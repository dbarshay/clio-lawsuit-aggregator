import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { getMatter, getSiblings } from "@/lib/claimIndex";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

const CLOSE_REASON_LABELS: Record<string, string> = {
  "12497450": "AAA- DECISION- DISMISSED WITH PREJUDICE",
  "12497465": "AAA- VOLUNTARILY WITHDRAWN WITH PREJUDICE",
  "12497480": "DISCONTINUED WITH PREJUDICE",
  "12497495": "MOTION LOSS",
  "12497510": "OUT OF STATE CARRIER",
  "12497525": "PAID (DECISION)",
  "12497540": "PAID (JUDGMENT)",
  "12497555": "PAID (SETTLEMENT)",
  "12497570": "PAID (FEE SCHEDULE)",
  "12497585": "PAID (VOLUNTARY)",
  "12497600": "PER CLIENT",
  "12497615": "POLICY CANCELLED",
  "12497630": "POLICY EXHAUSTED/NO COVERAGE",
  "12497645": "PPO",
  "12497660": "SOL",
  "12497675": "TRIAL LOSS",
  "12497690": "WORKERS COMPENSATION",
  "12497825": "TRANSFERRED TO LB",
};

function closeReasonLabel(value: any): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return CLOSE_REASON_LABELS[raw] || raw;
}


async function hydrateMatter(matterId: number) {
  const fields = [
    "id",
    "etag",
    "display_number",
    "description",
    "status",
    "matter_stage{id,name}",
    "client",
    "custom_field_values{value,custom_field}",
  ].join(",");

  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Failed to hydrate matter ${matterId}: ${res.status} ${text}`);
  }

  return JSON.parse(text)?.data;
}

function siblingRow(row: any) {
  return {
    matterId: row.matter_id,
    id: row.matter_id,
    displayNumber: row.display_number ?? "",
    patient: row.patient_name ?? "",
    client: row.client_name ?? "",
    clientName: row.client_name ?? "",
    insuranceCompany: row.insurer_name ?? "",
    billNumber: row.bill_number ?? "",
    dosStart: row.dos_start ?? "",
    dosEnd: row.dos_end ?? "",
    dosRange:
      row.dos_start && row.dos_end
        ? `${row.dos_start} to ${row.dos_end}`
        : row.dos_start || row.dos_end || "",
    claimAmount: row.claim_amount ?? 0,
    paymentVoluntary: row.payment_voluntary ?? 0,
    balancePresuit: row.balance_presuit ?? 0,
    denialReason: row.denial_reason ?? "",
    matterStage: row.matter_stage_name
      ? { name: row.matter_stage_name }
      : null,
    stage: row.matter_stage_name
      ? { name: row.matter_stage_name }
      : null,
    status: row.status ?? "",
    closeReason: closeReasonLabel(row.close_reason), 
    selectableForSettlement:
      String(row.matter_stage_name || "").toUpperCase().includes("READY FOR ARBITRATION/LITIGATION") &&
      String(row.status || "").toLowerCase().includes("open") &&
      !String(row.master_lawsuit_id || "").trim(),
    masterLawsuitId: row.master_lawsuit_id ?? "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get("matterId");

    if (!idParam) {
      return NextResponse.json(
        { ok: false, error: "Missing matterId" },
        { status: 400 }
      );
    }

    const id = Number(idParam);

    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid matterId" },
        { status: 400 }
      );
    }

    const liveMatter = await hydrateMatter(id);
    await upsertClaimIndexFromMatter(liveMatter);

    const current = await getMatter(id);

    if (!current) {
      return NextResponse.json(
        { ok: false, error: "Matter could not be indexed." },
        { status: 500 }
      );
    }

    if (!current.claim_number_normalized) {
      return NextResponse.json(
        { ok: false, error: "No claim number" },
        { status: 422 }
      );
    }

    const siblings = (await getSiblings(current.claim_number_normalized))
      .filter((row) => Number(row.matter_id) !== id)
      .map(siblingRow);

    return NextResponse.json({
      ok: true,
      count: siblings.length,
      claimNumber: current.claim_number_raw,
      normalizedClaimNumber: current.claim_number_normalized,
      currentMatter: {
        matterId: current.matter_id,
        displayNumber: current.display_number,
        patient: current.patient_name,
        clientName: current.client_name,
        insuranceCompany: current.insurer_name,
        claimAmount: current.claim_amount,
        masterLawsuitId: current.master_lawsuit_id,
      },
      siblings,
      source: "live-hydrate-current-then-local-claim-index",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Server error",
      },
      { status: 500 }
    );
  }
}