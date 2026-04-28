import { NextRequest, NextResponse } from "next/server";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawMatterIds: unknown[] = Array.isArray(body?.matterIds) ? body.matterIds : [];

    const matterIds: number[] = rawMatterIds
      .map((v: unknown) => Number(v))
      .filter((v: number) => Number.isFinite(v) && v > 0);

    if (matterIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Provide matterIds as a non-empty array" },
        { status: 400 }
      );
    }

    const uniqueMatterIds: number[] = Array.from(new Set<number>(matterIds));

    const results: Array<{
      matterId: number;
      displayNumber?: string;
      ok: boolean;
      claimNumber?: string;
      masterLawsuitId?: string;
      error?: string;
    }> = [];

    for (const matterId of uniqueMatterIds) {
      try {
        const ingested = await ingestMatterFromClio(matterId);

        results.push({
          matterId: ingested.matterId,
          displayNumber: ingested.displayNumber,
          ok: true,
          claimNumber: ingested.claimNumber,
          masterLawsuitId: ingested.masterLawsuitId,
        });
      } catch (err: any) {
        results.push({
          matterId,
          ok: false,
          error: err?.message || "Unknown ingestion error",
        });
      }
    }

    const succeeded = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);
    const claimNumbers = [...new Set(succeeded.map((r) => r.claimNumber).filter(Boolean))];

    return NextResponse.json({
      ok: failed.length === 0,
      requested: uniqueMatterIds.length,
      succeeded: succeeded.length,
      failed: failed.length,
      claimNumbers,
      results,
      error:
        failed.length > 0
          ? `Matter ingestion failed for ${failed.length} matter(s).`
          : null,
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
