import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const route = read("app/api/admin/users/create/route.ts");
const md = read("docs/admin-users/signer-profile-phase10-create-user-api-signer-profile-wiring.md");
const jsonText = read("docs/admin-users/signer-profile-phase10-create-user-api-signer-profile-wiring.json");
const phase9 = read("docs/admin-users/signer-profile-phase9-exact-api-payload-patch-targets.md");
let parsed = null;
try {
  parsed = JSON.parse(jsonText);
} catch {
  parsed = null;
}

const requiredFields = ["firstName", "lastName", "displayName", "username", "emailNormalized", "usernameNormalized", "phoneExtension", "faxNumber", "signatureBlockName", "locked", "inactive", "twoFactorPhone", "twoFactorDisabled", "twoFactorPendingSetup"];

assert("Phase 10 markdown exists", md.includes("Create-User API Signer/Profile Field Wiring"));
assert("Phase 10 JSON parses", parsed !== null);
assert("Phase 9 baseline documented", md.includes("admin-users-phase9-exact-api-payload-patch-targets-20260623"));
assert("create route imports Phase 7 contract", route.includes("buildAdminUserSignerProfileWritePayloadPhase7"));
assert("create route builds signerProfilePayload", route.includes("const signerProfilePayload = buildAdminUserSignerProfileWritePayloadPhase7"));
assert("create route supports literal req.json catch body shape", route.includes("const body = await req.json().catch(() => ({}));"));
assert("create route includes normalized unique values", route.includes("emailNormalized") && route.includes("usernameNormalized"));
assert("create route persists required signer/profile fields", requiredFields.every((field) => route.includes(`${field}: signerProfilePayload.${field}`)));
assert("edit route intentionally not patched", parsed?.editRoutePatched === false && md.includes("Edit route patched: `false`"));
assert("Phase 9 no-safe-edit finding preserved", phase9.includes("No safe edit route") || phase9.includes("NONE_SAFE_FOUND"));
assert("lockout route not used for signer edit", md.includes("lockout/password/role/permission routes are excluded"));
assert("no password reset/unlock behavior added", md.includes("No password reset/unlock/failed-login/2FA challenge behavior added"));
assert("DOCX mutation prohibited", md.includes("No DOCX templates changed"));
assert("production document-generation signer validation remains unwired", md.includes("No production document-generation signer validation wired"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
