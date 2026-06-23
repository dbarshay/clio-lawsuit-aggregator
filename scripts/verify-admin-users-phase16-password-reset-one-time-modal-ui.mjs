import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const page = read("app/admin/users/page.tsx");
const docs = read("docs/admin-users/signer-profile-phase16-password-reset-one-time-modal-ui.md");
const route = read("app/api/admin/users/password-reset/route.ts");
const phase15 = read("docs/admin-users/signer-profile-phase15-password-reset-one-time-modal-anchors.md");

assert("Phase 16 docs exist", docs.includes("Password Reset One-Time Temporary Password Modal UI"));
assert("Phase 15 baseline documented", docs.includes("admin-users-phase15-password-reset-one-time-modal-anchors-20260623"));
assert("Users page has Phase 16 modal contract", page.includes("Password Reset Phase 16 one-time modal contract"));
assert("Users page stores one-time temp password in client state", page.includes("passwordResetOneTimePassword") && page.includes("setPasswordResetOneTimePassword"));
assert("Users page detects one-time temp password apply response", page.includes("temporaryPasswordOneTimeDisplay") && page.includes("String(json.temporaryPassword)"));
assert("Users page has standard modal marker", page.includes("data-barsh-admin-users-password-reset-one-time-modal"));
assert("Users page has modal title", page.includes("Temporary Password"));
assert("Users page warns password shown once", page.includes("This temporary password is shown once"));
assert("Users page has copy button", page.includes("Copy Temporary Password") && page.includes("navigator.clipboard.writeText"));
assert("Users page clears state on Done", page.includes("closePasswordResetOneTimeModal") && page.includes("setPasswordResetOneTimePassword(\"\")"));
assert("Password reset route still returns one-time temp password", route.includes("temporaryPasswordOneTimeDisplay") && route.includes("temporaryPassword"));
assert("Phase 15 proved modal was previously missing", phase15.includes("pageHasTemporaryPasswordModal") && phase15.includes("False"));
assert("docs prohibit password reset route mutation", docs.includes("Does not change the password-reset route behavior"));
assert("docs prohibit DOCX mutation", docs.includes("DOCX templates"));
assert("docs prohibit document-generation behavior changes", docs.includes("document-generation behavior"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
