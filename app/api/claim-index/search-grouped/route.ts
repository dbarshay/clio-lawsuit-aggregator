import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildClaimIndexWhere,
  CLAIM_INDEX_SELECT,
  type ClaimIndexSearchParams,
} from "@/lib/claimIndexQuery";
import { groupByClaim } from "@/lib/claimIndexGroup";
import { getValidClioAccessToken } from "@/lib/clioTokenStore";
import { indexMatterInternal } from "@/lib/indexMatterInternal";
import { ingestMattersFromClioBatch } from "@/lib/ingestMattersFromClioBatch";
import { expandFromSeed } from "@/lib/expandFromSeed";
import { getCacheMetrics, resetCacheMetrics } from "@/lib/clioQueryCache";
import { getClioMetrics, resetClioMetrics } from "@/lib/clio";
import { getCachedQuery, setCachedQuery } from "@/lib/clioQueryCache";
import { clearContactCache } from "@/lib/contactCache";
import { getClaimClusterCache, setClaimClusterCache } from "@/lib/claimClusterCache";


const CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";

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

function isEligibleDisplayNumber(display?: string | null) {
  if (!display) return false;

  const match = String(display).trim().match(/^BRL\s*-?\s*(\d+)$/i);
  if (!match) return false;

  const n = Number(match[1]);
  return Number.isFinite(n) && n >= 30000;
}

function getNextPageToken(json: any): string | null {
  const raw =
    json?.meta?.paging?.next_page_token ??
    json?.meta?.next_page_token ??
    json?.next_page_token ??
    json?.meta?.paging?.next ??
    json?.links?.next ??
    null;

  if (!raw) return null;

  const s = String(raw);

  if (!s.includes("page_token=")) return s;

  try {
    const url = new URL(s);
    return url.searchParams.get("page_token");
  } catch {
    const m = s.match(/[?&]page_token=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
}

async function clioFetch(path: string) {
  const accessToken = await getValidClioAccessToken();

  const res = await fetch(`${CLIO_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clio fallback failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function searchClioMatterIdsByQuery(query: string): Promise<number[]> {
  const cached = getCachedQuery(query);
  if (cached) {
    return cached;
  }

  const ids: number[] = [];
  let pageToken: string | null = null;

  do {
    const params = new URLSearchParams();
    params.set("query", query);
    params.set("fields", "id,display_number");
    params.set("limit", "200");

    if (pageToken) {
      params.set("page_token", pageToken);
    }

    const json = await clioFetch(`/matters.json?${params.toString()}`);
    const data = Array.isArray(json?.data) ? json.data : [];

    for (const matter of data) {
      const id = Number(matter?.id);
      if (Number.isFinite(id) && id > 0) ids.push(id);
    }

    pageToken = getNextPageToken(json);
  } while (pageToken);

  const result = uniqueNumbers(ids);
  setCachedQuery(query, result);

  return result;
}

async function directClioFallbackMatterIds(params: ClaimIndexSearchParams): Promise<number[]> {
  const ids: number[] = [];

  if (params.matterId) {
    const n = Number(params.matterId);
    if (Number.isFinite(n) && n > 0) {
      try {
        const json = await clioFetch(`/matters/${n}.json?fields=id,display_number`);
        const id = Number(json?.data?.id);
        if (Number.isFinite(id) && id > 0) ids.push(id);
      } catch {
        // Continue to text-query fallback.
      }
    }
  }

  const queries: string[] = [];

  if (params.claim) queries.push(params.claim);
  if (params.provider && params.patient) queries.push(`${params.provider} ${params.patient}`);
  if (params.patient) queries.push(params.patient);
  if (params.masterLawsuitId) queries.push(params.masterLawsuitId);
  if (params.indexAaaNumber) queries.push(params.indexAaaNumber);
  if (params.patient && params.insurer) queries.push(`${params.patient} ${params.insurer}`);
  if (params.provider) queries.push(params.provider);
  if (params.insurer) queries.push(params.insurer);

  for (const q of Array.from(new Set(queries.map((x) => x.trim()).filter(Boolean)))) {
    const found = await searchClioMatterIdsByQuery(q);
    ids.push(...found);
  }

  return uniqueNumbers(ids);
}

async function indexMatterIds(matterIds: number[], forceIds: number[] = []) {
  const refreshed = new Set<number>();
  const skipped = new Set<number>();
  const rateLimited = new Set<number>();
  const errors: { matterId: number; error: string }[] = [];

  const ids = uniqueNumbers(matterIds);
  const forced = new Set(uniqueNumbers(forceIds));

  // Network-level batch size.  Keep conservative to avoid URL-length issues
  // while still replacing N per-matter Clio calls with a small number of calls.
  const batchSize = 25;
  const fallbackConcurrency = 3;

  function recordResult(result: {
    matterId: number;
    ok: boolean;
    skipped?: boolean;
    error?: string;
  }) {
    const errorText = String(result.error || "");

    if (!result.ok && /RateLimited|rate limit|429/i.test(errorText)) {
      rateLimited.add(result.matterId);
    }

    if (result.ok && result.skipped) {
      skipped.add(result.matterId);
    } else if (result.ok) {
      refreshed.add(result.matterId);
    } else {
      errors.push({
        matterId: result.matterId,
        error: result.error || "Unknown error",
      });
    }
  }

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    try {
      const batchResults = await ingestMattersFromClioBatch(batch);
      for (const result of batchResults) {
        recordResult(result);
      }
      continue;
    } catch (err: any) {
      const batchError = err?.message || "Batch hydration failed";

      // If the batch request fails, fall back to the existing per-matter path.
      // This preserves the old correctness behavior and makes the optimization safe.
      for (let j = 0; j < batch.length; j += fallbackConcurrency) {
        const fallbackBatch = batch.slice(j, j + fallbackConcurrency);

        const fallbackResults = await Promise.all(
          fallbackBatch.map(async (id) =>
            indexMatterInternal(id, { force: forced.has(id) })
          )
        );

        for (const result of fallbackResults) {
          if (!result.ok && !result.error) {
            recordResult({
              ...result,
              error: batchError,
            });
          } else {
            recordResult(result);
          }
        }
      }
    }
  }

  return {
    refreshed: Array.from(refreshed),
    skipped: Array.from(skipped),
    rateLimited: Array.from(rateLimited),
    errors,
  };
}

async function runSearch(params: ClaimIndexSearchParams) {
  const where = buildClaimIndexWhere(params);

  return prisma.claimIndex.findMany({
    where,
    orderBy: { matter_id: "asc" },
    select: CLAIM_INDEX_SELECT,
  });
}

export async function GET(req: NextRequest) {
  // Ensure per-request contact cache isolation
  clearContactCache();
  resetCacheMetrics();
  resetClioMetrics();

  const forceRefresh = clean(req.nextUrl.searchParams.get("refresh")) === "true";

  const params: ClaimIndexSearchParams = {
    matterId: clean(req.nextUrl.searchParams.get("matterId")),
    patient: clean(req.nextUrl.searchParams.get("patient")),
    provider: clean(req.nextUrl.searchParams.get("provider")),
    insurer: clean(req.nextUrl.searchParams.get("insurer")),
    claim: clean(req.nextUrl.searchParams.get("claim")),
    masterLawsuitId: clean(req.nextUrl.searchParams.get("masterLawsuitId")),
    indexAaaNumber: clean(req.nextUrl.searchParams.get("indexAaaNumber")),
  };

  const hasAnySelector = Object.values(params).some(Boolean);

  const isRiskySelector =
    !!params.patient ||
    !!params.provider ||
    !!params.insurer;



  if (!hasAnySelector) {
    return NextResponse.json(
      { ok: false, error: "At least one search parameter required" },
      { status: 400 }
    );
  }

  let clusterCacheHit = false;
  let clusterCacheCount = 0;

  let rows = await runSearch(params);

  // Claim-cluster cache is intentionally NOT used to replace UI search rows.
  // Correctness rule: returned UI rows must be Clio-verified in this request.
  // The cache may remain as an observability/warmth layer, but never as a
  // correctness dependency or return-path shortcut.


  let refreshSource: "claim-index" | "clio-fallback" | "none" = "none";
  let refreshedMatterIds: number[] = [];
  let refreshErrors: { matterId: number; error: string }[] = [];
  let skippedMatterIds: number[] = [];
  let rateLimitedIds: number[] = [];

  let expansionDebug: any = null;

  let expandedMatterIdsRawForDebug: number[] = [];
  let expandedMatterIdsForDebug: number[] = [];
  let appScopePrunedExpandedIdsForDebug: number[] = [];
  let preHydrationExpandedIdsForDebug: number[] = [];
  let preHydrationExcludedIdsForDebug: number[] = [];
  let expansionObservability = {
    seedRowCount: 0,
    rawExpandedCount: 0,
    appScopeExpandedCount: 0,
    appScopePrunedCount: 0,
    claimFilteredExpandedCount: 0,
    claimPrunedCount: 0,
    hydrationCandidateCount: 0,
    appScopePruneRatio: 0,
    claimPruneRatio: 0,
    totalPruneRatio: 0,
  };

  if (rows.length > 0) {
    refreshSource = "claim-index";

    const ids = rows
      .filter((r) => isEligibleDisplayNumber(r.display_number))
      .map((r) => r.matter_id);
    const forceIds = params.matterId ? [Number(params.matterId)] : [];

    const skipSeedRefreshBecauseClusterCacheHit =
      clusterCacheHit &&
      !!params.claim &&
      !isRiskySelector &&
      !forceRefresh &&
      !params.matterId &&
      !params.masterLawsuitId &&
      !params.indexAaaNumber;

    // Correctness rule: every seed row returned to the UI must be hydrated
    // from Clio in this request.  No freshness window, cache hit, or webhook
    // signal can substitute for source-of-truth verification.
    const idsNeedingSeedRefresh = ids;

    const refreshForceIds = idsNeedingSeedRefresh;

    const refresh = idsNeedingSeedRefresh.length > 0
      ? await indexMatterIds(idsNeedingSeedRefresh, refreshForceIds)
      : { refreshed: [], skipped: [], rateLimited: [], errors: [] };
    refreshedMatterIds = refresh.refreshed;

    // --- STORE CLAIM CLUSTER CACHE ---
    if (params.claim && rows.length > 0) {
      const idsToCache = rows.map(r => r.matter_id);
      await setClaimClusterCache(params.claim, idsToCache);
    }

    skippedMatterIds = refresh.skipped;
    refreshErrors = refresh.errors;
    rateLimitedIds = refresh.rateLimited || [];

    rows = await runSearch(params);

    // --- EXPANSION STEP ---
    // Clio-backed verification has already refreshed the seed rows from Clio.
    // For strong selectors, skip weaker Clio-backed expansion after the verified cluster is stable.
    const hasStrongSelector =
      !!params.matterId ||
      !!params.claim ||
      !!params.masterLawsuitId ||
      !!params.indexAaaNumber;

    const clusterClaims = new Set(
      rows.map((r) => r.claim_number_normalized).filter(Boolean)
    );
    const clusterMasterIds = new Set(
      rows.map((r) => r.master_lawsuit_id).filter(Boolean)
    );
    const clusterIndexNums = new Set(
      rows.map((r) => r.index_aaa_number).filter(Boolean)
    );

    const hasUniformStrongCluster =
      clusterClaims.size === 1 ||
      clusterMasterIds.size === 1 ||
      clusterIndexNums.size === 1;

    const shouldEarlyStopClioExpansion =
      hasStrongSelector &&
      rows.length > 0 &&
      hasUniformStrongCluster;

    const expansion = await expandFromSeed(rows, {
      includeClio: !shouldEarlyStopClioExpansion,
    });

    expansionDebug = expansion;
    const expandedIdsRaw = expansion.matterIds;
    expandedMatterIdsRawForDebug = expandedIdsRaw;
    expansionObservability.seedRowCount = rows.length;
    expansionObservability.rawExpandedCount = expandedIdsRaw.length;

    // App scope: this lawsuit aggregation app is for BRL30000 and later.
    // Prune expansion candidates before freshness checks or Clio hydration.
    const expandedKnownRows = expandedIdsRaw.length > 0
      ? await prisma.claimIndex.findMany({
          where: { matter_id: { in: expandedIdsRaw } },
          select: {
            matter_id: true,
            display_number: true,
          },
        })
      : [];

    const eligibleKnownIds = new Set(
      expandedKnownRows
        .filter((r) => isEligibleDisplayNumber(r.display_number))
        .map((r) => r.matter_id)
    );

    const knownExpandedIds = new Set(expandedKnownRows.map((r) => r.matter_id));

    // Keep unknown IDs because Clio remains source of truth. Known old BRL rows are excluded.
    const expandedIds = expandedIdsRaw.filter(
      (id) => !knownExpandedIds.has(id) || eligibleKnownIds.has(id)
    );

    appScopePrunedExpandedIdsForDebug = expandedIdsRaw.filter(
      (id) => !expandedIds.includes(id)
    );

    expandedMatterIdsForDebug = expandedIds;
    expansionObservability.appScopeExpandedCount = expandedIds.length;
    expansionObservability.appScopePrunedCount = appScopePrunedExpandedIdsForDebug.length;
    expansionObservability.appScopePruneRatio = expandedIdsRaw.length > 0
      ? Number((appScopePrunedExpandedIdsForDebug.length / expandedIdsRaw.length).toFixed(4))
      : 0;

    if (expandedIds.length > 0) {
      const seedClaims = Array.from(
        new Set(
          rows
            .map((r) => r.claim_number_normalized)
            .filter((v): v is string => Boolean(v))
        )
      );

      // Early filter before hydration:
      // - keep unknown candidates so Clio remains source of truth
      // - skip candidates already known locally to have a different claim
      let filteredExpandedIds = expandedIds;

      if (seedClaims.length > 0) {
        const knownCandidates = await prisma.claimIndex.findMany({
          where: { matter_id: { in: expandedIds } },
          select: {
            matter_id: true,
            claim_number_normalized: true,
          },
        });

        const knownById = new Map(
          knownCandidates.map((row) => [row.matter_id, row.claim_number_normalized])
        );

        filteredExpandedIds = expandedIds.filter((id) => {
          const knownClaim = knownById.get(id);

          if (!knownById.has(id)) return true; // unknown: hydrate from Clio
          if (!knownClaim) return true; // locally incomplete: hydrate from Clio

          return seedClaims.includes(knownClaim);
        });

        preHydrationExcludedIdsForDebug = expandedIds.filter(
          (id) => !filteredExpandedIds.includes(id)
        );
      }

      preHydrationExpandedIdsForDebug = filteredExpandedIds;
      expansionObservability.claimFilteredExpandedCount = filteredExpandedIds.length;
      expansionObservability.claimPrunedCount = preHydrationExcludedIdsForDebug.length;
      expansionObservability.claimPruneRatio = expandedIds.length > 0
        ? Number((preHydrationExcludedIdsForDebug.length / expandedIds.length).toFixed(4))
        : 0;
      expansionObservability.totalPruneRatio = expandedIdsRaw.length > 0
        ? Number(((expandedIdsRaw.length - filteredExpandedIds.length) / expandedIdsRaw.length).toFixed(4))
        : 0;

      // Correctness rule: every expanded candidate that may be returned must
      // be hydrated from Clio in this request.  No freshness window or cluster
      // cache can substitute for source-of-truth verification.
      const idsNeedingRefresh = filteredExpandedIds;

      expansionObservability.hydrationCandidateCount = idsNeedingRefresh.length;

      const expandRefreshForceIds = idsNeedingRefresh;

      const expandRefresh = idsNeedingRefresh.length > 0
        ? await indexMatterIds(idsNeedingRefresh, expandRefreshForceIds)
        : { refreshed: [], skipped: [], rateLimited: [], errors: [] };
      refreshedMatterIds = uniqueNumbers([
        ...refreshedMatterIds,
        ...expandRefresh.refreshed,
      ]);
      skippedMatterIds = uniqueNumbers([
        ...skippedMatterIds,
        ...expandRefresh.skipped,
      ]);
      refreshErrors.push(...expandRefresh.errors);

      rows = await prisma.claimIndex.findMany({
        where: {
          AND: [
            { matter_id: { in: filteredExpandedIds } },
            seedClaims.length > 0
              ? { claim_number_normalized: { in: seedClaims } }
              : {},
          ],
        },
        orderBy: { matter_id: "asc" },
        select: CLAIM_INDEX_SELECT,
      });
    }
  } else {
    refreshSource = "clio-fallback";

    const fallbackIds = await directClioFallbackMatterIds(params);

    if (fallbackIds.length > 0) {
      const forceIds = params.matterId ? [Number(params.matterId)] : [];
      const refresh = await indexMatterIds(fallbackIds, forceIds);
      refreshedMatterIds = refresh.refreshed;

    // --- STORE CLAIM CLUSTER CACHE ---
    if (params.claim && rows.length > 0) {
      const idsToCache = rows.map(r => r.matter_id);
      await setClaimClusterCache(params.claim, idsToCache);
    }

      skippedMatterIds = refresh.skipped;
      refreshErrors = refresh.errors;
    rateLimitedIds = refresh.rateLimited || [];

      rows = await runSearch(params);
    }
  }

  // Final cache repair: forced/risky hydration may invalidate claim cache
  // through indexMatterInternal.  Rebuild the claim cache after all Clio refresh
  // work is complete so the next safe claim search can use the warm path.
  if (params.claim && rows.length > 0) {
    await setClaimClusterCache(params.claim, rows.map((r) => r.matter_id));
  }

  const groups = groupByClaim(rows);

  const dedupedRefreshed = uniqueNumbers(refreshedMatterIds);
  const dedupedSkipped = uniqueNumbers(skippedMatterIds);

  return NextResponse.json({
    ok: true,
    count: rows.length,
    groupCount: groups.length,
    filters: params,
    clusterCache: {
      hit: clusterCacheHit,
      matterCount: clusterCacheCount,
    },
    refresh: {
      source: refreshSource,
      rateLimited: rateLimitedIds.length,
      rateLimitedIds,
      refreshed: dedupedRefreshed.length,
      refreshedMatterIds: dedupedRefreshed,
      skipped: dedupedSkipped.length,
      skippedMatterIds: dedupedSkipped,
      errors: refreshErrors,
    },
    expansion: expansionDebug ? {
      skippedClioExpansion: expansionDebug.clioExpansionSkipped,
      clioQueries: expansionDebug.clioQueries,
      clioQueryCount: expansionDebug.clioQueries.length,
      clioIssues: expansionDebug.clioIssues,
      clioRateLimited: expansionDebug.clioRateLimited,
      observability: expansionObservability,
      rawExpandedCandidateCount: expandedMatterIdsRawForDebug.length,
      rawExpandedCandidateIds: expandedMatterIdsRawForDebug,
      appScopeExpandedCandidateCount: expandedMatterIdsForDebug.length,
      appScopeExpandedCandidateIds: expandedMatterIdsForDebug,
      appScopePrunedCandidateCount: appScopePrunedExpandedIdsForDebug.length,
      appScopePrunedCandidateIds: appScopePrunedExpandedIdsForDebug,
      preHydrationCandidateCount: preHydrationExpandedIdsForDebug.length,
      preHydrationCandidateIds: preHydrationExpandedIdsForDebug,
      preHydrationExcludedCount: preHydrationExcludedIdsForDebug.length,
      preHydrationExcludedIds: preHydrationExcludedIdsForDebug,
      finalReturnedMatterCount: rows.length,
      finalReturnedMatterIds: rows.map((r) => r.matter_id),
      cacheHits: getCacheMetrics().cacheHits,
      cacheMisses: getCacheMetrics().cacheMisses,
      clioCallCount: getClioMetrics().clioCallCount,
    } : null,
    groups,
  });
}
