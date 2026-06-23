import { Prisma, type AdminUser } from "@prisma/client";
import {
  hashPasswordForPhase1,
  passwordReusesLastThree,
  updatePasswordHistory,
  validatePasswordPolicy,
} from "@/src/lib/auth/admin-user-password-security-phase1";

export const ADMIN_USER_PASSWORD_AUTH_RUNTIME_PHASE19 = "ADMIN_USER_PASSWORD_AUTH_RUNTIME_PHASE19";
export const ADMIN_USER_FAILED_LOGIN_LOCKOUT_THRESHOLD_PHASE19 = 5;
export const ADMIN_USER_FAILED_LOGIN_LOCKOUT_MINUTES_PHASE19 = 15;

export type AdminUserPasswordAuthSubjectPhase19 = Pick<AdminUser,
  | "id"
  | "email"
  | "passwordHash"
  | "passwordHistoryJson"
  | "forcePasswordChange"
  | "passwordChangeRequired"
  | "failedLoginCount"
  | "failedLoginLockedAt"
  | "locked"
  | "inactive"
  | "status"
>;

export function adminUserPasswordMatchesPhase19(password: string, passwordHash: string | null | undefined): boolean {
  if (!passwordHash) return false;
  return hashPasswordForPhase1(password) === passwordHash;
}

export function normalizePasswordHistoryJsonPhase19(value: Prisma.JsonValue | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function adminUserPasswordPolicyErrorsPhase19(password: string, historyJson: Prisma.JsonValue | null | undefined): string[] {
  const errors = [...validatePasswordPolicy(password)];
  if (passwordReusesLastThree(password, normalizePasswordHistoryJsonPhase19(historyJson))) errors.push("Password may not reuse any of the last 3 passwords.");
  return errors;
}

export function buildAdminUserPasswordChangeDataPhase19(currentHistoryJson: Prisma.JsonValue | null | undefined, newPassword: string) {
  const passwordHash = hashPasswordForPhase1(newPassword);
  return {
    passwordHash,
    passwordHistoryJson: updatePasswordHistory(normalizePasswordHistoryJsonPhase19(currentHistoryJson), passwordHash),
    forcePasswordChange: false,
    passwordChangeRequired: false,
    passwordSetAt: new Date(),
    failedLoginCount: 0,
    failedLoginLockedAt: null,
  };
}

export function adminUserRequiresPasswordChangePhase19(user: Pick<AdminUser, "forcePasswordChange" | "passwordChangeRequired"> | null | undefined): boolean {
  return Boolean(user?.forcePasswordChange || user?.passwordChangeRequired);
}

export function adminUserIsFailedLoginLockedPhase19(user: Pick<AdminUser, "failedLoginLockedAt"> | null | undefined, now = new Date()): boolean {
  if (!user?.failedLoginLockedAt) return false;
  const lockedUntil = new Date(user.failedLoginLockedAt.getTime() + ADMIN_USER_FAILED_LOGIN_LOCKOUT_MINUTES_PHASE19 * 60 * 1000);
  return lockedUntil > now;
}

export function buildFailedLoginUpdateDataPhase19(currentFailedLoginCount: number | null | undefined) {
  const nextFailedLoginCount = Number(currentFailedLoginCount || 0) + 1;
  return {
    failedLoginCount: nextFailedLoginCount,
    failedLoginLockedAt: nextFailedLoginCount >= ADMIN_USER_FAILED_LOGIN_LOCKOUT_THRESHOLD_PHASE19 ? new Date() : null,
  };
}

export function buildSuccessfulLoginUpdateDataPhase19() {
  return {
    failedLoginCount: 0,
    failedLoginLockedAt: null,
    lastLoginAt: new Date(),
  };
}
