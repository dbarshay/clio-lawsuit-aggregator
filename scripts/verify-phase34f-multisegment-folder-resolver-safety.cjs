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
const resolver = read("lib/clioFolderResolverExecutor.ts");
const finalize = read("app/api/documents/finalize/route.ts");
const plan = read("lib/clioStoragePlan.ts");

const scriptName = "verify:phase34f-multisegment-folder-resolver-safety";

if (pkg.scripts && pkg.scripts[scriptName] === "node scripts/verify-phase34f-multisegment-folder-resolver-safety.cjs") {
  pass("package script registered");
} else {
  fail("package script missing");
}

for (const token of [
  "getResolvedCreatedFlag",
  "getResolvedFolderId",
  "folderSegments",
  "ClioResolvedFolderSegment",
  "configuredSegments",
  "for (const segmentName of configuredSegments)",
  "parentId = folderId",
  "createdFolderCount",
  "reusedFolderCount",
  "folderId: finalFolder.id",
]) {
  if (resolver.includes(token)) pass("resolver contains " + token);
  else fail("resolver missing " + token);
}

if (resolver.includes("createClioFolderWithGuard") && resolver.includes("buildClioStorageTargetPlan")) {
  pass("resolver still uses guarded creator and planner");
} else {
  fail("resolver missing guarded creator/planner");
}

if (!/patient|provider|insurer|claimNumber|claim number/i.test(resolver)) {
  pass("resolver does not use private matter facts");
} else {
  fail("resolver references private matter facts");
}

if (
  plan.includes("folderSegments = [rootFolderName, groupFolderName, finalFolderName]") &&
  plan.includes('matterFolderPath = folderSegments.join("/")')
) {
  pass("planner supplies three taxonomy segments");
} else {
  fail("planner taxonomy segments missing");
}

if (
  finalize.includes("resolveClioMatterFolderWithGuard(singleMasterTargetInput)") &&
  finalize.includes("clioWrite: singleMasterResolveFolders") &&
  finalize.includes("uploadRewired: false") &&
  finalize.includes("databaseMutation: false") &&
  finalize.includes("noUploadPerformed: true") &&
  finalize.includes("generationSkipped: true")
) {
  pass("finalize can call guarded resolver but still disables upload/db/final document generation");
} else {
  fail("finalize guarded resolver/no-upload contract missing");
}

for (const forbidden of ["uploadRewired: true", "databaseMutation: true"]) {
  if (!finalize.includes(forbidden)) pass("finalize does not contain " + forbidden);
  else fail("finalize contains " + forbidden);
}

console.log("RESULT: Phase 34F multisegment folder resolver safety verifier");
if (failed) process.exit(1);
