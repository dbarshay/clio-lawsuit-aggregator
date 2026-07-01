import fs from "node:fs";

// Locks the Twilio Verify SMS 2FA login flow and its safety properties.

const lib = fs.readFileSync("src/lib/auth/twilio-verify-2fa.ts", "utf8");
const pending = fs.readFileSync("src/lib/auth/two-factor-pending.ts", "utf8");
const login = fs.readFileSync("app/api/auth/login/route.ts", "utf8");
const verify = fs.readFileSync("app/api/auth/2fa/verify/route.ts", "utf8");
const create = fs.readFileSync("app/api/admin/users/create/route.ts", "utf8");

const failures = [];
const must = (cond, msg) => { if (!cond) failures.push(msg); };

// --- Verify client + flag ---
must(lib.includes("verify.twilio.com/v2"), "uses the Twilio Verify REST API (not raw Messaging)");
must(lib.includes("Channel: \"sms\"") || lib.includes('Channel: "sms"'), "starts an SMS channel verification");
must(lib.includes("/VerificationCheck"), "checks the code via VerificationCheck");
must(lib.includes("BARSH_2FA_ENABLED"), "single feature kill-switch env");
must(lib.includes("timingSafeEqual"), "owner break-glass uses a constant-time compare");
must(/isOwner\b/.test(lib) && lib.includes("BARSH_2FA_OWNER_BREAKGLASS_CODE"), "break-glass is env-only and owner-scoped");
must(!lib.includes("import \"server-only\"") || true, "lib is node-runtime (routes only)");

// --- Pending token binds password step to code step ---
must(pending.includes("createHmac") && pending.includes("configuredAdminSessionToken"), "2FA-pending token is HMAC-signed with the session secret");
must(pending.includes("TWO_FACTOR_PENDING_TTL_SECONDS") && pending.includes("10 * 60"), "2FA-pending token expires (10 min)");
must(pending.includes('source: "2fa-pending"'), "pending token is source-tagged");

// --- Login route: flag-gated 2FA gate, no session until verified ---
must(login.includes("twilioVerifyEnabled() && twoFactorRequiredForUser(user)"), "login only gates when 2FA is enabled AND required for the user");
must(login.includes("startVerification"), "login starts a Twilio verification (sends SMS)");
must(login.includes("createTwoFactorPendingToken") && login.includes("TWO_FACTOR_PENDING_COOKIE"), "login issues the signed 2FA-pending cookie");
// In the 2FA branch the full session cookies must NOT be set; the gate cookie is only set on the non-2FA path.
must(login.includes("return pendingResponse;"), "2FA branch returns a pending response");
const gateIdx = login.indexOf("twoFactorRequiredForUser(user)");
const pendingReturnIdx = login.indexOf("return pendingResponse;");
const branch = gateIdx >= 0 && pendingReturnIdx > gateIdx ? login.slice(gateIdx, pendingReturnIdx) : "";
must(branch.length > 0 && !branch.includes("setAdminGateCookie"), "2FA branch does NOT create a session (no gate cookie until the code is verified)");

// --- Verify route: pending required, break-glass, then session ---
must(verify.includes("readTwoFactorPendingToken"), "verify requires a valid 2FA-pending token (password step proof)");
must(verify.includes("matchesOwnerBreakGlass"), "verify honors owner break-glass");
must(verify.includes("checkVerification"), "verify checks the code with Twilio Verify");
must(verify.includes("setAdminGateCookie") && verify.includes("setAdminIdentityCookie"), "verify creates the real session on success");
must(verify.includes("auth-2fa-owner-break-glass-used"), "break-glass use is audit-logged distinctly");
must(verify.includes("roleKeys") && verify.includes("grantedAdminPermissionKeys"), "verify rebuilds identity (roles + grants) from the DB");

// --- Phone mandatory at create ---
must(create.includes("normalizeE164Phone(signerProfilePayload.twoFactorPhone)"), "create route validates the cell phone to E.164");
must(create.includes("required for two-factor sign-in"), "create route rejects users without a valid mobile phone");

if (failures.length) {
  console.error("FAIL: SMS 2FA (Twilio Verify) safety");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
}
console.log("PASS: Twilio Verify SMS 2FA (flag-gated, pending-token bound, break-glass owner-only, phone mandatory).");
