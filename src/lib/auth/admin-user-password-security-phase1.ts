import crypto from "crypto";

export const PASSWORD_POLICY_DESCRIPTION = "Minimum 8 characters with uppercase, lowercase, number, and symbol.";
export const PASSWORD_HISTORY_LIMIT = 3;
export const FAILED_LOGIN_LOCKOUT_THRESHOLD = 5;

export function validatePasswordPolicy(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters.");
  if (/[A-Z]/.test(password) === false) errors.push("Password must include at least one uppercase letter.");
  if (/[a-z]/.test(password) === false) errors.push("Password must include at least one lowercase letter.");
  if (/[0-9]/.test(password) === false) errors.push("Password must include at least one number.");
  if (/[^A-Za-z0-9]/.test(password) === false) errors.push("Password must include at least one symbol.");
  return errors;
}

export function hashPasswordForPhase1(password: string, salt = crypto.randomBytes(16).toString("hex")): string {
  const digest = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

export function verifyPasswordForPhase1(password: string, storedHash: string | null | undefined): boolean {
  const value = String(storedHash ?? "");
  const parts = value.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const candidate = hashPasswordForPhase1(password, parts[1]);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(value));
}

export function parsePasswordHistory(passwordHistoryJson: string | null | undefined): string[] {
  if (String(passwordHistoryJson ?? "").trim().length === 0) return [];
  try {
    const parsed = JSON.parse(String(passwordHistoryJson));
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function updatePasswordHistory(passwordHistoryJson: string | null | undefined, newHash: string): string {
  const existing = parsePasswordHistory(passwordHistoryJson);
  return JSON.stringify([newHash, ...existing].slice(0, PASSWORD_HISTORY_LIMIT));
}

export function passwordReusesLastThree(password: string, passwordHistoryJson: string | null | undefined): boolean {
  return parsePasswordHistory(passwordHistoryJson).slice(0, PASSWORD_HISTORY_LIMIT).some((hash) => verifyPasswordForPhase1(password, hash));
}

export function generateTemporaryPassword(): string {
  const raw = crypto.randomBytes(18).toString("base64url");
  return `Brl1-${raw}*`;
}
