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
const smoke = read("scripts/smoke-phase35a-live-individual-folder-resolution-no-upload.cjs");

const verifierScript = "verify:phase35a-live-individual-folder-resolution-no-upload-safety";
const smokeScript = "smoke:phase35a-live-individual-folder-resolution-no-upload";

if (pkg.scripts && pkg.scripts[verifierScript] === "node scripts/verify-phase35a-live-individual-folder-resolution-no-upload-safety.cjs") {
  pass("package verifier script registered");
} else {
  fail("package verifier script missing");
}

if (pkg.scripts && pkg.scripts[smokeScript] === "node scripts/smoke-phase35a-live-individual-folder-resolution-no-upload.cjs") {
  pass("package smoke script registered");
} else {
  fail("package smoke script missing");
}

for (const token of [
  "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001",
  "BRL_202600001",
  "BRL-202600001-BRL-202600999",
  "CLIO_MASTER_MATTER_ID",
  "CLIO_SINGLE_MASTER_ROOT_FOLDER_ID",
  "CLIO_DOCUMENTS_ROOT_FOLDER_ID",
  "22053807035",
  "no document upload was performed",
  "no database mutation was performed",
  "barshMattersOwnsFileAndLawsuitNumbers",
  "noPatientProviderInsurerClaimFolderNames",
  "mergeNonEmptyEnvFiles"
]) {
  if (smoke.includes(token)) pass("smoke contains " + token);
  else fail("smoke missing " + token);
}

for (const forbidden of [
  "uploadRewired: true",
  "databaseMutation: true",
  "confirmUpload: true",
  "patientName",
  "providerName",
  "insurerName",
  "claimNumber"
]) {
  if (!smoke.includes(forbidden)) pass("smoke does not include forbidden token: " + forbidden);
  else fail("smoke includes forbidden token: " + forbidden);
}

console.log("RESULT: Phase 35A live individual matter folder-resolution no-upload safety verifier");
if (failed) process.exit(1);
