import { NextRequest, NextResponse } from "next/server";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const matter = body?.data;

    if (!matter?.id) {
      return NextResponse.json(
        { ok: false, error: "No matter found at body.data" },
        { status: 400 }
      );
    }

    const row = await upsertClaimIndexFromMatter(matter);

    return NextResponse.json({
      ok: true,
      indexedMatterId: row.matter_id,
      displayNumber: row.display_number,
      claimNumber: row.claim_number_raw,
      normalizedClaimNumber: row.claim_number_normalized,
    });
  } catch (err: any) {
    console.error("WEBHOOK PROCESS ERROR:", err);

    return NextResponse.json(
      { ok: false, error: err?.message ?? "Webhook processing failed" },
      { status: 500 }
    );
  }
}
