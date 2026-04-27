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
    const nextParam = req.nextUrl.searchParams.get("next");
    const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "25"));
    const delayMs = Math.max(0, Number(req.nextUrl.searchParams.get("delayMs") || "200"));

    const nextUrl = nextParam
      ? decodeURIComponent(nextParam)
      : `/api/v4/matters.json?fields=id&limit=${limit}`;

    console.log("Fetching:", nextUrl);

    const res = await fetchWithRetry(nextUrl);
    const json = await res.json();

    const matters = Array.isArray(json?.data) ? json.data : [];
    const next = json?.meta?.paging?.next || null;

    let scanned = 0;
    let indexed = 0;
    let failed = 0;
    const errors: Array<{ id?: number; error: string }> = [];

    for (const m of matters) {
      const id = Number(m?.id);
      if (!id) continue;

      scanned++;

      try {
        const detail = await fetchMatterDetail(id);
        const result = await indexMatterFromClioPayload(detail);

        if (!(result as any)?.skipped) {
          indexed++;
        }
      } catch (e: any) {
        failed++;
        errors.push({ id, error: e?.message || "Unknown error" });
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
