import { createHmac, timingSafeEqual } from "node:crypto";
import { configuredAdminSessionToken } from "@/lib/adminAuth";

// Short-lived signed token proving the PASSWORD step of login succeeded, so the SMS-code step
// (/api/auth/2fa/verify) cannot be reached without a valid password first. Carried in an httpOnly
// cookie between login step 1 and step 2. Signed with the same server session secret (HMAC-SHA256)
// used for the gate cookie; expires after TWO_FACTOR_PENDING_TTL_SECONDS.

export const TWO_FACTOR_PENDING_COOKIE = "barsh_2fa_pending";
export const TWO_FACTOR_PENDING_TTL_SECONDS = 10 * 60;

type PendingPayload = { userId: string; email: string; issuedAt: number; source: "2fa-pending" };

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function b64url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encoded: string): string {
  const secret = configuredAdminSessionToken();
  if (!secret) return "";
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

function sigMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createTwoFactorPendingToken(input: { userId: string; email: string }): string {
  const userId = clean(input.userId);
  const email = clean(input.email).toLowerCase();
  if (!userId || !email) return "";
  const payload: PendingPayload = { userId, email, issuedAt: Date.now(), source: "2fa-pending" };
  const encoded = b64url(JSON.stringify(payload));
  const signature = sign(encoded);
  if (!signature) return "";
  return `${encoded}.${signature}`;
}

export function readTwoFactorPendingToken(value: unknown): { userId: string; email: string } | null {
  const raw = clean(value);
  const [encoded, signature, extra] = raw.split(".");
  if (!encoded || !signature || extra) return null;
  if (!sigMatch(signature, sign(encoded))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as PendingPayload;
    if (!parsed || parsed.source !== "2fa-pending") return null;
    if (!clean(parsed.userId) || !clean(parsed.email)) return null;
    const ageMs = Date.now() - Number(parsed.issuedAt);
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > TWO_FACTOR_PENDING_TTL_SECONDS * 1000) return null;
    return { userId: clean(parsed.userId), email: clean(parsed.email).toLowerCase() };
  } catch {
    return null;
  }
}
