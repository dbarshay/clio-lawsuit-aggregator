import fs from "node:fs";

let failed = false;
function must(ok, message) {
  if (!ok) {
    failed = true;
    console.error("FAIL: " + message);
  } else {
    console.log("PASS: " + message);
  }
}
const page = fs.readFileSync("app/admin/users/page.tsx", "utf8");
const challenge = fs.readFileSync("app/api/auth/2fa/challenge/route.ts", "utf8");
const verify = fs.readFileSync("app/api/auth/2fa/verify/route.ts", "utf8");
const login = fs.readFileSync("app/api/auth/login/route.ts", "utf8");

must(challenge.includes("setupVerification") && challenge.includes("setupVerificationCode"), "challenge route supports setup verification code return");
must(challenge.includes("codeReturned: setupVerification"), "challenge route only returns code for setup verification");
must(challenge.includes("deliveryPendingExternalSms: !setupVerification"), "challenge route preserves external SMS pending for normal challenges");
must(verify.includes("setupVerification") && verify.includes("twoFactorPendingSetup: false"), "verify route clears pending setup after setup verification");
must(verify.includes("twoFactorConfiguredAt: new Date()") && verify.includes('twoFactorMethod: "sms"'), "verify route records 2FA configured timestamp/method");
must(page.includes('data-barsh-admin-users-2fa-verify-panel="true"'), "Admin Users page has verify setup panel");
must(page.includes('data-barsh-admin-users-verify-2fa-setup-row-button="true"'), "pending setup row has Verify Setup action");
must(page.includes("/api/auth/2fa/challenge") && page.includes("/api/auth/2fa/verify"), "Admin Users page calls challenge and verify routes");
must(page.includes("setupVerification: true"), "Admin Users setup verification calls are explicitly setup-only");
must(page.includes("Setup verification code:"), "Admin Users setup verification displays temporary setup code");
must(login.includes("twoFactorRequired: false"), "Phase U1 does not yet enforce 2FA at login");

if (failed) {
  console.error("RESULT: Admin Users Workflow Phase U1 2FA setup verification verifier failed");
  process.exit(1);
}
console.log("PASS: Admin Users Workflow Phase U1 2FA setup verification locked.");
