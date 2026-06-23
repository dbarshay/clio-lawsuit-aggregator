import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const md = read("docs/admin-users/signer-profile-phase15-password-reset-one-time-modal-anchors.md");
const jsonText = read("docs/admin-users/signer-profile-phase15-password-reset-one-time-modal-anchors.json");
const page = read("app/admin/users/page.tsx");
const route = read("app/api/admin/users/password-reset/route.ts");
let parsed = null;
try {
  parsed = JSON.parse(jsonText);
} catch {
  parsed = null;
}

assert("Phase 15 markdown exists", md.includes("Password Reset One-Time Modal UI Anchors"));
assert("Phase 15 JSON parses", parsed !== null);
assert("Phase 14 baseline documented", md.includes("admin-users-phase14-password-reset-generated-temporary-password-20260623"));
assert("runtime mutation is false", parsed?.runtimeMutation === false);
assert("Users page has password reset route", page.includes("/api/admin/users/password-reset"));
assert("Users page has password reset result state", page.includes("passwordResetResult") && page.includes("setPasswordResetResult"));
assert("Users page has Reset Password label", page.includes("Reset Password"));
assert("Password reset route returns one-time temp password", route.includes("temporaryPasswordOneTimeDisplay") && route.includes("temporaryPassword"));
assert("Password reset route recommends copy", route.includes("copyButtonRecommended"));
assert("Password reset route has one-time warning", route.includes("This temporary password is shown once"));
assert("Phase 16 rules require modal", md.includes("standard Barsh Matters modal/popup"));
assert("Phase 16 rules require Copy button", md.includes("Copy button") && md.includes("navigator.clipboard.writeText"));
assert("Phase 16 rules prohibit route mutation", md.includes("must not change password reset route behavior"));
assert("Phase 16 rules prohibit DOCX mutation", md.includes("DOCX templates"));
assert("Phase 16 rules prohibit document generation changes", md.includes("document-generation behavior"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
