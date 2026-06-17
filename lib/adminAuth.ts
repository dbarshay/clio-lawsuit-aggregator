import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "barsh_admin_gate";
export const ADMIN_AUTHORIZE_PATH = "/api/admin/authorize";

export type ConfiguredAdminPassword = {
  password: string;
  configured: boolean;
  devFallback: boolean;
};

export function cleanAdminAuthValue(value: unknown): string {
  return String(value ?? "").trim();
}

export function configuredAdminPassword(): ConfiguredAdminPassword {
  const configured = cleanAdminAuthValue(process.env.BARSH_ADMIN_PASSWORD);
  if (configured) {
    return {
      password: configured,
      configured: true,
      devFallback: false,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      password: "barsh-admin-dev",
      configured: false,
      devFallback: true,
    };
  }

  return {
    password: "",
    configured: false,
    devFallback: false,
  };
}

export function configuredAdminSessionToken(): string {
  const configured = cleanAdminAuthValue(process.env.BARSH_ADMIN_SESSION_TOKEN);
  if (configured) return configured;

  if (process.env.NODE_ENV !== "production") return "barsh-admin-dev-session";

  return "";
}

export function safeAdminAction(value: unknown): string {
  return cleanAdminAuthValue(value).slice(0, 80) || "Administrator";
}

export function isAdminRequestAuthorized(req: NextRequest): boolean {
  const expectedToken = configuredAdminSessionToken();
  const actualToken = cleanAdminAuthValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);

  return Boolean(expectedToken && actualToken === expectedToken);
}

export function setAdminGateCookie(response: NextResponse): void {
  const sessionToken = configuredAdminSessionToken();

  if (!sessionToken) return;

  response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearAdminGateCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function adminUnauthorizedJson(status = 401) {
  return NextResponse.json(
    {
      ok: false,
      action: "admin-proxy",
      authorized: false,
      error: "Administrator authorization required.",
    },
    { status }
  );
}
