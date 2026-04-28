import { NextRequest, NextResponse } from "next/server";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";

function collectMatterIds(payload: any): number[] {
  const ids = new Set<number>();

  const maybeAdd = (v: any) => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) ids.add(n);
  };

  maybeAdd(payload?.id);
  maybeAdd(payload?.matter_id);
  maybeAdd(payload?.matterId);

  maybeAdd(payload?.data?.id);
  maybeAdd(payload?.data?.matter_id);
  maybeAdd(payload?.data?.matterId);

  maybeAdd(payload?.object?.id);
  maybeAdd(payload?.object?.matter_id);
  maybeAdd(payload?.object?.matterId);

  maybeAdd(payload?.record?.id);
  maybeAdd(payload?.record?.matter_id);
  maybeAdd(payload?.record?.matterId);

  if (Array.isArray(payload?.data)) {
    for (const item of payload.data) {
      maybeAdd(item?.id);
      maybeAdd(item?.matter_id);
      maybeAdd(item?.matterId);
      maybeAdd(item?.record?.id);
    }
  }

  if (Array.isArray(payload?.records)) {
    for (const item of payload.records) {
      maybeAdd(item?.id);
      maybeAdd(item?.matter_id);
      maybeAdd(item?.matterId);
    }
  }

  return [...ids];
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CLIO_WEBHOOK_SHARED_SECRET || "";
    const providedSecret =
      req.headers.get("x-clio-webhook-secret") ||
      req.headers.get("x-webhook-secret") ||
      req.nextUrl.searchParams.get("secret") ||
      "";

    if (secret && providedSecret !== secret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized webhook request" },
        { status: 401 }
      );
    }

    const payload = await req.json().catch(() => ({}));

    console.log("CLIO WEBHOOK HEADERS:", JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
    console.log("CLIO WEBHOOK PAYLOAD:", JSON.stringify(payload, null, 2));

    const matterIds = collectMatterIds(payload);

    console.log("CLIO WEBHOOK MATTER IDS:", matterIds);

    if (matterIds.length === 0) {
      return NextResponse.json({
        ok: true,
        accepted: true,
        ingested: 0,
        matterIds: [],
        note: "No matter ids found in payload",
      });
    }

    const results: Array<{
      matterId: number;
      ok: boolean;
      displayNumber?: string;
      claimNumber?: string;
      masterLawsuitId?: string;
      error?: string;
    }> = [];

    for (const matterId of matterIds) {
      try {
        const ingested = await ingestMatterFromClio(matterId);
        results.push({
          matterId: ingested.matterId,
          ok: true,
          displayNumber: ingested.displayNumber,
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

    const failed = results.filter((r) => !r.ok);

    return NextResponse.json({
      ok: failed.length === 0,
      accepted: true,
      ingested: results.length - failed.length,
      failed: failed.length,
      matterIds,
      results,
      error:
        failed.length > 0
          ? `Webhook ingestion failed for ${failed.length} matter(s).`
          : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Webhook server error",
      },
      { status: 500 }
    );
  }
}
