import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expandFromSeed } from "@/lib/expandFromSeed";
import { ingestMattersFromClioBatch } from "@/lib/ingestMattersFromClioBatch";
import { indexMatterInternal } from "@/lib/indexMatterInternal";
import { deleteClaimClusterCache, setClaimClusterCache } from "@/lib/claimClusterCache";

function clean(v: string | null) {
  return (v || "").trim();
}

function uniqueNumbers(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    const claim = clean(req.nextUrl.searchParams.get("claim"));

    if (!claim) {
      return NextResponse.json(
        { ok: false, error: "claim is required" },
        { status: 400 }
      );
    }

    // 1. Seed from ClaimIndex
    const seedRows = await prisma.claimIndex.findMany({
      where: {
        claim_number_normalized: claim,
      },
      select: {
        matter_id: true,
        claim_number_normalized: true,
        patient_name: true,
        client_name: true,
        insurer_name: true,
        master_lawsuit_id: true,
        index_aaa_number: true,
      },
    });

    if (seedRows.length === 0) {
      return NextResponse.json({
        ok: true,
        claim,
        message: "No seed rows found",
        refreshed: 0,
      });
    }

    // 2. Expand cluster (NO Clio expansion needed; ClaimIndex is enough for claim)
    const expanded = await expandFromSeed(seedRows, { includeClio: false });

    const allIds = uniqueNumbers(expanded.matterIds);

    // 3. Force refresh all matters
    const batchSize = 25;
    const refreshed: number[] = [];
    const errors: any[] = [];

    for (let i = 0; i < allIds.length; i += batchSize) {
      const batch = allIds.slice(i, i + batchSize);

      try {
        const results = await ingestMattersFromClioBatch(batch);

        for (const r of results) {
          if (r.ok) refreshed.push(r.matterId);
          else errors.push(r);
        }
      } catch {
        // fallback per-matter
        for (const id of batch) {
          const r = await indexMatterInternal(id, { force: true });
          if (r.ok) refreshed.push(id);
          else errors.push(r);
        }
      }
    }

    // 4. Rebuild cache AFTER successful refresh
    await deleteClaimClusterCache(claim);
    await setClaimClusterCache(claim, allIds);

    return NextResponse.json({
      ok: true,
      claim,
      total: allIds.length,
      refreshed: refreshed.length,
      cachedMatterIds: allIds.length,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "refresh failed" },
      { status: 500 }
    );
  }
}
