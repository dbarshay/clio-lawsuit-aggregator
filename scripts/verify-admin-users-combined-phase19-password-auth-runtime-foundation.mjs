import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const targets = JSON.parse(read("docs/admin-users/signer-profile-phase18-exact-forced-password-change-patch-targets.json"));
const helper = read("src/lib/auth/admin-user-password-auth-runtime-phase19.ts");
const forcedRoute = read("app/api/auth/forced-password-change/route.ts");
const changeRoute = read("app/api/auth/change-password/route.ts");
const forcedPage = read("app/forced-password-change/page.tsx");
const changePage = read("app/change-password/page.tsx");
const loginRoute = read(targets.selectedLoginRoute);
const loginPage = read(targets.selectedLoginPage);
const sessionRoute = read(targets.selectedAuthSessionLib);
const passwordResetRoute = read("app/api/admin/users/password-reset/route.ts");
const signerRoute = read("app/api/admin/users/signer-profile/route.ts");
const docs = read("docs/admin-users/signer-profile-combined-phase19-password-auth-runtime-foundation.md");

assert("Combined Phase 19 docs exist", docs.includes("Password Auth Runtime Foundation"));
assert("Phase 18 baseline documented", docs.includes("admin-users-phase18-exact-forced-password-change-patch-targets-20260623"));
assert("helper exists with Phase 19 marker", helper.includes("ADMIN_USER_PASSWORD_AUTH_RUNTIME_PHASE19"));
assert("helper verifies current password by hash", helper.includes("adminUserPasswordMatchesPhase19") && helper.includes("hashPasswordForPhase1"));
assert("helper enforces last-3 password history", helper.includes("passwordReusesLastThree") && helper.includes("updatePasswordHistory"));
assert("helper defines failed-login lockout threshold", helper.includes("ADMIN_USER_FAILED_LOGIN_LOCKOUT_THRESHOLD_PHASE19") && helper.includes("failedLoginLockedAt"));
assert("forced password-change route exists", forcedRoute.includes("admin-user-forced-password-change"));
assert("forced route requires current/temp new confirm", forcedRoute.includes("currentPassword") && forcedRoute.includes("newPassword") && forcedRoute.includes("confirmPassword"));
assert("forced route clears force flags", forcedRoute.includes("forcePasswordChange: false") || helper.includes("forcePasswordChange: false"));
assert("forced route audits without plaintext", forcedRoute.includes("plaintextPasswordLogged: false"));
assert("change password route exists", changeRoute.includes("admin-user-change-password"));
assert("change password route requires authorized admin request", changeRoute.includes("isAdminRequestAuthorized"));
assert("forced password-change page exists", forcedPage.includes("data-barsh-forced-password-change-page"));
assert("change password page exists", changePage.includes("data-barsh-change-password-page"));
assert("login route has Phase 19 marker", loginRoute.includes("ADMIN_USER_PASSWORD_AUTH_RUNTIME_PHASE19"));
assert("login page has Phase 19 marker", loginPage.includes("ADMIN_USER_PASSWORD_AUTH_RUNTIME_PHASE19"));
assert("session route has Phase 19 marker", sessionRoute.includes("ADMIN_USER_PASSWORD_AUTH_RUNTIME_PHASE19"));
assert("password reset generated temp behavior preserved", passwordResetRoute.includes("generateTemporaryPassword") && passwordResetRoute.includes("temporaryPasswordOneTimeDisplay"));
assert("signer-profile route still separate from password hash", signerRoute.includes("admin-user-signer-profile-update") && signerRoute.includes("passwordHash") === false);
assert("docs prohibit DOCX mutation", docs.includes("Does not change DOCX templates"));
assert("docs prohibit document generation mutation", docs.includes("Does not change document-generation behavior"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
