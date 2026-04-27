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
    "custom_field_values{value,custom_field}"
  ].join(",");

  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clio API ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json?.data;
}

export async function GET(req: NextRequest) {
  try {
    const matterIdParam = req.nextUrl.searchParams.get("matterId");

    if (!matterIdParam) {
      return NextResponse.json(
        { ok: false, error: "Missing matterId" },
        { status: 400 }
      );
    }

    const matterId = Number(matterIdParam);

    if (!Number.isFinite(matterId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid matterId" },
        { status: 400 }
      );
    }

    const detail = await fetchMatterDetail(matterId);
    const indexed = await indexMatterFromClioPayload(detail);

    if ((indexed as any)?.skipped) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    return NextResponse.json({
      ok: true,
      matterId,
      indexed,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
