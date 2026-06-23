import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const md = read("docs/admin-users/signer-profile-qa-phase1-runtime-smoke-gap-report.md");
const jsonText = read("docs/admin-users/signer-profile-qa-phase1-runtime-smoke-gap-report.json");
let parsed = null;
try {
  parsed = JSON.parse(jsonText);
} catch {
  parsed = null;
}

const gaps = Array.isArray(parsed?.gaps) ? parsed.gaps : [];
const checksObject = parsed?.checks || {};

assert("QA Phase 1 markdown exists", md.includes("Runtime Smoke + Gap Report"));
assert("QA Phase 1 JSON parses", parsed !== null);
assert("Combined Phase 21 baseline documented", md.includes("admin-users-combined-phase21-2fa-final-readiness-20260623"));
assert("runtime mutation is false", parsed?.runtimeMutation === false);
assert("password reset surface ready", checksObject.passwordResetGeneratedTemporaryPassword === true);
assert("forced password-change route ready", checksObject.forcedPasswordChangeRouteImplemented === true);
assert("change-password route ready", checksObject.changePasswordRouteImplemented === true);
assert("signout route ready", checksObject.signoutRouteImplemented === true);
assert("stay signed in route ready", checksObject.staySignedInRouteImplemented === true);
assert("2FA challenge route ready", checksObject.twoFactorChallengeRouteImplemented === true);
assert("2FA verify route ready", checksObject.twoFactorVerifyRouteImplemented === true);
assert("external SMS remains explicitly deferred", gaps.some((gap) => gap.key === "externalSmsDeliveryImplemented" && gap.severity === "known-deferred"));
assert("report contains recommended next patch", md.includes("Runtime Enforcement Gap Patch"));
assert("report prohibits DOCX mutation in next scope", md.includes("Do not change DOCX templates"));
assert("report prohibits production document-generation signer validation mutation", md.includes("production document-generation signer validation"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
}
if (failed.length > 0) process.exit(1);
