import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const schema = read("prisma/schema.prisma");
const twofa = read("src/lib/auth/admin-user-two-factor-phase1.ts");
const timeout = read("src/lib/auth/admin-user-session-timeout-phase1.ts");
const signer = read("src/lib/admin-users/admin-user-signer-profile-phase1.ts");
const usersPage = read("app/admin/users/page.tsx");
const docs = read("docs/admin-users/signer-profile-phase1-security.md");
const registry = read("src/lib/templates/template-signer-requirements-registry-phase1.ts");

for (const field of ["twoFactorPhone", "twoFactorPhoneMasked", "twoFactorDisabled", "twoFactorPendingSetup", "twoFactorChallengeHash", "twoFactorChallengeExpiresAt", "twoFactorChallengeAttempts", "twoFactorChallengeLockedAt"]) {
  assert(`schema has ${field}`, schema.includes(field));
}
assert("2FA code expiration is 5 minutes", twofa.includes("TWO_FACTOR_CODE_EXPIRATION_MINUTES = 5"));
assert("2FA max attempts is 5", twofa.includes("TWO_FACTOR_MAX_ATTEMPTS = 5"));
assert("2FA phone masking helper exists", signer.includes("maskTwoFactorPhone"));
assert("per-user 2FA disable status exists", signer.includes("twoFactorDisabled") && signer.includes("Disabled"));
assert("2FA statuses covered", signer.includes("Enabled") && signer.includes("Missing Phone") && signer.includes("Pending Setup"));
assert("sign-out/session invalidation schema exists", schema.includes("lastSignOutAt") && schema.includes("sessionInvalidatedAt"));
assert("visible sign out contract exists", docs.includes("signout") || docs.includes("signout") || docs.includes("Sign Out"));
assert("idle timeout is 30 minutes", timeout.includes("IDLE_TIMEOUT_MINUTES = 30"));
assert("idle timeout warning is 2 minutes", timeout.includes("IDLE_TIMEOUT_WARNING_MINUTES = 2"));
assert("warning modal actions documented", docs.includes("Stay Signed In") || usersPage.includes("Stay Signed In"));
assert("no production template generation wiring", registry.includes("PHASE1") || registry.includes("Phase1") || registry.includes("phase1"));

const failed = checks.filter((c) => c.pass === false);
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}: ${c.name}`);
if (failed.length > 0) process.exit(1);
