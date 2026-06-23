import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const md = read("docs/admin-users/signer-profile-phase2-real-wiring-map.md");
const jsonText = read("docs/admin-users/signer-profile-phase2-real-wiring-map.json");
const schema = read("prisma/schema.prisma");
const usersPage = read("app/admin/users/page.tsx");

let parsed = null;
try {
  parsed = JSON.parse(jsonText);
} catch {
  parsed = null;
}

assert("Phase 2 markdown map exists", md.includes("Real Wiring Map and Guardrails"));
assert("Phase 2 JSON map parses", parsed !== null);
assert("effective Phase 1 lock documented", md.includes("admin-users-signer-profile-phase1-security-repair-20260623"));
assert("admin full-permission default documented", md.includes("primary admin should default to access to all permissions") && String(parsed?.adminDefaultAllPermissionsRequirement || "").includes("all permissions"));
assert("candidate API routes captured", Array.isArray(parsed?.candidateApiRoutes));
assert("candidate admin pages captured", Array.isArray(parsed?.candidateAdminPages));
assert("candidate auth/session files captured", Array.isArray(parsed?.candidateAuthSessionFiles));
assert("candidate permission files captured", Array.isArray(parsed?.candidatePermissionFiles));
assert("Phase 1 schema signer/security fields still present", [
  "firstName", "lastName", "displayName", "username", "phoneExtension",
  "faxNumber", "signatureBlockName", "passwordHash", "twoFactorPhone",
  "sessionInvalidatedAt"
].every((field) => schema.includes(field)));
assert("Users admin Phase 1 contract remains present", usersPage.includes("Signer Profile Phase 1 UI contract"));
assert("Initial Billing Letter DOCX mutation prohibited in guardrails", md.includes("initial-billing-letter.docx"));
assert("letterhead-simple DOCX mutation prohibited in guardrails", md.includes("letterhead-simple.docx"));
assert("production document-generation signer validation remains unwired by plan", md.includes("Do not wire production document-generation signer validation"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
