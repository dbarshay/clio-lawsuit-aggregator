import { NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { getStoredClioToken } from "@/lib/clioTokenStore";

export async function GET() {
  try {
    const before = await getStoredClioToken();

    const res = await clioFetch("/matters.json?limit=1&fields=id,display_number");

    const body = await res.json().catch(() => null);
    const after = await getStoredClioToken();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      sample: body?.data || body,
      tokenStoredInDb: true,
      hadExpiresAtBefore: Boolean(before.expiresAt),
      expiresAtBefore: before.expiresAt,
      expiresAtAfter: after.expiresAt,
      reauthorizeUrl: "/api/clio/oauth/start",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        reauthorizeUrl: "/api/clio/oauth/start",
      },
      { status: 500 }
    );
  }
}
