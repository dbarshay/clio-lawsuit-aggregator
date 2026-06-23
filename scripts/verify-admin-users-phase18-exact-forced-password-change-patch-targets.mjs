import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const md = read("docs/admin-users/signer-profile-phase18-exact-forced-password-change-patch-targets.md");
const jsonText = read("docs/admin-users/signer-profile-phase18-exact-forced-password-change-patch-targets.json");
let parsed = null;
try {
  parsed = JSON.parse(jsonText);
} catch {
  parsed = null;
}

const selectedLoginRoute = String(parsed?.selectedLoginRoute || "");
const selectedLoginPage = String(parsed?.selectedLoginPage || "");
const selectedAuthSessionLib = String(parsed?.selectedAuthSessionLib || "");
const selectedAdminGuard = String(parsed?.selectedAdminGuard || "");
const unsafeReasons = Array.isArray(parsed?.unsafeReasons) ? parsed.unsafeReasons : ["missing"];
const route = read(selectedLoginRoute);
const page = read(selectedLoginPage);

assert("Phase 18 markdown exists", md.includes("Exact Forced Password-Change Patch Targets"));
assert("Phase 18 JSON parses", parsed !== null);
assert("Phase 17 baseline documented", md.includes("admin-users-phase17-forced-password-change-auth-anchors-20260623"));
assert("runtime mutation is false", parsed?.runtimeMutation === false);
assert("selected login route exists", selectedLoginRoute !== "NONE_SAFE_FOUND" && fs.existsSync(selectedLoginRoute));
assert("selected login page exists", selectedLoginPage !== "NONE_SAFE_FOUND" && fs.existsSync(selectedLoginPage));
assert("selected auth/session library exists", selectedAuthSessionLib !== "NONE_SAFE_FOUND" && fs.existsSync(selectedAuthSessionLib));
assert("selected admin guard exists or is optional", selectedAdminGuard === "NONE_SAFE_FOUND" || fs.existsSync(selectedAdminGuard));
assert("no unsafe reasons", unsafeReasons.length === 0);
assert("selected login route validates password hashes", route.includes("passwordHash") || route.toLowerCase().includes("bcrypt"));
assert("selected login page references login API or login flow", page.toLowerCase().includes("login") && (page.includes("/api") || page.includes("fetch(")));
assert("Phase 19 patch plan requires current/temp password", md.includes("current/temporary password"));
assert("Phase 19 patch plan requires history helpers", md.includes("passwordReusesLastThree") && md.includes("updatePasswordHistory"));
assert("Phase 19 patch plan preserves password reset generated temp", md.includes("Do not change password reset generated temporary password behavior"));
assert("Phase 19 patch plan prohibits DOCX mutation", md.includes("DOCX templates"));
assert("Phase 19 patch plan prohibits document generation mutation", md.includes("document-generation behavior"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
