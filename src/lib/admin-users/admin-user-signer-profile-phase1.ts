export type AdminUserSignerProfilePhase1 = {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  phoneExtension?: string | null;
  faxNumber?: string | null;
  signatureBlockName?: string | null;
  locked?: boolean | null;
  inactive?: boolean | null;
  failedLoginLockedAt?: Date | string | null;
  twoFactorPhone?: string | null;
  twoFactorDisabled?: boolean | null;
  twoFactorPendingSetup?: boolean | null;
};

export const SIGNER_PROFILE_REQUIRED_FIELDS = [
  "displayName",
  "email",
  "phoneExtension",
  "faxNumber",
  "signatureBlockName",
] as const;

export type SignerProfileRequiredField = typeof SIGNER_PROFILE_REQUIRED_FIELDS[number];

export function normalizeAdminUniqueValue(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length === 0 ? null : trimmed.toLowerCase();
}

export function suggestDisplayName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const first = String(firstName ?? "").trim();
  const last = String(lastName ?? "").trim();
  if (first.length === 0 && last.length === 0) return "";
  if (first.length === 0) return last;
  if (last.length === 0) return first;
  return `${first.charAt(0)}${last}`;
}

export const suggestUsername = suggestDisplayName;

export function deriveSignerMissingFields(user: AdminUserSignerProfilePhase1): SignerProfileRequiredField[] {
  return SIGNER_PROFILE_REQUIRED_FIELDS.filter((field) => {
    const value = user[field];
    return String(value ?? "").trim().length === 0;
  });
}

export function deriveSignerProfileStatus(user: AdminUserSignerProfilePhase1): "Complete" | "Missing Fields" {
  return deriveSignerMissingFields(user).length === 0 ? "Complete" : "Missing Fields";
}

export function deriveTwoFactorStatus(user: AdminUserSignerProfilePhase1): "Enabled" | "Disabled" | "Missing Phone" | "Pending Setup" {
  if (user.twoFactorDisabled === true) return "Disabled";
  if (user.twoFactorPendingSetup === true) return "Pending Setup";
  if (String(user.twoFactorPhone ?? "").trim().length === 0) return "Missing Phone";
  return "Enabled";
}

export function isEligibleSigner(user: AdminUserSignerProfilePhase1): boolean {
  return user.inactive !== true && deriveSignerProfileStatus(user) === "Complete";
}

export function maskTwoFactorPhone(phone: string | null | undefined): string | null {
  const raw = String(phone ?? "").trim();
  if (raw.length === 0) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
