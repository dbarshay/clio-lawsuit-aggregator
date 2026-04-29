import { prisma } from "@/lib/prisma";
import { clioFetch } from "@/lib/clio";

type SeedRow = {
  matter_id: number;
  claim_number_normalized: string | null;
  patient_name: string | null;
  client_name: string | null;
  insurer_name: string | null;
  master_lawsuit_id: string | null;
  index_aaa_number: string | null;
};

type ClioExpansionIssue = {
  query: string;
  status: number;
  error: string;
  rateLimited: boolean;
};

function clean(v: string | null | undefined) {
  return (v || "").trim();
}

function uniqueStrings(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
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

async function searchClioMatterIdsByQuery(
  query: string,
  issues: ClioExpansionIssue[]
): Promise<number[]> {
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

    const res = await clioFetch(`/matters.json?${params.toString()}`);

    if (!res.ok) {
      const text = await res.text();
      issues.push({
        query,
        status: res.status,
        error: text,
        rateLimited: res.status === 429 || text.includes("Rate limit"),
      });
      return ids;
    }

    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];

    for (const matter of data) {
      const id = Number(matter?.id);
      if (Number.isFinite(id) && id > 0) ids.push(id);
    }

    pageToken = getNextPageToken(json);
  } while (pageToken);

  return uniqueNumbers(ids);
}

async function addClaimIndexMatches(rows: SeedRow[], matterIds: Set<number>) {
  const claims = uniqueStrings(rows.map((r) => r.claim_number_normalized));
  const patients = uniqueStrings(rows.map((r) => r.patient_name));
  const providers = uniqueStrings(rows.map((r) => r.client_name));
  const insurers = uniqueStrings(rows.map((r) => r.insurer_name));
  const masterIds = uniqueStrings(rows.map((r) => r.master_lawsuit_id));
  const indexNums = uniqueStrings(rows.map((r) => r.index_aaa_number));

  if (claims.length > 0) {
    const found = await prisma.claimIndex.findMany({
      where: { claim_number_normalized: { in: claims } },
      select: { matter_id: true },
    });
    found.forEach((f) => matterIds.add(f.matter_id));
  }

  for (const patient of patients) {
    for (const provider of providers) {
      const found = await prisma.claimIndex.findMany({
        where: {
          AND: [
            { patient_name: { contains: patient, mode: "insensitive" } },
            { client_name: { contains: provider, mode: "insensitive" } },
          ],
        },
        select: { matter_id: true },
      });
      found.forEach((f) => matterIds.add(f.matter_id));
    }
  }

  if (patients.length > 0) {
    const found = await prisma.claimIndex.findMany({
      where: { patient_name: { in: patients } },
      select: { matter_id: true },
    });
    found.forEach((f) => matterIds.add(f.matter_id));
  }

  if (masterIds.length > 0) {
    const found = await prisma.claimIndex.findMany({
      where: { master_lawsuit_id: { in: masterIds } },
      select: { matter_id: true },
    });
    found.forEach((f) => matterIds.add(f.matter_id));
  }

  if (indexNums.length > 0) {
    const found = await prisma.claimIndex.findMany({
      where: { index_aaa_number: { in: indexNums } },
      select: { matter_id: true },
    });
    found.forEach((f) => matterIds.add(f.matter_id));
  }

  for (const patient of patients) {
    for (const insurer of insurers) {
      const found = await prisma.claimIndex.findMany({
        where: {
          AND: [
            { patient_name: { contains: patient, mode: "insensitive" } },
            { insurer_name: { contains: insurer, mode: "insensitive" } },
          ],
        },
        select: { matter_id: true },
      });
      found.forEach((f) => matterIds.add(f.matter_id));
    }
  }
}

async function addClioMatches(
  rows: SeedRow[],
  matterIds: Set<number>,
  issues: ClioExpansionIssue[]
) {
  const claims = uniqueStrings(rows.map((r) => r.claim_number_normalized));
  const patients = uniqueStrings(rows.map((r) => r.patient_name));
  const providers = uniqueStrings(rows.map((r) => r.client_name));
  const insurers = uniqueStrings(rows.map((r) => r.insurer_name));
  const masterIds = uniqueStrings(rows.map((r) => r.master_lawsuit_id));
  const indexNums = uniqueStrings(rows.map((r) => r.index_aaa_number));

  let queries: string[] = [];

  if (claims.length > 0) {
    queries = claims;
  } else if (masterIds.length > 0 || indexNums.length > 0) {
    queries = [...masterIds, ...indexNums];
  } else {
    queries.push(...patients);

    for (const patient of patients) {
      for (const insurer of insurers) {
        queries.push(`${patient} ${insurer}`);
      }

      for (const provider of providers) {
        queries.push(`${provider} ${patient}`);
      }
    }
  }

  const uniqueQueries = Array.from(new Set(queries.map(clean).filter(Boolean)));

  for (const query of uniqueQueries) {
    const found = await searchClioMatterIdsByQuery(query, issues);
    found.forEach((id) => matterIds.add(id));
  }

  return uniqueQueries;
}

type ExpandFromSeedOptions = {
  includeClio?: boolean;
};

export async function expandFromSeed(
  rows: SeedRow[],
  options: ExpandFromSeedOptions = {}
) {
  const matterIds = new Set<number>();
  const clioIssues: ClioExpansionIssue[] = [];
  let clioQueries: string[] = [];
  let clioExpansionSkipped = options.includeClio === false;

  rows.forEach((row) => matterIds.add(row.matter_id));

  await addClaimIndexMatches(rows, matterIds);

  if (options.includeClio !== false) {
    clioQueries = await addClioMatches(rows, matterIds, clioIssues);
  }

  return {
    matterIds: Array.from(matterIds),
    clioExpansionSkipped,
    clioQueries,
    clioIssues,
    clioRateLimited: clioIssues.filter((i) => i.rateLimited).length,
  };
}
