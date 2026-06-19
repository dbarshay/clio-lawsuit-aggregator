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
const finalize = read("app/api/documents/finalize/route.ts");

const scriptName = "verify:phase34i-finalize-live-folder-resolution-no-upload-safety";

if (pkg.scripts && pkg.scripts[scriptName] === "node scripts/verify-phase34i-finalize-live-folder-resolution-no-upload-safety.cjs") {
  pass("package script registered");
} else {
  fail("package script missing");
}

for (const token of [
  "resolveClioMatterFolderWithGuard(singleMasterTargetInput)",
  "buildClioStorageFolderResolutionPreview(singleMasterTargetInput)",
  "clioWrite: singleMasterResolveFolders",
  "uploadRewired: false",
  "databaseMutation: false",
  "noUploadPerformed: true",
  "generationSkipped: true",
  "singleMasterDryRun",
  "singleMasterResolveFolders"
]) {
  if (finalize.includes(token)) pass("finalize contains " + token);
  else fail("finalize missing " + token);
}

for (const forbidden of [
  "resolverBlocked: true",
  "Live folder resolution remains disabled until finalize live folder resolution is explicitly enabled and smoke-tested.",
  "uploadRewired: true",
  "databaseMutation: true"
]) {
  if (!finalize.includes(forbidden)) pass("finalize does not contain " + forbidden);
  else fail("finalize unexpectedly contains " + forbidden);
}

console.log("RESULT: Phase 34I finalize live folder resolution no-upload safety verifier");
if (failed) process.exit(1);
