import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const md = read("docs/admin-users/signer-profile-phase9-exact-api-payload-patch-targets.md");
const jsonText = read("docs/admin-users/signer-profile-phase9-exact-api-payload-patch-targets.json");
const contract = read("src/lib/admin-users/admin-user-signer-profile-write-contract-phase7.ts");
const phase5Apply = read("scripts/apply-admin-user-role-seed.mjs");
const phase5Preview = read("scripts/preview-admin-user-role-seed.mjs");
let parsed = null;
try {
  parsed = JSON.parse(jsonText);
} catch {
  parsed = null;
}

const createPath = String(parsed?.selectedCreateRoute || "");
const editPath = parsed?.selectedEditRoute === null || parsed?.selectedEditRoute === undefined ? "" : String(parsed.selectedEditRoute);
const createText = read(createPath);
const editText = editPath.length > 0 ? read(editPath) : "";
const noSafeEditRoute = parsed?.noSafeEditRoute === true;
const unsafeEditRoutes = Array.isArray(parsed?.unsafeEditRoutesExcluded) ? parsed.unsafeEditRoutesExcluded : [];

assert("Phase 9 markdown exists", md.includes("Exact API Payload Patch Targets"));
assert("Phase 9 JSON parses", parsed !== null);
assert("Phase 8 baseline documented", md.includes("admin-users-phase8-exact-create-edit-api-targets-20260623"));
assert("runtime mutation is false", parsed?.runtimeMutation === false);
assert("selected create route exists", createPath.length > 0 && fs.existsSync(createPath));
assert("create route has POST", parsed?.createRouteHasPost === true && createText.includes("POST"));
assert("create route has admin-user create shape", parsed?.createRouteHasAdminUserCreate === true);
assert("edit route branch is safe", (noSafeEditRoute === true && editPath.length === 0) || (editPath.length > 0 && fs.existsSync(editPath) && (editText.includes("PATCH") || editText.includes("PUT"))));
assert("lockout route is not selected as edit route", editPath.includes("lockout") === false);
assert("unsafe edit routes are documented", unsafeEditRoutes.length > 0 && unsafeEditRoutes.some((path) => String(path).includes("lockout")));
assert("no-safe-edit route branch documented when applicable", noSafeEditRoute === false || md.includes("NONE_SAFE_FOUND"));
assert("Phase 7 contract still present", contract.includes("buildAdminUserSignerProfileWritePayloadPhase7"));
assert("Phase 9 report sees Phase 7 contract", parsed?.phase7ContractPresent === true);
assert("Phase 5 owner-admin marker preserved in apply script", phase5Apply.includes("ADMIN_USERS_PHASE5_OWNER_ADMIN_ALL_PERMISSIONS_ENFORCEMENT"));
assert("Phase 5 owner-admin marker preserved in preview script", phase5Preview.includes("ADMIN_USERS_PHASE5_OWNER_ADMIN_ALL_PERMISSIONS_ENFORCEMENT"));
assert("Phase 10 patch rules include create route", md.includes("Patch selectedCreateRoute for API payload persistence"));
assert("Phase 10 patch rules exclude lockout/password role routes", md.includes("Never use lockout"));
assert("Phase 10 patch rules include Phase 7 contract import", md.includes("Import buildAdminUserSignerProfileWritePayloadPhase7"));
assert("Phase 10 patch rules include normalized uniqueness", md.includes("emailNormalized") && md.includes("usernameNormalized"));
assert("Phase 10 excludes password reset/unlock", md.includes("Do not add password reset"));
assert("DOCX mutation prohibited", md.includes("Do not change DOCX templates"));
assert("production signer validation prohibited", md.includes("Do not wire production document-generation signer validation"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
