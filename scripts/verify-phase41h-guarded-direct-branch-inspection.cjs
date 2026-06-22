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

function contains(label, text, token) {
  if (text.includes(token)) pass(label);
  else fail(`${label} missing token: ${token}`);
}

function notContains(label, text, token) {
  if (!text.includes(token)) pass(label);
  else fail(`${label} contains forbidden token: ${token}`);
}

const docPath = "docs/clio-storage-refactor/phase41h-guarded-direct-branch-inspection.md";
const finalizePath = "app/api/documents/finalize/route.ts";
const uploadPath = "lib/clioDocumentUpload.ts";
const guardPath = "lib/clioStorageWriteGuard.ts";
const resolverPath = "lib/clioFolderResolverExecutor.ts";
const pkgPath = "package.json";

for (const file of [docPath, finalizePath, uploadPath, guardPath, resolverPath, pkgPath]) {
  if (exists(file)) pass(`required Phase 41H file exists: ${file}`);
  else fail(`missing required Phase 41H file: ${file}`);
}

const doc = exists(docPath) ? read(docPath) : "";
const finalize = exists(finalizePath) ? read(finalizePath) : "";
const upload = exists(uploadPath) ? read(uploadPath) : "";
const guard = exists(guardPath) ? read(guardPath) : "";
const resolver = exists(resolverPath) ? read(resolverPath) : "";
const pkg = exists(pkgPath) ? JSON.parse(read(pkgPath)) : { scripts: {} };

for (const token of [
  "Phase 41H locks a read-only inspection",
  "CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED=1",
  "storageTargetKind: \"individual_matter\"",
  "directMatterFileNumber",
  "bmMatterId: directMatterFileNumber",
  "displayNumber: directMatterFileNumber",
  "CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED=1",
  "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED=1",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED=1",
  "uploadRewired: false",
  "databaseMutation: false",
  "noUploadPerformed: true",
  "not a live upload",
]) {
  contains(`doc contains ${token}`, doc, token);
}

const branchMatch = finalize.match(/if \(isDirectMatter\) \{[\s\S]*?\n  \}/);
const branch = branchMatch ? branchMatch[0] : "";
if (branch) pass("direct matter branch located inside buildSingleMasterFinalizeTargetInput");
else fail("direct matter branch missing inside buildSingleMasterFinalizeTargetInput");

for (const token of [
  "const isDirectMatter = params.uploadTargetMode === \"direct-matter\"",
  "CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED",
  "Single-master Clio storage for direct/individual matters is blocked until CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED=1.",
  "/^BRL_\\d{9}$/.test(directMatterFileNumber)",
  "storageTargetKind: \"individual_matter\"",
  "directMatterFileNumber",
  "bmMatterId: directMatterFileNumber",
  "displayNumber: directMatterFileNumber",
]) {
  contains(`finalize/direct branch contains ${token}`, finalize, token);
}

for (const forbidden of ["patient", "provider", "insurer", "claimNumber", "claim number", "denial"]) {
  if (!new RegExp(forbidden, "i").test(branch)) pass(`direct branch avoids ${forbidden}`);
  else fail(`direct branch contains ${forbidden}`);
}

for (const forbidden of [
  "22062400790",
  "22062400880",
  "22062401000",
  "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001",
]) {
  notContains("finalize route does not hard-code direct live audit anchor", finalize, forbidden);
}

for (const token of [
  "uploadRewired: false",
  "databaseMutation: false",
  "noUploadPerformed: true",
  "singleMasterDryRun",
  "singleMasterResolveFolders",
  "folderResolutionMode",
  "preview-only-no-clio-call",
  "guarded-live-folder-resolution-no-upload",
]) {
  contains(`dry-run response preserves ${token}`, finalize, token);
}

for (const token of [
  "CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED=1",
  "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED=1",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED=1",
  "uploadGuard.uploadRewireEnabled",
  "uploadGuard.liveClioWriteEnabled",
  "uploadGuard.createFoldersEnabled",
]) {
  contains(`upload guard preserves ${token}`, finalize, token);
}

contains("duplicate check uses folder list when rewired", finalize, "uploadRewiredToSingleMasterFolder\n      ? await listClioFolderDocuments(Number(singleMasterUploadFolderId))");
contains("duplicate check keeps matter fallback when not rewired", finalize, ": await listClioMatterDocuments(matterId);");
contains("upload helper supports Folder parent type", upload, "export type ClioDocumentParentType = \"Matter\" | \"Folder\"");
contains("upload helper supports Folder parent ID", upload, "parentId = parentType === \"Folder\" ? positiveId(params.parentId) : matterId");
contains("folder create guard still requires create/live flags", guard, "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED");
contains("folder create guard still requires live flag", guard, "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED");
contains("resolver still detects duplicate child folder names", resolver, "Duplicate child folders named");
contains("package Phase 41H verifier script registered", JSON.stringify(pkg.scripts || {}), "verify:phase41h-guarded-direct-branch-inspection");

console.log("CONTRACT: Phase 41H is read-only inspection/readiness and does not enable direct upload.");
console.log("CONTRACT: direct target-input construction is default-off and upload still requires the existing upload/folder/live guards.");
console.log("RESULT: Phase 41H guarded direct finalize branch inspection verifier");

if (failed) process.exit(1);
