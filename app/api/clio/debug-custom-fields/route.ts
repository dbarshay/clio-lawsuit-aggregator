import { NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export async function GET() {
  try {
    const fields = encodeURIComponent("id,etag,display_number,custom_field_values");
    const res = await clioFetch(`/api/v4/matters/1870311350.json?fields=${fields}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await res.text();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      body: text ? JSON.parse(text) : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
        stack: err?.stack || null,
      },
      { status: 500 }
    );
  }
}
