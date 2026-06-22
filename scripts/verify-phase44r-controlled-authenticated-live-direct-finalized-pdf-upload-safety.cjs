const fs = require("fs");
const scriptPath = "scripts/smoke-phase44r-controlled-authenticated-live-direct-finalized-pdf-upload.cjs";
const script = fs.readFileSync(scriptPath, "utf8");

function pass(msg) { console.log("PASS: " + msg); }
function fail(msg) { console.error("FAIL: " + msg); process.exitCode = 1; }

for (const token of [
  "phase44rAuthorizeAdmin",
  "/api/admin/authorize",
  "phase44rConfiguredAdminPassword",
  "BARSH_ADMIN_PASSWORD",
  "BARSH_PHASE44R_ADMIN_PASSWORD",
  "loadEnvConfig(process.cwd())",
  "phase44rAdminCookieHeader",
  "phase44rCaptureSetCookies",
  "phase44rMergeCookieHeader",
  "phase44rFetch",
  "confirmUpload: true",
  "singleMasterDryRun: false",
  "EXPECTED_FOLDER_ID = 22062401000",
  "uploaded.length === 1",
  "workingDocumentDriveItemId: working.driveItemId",
  "FINALIZE_JSON_REDACTED",
]) {
  if (script.includes(token)) pass("Phase 44R smoke contains " + token);
  else fail("Phase 44R smoke missing " + token);
}

if (script.includes("barsh-admin-dev")) fail("Phase 44R smoke must not contain dev fallback password token");
else pass("Phase 44R smoke has no dev fallback password token");

if (script.includes("masterLawsuitId")) fail("Phase 44R direct smoke should not introduce masterLawsuitId");
else pass("Phase 44R direct smoke does not introduce masterLawsuitId token");

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 44R authenticated live direct smoke verifier passed");
