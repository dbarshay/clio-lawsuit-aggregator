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

async function fetchWithRetry(path: string, maxAttempts = 8) {
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
    const min = Number(req.nextUrl.searchParams.get("min") || "30000");
    const max = Number(req.nextUrl.searchParams.get("max") || "39999");
    const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "200"));
    const delayMs = Math.max(0, Number(req.nextUrl.searchParams.get("delayMs") || "100"));
    const maxPages = Math.max(1, Number(req.nextUrl.searchParams.get("maxPages") || "100"));

    const listFields = encodeURIComponent("id,display_number");

    let nextUrl: string | null = `/api/v4/matters.json?fields=${listFields}&limit=${limit}`;

    let pages = 0;
    let seen = 0;
    let skippedBelow = 0;
    let skippedAbove = 0;
    let scannedInRange = 0;
    let indexed = 0;
    let skippedNoClaim = 0;
    let failed = 0;
    let stoppedBecause = "completed";

    const indexedDisplayNumbers: string[] = [];
    const scannedDisplayNumbers: string[] = [];
    const errors: Array<{ id?: number; displayNumber?: string; error: string }> = [];

    while (nextUrl && pages < maxPages) {
      pages++;

      console.log(`BRL RANGE PAGE ${pages}:`, nextUrl);

      const listRes = await fetchWithRetry(nextUrl);
      const listJson = await listRes.json();

      const matters = Array.isArray(listJson?.data) ? listJson.data : [];
      nextUrl = listJson?.meta?.paging?.next || null;

      let pageHadInRange = false;
      let pageHadAboveRange = false;

      for (const m of matters) {
        const id = Number(m?.id);
        const displayNumber = String(m?.display_number || "");
        const n = brlNumber(displayNumber);

        if (!id || n === null) continue;

        seen++;

        if (n < min) {
          skippedBelow++;
          continue;
        }

        if (n > max) {
          skippedAbove++;
          pageHadAboveRange = true;
          continue;
        }

        pageHadInRange = true;
        scannedInRange++;
        scannedDisplayNumbers.push(displayNumber);

        try {
          const detail = await fetchMatterDetail(id);
          const result = await indexMatterFromClioPayload(detail);

          if ((result as any)?.skipped) {
            skippedNoClaim++;
          } else {
            indexed++;
            indexedDisplayNumbers.push(displayNumber);
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

      // If we have passed the range after seeing the range, stop.
      if (pageHadAboveRange && (scannedInRange > 0 || pageHadInRange)) {
        stoppedBecause = "passed max BRL range";
        break;
      }
    }

    if (pages >= maxPages && nextUrl) {
      stoppedBecause = "maxPages reached";
    }

    return NextResponse.json({
      ok: true,
      range: { min, max },
      pages,
      seen,
      skippedBelow,
      skippedAbove,
      scannedInRange,
      indexed,
      skippedNoClaim,
      failed,
      stoppedBecause,
      next: nextUrl,
      scannedDisplayNumbers,
      indexedDisplayNumbers,
      errors: errors.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
