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

    const res = await clioFetch(`/api/v4/matters/${matterId}.json`);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: text || "Failed to load matter" },
        { status: res.status }
      );
    }

    const json = await res.json();

    return NextResponse.json({
      ok: true,
      raw: json?.data ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
