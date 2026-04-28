import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export async function GET(req: NextRequest) {
  const matterId = req.nextUrl.searchParams.get("matterId");

  if (!matterId) {
    return NextResponse.json({ ok: false, error: "Missing matterId" });
  }

  const paths = [
    `/api/v4/matters/${matterId}.json`,
    `/api/v4/matters/${matterId}.json?fields=id,display_number,custom_field_values`,
    `/api/v4/custom_field_values.json?parent_id=${matterId}`,
    `/api/v4/custom_field_values.json?matter_id=${matterId}`,
    `/api/v4/custom_field_values.json?fields=id,value,custom_field,parent&parent_id=${matterId}`,
  ];

  const results = [];

  for (const path of paths) {
    const res = await clioFetch(path);
    const text = await res.text();

    results.push({
      path,
      status: res.status,
      ok: res.ok,
      preview: text.slice(0, 500),
    });
  }

  return NextResponse.json({ ok: true, results });
}
