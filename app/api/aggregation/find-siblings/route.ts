import { NextRequest, NextResponse } from "next/server";
import { getMatter, getSiblings } from "@/lib/claimIndex";

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

    const current = await getMatter(id);

    if (!current) {
      return NextResponse.json(
        {
          ok: false,
          error: "Matter is not yet indexed. Run index-matter or rebuild first.",
        },
        { status: 404 }
      );
    }

    if (!current.claim_number_normalized) {
      return NextResponse.json({ ok: false, error: "No claim number" }, { status: 422 });
    }

    const siblings = (await getSiblings(current.claim_number_normalized))
      .filter((row) => Number(row.matter_id) !== id)
      .map((row) => ({
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
      source: "local-claim-index",
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
