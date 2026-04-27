import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clioAuth";
import { getMatter, getSiblings } from "@/lib/claimIndex";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function hydrate(id: number) {
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
    `/api/v4/matters/${id}.json?fields=${encodeURIComponent(fields)}`
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`hydrate ${id} failed: ${res.status} ${text}`);
  }

  return JSON.parse(text)?.data;
}

export async function GET(req: NextRequest) {
  const matterId = Number(req.nextUrl.searchParams.get("matterId"));
  const delayMs = Number(req.nextUrl.searchParams.get("delayMs") || 1200);
  const limit = Number(req.nextUrl.searchParams.get("limit") || 20);

  if (!Number.isFinite(matterId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid matterId" },
      { status: 400 }
    );
  }

  const baseMatter = await hydrate(matterId);
  const baseRow = await upsertClaimIndexFromMatter(baseMatter);

  if (!baseRow.claim_number_normalized) {
    return NextResponse.json({
      ok: false,
      error: "No claim number",
    });
  }

  const knownCluster = await getSiblings(baseRow.claim_number_normalized);

  const idsToRefresh = knownCluster
    .map((r) => Number(r.matter_id))
    .filter((id) => Number.isFinite(id))
    .filter((id) => id !== matterId)
    .slice(0, limit);

  let refreshed = 0;
  let failed = 0;

  const refreshedMatterIds: number[] = [];
  const errors: any[] = [];

  for (const id of idsToRefresh) {
    try {
      const matter = await hydrate(id);
      await upsertClaimIndexFromMatter(matter);
      refreshed++;
      refreshedMatterIds.push(id);
    } catch (err: any) {
      failed++;
      errors.push({
        matterId: id,
        error: err?.message || String(err),
      });
    }

    await sleep(delayMs);
  }

  return NextResponse.json({
    ok: true,
    claimNumber: baseRow.claim_number_raw,
    normalizedClaimNumber: baseRow.claim_number_normalized,
    knownClusterSize: knownCluster.length,
    refreshed,
    failed,
    refreshedMatterIds,
    errors,
    source: "refresh-known-local-claim-cluster",
  });
}
