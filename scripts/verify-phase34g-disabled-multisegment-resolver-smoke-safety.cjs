const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (message) => console.log("PASS: " + message);
const fail = (message) => {
  failed = true;
  console.error("FAIL: " + message);
};

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(process.cwd(), relativePath));

const pkg = JSON.parse(read("package.json"));
const smokePath = "scripts/smoke-phase34g-disabled-multisegment-resolver.cjs";
const smoke = exists(smokePath) ? read(smokePath) : "";

const verifierScript = "verify:phase34g-disabled-multisegment-resolver-smoke-safety";
const smokeScript = "smoke:phase34g-disabled-multisegment-resolver";

if (pkg.scripts && pkg.scripts[verifierScript] === "node scripts/verify-phase34g-disabled-multisegment-resolver-smoke-safety.cjs") {
  pass("package verifier script registered");
} else {
  fail("package verifier script missing");
}

if (pkg.scripts && pkg.scripts[smokeScript] === "node scripts/smoke-phase34g-disabled-multisegment-resolver.cjs") {
  pass("package smoke script registered");
} else {
  fail("package smoke script missing");
}

const requiredTokens = [
  "singleMasterResolveFolders: true",
  "Live folder resolution remains disabled until finalize live folder resolution is explicitly enabled and smoke-tested.",
  "resolverBlocked true",
  "clioWrite false",
  "uploadRewired false",
  "databaseMutation false",
  "noUploadPerformed true",
  "no Clio folder was created",
  "no upload was performed",
  "no database mutation was performed",
  "2026.05.00001"
];

for (const token of requiredTokens) {
  if (smoke.includes(token)) pass("smoke contains required token: " + token);
  else fail("smoke missing required token: " + token);
}

const forbiddenEnabledForms = [
  "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: \"1\"",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: \"1\"",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_COMMAND: \"RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE\"",
  "confirmUpload: true",
  "uploadRewired: true",
  "databaseMutation: true",
  "clioWrite: true",
  "Live folder resolution is blocked in Phase 34E until the resolver supports the locked multi-segment folder taxonomy."
];

for (const token of forbiddenEnabledForms) {
  if (!smoke.includes(token)) pass("smoke does not include enabled/stale token: " + token);
  else fail("smoke unexpectedly includes enabled/stale token: " + token);
}

console.log("RESULT: Phase 34G finalize live resolver blocked API smoke safety verifier");
if (failed) process.exit(1);
