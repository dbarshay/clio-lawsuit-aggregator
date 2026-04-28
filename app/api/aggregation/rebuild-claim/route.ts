import { NextRequest, NextResponse } from "next/server";
import { getMatter, getSiblings } from "@/lib/claimIndex";
import { refreshClaimIndex } from "@/lib/refreshClaimIndex";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawMatterId = body?.matterId;
    const rawClaimNumber = body?.claimNumber;

    let claimNumber = "";
    let normalizedClaimNumber = "";
    let sourceMatterId: number | null = null;

    if (rawMatterId != null && rawMatterId !== "") {
      const matterId = Number(rawMatterId);

      if (!Number.isFinite(matterId)) {
        return NextResponse.json(
          { ok: false, error: "Invalid matterId" },
          { status: 400 }
        );
      }

      const current = getMatter(matterId) as any;

      if (!current) {
        return NextResponse.json(
          {
            ok: false,
            error: "Matter is not yet indexed. Rebuild requires an indexed base matter or explicit claimNumber.",
          },
          { status: 404 }
        );
      }

      if (!current.claim_number_normalized) {
        return NextResponse.json(
          { ok: false, error: "No claim number for this matter" },
          { status: 422 }
        );
      }

      sourceMatterId = matterId;
      claimNumber = current.claim_number_raw || current.claim_number_normalized;
      normalizedClaimNumber = current.claim_number_normalized;
    } else if (rawClaimNumber != null && String(rawClaimNumber).trim() !== "") {
      claimNumber = String(rawClaimNumber).trim();
      normalizedClaimNumber = claimNumber.replace(/\s+/g, "").toUpperCase();
    } else {
      return NextResponse.json(
        { ok: false, error: "Provide matterId or claimNumber" },
        { status: 400 }
      );
    }

    const refresh = await refreshClaimIndex(claimNumber, { force: true });
    const siblings = (getSiblings(normalizedClaimNumber) as any[]).map((row) => ({
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
      status: row.status ?? "",
      masterLawsuitId: row.master_lawsuit_id ?? "",
    }));

    return NextResponse.json({
      ok: true,
      sourceMatterId,
      claimNumber,
      normalizedClaimNumber,
      refresh,
      count: siblings.length,
      siblings,
      source: "manual-rebuild-claim",
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
