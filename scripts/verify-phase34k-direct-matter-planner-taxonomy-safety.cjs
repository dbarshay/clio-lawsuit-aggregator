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
const smoke = read("scripts/smoke-phase34k-direct-matter-planner-taxonomy.cjs");
const plan = read("lib/clioStoragePlan.ts");

const verifierScript = "verify:phase34k-direct-matter-planner-taxonomy-safety";
const smokeScript = "smoke:phase34k-direct-matter-planner-taxonomy";

if (pkg.scripts && pkg.scripts[verifierScript] === "node scripts/verify-phase34k-direct-matter-planner-taxonomy-safety.cjs") {
  pass("package verifier script registered");
} else {
  fail("package verifier script missing");
}

if (pkg.scripts && pkg.scripts[smokeScript] === "node scripts/smoke-phase34k-direct-matter-planner-taxonomy.cjs") {
  pass("package smoke script registered");
} else {
  fail("package smoke script missing");
}

const requiredSmokeTokens = [
  "BRL_202600001",
  "Individual Matters",
  "BRL-202600001-BRL-202600999",
  "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001",
  "individual_matter",
  "no Clio call performed",
  "no folder created",
  "no upload performed",
  "no database mutation performed",
  "singleMasterEnabled: true"
];

for (const token of requiredSmokeTokens) {
  if (smoke.includes(token)) pass("smoke contains " + token);
  else fail("smoke missing " + token);
}

const requiredPlannerTokens = [
  "buildIndividualMatterRangeFolderName",
  "BRL_YYYYNNNNN",
  "Individual Matters",
  "folderSegments"
];

for (const token of requiredPlannerTokens) {
  if (plan.includes(token)) pass("planner contains " + token);
  else fail("planner missing " + token);
}

const forbiddenTokens = [
  "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED",
  "RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE",
  "confirmUpload: true",
  "uploadRewired: true",
  "databaseMutation: true"
];

for (const token of forbiddenTokens) {
  if (!smoke.includes(token)) pass("smoke does not include live/write token: " + token);
  else fail("smoke unexpectedly includes live/write token: " + token);
}

console.log("RESULT: Phase 34K direct matter planner taxonomy safety verifier");
if (failed) process.exit(1);
