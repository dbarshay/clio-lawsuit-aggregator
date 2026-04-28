import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

const SPECS = [
  "id,display_number,custom_field_values",
  "id,display_number,custom_field_values{id}",
  "id,display_number,custom_field_values{id,value}",
  "id,display_number,custom_field_values{id,value,custom_field}",
  "id,display_number,custom_field_values{id,value,custom_field{id}}",
  "id,display_number,custom_field_values{field_name,value}",
  "id,display_number,custom_field_values{id,field_name,value}",
  "id,display_number,custom_field_values{id,field_name,value,custom_field{id}}",
];

export async function GET(req: NextRequest) {
  const matterId = req.nextUrl.searchParams.get("matterId") || "1872642740";
  const results = [];

  for (const fields of SPECS) {
    const encodedFields = encodeURIComponent(fields);
    const path = `/api/v4/matters/${matterId}.json?fields=${encodedFields}`;

    const res = await clioFetch(path);
    const text = await res.text();

    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    results.push({
      fields,
      path,
      status: res.status,
      ok: res.ok,
      sampleCustomFieldValues: parsed?.data?.custom_field_values?.slice?.(0, 5) || null,
      error: parsed?.error || parsed?.error_description || null,
    });
  }

  return NextResponse.json({ ok: true, matterId, results });
}
