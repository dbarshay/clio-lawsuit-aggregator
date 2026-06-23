import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const contract = read("src/lib/admin-users/admin-user-signer-profile-write-contract-phase7.ts");
const docs = read("docs/admin-users/signer-profile-phase7-create-edit-payload-normalization-contract.md");
const phase5Apply = read("scripts/apply-admin-user-role-seed.mjs");
const phase5Preview = read("scripts/preview-admin-user-role-seed.mjs");
const schema = read("prisma/schema.prisma");

assert("Phase 7 contract file exists", contract.includes("buildAdminUserSignerProfileWritePayloadPhase7"));
assert("Phase 7 docs exist", docs.includes("Create/Edit Payload Normalization Contract"));
assert("first and last names are supported", contract.includes("firstName") && contract.includes("lastName"));
assert("displayName and username suggestions are used", contract.includes("suggestDisplayName") && contract.includes("suggestUsername"));
assert("case-insensitive normalized email and username are produced", contract.includes("emailNormalized") && contract.includes("usernameNormalized") && contract.includes("normalizeAdminUniqueValue"));
assert("phone extension and fax exact text helper exists", contract.includes("cleanExactAdminText") && contract.includes("phoneExtension") && contract.includes("faxNumber"));
assert("signer completeness is derived", contract.includes("deriveSignerMissingFields") && contract.includes("deriveSignerProfileStatus"));
assert("2FA status is derived", contract.includes("deriveTwoFactorStatus") && contract.includes("twoFactorPhone") && contract.includes("twoFactorDisabled"));
assert("locked and inactive remain separate", contract.includes("locked: boolean") && contract.includes("inactive: boolean"));
assert("changed fields helper exists for audit wiring", contract.includes("getAdminUserSignerProfileChangedFieldsPhase7"));
assert("unique input assertion helper exists", contract.includes("assertAdminUserSignerProfileUniqueInputsPhase7"));
assert("schema still has normalized unique fields", schema.includes("emailNormalized") && schema.includes("usernameNormalized"));
assert("Phase 5 owner-admin marker preserved in apply script", phase5Apply.includes("ADMIN_USERS_PHASE5_OWNER_ADMIN_ALL_PERMISSIONS_ENFORCEMENT"));
assert("Phase 5 owner-admin marker preserved in preview script", phase5Preview.includes("ADMIN_USERS_PHASE5_OWNER_ADMIN_ALL_PERMISSIONS_ENFORCEMENT"));
assert("docs prohibit document-generation signer wiring", docs.includes("Do not wire production document-generation signer validation"));
assert("docs prohibit DOCX mutation", docs.includes("Do not change DOCX templates"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
