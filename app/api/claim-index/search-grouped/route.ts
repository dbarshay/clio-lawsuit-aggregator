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
import { expandFromSeed } from "@/lib/expandFromSeed";
import { getCacheMetrics, resetCacheMetrics } from "@/lib/clioQueryCache";
import { getClioMetrics, resetClioMetrics } from "@/lib/clio";
import { getCachedQuery, setCachedQuery } from "@/lib/clioQueryCache";
import { clearContactCache } from "@/lib/contactCache";

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
  const concurrency = 3;

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);

    const results = await Promise.all(
      batch.map(async (id) =>
        indexMatterInternal(id, { force: forced.has(id) })
      )
    );

    for (const result of results) {
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

async function allMatterIdsFresh(matterIds: number[]) {
  const ids = uniqueNumbers(matterIds);

  if (ids.length === 0) return false;

  const rows = await prisma.claimIndex.findMany({
    where: {
      matter_id: { in: ids },
    },
    select: {
      matter_id: true,
      indexed_at: true,
    },
  });

  if (rows.length !== ids.length) return false;

  const freshnessWindowMs = 30_000;
  const now = Date.now();

  return rows.every((row) => {
    if (!row.indexed_at) return false;

    const ageMs = now - row.indexed_at.getTime();
    return ageMs >= 0 && ageMs < freshnessWindowMs;
  });
}

export async function GET(req: NextRequest) {
  // Ensure per-request contact cache isolation
  clearContactCache();
  resetCacheMetrics();
  resetClioMetrics();

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

  if (!hasAnySelector) {
    return NextResponse.json(
      { ok: false, error: "At least one search parameter required" },
      { status: 400 }
    );
  }

  let rows = await runSearch(params);

  let refreshSource: "claim-index" | "clio-fallback" | "none" = "none";
  let refreshedMatterIds: number[] = [];
  let refreshErrors: { matterId: number; error: string }[] = [];
  let skippedMatterIds: number[] = [];
  let rateLimitedIds: number[] = [];

  let expansionDebug: any = null;
  let expandedMatterIdsForDebug: number[] = [];
  let preHydrationExpandedIdsForDebug: number[] = [];
  let preHydrationExcludedIdsForDebug: number[] = [];

  if (rows.length > 0) {
    refreshSource = "claim-index";

    const ids = rows.map((r) => r.matter_id);
    const forceIds = params.matterId ? [Number(params.matterId)] : [];

    // Only hydrate stale or unknown seed matters.
    // MatterId searches are forced because the user is asking for one exact record.
    const idsNeedingSeedRefresh = [];

    for (const id of ids) {
      if (forceIds.includes(id)) {
        idsNeedingSeedRefresh.push(id);
        continue;
      }

      const fresh = await allMatterIdsFresh([id]);
      if (!fresh) idsNeedingSeedRefresh.push(id);
    }

    const refresh = idsNeedingSeedRefresh.length > 0
      ? await indexMatterIds(idsNeedingSeedRefresh, forceIds)
      : { refreshed: [], skipped: [], rateLimited: [], errors: [] };
    refreshedMatterIds = refresh.refreshed;
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
    const expandedIds = expansion.matterIds;
    expandedMatterIdsForDebug = expandedIds;

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

      // Only hydrate stale or unknown matters to reduce Clio pressure
      const idsNeedingRefresh = [];

      for (const id of filteredExpandedIds) {
        const fresh = await allMatterIdsFresh([id]);
        if (!fresh) idsNeedingRefresh.push(id);
      }

      const expandRefresh = idsNeedingRefresh.length > 0
        ? await indexMatterIds(idsNeedingRefresh)
        : { refreshed: [], skipped: [], errors: [] };
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
      skippedMatterIds = refresh.skipped;
      refreshErrors = refresh.errors;
    rateLimitedIds = refresh.rateLimited || [];

      rows = await runSearch(params);
    }
  }

  const groups = groupByClaim(rows);

  const dedupedRefreshed = uniqueNumbers(refreshedMatterIds);
  const dedupedSkipped = uniqueNumbers(skippedMatterIds);

  return NextResponse.json({
    ok: true,
    count: rows.length,
    groupCount: groups.length,
    filters: params,
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
      rawExpandedCandidateCount: expandedMatterIdsForDebug.length,
      rawExpandedCandidateIds: expandedMatterIdsForDebug,
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
