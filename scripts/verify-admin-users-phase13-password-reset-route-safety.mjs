import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const md = read("docs/admin-users/signer-profile-phase13-password-reset-route-safety.md");
const jsonText = read("docs/admin-users/signer-profile-phase13-password-reset-route-safety.json");
const passwordLib = read("src/lib/auth/admin-user-password-security-phase1.ts");
const usersPage = read("app/admin/users/page.tsx");
let parsed = null;
try {
  parsed = JSON.parse(jsonText);
} catch {
  parsed = null;
}
const routePath = String(parsed?.routePath || "");
const route = read(routePath);

assert("Phase 13 markdown exists", md.includes("Password Reset Route Safety Lock"));
assert("Phase 13 JSON parses", parsed !== null);
assert("Phase 12 baseline documented", md.includes("admin-users-phase12-users-admin-ui-signer-profile-wiring-20260623"));
assert("runtime mutation is false", parsed?.runtimeMutation === false);
assert("password reset route exists", routePath.length > 0 && fs.existsSync(routePath));
assert("Phase 1 password library exists", passwordLib.includes("validatePasswordPolicy") && passwordLib.includes("PASSWORD_HISTORY_LIMIT = 3"));
assert("password route is owner_admin gated", route.includes("owner_admin"));
assert("password route avoids plaintext storage names", route.includes("plainTextPassword") === false && route.includes("plaintextPassword") === false);
assert("Users page has Reset Password action", usersPage.includes("Reset Password") && usersPage.includes("/api/admin/users/password-reset"));
assert("docs include Phase 14 patch rules", md.includes("Phase 14 patch rules"));
assert("docs prohibit DOCX mutation", md.includes("Do not change DOCX templates"));
assert("docs prohibit document-generation behavior changes", md.includes("document-generation behavior"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
