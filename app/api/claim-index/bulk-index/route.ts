import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { indexMatterFromClioPayload } from "@/lib/claimIndexHydration";

async function fetchMatterDetail(matterId: number) {
  const fields = [
    "id",
    "display_number",
    "description",
    "status",
    "client",
    "custom_field_values{value,custom_field}",
  ].join(",");

  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Clio API ${res.status}: ${text}`);
  }

  return JSON.parse(text)?.data;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const matterIds = Array.isArray(body?.matterIds) ? body.matterIds : [];

  const results = [];

  for (const rawId of matterIds) {
    const matterId = Number(rawId);

    if (!Number.isFinite(matterId)) {
      results.push({ matterId: rawId, ok: false, error: "Invalid matterId" });
      continue;
    }

    try {
      const detail = await fetchMatterDetail(matterId);
      const indexed = await indexMatterFromClioPayload(detail);

      results.push({
        matterId,
        ok: true,
        indexed,
      });
    } catch (err: any) {
      results.push({
        matterId,
        ok: false,
        error: err?.message || "Unknown error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    requested: matterIds.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
