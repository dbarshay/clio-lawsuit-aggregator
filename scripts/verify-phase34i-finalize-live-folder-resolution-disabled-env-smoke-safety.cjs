const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (message) => console.log("PASS: " + message);
const fail = (message) => {
  failed = true;
  console.error("FAIL: " + message);
};

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const pkg = JSON.parse(read("package.json"));
const smoke = read("scripts/smoke-phase34i-finalize-live-folder-resolution-disabled-env.cjs");

const verifierScript = "verify:phase34i-finalize-live-folder-resolution-disabled-env-smoke-safety";
const smokeScript = "smoke:phase34i-finalize-live-folder-resolution-disabled-env";

if (pkg.scripts && pkg.scripts[verifierScript] === "node scripts/verify-phase34i-finalize-live-folder-resolution-disabled-env-smoke-safety.cjs") {
  pass("package verifier script registered");
} else {
  fail("package verifier script missing");
}

if (pkg.scripts && pkg.scripts[smokeScript] === "node scripts/smoke-phase34i-finalize-live-folder-resolution-disabled-env.cjs") {
  pass("package smoke script registered");
} else {
  fail("package smoke script missing");
}

const requiredTokens = [
  "singleMasterResolveFolders: true",
  "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_COMMAND",
  "no upload was performed",
  "no database mutation was performed",
  "2026.05.00001"
];

for (const token of requiredTokens) {
  if (smoke.includes(token)) pass("smoke contains " + token);
  else fail("smoke missing " + token);
}

const forbiddenTokens = [
  'CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: "1"',
  'CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: "1"',
  'CLIO_SINGLE_MASTER_LIVE_WRITE_COMMAND: "RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE"',
  "confirmUpload: true",
  "uploadRewired: true",
  "databaseMutation: true"
];

for (const token of forbiddenTokens) {
  if (!smoke.includes(token)) pass("smoke does not include enabled/write token: " + token);
  else fail("smoke unexpectedly includes enabled/write token: " + token);
}

console.log("RESULT: Phase 34I disabled-env smoke safety verifier");
if (failed) process.exit(1);
