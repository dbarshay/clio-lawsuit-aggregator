import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clioAuth";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

const CLAIM_NUMBER_FIELD_ID = 22145915;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPageToken(nextUrl: string | null): string | null {
  if (!nextUrl) return null;
  try {
    return new URL(nextUrl).searchParams.get("page_token");
  } catch {
    return null;
  }
}

function getClaimNumber(matter: any) {
  return matter.custom_field_values?.find(
    (c: any) => Number(c.custom_field?.id) === CLAIM_NUMBER_FIELD_ID
  )?.value;
}

async function clioFetchWithRetry(path: string, maxRetries = 3) {
  let attempt = 0;

  while (true) {
    const res = await clioFetch(path);
    const text = await res.text();

    if (res.status !== 429 || attempt >= maxRetries) {
      return { res, text };
    }

    const match = text.match(/Retry in (\d+) seconds/i);
    const waitSeconds = match ? Number(match[1]) : 60;

    await sleep((waitSeconds + 2) * 1000);
    attempt++;
  }
}

async function hydrateMatter(matterId: number) {
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

  const { res, text } = await clioFetchWithRetry(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
  );

  if (!res.ok) {
    throw new Error(`Hydrate failed ${res.status}: ${text}`);
  }

  return JSON.parse(text)?.data;
}

export async function GET(req: NextRequest) {
  const totalLimit = Number(req.nextUrl.searchParams.get("limit") || 250);
  const pageLimit = Math.min(Number(req.nextUrl.searchParams.get("pageLimit") || 50), 200);
  const delayMs = Number(req.nextUrl.searchParams.get("delayMs") || 1500);
  const maxPages = Number(req.nextUrl.searchParams.get("maxPages") || 100);

  let pageToken: string | null = null;

  let scanned = 0;
  let hydrated = 0;
  let indexed = 0;
  let skippedNoClaim = 0;
  let failed = 0;
  let rateLimitRetries = 0;

  const sampleClaims: any[] = [];
  const errors: any[] = [];

  for (let page = 0; page < maxPages; page++) {
    if (scanned >= totalLimit) break;

    const params = new URLSearchParams({
      limit: String(pageLimit),
      fields: "id,display_number",
    });

    if (pageToken) params.set("page_token", pageToken);

    const listResult = await clioFetchWithRetry(
      `/api/v4/matters.json?${params.toString()}`
    );

    const listRes = listResult.res;
    const listText = listResult.text;

    if (!listRes.ok) {
      return NextResponse.json({
        ok: false,
        phase: "list",
        error: `Clio list failed: ${listRes.status}`,
        body: listText,
        scanned,
        hydrated,
        indexed,
        skippedNoClaim,
        failed,
      });
    }

    const listJson = JSON.parse(listText);
    const matters = listJson?.data || [];

    if (matters.length === 0) break;

    for (const thinMatter of matters) {
      if (scanned >= totalLimit) break;

      scanned++;

      try {
        const matter = await hydrateMatter(Number(thinMatter.id));
        hydrated++;

        const claim = getClaimNumber(matter);

        if (!claim) {
          skippedNoClaim++;
        } else {
          const row = await upsertClaimIndexFromMatter(matter);
          indexed++;

          if (sampleClaims.length < 25) {
            sampleClaims.push({
              matterId: matter.id,
              displayNumber: matter.display_number,
              claimNumber: claim,
              normalized: row.claim_number_normalized,
            });
          }
        }
      } catch (err: any) {
        failed++;

        if (String(err?.message || "").includes("429")) {
          rateLimitRetries++;
        }

        if (errors.length < 25) {
          errors.push({
            matterId: thinMatter.id,
            error: err?.message || String(err),
          });
        }
      }

      await sleep(delayMs);
    }

    pageToken = extractPageToken(listJson?.meta?.paging?.next || null);
    if (!pageToken) break;

    await sleep(delayMs);
  }

  return NextResponse.json({
    ok: true,
    scanned,
    hydrated,
    indexed,
    skippedNoClaim,
    failed,
    rateLimitRetries,
    sampleClaims,
    errors,
  });
}
