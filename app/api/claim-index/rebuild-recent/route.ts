import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { indexMatterFromClioPayload } from "@/lib/claimIndexHydration";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  throw new Error(`Retry limit exceeded`);
}

async function fetchMatterDetail(matterId: number) {
  const fields = [
    "id",
    "display_number",
    "description",
    "status",
    "client",
    "custom_field_values{value,custom_field}"
  ].join(",");

  const res = await fetchWithRetry(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
  );

  const json = await res.json();
  return json?.data;
}

export async function GET(req: NextRequest) {
  try {
    const limit = Math.max(
      1,
      Number(req.nextUrl.searchParams.get("limit") || "100")
    );

    const delayMs = Math.max(
      0,
      Number(req.nextUrl.searchParams.get("delayMs") || "100")
    );

    const listRes = await fetchWithRetry(
      `/api/v4/matters.json?fields=id&limit=${limit}`
    );

    const listJson = await listRes.json();
    const matters = Array.isArray(listJson?.data) ? listJson.data : [];

    let scanned = 0;
    let indexed = 0;
    let failed = 0;

    const indexedMatterIds: number[] = [];
    const skippedNoClaim: number[] = [];
    const errors: Array<{ id?: number; error: string }> = [];

    for (const m of matters) {
      const id = Number(m?.id);
      if (!id) continue;

      scanned++;

      try {
        const detail = await fetchMatterDetail(id);
        await indexMatterFromClioPayload(detail);
        indexed++;
        indexedMatterIds.push(id);
      } catch (e: any) {
        const msg = e?.message || "Unknown error";

        if (msg === "No claim number") {
          skippedNoClaim.push(id);
        } else {
          failed++;
          errors.push({ id, error: msg });
        }
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }

    return NextResponse.json({
      ok: true,
      scanned,
      indexed,
      failed,
      skippedNoClaim: skippedNoClaim.length,
      indexedMatterIds,
      skippedNoClaimIds: skippedNoClaim,
      errors: errors.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
