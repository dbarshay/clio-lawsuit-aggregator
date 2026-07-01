import { timingSafeEqual } from "node:crypto";

// Twilio Verify-backed SMS 2FA for Barsh Matters admin login.
//
// Twilio Verify (not raw Programmable Messaging) is used deliberately: when a 10DLC number is used
// only for user verification, Twilio Verify is EXEMPT from A2P 10DLC brand/campaign registration.
// Twilio owns code generation, delivery, expiry, retry, and rate-limiting; we only start a
// verification and check a submitted code. No OTP is generated or stored on our side.
//
// This module is intentionally free of Next/Prisma imports so it can be unit-tested in isolation.
// It is consumed by the login + 2FA-verify routes (Node runtime), never the Edge middleware.

export const TWO_FACTOR_RUNTIME = "TWILIO_VERIFY_2FA";
const TWILIO_VERIFY_BASE = "https://verify.twilio.com/v2";

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

// --- Feature flag + configuration -----------------------------------------------------------

/** Master kill-switch. Default OFF -> login never asks for a code (behaves exactly as today). */
export function twoFactorFeatureEnabled(): boolean {
  const raw = env("BARSH_2FA_ENABLED").toLowerCase();
  return raw === "1" || raw === "true";
}

export function twilioVerifyConfig(): { accountSid: string; authToken: string; serviceSid: string } {
  return {
    accountSid: env("TWILIO_ACCOUNT_SID"),
    authToken: env("TWILIO_AUTH_TOKEN"),
    serviceSid: env("TWILIO_VERIFY_SERVICE_SID"),
  };
}

export function twilioVerifyConfigured(): boolean {
  const c = twilioVerifyConfig();
  return Boolean(c.accountSid && c.authToken && c.serviceSid);
}

/** True only when the feature is on AND Twilio credentials are present. */
export function twilioVerifyEnabled(): boolean {
  return twoFactorFeatureEnabled() && twilioVerifyConfigured();
}

// --- Per-user requiredness -------------------------------------------------------------------

export type TwoFactorSubject = {
  email?: string | null;
  twoFactorDisabled?: boolean | null;
  twoFactorPhone?: string | null;
  twoFactorPhoneMasked?: string | null;
};

/**
 * Whether THIS user must pass SMS 2FA (independent of the feature flag, which the caller checks).
 * Every active admin user is required unless the Owner has explicitly exempted them
 * (twoFactorDisabled). A user with no phone on file cannot be verified -> treated as required so the
 * login path blocks them until a phone is set (phone is mandatory at user creation).
 */
export function twoFactorRequiredForUser(user: TwoFactorSubject | null | undefined): boolean {
  if (!user) return false;
  if (user.twoFactorDisabled) return false;
  return true;
}

export function twoFactorHasDeliverablePhone(user: TwoFactorSubject | null | undefined): boolean {
  return Boolean(user && (normalizeE164Phone(user.twoFactorPhone).ok || user.twoFactorPhoneMasked));
}

// --- E.164 phone normalization ---------------------------------------------------------------

export type E164Result = { ok: boolean; e164: string | null; reason: string | null };

/**
 * Normalize a user-entered phone to E.164 (e.g. "+15551234567"). Defaults a bare 10-digit number to
 * the US country code (+1). Returns ok:false with a reason for anything that can't be a valid number.
 */
export function normalizeE164Phone(input: unknown): E164Result {
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: false, e164: null, reason: "Phone number is required." };

  const hadPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return { ok: false, e164: null, reason: "Phone number has no digits." };

  let e164: string;
  if (hadPlus) {
    e164 = `+${digits}`;
  } else if (digits.length === 10) {
    e164 = `+1${digits}`; // bare US number
  } else if (digits.length === 11 && digits.startsWith("1")) {
    e164 = `+${digits}`; // US with leading 1
  } else {
    e164 = `+${digits}`; // assume caller included country code
  }

  // E.164: leading +, first digit 1-9, total 8..15 digits.
  if (!/^\+[1-9]\d{6,14}$/.test(e164)) {
    return { ok: false, e164: null, reason: "Not a valid phone number. Include country code, e.g. +1 555 123 4567." };
  }
  return { ok: true, e164, reason: null };
}

export function maskE164Phone(e164: string | null | undefined): string | null {
  const digits = String(e164 ?? "").replace(/[^\d]/g, "");
  if (digits.length < 4) return null;
  return `***-***-${digits.slice(-4)}`;
}

// --- Owner break-glass recovery --------------------------------------------------------------

/**
 * Emergency Owner sign-in when SMS is unavailable. Env-only secret; never stored in the DB or shown
 * in the UI. Only honored for the Owner email, and only reachable AFTER the password step. Uses a
 * constant-time compare and is heavily audit-logged by the caller.
 */
export function ownerBreakGlassEnabled(): boolean {
  return env("BARSH_2FA_OWNER_BREAKGLASS_CODE").length > 0;
}

export function matchesOwnerBreakGlass(params: { isOwner: boolean; code: string }): boolean {
  const configured = env("BARSH_2FA_OWNER_BREAKGLASS_CODE");
  if (!params.isOwner || !configured) return false;
  const submitted = String(params.code ?? "").trim();
  if (!submitted || submitted.length !== configured.length) return false;
  try {
    return timingSafeEqual(Buffer.from(submitted), Buffer.from(configured));
  } catch {
    return false;
  }
}

// --- Twilio Verify REST calls ----------------------------------------------------------------

export type VerifyStartResult = { ok: boolean; status: string | null; error: string | null };
export type VerifyCheckResult = { ok: boolean; approved: boolean; status: string | null; error: string | null };

function authHeader(): string {
  const { accountSid, authToken } = twilioVerifyConfig();
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

async function twilioPost(path: string, form: Record<string, string>): Promise<{ status: number; json: any }> {
  const { serviceSid } = twilioVerifyConfig();
  const res = await fetch(`${TWILIO_VERIFY_BASE}/Services/${serviceSid}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

/** Ask Twilio to send an SMS verification code to the given E.164 number. */
export async function startVerification(phoneE164: string): Promise<VerifyStartResult> {
  if (!twilioVerifyEnabled()) return { ok: false, status: null, error: "Twilio Verify is not configured." };
  const phone = normalizeE164Phone(phoneE164);
  if (!phone.ok || !phone.e164) return { ok: false, status: null, error: phone.reason };
  try {
    const { status, json } = await twilioPost("/Verifications", { To: phone.e164, Channel: "sms" });
    if (status >= 200 && status < 300) return { ok: true, status: String(json?.status ?? "pending"), error: null };
    return { ok: false, status: null, error: String(json?.message ?? `Twilio Verify start failed (${status}).`) };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message : "Twilio Verify start error." };
  }
}

/** Check a submitted code against Twilio Verify. approved=true only when Twilio says "approved". */
export async function checkVerification(phoneE164: string, code: string): Promise<VerifyCheckResult> {
  if (!twilioVerifyEnabled()) return { ok: false, approved: false, status: null, error: "Twilio Verify is not configured." };
  const phone = normalizeE164Phone(phoneE164);
  if (!phone.ok || !phone.e164) return { ok: false, approved: false, status: null, error: phone.reason };
  const submitted = String(code ?? "").trim();
  if (!submitted) return { ok: false, approved: false, status: null, error: "Code is required." };
  try {
    const { status, json } = await twilioPost("/VerificationCheck", { To: phone.e164, Code: submitted });
    if (status >= 200 && status < 300) {
      const approved = json?.status === "approved" && json?.valid === true;
      return { ok: true, approved, status: String(json?.status ?? "unknown"), error: null };
    }
    // Twilio returns 404 when the verification has expired / already consumed.
    return { ok: false, approved: false, status: null, error: String(json?.message ?? `Twilio Verify check failed (${status}).`) };
  } catch (error) {
    return { ok: false, approved: false, status: null, error: error instanceof Error ? error.message : "Twilio Verify check error." };
  }
}
