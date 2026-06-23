import crypto from "crypto";

export const TWO_FACTOR_CODE_EXPIRATION_MINUTES = 5;
export const TWO_FACTOR_MAX_ATTEMPTS = 5;

export function hashTwoFactorCodeForPhase1(code: string, salt = crypto.randomBytes(16).toString("hex")): string {
  const digest = crypto.scryptSync(code, salt, 32).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

export function verifyTwoFactorCodeForPhase1(code: string, storedHash: string | null | undefined): boolean {
  const value = String(storedHash ?? "");
  const parts = value.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const candidate = hashTwoFactorCodeForPhase1(code, parts[1]);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(value));
}

export function getTwoFactorExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + TWO_FACTOR_CODE_EXPIRATION_MINUTES * 60 * 1000);
}

export function generateTwoFactorCodeForPhase1(): string {
  return String(crypto.randomInt(100000, 1000000));
}
