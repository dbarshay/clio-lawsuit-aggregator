import { NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export async function GET() {
  const res = await clioFetch(
    "/api/v4/matters.json?limit=5&fields=id,display_number,custom_field_values"
  );

  const text = await res.text();

  return NextResponse.json({
    status: res.status,
    ok: res.ok,
    body: text,
  });
}
