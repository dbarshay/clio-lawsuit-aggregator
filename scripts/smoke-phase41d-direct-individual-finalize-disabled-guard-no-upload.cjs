const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => {
  failed = true;
  console.error("FAIL: " + m);
};

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));

const DIRECT_TARGET_INPUT = Object.freeze({
  storageTargetKind: "individual_matter",
  directMatterFileNumber: "BRL_202600001",
  bmMatterId: "BRL_202600001",
  displayNumber: "BRL_202600001",
});

function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

console.log("RESULT: Phase 41D direct/individual finalize disabled-guard no-upload smoke starting");

for (const file of [
  "app/api/documents/finalize/route.ts",
  "lib/clioStoragePlan.ts",
  "lib/clioDocumentUpload.ts",
  "docs/clio-storage-refactor/phase41c-direct-individual-finalize-wiring-design.md",
]) {
  assert(exists(file), `required file exists: ${file}`);
}

const finalize = read("app/api/documents/finalize/route.ts");
const plan = read("lib/clioStoragePlan.ts");
const phase41c = read("docs/clio-storage-refactor/phase41c-direct-individual-finalize-wiring-design.md");

assert(DIRECT_TARGET_INPUT.storageTargetKind === "individual_matter", "direct target input uses storageTargetKind individual_matter");
assert(DIRECT_TARGET_INPUT.directMatterFileNumber === "BRL_202600001", "direct target input uses Barsh Matters direct file number");
assert(DIRECT_TARGET_INPUT.bmMatterId === "BRL_202600001", "direct target input bmMatterId is the Barsh Matters direct file number");
assert(DIRECT_TARGET_INPUT.displayNumber === "BRL_202600001", "direct target input displayNumber is the Barsh Matters direct file number");

for (const token of ["Individual Matters", "individual_matter", "direct_matter", "directMatterFileNumber", "BRL_YYYYNNNNN"]) {
  assert(plan.includes(token), `planner supports direct/individual taxonomy token: ${token}`);
}

for (const token of [
  "storageTargetKind: \"individual_matter\"",
  "directMatterFileNumber",
  "Barsh Matters owns and assigns direct/individual file numbers",
  "existing direct matter documents must not be moved automatically",
  "Disabled guard smoke",
]) {
  assert(phase41c.includes(token), `Phase 41C design remains anchored: ${token}`);
}

const finalizeMentionsDirectTarget =
  /directMatterFileNumber|storageTargetKind|individual_matter|direct_matter/.test(finalize);

if (!finalizeMentionsDirectTarget) {
  pass("actual finalize route has no direct/individual target-input branch yet, so direct upload remains disabled");
} else {
  const guarded =
    /CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED/.test(finalize) &&
    /CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED/.test(finalize) &&
    /uploadRewired/.test(finalize);
  assert(guarded, "any direct/individual finalize target branch must remain guarded by folder/live/upload controls");
}

for (const forbidden of [
  "22062400790",
  "22062400880",
  "22062401000",
  "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001",
]) {
  assert(!finalize.includes(forbidden), `finalize route does not hard-code direct audit anchor: ${forbidden}`);
}

const namingBlock =
  (plan.match(/function buildIndividualMatterRangeFolderName[\s\S]*?export function buildClioStorageTargetPlan/) || [""])[0] ||
  plan;

for (const forbidden of ["patient", "provider", "insurer", "claimNumber", "claim number", "denial"]) {
  assert(!new RegExp(forbidden, "i").test(namingBlock), `direct folder naming path avoids ${forbidden}`);
}

console.log("CONTRACT: Phase 41D performs no upload, no folder create, no delete, no DB mutation, and no production env change.");
console.log("CONTRACT: direct/individual finalize upload remains blocked until direct target wiring and explicit upload/folder/live controls are intentionally enabled.");
console.log("RESULT: Phase 41D direct/individual finalize disabled-guard no-upload smoke completed");

if (failed) process.exit(1);
