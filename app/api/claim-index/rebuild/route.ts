import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { indexMatterFromClioPayload } from "@/lib/claimIndexHydration";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function brlNumber(displayNumber: any): number | null {
  const match = String(displayNumber || "").match(/^BRL(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function shouldScan(displayNumber: any) {
  const n = brlNumber(displayNumber);
  return n !== null && n >= 30000;
}

async function fetchWithRetry(path: string, maxAttempts = 5) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    const res = await clioFetch(path);

    if (res.ok) return res;

    const text = await res.text();

    if (res.status === 429) {
      const match = text.match(/Retry in (\d+) seconds/i);
      const delay = match ? Number(match[1]) * 1000 : 30000;
      console.log(`Rate limited. Waiting ${delay} ms...`);
      await sleep(delay);
      continue;
    }

    throw new Error(`Clio API ${res.status}: ${text}`);
  }

  throw new Error("Retry limit exceeded");
}

async function fetchMatterDetail(matterId: number) {
  const fields = [
    "id",
    "etag",
    "display_number",
    "description",
    "status",
    "matter_stage",
    "client",
    "custom_field_values{id,value,custom_field{id}}",
  ].join(",");

  const res = await fetchWithRetry(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
  );

  const json = await res.json();
  return json?.data;
}

export async function GET(req: NextRequest) {
  try {
    const nextParam = req.nextUrl.searchParams.get("next");
    const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "50"));
    const delayMs = Math.max(0, Number(req.nextUrl.searchParams.get("delayMs") || "250"));

    const listFields = encodeURIComponent("id,display_number");

    const nextUrl = nextParam
      ? decodeURIComponent(nextParam)
      : `/api/v4/matters.json?fields=${listFields}&limit=${limit}`;

    console.log("Fetching:", nextUrl);

    const res = await fetchWithRetry(nextUrl);
    const json = await res.json();

    const matters = Array.isArray(json?.data) ? json.data : [];
    const next = json?.meta?.paging?.next || null;

    let scanned = 0;
    let skippedBefore30000 = 0;
    let indexed = 0;
    let failed = 0;

    const errors: Array<{ id?: number; displayNumber?: string; error: string }> = [];

    for (const m of matters) {
      const id = Number(m?.id);
      const displayNumber = String(m?.display_number || "");

      if (!id) continue;

      if (!shouldScan(displayNumber)) {
        skippedBefore30000++;
        continue;
      }

      scanned++;

      try {
        const detail = await fetchMatterDetail(id);
        const result = await indexMatterFromClioPayload(detail);

        if (!(result as any)?.skipped) {
          indexed++;
        }
      } catch (e: any) {
        failed++;
        errors.push({
          id,
          displayNumber,
          error: e?.message || "Unknown error",
        });
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }

    return NextResponse.json({
      ok: true,
      scanned,
      skippedBefore30000,
      indexed,
      failed,
      next,
      errors: errors.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
