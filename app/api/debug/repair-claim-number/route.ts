import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

const CLAIM_NUMBER_FIELD_ID = 22145915;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const matterId = Number(body.matterId);
    const claimNumber = String(body.claimNumber || "").trim();

    if (!matterId || !claimNumber) {
      return NextResponse.json(
        { ok: false, error: "matterId and claimNumber are required." },
        { status: 400 }
      );
    }

    const fields = "id,etag,custom_field_values{id,value,custom_field}";
    const readRes = await clioFetch(
      `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`,
      { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
    );

    const readText = await readRes.text();

    if (!readRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Read failed: ${readText}` },
        { status: 500 }
      );
    }

    const matter = JSON.parse(readText)?.data;
    const existing = (matter.custom_field_values || []).find(
      (cfv: any) => Number(cfv?.custom_field?.id) === CLAIM_NUMBER_FIELD_ID
    );

    if (!existing?.id) {
      return NextResponse.json(
        { ok: false, error: "Could not find existing CLAIM NUMBER custom field value." },
        { status: 500 }
      );
    }

    const patchRes = await clioFetch(`/api/v4/matters/${matterId}.json`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "If-Match": matter.etag,
      },
      body: JSON.stringify({
        data: {
          custom_field_values: [
            {
              id: existing.id,
              custom_field: { id: CLAIM_NUMBER_FIELD_ID },
              value: claimNumber,
            },
          ],
        },
      }),
    });

    const patchText = await patchRes.text();

    if (!patchRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Patch failed: ${patchText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      matterId,
      claimNumber,
      fieldValueId: existing.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
