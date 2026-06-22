const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(`${label} missing token: ${token}`); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(`${label} contains forbidden token: ${token}`); }
const docPath = "docs/clio-storage-refactor/phase41i-direct-individual-finalize-route-dry-run-no-upload.md";
const smokePath = "scripts/smoke-phase41i-direct-individual-finalize-route-dry-run-no-upload.cjs";
const finalizePath = "app/api/documents/finalize/route.ts";
for (const file of [docPath, smokePath, finalizePath, "package.json"]) {
  exists(file) ? pass(`required Phase 41I file exists: ${file}`) : fail(`missing required Phase 41I file: ${file}`);
}
const doc = exists(docPath) ? read(docPath) : "";
const smoke = exists(smokePath) ? read(smokePath) : "";
const finalize = exists(finalizePath) ? read(finalizePath) : "";
const pkg = JSON.parse(read("package.json"));
for (const token of [
  "Phase 41I locks an actual local route dry-run smoke",
  "CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED",
  "uploadRewired: false",
  "databaseMutation: false",
  "noUploadPerformed: true",
  "preview-only-no-clio-call",
  "BRL_202600001",
  "not a live upload",
]) contains(`doc contains ${token}`, doc, token);
for (const token of [
  "runDefaultOffCase",
  "runGuardEnabledDryRunCase",
  "CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED: \"0\"",
  "CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED: \"1\"",
  "CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED: \"0\"",
  "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: \"0\"",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: \"0\"",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: false",
  "uploadRewired === false",
  "databaseMutation === false",
  "noUploadPerformed === true",
  "folderResolutionMode === \"preview-only-no-clio-call\"",
  "storageTargetKind === \"individual_matter\"",
  "directMatterFileNumber === DIRECT_FILE_NUMBER",
  "bmMatterId === DIRECT_FILE_NUMBER",
  "displayNumber === DIRECT_FILE_NUMBER",
]) contains(`smoke contains ${token}`, smoke, token);
for (const forbidden of [
  "CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED: \"1\"",
  "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: \"1\"",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: \"1\"",
  "singleMasterResolveFolders: true",
  "confirmUpload: true",
  "allowDuplicateUploads: true",
]) notContains("smoke does not arm live upload/folder flags", smoke, forbidden);
for (const token of [
  "CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED",
  "storageTargetKind: \"individual_matter\"",
  "directMatterFileNumber",
  "bmMatterId: directMatterFileNumber",
  "displayNumber: directMatterFileNumber",
  "uploadRewired: false",
  "databaseMutation: false",
  "noUploadPerformed: true",
  "preview-only-no-clio-call",
]) contains(`finalize route keeps Phase 41I route-dry-run anchor ${token}`, finalize, token);
if (pkg.scripts && pkg.scripts["smoke:phase41i-direct-individual-finalize-route-dry-run-no-upload"] === "node scripts/smoke-phase41i-direct-individual-finalize-route-dry-run-no-upload.cjs") pass("package Phase 41I smoke script registered"); else fail("package Phase 41I smoke script missing");
if (pkg.scripts && pkg.scripts["verify:phase41i-direct-individual-finalize-route-dry-run-safety"] === "node scripts/verify-phase41i-direct-individual-finalize-route-dry-run-safety.cjs") pass("package Phase 41I verifier script registered"); else fail("package Phase 41I verifier script missing");
console.log("CONTRACT: Phase 41I is local route dry-run only and does not enable live upload.");
console.log("CONTRACT: direct/individual route dry-run must keep uploadRewired false, databaseMutation false, and noUploadPerformed true.");
console.log("RESULT: Phase 41I direct/individual route dry-run no-upload safety verifier");
if (failed) process.exit(1);
