import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const stripBlockComments = (text) => text.replace(new RegExp("/\\\\*[\\\\s\\\\S]*?\\\\*/", "g"), "");
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const docs = read("docs/admin-users/signer-profile-qa-phase2-runtime-enforcement-gap-patch.md");
const loginRoute = stripBlockComments(read("app/api/auth/login/route.ts"));
const loginPage = stripBlockComments(read("app/login/page.tsx"));
const sessionRoute = stripBlockComments(read("app/api/auth/session/route.ts"));
const adminPage = stripBlockComments(read("app/admin/page.tsx"));
const qa1 = read("docs/admin-users/signer-profile-qa-phase1-runtime-smoke-gap-report.json");
const passwordReset = read("app/api/admin/users/password-reset/route.ts");
const signerRoute = read("app/api/admin/users/signer-profile/route.ts");

assert("QA Phase 2 docs exist", docs.includes("Runtime Enforcement Gap Patch"));
assert("QA Phase 1 baseline documented", docs.includes("admin-users-qa-phase1-runtime-smoke-gap-report-20260623"));
assert("QA Phase 1 report preserved", qa1.includes("externalSmsDeliveryImplemented"));
assert("login route has runtime forced-password visibility", loginRoute.includes("/forced-password-change") && loginRoute.includes("forcePasswordChange") && loginRoute.includes("passwordChangeRequired"));
assert("login route has runtime 2FA visibility", loginRoute.includes("/api/auth/2fa/challenge") && loginRoute.includes("/api/auth/2fa/verify") && loginRoute.includes("twoFactorRequired"));
assert("login page redirects forced-password users", loginPage.includes("adminUsersQaPhase2LoginNeedsForcedPasswordChange") && loginPage.includes("window.location.href") && loginPage.includes("/forced-password-change"));
assert("login page has 2FA runtime UX", loginPage.includes("/api/auth/2fa/challenge") && loginPage.includes("/api/auth/2fa/verify") && loginPage.includes("twoFactor=required"));
assert("session route exposes forced-password runtime fields", sessionRoute.includes("forcePasswordChange") && sessionRoute.includes("passwordChangeRequired"));
assert("session route exposes 2FA runtime fields", sessionRoute.includes("twoFactorRequired") && sessionRoute.includes("twoFactorPending"));
assert("admin page uses new signout route", adminPage.includes("/api/auth/signout") && adminPage.includes("/api/auth/logout") === false);
assert("external SMS remains deferred in docs", docs.includes("External SMS delivery remains known deferred"));
assert("password reset generated temp preserved", passwordReset.includes("generateTemporaryPassword") && passwordReset.includes("temporaryPasswordOneTimeDisplay"));
assert("signer profile route remains separate", signerRoute.includes("admin-user-signer-profile-update") && signerRoute.includes("passwordHash") === false);
assert("docs prohibit DOCX mutation", docs.includes("Does not change DOCX templates"));
assert("docs prohibit document generation mutation", docs.includes("production document-generation signer validation"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
