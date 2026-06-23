import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const md = read("docs/admin-users/signer-profile-phase8-exact-create-edit-api-targets.md");
const jsonText = read("docs/admin-users/signer-profile-phase8-exact-create-edit-api-targets.json");
const contract = read("src/lib/admin-users/admin-user-signer-profile-write-contract-phase7.ts");
const phase5Apply = read("scripts/apply-admin-user-role-seed.mjs");
const phase5Preview = read("scripts/preview-admin-user-role-seed.mjs");
let parsed = null;
try {
  parsed = JSON.parse(jsonText);
} catch {
  parsed = null;
}

const createCandidates = Array.isArray(parsed?.createCandidates) ? parsed.createCandidates : [];
const editCandidates = Array.isArray(parsed?.editCandidates) ? parsed.editCandidates : [];
const pageHits = Array.isArray(parsed?.usersPageFetchHits) ? parsed.usersPageFetchHits : [];

assert("Phase 8 markdown exists", md.includes("Exact Create/Edit API Targets"));
assert("Phase 8 JSON parses", parsed !== null);
assert("Phase 7 baseline documented", md.includes("admin-users-phase7-create-edit-payload-normalization-contract-20260623"));
assert("runtime mutation is false", parsed?.runtimeMutation === false);
assert("create candidates found", createCandidates.length > 0);
assert("edit candidates found", editCandidates.length > 0);
assert("Users page fetch/form hits found", pageHits.length > 0);
assert("Phase 7 contract still present", contract.includes("buildAdminUserSignerProfileWritePayloadPhase7"));
assert("Phase 8 report sees Phase 7 contract", parsed?.phase7ContractPresent === true);
assert("Phase 5 owner-admin marker preserved in apply script", phase5Apply.includes("ADMIN_USERS_PHASE5_OWNER_ADMIN_ALL_PERMISSIONS_ENFORCEMENT"));
assert("Phase 5 owner-admin marker preserved in preview script", phase5Preview.includes("ADMIN_USERS_PHASE5_OWNER_ADMIN_ALL_PERMISSIONS_ENFORCEMENT"));
assert("Phase 9 plan includes normalized email/username", md.includes("emailNormalized") && md.includes("usernameNormalized"));
assert("Phase 9 plan preserves owner-admin all-permissions", md.includes("Preserve Phase 5 owner_admin all-permissions behavior"));
assert("Phase 9 plan excludes password reset", md.includes("Do not add password reset"));
assert("DOCX mutation prohibited", md.includes("Do not change DOCX templates"));
assert("production signer validation prohibited", md.includes("Do not wire production document-generation signer validation"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
