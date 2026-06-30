import { NextRequest, NextResponse } from "next/server";
import { resolveAccess, roleEnforcementEnabled } from "@/lib/admin-permissions/resolveAccess";
import { adminPermissionKeysForTier } from "@/lib/admin-permissions/catalog";

const ADMIN_COOKIE_NAME = "barsh_admin_gate";
const OWNER_ADMIN_EMAIL = "dbarshay15@gmail.com";

type SignedGatePayload = {
  token?: string;
  lastActivityAt?: number;
  source?: string;
  identity?: {
    id?: string;
    email?: string;
    username?: string | null;
    roleKeys?: string[];
  } | null;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function base64UrlDecodeText(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function configuredSessionToken(): string {
  const configured = clean(process.env.BARSH_ADMIN_SESSION_TOKEN);
  if (configured) return configured;
  // Dev fallback mirrors lib/adminAuth.ts so the middleware validates the same cookies the
  // app issues in development. In production an unset token yields "" → every cookie fails
  // (fail-closed), never a predictable token.
  if (process.env.NODE_ENV !== "production") return "barsh-admin-dev-session";
  return "";
}

async function signPayload(encodedPayload: string): Promise<string> {
  const token = configuredSessionToken();
  if (!token) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(token),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function readSignedGatePayload(value: string | undefined): Promise<SignedGatePayload | null> {
  const cookieValue = clean(value);
  if (!cookieValue || !cookieValue.includes(".")) return null;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signPayload(encodedPayload);
  if (!expectedSignature || signature !== expectedSignature) return null;

  try {
    const parsed = JSON.parse(base64UrlDecodeText(encodedPayload)) as SignedGatePayload;
    if (!parsed || parsed.source !== "signed-gate") return null;
    if (parsed.token !== configuredSessionToken()) return null;
    if (!Number.isFinite(Number(parsed.lastActivityAt))) return null;

    const inactiveForMs = Date.now() - Number(parsed.lastActivityAt);
    if (inactiveForMs < 0) return null;
    if (inactiveForMs > 60 * 60 * 1000) return null;

    return parsed;
  } catch {
    return null;
  }
}

function isAdminSurface(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function blockedResponse(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        ok: false,
        action: "admin-enforcement-phase14a",
        blocked: true,
        error: "Administrator functions are restricted to owner_admin.",
        permissionEnforcementScope: "admin-functions-only",
      },
      { status: 403 }
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("adminBlocked", "1");
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (!isAdminSurface(pathname)) return NextResponse.next();

  const gate = await readSignedGatePayload(req.cookies.get(ADMIN_COOKIE_NAME)?.value);

  // No valid signed gate: fail CLOSED on admin surfaces (was previously fail-open).
  if (!gate) return blockedResponse(req);

  // Legacy/generic owner recovery sessions have no identity in the signed gate and remain allowed.
  const identityEmail = clean(gate.identity?.email).toLowerCase();
  if (!identityEmail) return NextResponse.next();

  const identityRoleKeys = Array.isArray(gate.identity?.roleKeys) ? gate.identity.roleKeys.map(clean) : [];
  const isOwner =
    identityEmail === OWNER_ADMIN_EMAIL ||
    identityRoleKeys.includes("owner_admin") ||
    identityRoleKeys.includes("owner");
  if (isOwner) return NextResponse.next();

  // Role-based access is ONLY consulted when enforcement is explicitly enabled. With the flag off
  // (default), behavior is unchanged: any non-owner on an admin surface is blocked, exactly as before.
  if (roleEnforcementEnabled()) {
    // v1 is all-or-nothing for admin functions: an Administrator role carries every admin-tier
    // grant. Per-card grants (carried in the signed identity) are the planned fast-follow.
    const grantedAdminPermissionKeys = identityRoleKeys.includes("administrator")
      ? adminPermissionKeysForTier("admin")
      : [];
    const decision = resolveAccess({
      isOwner: false,
      roleKeys: identityRoleKeys,
      grantedAdminPermissionKeys,
      pathname,
      method: req.method,
    });
    if (decision.allowed) return NextResponse.next();
  }

  return blockedResponse(req);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
