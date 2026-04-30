import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expandFromSeed } from "@/lib/expandFromSeed";
import { ingestMattersFromClioBatch } from "@/lib/ingestMattersFromClioBatch";
import { indexMatterInternal } from "@/lib/indexMatterInternal";
import {
  deleteClaimClusterCache,
  setClaimClusterCache,
} from "@/lib/claimClusterCache";
import {
  buildClaimIndexWhere,
  type ClaimIndexSearchParams,
} from "@/lib/claimIndexQuery";

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

function uniqueStrings(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.map((v) => (v || "").trim()).filter(Boolean)));
}

export async function POST(req: NextRequest) {
  try {
    const params: ClaimIndexSearchParams = {
      matterId: clean(req.nextUrl.searchParams.get("matterId")),
      patient: clean(req.nextUrl.searchParams.get("patient")),
      provider: clean(req.nextUrl.searchParams.get("provider")),
      insurer: clean(req.nextUrl.searchParams.get("insurer")),
      claim: clean(req.nextUrl.searchParams.get("claim")),
      masterLawsuitId: clean(req.nextUrl.searchParams.get("masterLawsuitId")),
      indexAaaNumber: clean(req.nextUrl.searchParams.get("indexAaaNumber")),
    };

    const hasSelector = Object.values(params).some(Boolean);

    if (!hasSelector) {
      return NextResponse.json(
        { ok: false, error: "At least one selector is required" },
        { status: 400 }
      );
    }

    // 1. Seed from ClaimIndex using SAME selector logic as search
    const where = buildClaimIndexWhere(params);

    const seedRows = await prisma.claimIndex.findMany({
      where,
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
        message: "No seed rows found",
        selectors: params,
        refreshed: 0,
      });
    }

    // 2. Expand cluster
    const expanded = await expandFromSeed(seedRows, { includeClio: false });
    const allIds = uniqueNumbers(expanded.matterIds);

    // 3. Force hydrate EVERYTHING from Clio
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
        for (const id of batch) {
          const r = await indexMatterInternal(id, { force: true });
          if (r.ok) refreshed.push(id);
          else errors.push(r);
        }
      }
    }

    // 4. Determine ALL affected claims
    const refreshedRows = await prisma.claimIndex.findMany({
      where: { matter_id: { in: allIds } },
      select: { claim_number_normalized: true },
    });

    const affectedClaims = uniqueStrings(
      refreshedRows.map((r) => r.claim_number_normalized)
    );

    // 5. Invalidate + rebuild each claim cache
    for (const claim of affectedClaims) {
      await deleteClaimClusterCache(claim);

      const claimRows = await prisma.claimIndex.findMany({
        where: { claim_number_normalized: claim },
        select: { matter_id: true },
      });

      const claimIds = claimRows.map((r) => r.matter_id);
      await setClaimClusterCache(claim, claimIds);
    }

    return NextResponse.json({
      ok: true,
      selectors: params,
      total: allIds.length,
      refreshed: refreshed.length,
      affectedClaims,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "refresh failed" },
      { status: 500 }
    );
  }
}
