import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export async function GET(req: NextRequest) {
  const displayNumber = req.nextUrl.searchParams.get("displayNumber");

  if (!displayNumber) {
    return NextResponse.json(
      { ok: false, error: "Missing displayNumber" },
      { status: 400 }
    );
  }

  const fields = [
    "id",
    "display_number",
    "description",
    "status",
  ].join(",");

  const res = await clioFetch(
    `/api/v4/matters.json?fields=${encodeURIComponent(fields)}&query=${encodeURIComponent(displayNumber)}&limit=10`
  );

  const text = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: text },
      { status: res.status }
    );
  }

  const json = JSON.parse(text);
  const matters = Array.isArray(json?.data) ? json.data : [];

  return NextResponse.json({
    ok: true,
    count: matters.length,
    displayNumber,
    matters,
  });
}
