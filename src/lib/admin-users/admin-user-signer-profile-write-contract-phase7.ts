import {
  deriveSignerMissingFields,
  deriveSignerProfileStatus,
  deriveTwoFactorStatus,
  normalizeAdminUniqueValue,
  suggestDisplayName,
  suggestUsername,
  type AdminUserSignerProfilePhase1,
} from "./admin-user-signer-profile-phase1";

export type AdminUserSignerProfileWriteInputPhase7 = {
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
  twoFactorPhone?: string | null;
  twoFactorDisabled?: boolean | null;
  twoFactorPendingSetup?: boolean | null;
};

export type AdminUserSignerProfileWritePayloadPhase7 = {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  username: string | null;
  email: string | null;
  emailNormalized: string | null;
  usernameNormalized: string | null;
  phoneExtension: string | null;
  faxNumber: string | null;
  signatureBlockName: string | null;
  locked: boolean;
  inactive: boolean;
  twoFactorPhone: string | null;
  twoFactorDisabled: boolean;
  twoFactorPendingSetup: boolean;
  signerProfileStatus: "Complete" | "Missing Fields";
  signerMissingFields: string[];
  twoFactorStatus: "Enabled" | "Disabled" | "Missing Phone" | "Pending Setup";
};

export const ADMIN_USER_SIGNER_PROFILE_PHASE7_WRITE_FIELDS = [
  "firstName",
  "lastName",
  "displayName",
  "username",
  "email",
  "phoneExtension",
  "faxNumber",
  "signatureBlockName",
  "locked",
  "inactive",
  "twoFactorPhone",
  "twoFactorDisabled",
  "twoFactorPendingSetup",
] as const;

function cleanOptionalText(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length === 0 ? null : trimmed;
}

function cleanExactAdminText(value: string | null | undefined): string | null {
  const raw = value ?? null;
  if (raw === null) return null;
  const text = String(raw);
  return text.trim().length === 0 ? null : text;
}

function cleanBoolean(value: boolean | null | undefined): boolean {
  return value === true;
}

export function buildAdminUserSignerProfileWritePayloadPhase7(
  input: AdminUserSignerProfileWriteInputPhase7,
): AdminUserSignerProfileWritePayloadPhase7 {
  const firstName = cleanOptionalText(input.firstName);
  const lastName = cleanOptionalText(input.lastName);
  const displayName = cleanOptionalText(input.displayName) ?? cleanOptionalText(suggestDisplayName(firstName, lastName));
  const username = cleanOptionalText(input.username) ?? cleanOptionalText(suggestUsername(firstName, lastName));
  const email = cleanOptionalText(input.email);
  const payloadBase: AdminUserSignerProfilePhase1 = {
    displayName,
    email,
    phoneExtension: cleanExactAdminText(input.phoneExtension),
    faxNumber: cleanExactAdminText(input.faxNumber),
    signatureBlockName: cleanOptionalText(input.signatureBlockName),
    inactive: cleanBoolean(input.inactive),
    twoFactorPhone: cleanOptionalText(input.twoFactorPhone),
    twoFactorDisabled: cleanBoolean(input.twoFactorDisabled),
    twoFactorPendingSetup: cleanBoolean(input.twoFactorPendingSetup),
  };
  const signerMissingFields = deriveSignerMissingFields(payloadBase);
  return {
    firstName,
    lastName,
    displayName,
    username,
    email,
    emailNormalized: normalizeAdminUniqueValue(email),
    usernameNormalized: normalizeAdminUniqueValue(username),
    phoneExtension: payloadBase.phoneExtension ?? null,
    faxNumber: payloadBase.faxNumber ?? null,
    signatureBlockName: payloadBase.signatureBlockName ?? null,
    locked: cleanBoolean(input.locked),
    inactive: cleanBoolean(input.inactive),
    twoFactorPhone: payloadBase.twoFactorPhone ?? null,
    twoFactorDisabled: cleanBoolean(input.twoFactorDisabled),
    twoFactorPendingSetup: cleanBoolean(input.twoFactorPendingSetup),
    signerProfileStatus: deriveSignerProfileStatus(payloadBase),
    signerMissingFields,
    twoFactorStatus: deriveTwoFactorStatus(payloadBase),
  };
}

export function getAdminUserSignerProfileChangedFieldsPhase7(
  before: Partial<AdminUserSignerProfileWritePayloadPhase7>,
  after: Partial<AdminUserSignerProfileWritePayloadPhase7>,
): string[] {
  return ADMIN_USER_SIGNER_PROFILE_PHASE7_WRITE_FIELDS.filter((field) => before[field] !== after[field]);
}

export function assertAdminUserSignerProfileUniqueInputsPhase7(
  payload: AdminUserSignerProfileWritePayloadPhase7,
): string[] {
  const errors: string[] = [];
  if (payload.email !== null && payload.emailNormalized === null) errors.push("Email normalization failed.");
  if (payload.username !== null && payload.usernameNormalized === null) errors.push("Username normalization failed.");
  return errors;
}
