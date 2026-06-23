import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const page = read("app/admin/users/page.tsx");
const docs = read("docs/admin-users/signer-profile-phase12-users-admin-ui-wiring.md");
const phase11Route = read("app/api/admin/users/signer-profile/route.ts");
const phase10Create = read("app/api/admin/users/create/route.ts");

const fields = ["firstName", "lastName", "displayName", "username", "email", "phoneExtension", "faxNumber", "signatureBlockName", "locked", "inactive", "twoFactorPhone", "twoFactorDisabled", "twoFactorPendingSetup"];

assert("Phase 12 docs exist", docs.includes("Users Admin UI Signer/Profile Wiring"));
assert("Phase 11 baseline documented", docs.includes("admin-users-phase11-dedicated-signer-profile-update-route-20260623"));
assert("Users page has Phase 12 contract", page.includes("Signer Profile Phase 12 UI wiring contract"));
assert("Users page references create route", page.includes("/api/admin/users/create") || page.includes("ADMIN_USERS_PHASE12_CREATE_ROUTE"));
assert("Users page references dedicated signer-profile route", page.includes("/api/admin/users/signer-profile") || page.includes("ADMIN_USERS_PHASE12_SIGNER_PROFILE_UPDATE_ROUTE"));
assert("Users page includes signer-profile payload helper", page.includes("adminUsersPhase12SignerProfilePayload"));
assert("Users page includes all signer/contact/status fields", fields.every((field) => page.includes(field)));
assert("Users page includes signer status labels", page.includes("Complete") && page.includes("Missing Fields"));
assert("Users page includes 2FA status labels", page.includes("Enabled") && page.includes("Disabled") && page.includes("Missing Phone") && page.includes("Pending Setup"));
assert("Existing security action labels preserved", page.includes("Reset Password") && page.includes("Unlock Login") && page.includes("Clear Failed-Login Lockout"));
assert("Phase 11 dedicated route still exists", phase11Route.includes("export async function PATCH") && phase11Route.includes("admin-user-signer-profile-update"));
assert("Phase 10 create route still uses Phase 7 contract", phase10Create.includes("buildAdminUserSignerProfileWritePayloadPhase7"));
assert("docs keep signer edits separate from lockout/password routes", docs.includes("separate from lockout"));
assert("docs prohibit document-generation signer validation", docs.includes("Does not wire production document-generation signer validation"));
assert("docs prohibit DOCX mutation", docs.includes("Does not change DOCX templates"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
