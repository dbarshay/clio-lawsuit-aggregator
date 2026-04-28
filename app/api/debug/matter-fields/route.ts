import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export async function GET(req: NextRequest) {
  try {
    const matterId = req.nextUrl.searchParams.get("matterId");

    if (!matterId) {
      return NextResponse.json(
        { ok: false, error: "Missing matterId" },
        { status: 400 }
      );
    }

    const res = await clioFetch(
      `/api/v4/matters/${matterId}.json?fields=id,etag,display_number,custom_field_values`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await res.text();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      raw: text ? JSON.parse(text) : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
