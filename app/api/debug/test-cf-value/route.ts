import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export async function GET(req: NextRequest) {
  const cfId = req.nextUrl.searchParams.get("cfId");

  if (!cfId) {
    return NextResponse.json({ ok: false, error: "Missing cfId" }, { status: 400 });
  }

  const paths = [
    `/api/v4/custom_field_values/${cfId}.json`,
    `/api/v4/custom_field_values/${encodeURIComponent(cfId)}.json`,
    `/api/v4/custom_field_values.json?id=${encodeURIComponent(cfId)}`,
  ];

  const results = [];

  for (const path of paths) {
    const res = await clioFetch(path, { cache: "no-store" });
    const text = await res.text();

    results.push({
      path,
      status: res.status,
      ok: res.ok,
      preview: text.slice(0, 1000),
    });
  }

  return NextResponse.json({ ok: true, cfId, results });
}
