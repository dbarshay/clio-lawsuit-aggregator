import { NextRequest, NextResponse } from "next/server";
import {
  cleanAdminAuthValue,
  configuredAdminPassword,
  configuredAdminSessionToken,
  safeAdminAction,
  setAdminGateCookie,
} from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = cleanAdminAuthValue(body?.password);
    const action = safeAdminAction(body?.action);

    const adminPassword = configuredAdminPassword();
    const sessionToken = configuredAdminSessionToken();

    if (!adminPassword.password || !sessionToken) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-authorize",
          authorized: false,
          error: "Administrator password is not configured.  Set BARSH_ADMIN_PASSWORD and BARSH_ADMIN_SESSION_TOKEN.",
          passwordConfigured: adminPassword.configured,
          devFallback: false,
        },
        { status: 503 }
      );
    }

    if (!password || password !== adminPassword.password) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-authorize",
          authorized: false,
          error: "Invalid administrator password.",
          passwordConfigured: adminPassword.configured,
          devFallback: adminPassword.devFallback,
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      action: "admin-authorize",
      authorized: true,
      adminAction: action,
      passwordConfigured: adminPassword.configured,
      devFallback: adminPassword.devFallback,
      note: adminPassword.devFallback
        ? "Development fallback password accepted.  Configure BARSH_ADMIN_PASSWORD for production."
        : "Administrator password accepted.",
    });

    setAdminGateCookie(response);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "admin-authorize",
        authorized: false,
        error: error?.message || "Administrator authorization failed.",
      },
      { status: 500 }
    );
  }
}
