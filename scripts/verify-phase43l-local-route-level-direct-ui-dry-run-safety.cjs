const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p) => fs.existsSync(path.join(process.cwd(), p));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }

const docPath = "docs/clio-storage-refactor/phase43l-local-route-level-direct-ui-dry-run-smoke.md";
const smokePath = "scripts/smoke-phase43l-local-route-level-direct-ui-dry-run.cjs";
for (const f of [docPath, smokePath, "app/api/documents/finalize/route.ts", "app/matters/page.tsx", "package.json"]) {
  exists(f) ? pass("required Phase 43L file exists: " + f) : fail("missing required Phase 43L file: " + f);
}

const doc = read(docPath);
const smoke = read(smokePath);
const finalize = read("app/api/documents/finalize/route.ts");
const page = read("app/matters/page.tsx");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 43L",
  "Local Route-Level Direct UI Dry-Run Smoke",
  "local server only",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "allowDuplicateUploads: false",
  "no live upload is enabled",
  "no document is uploaded"
]) {
  contains("doc contains " + token, doc, token);
}

for (const token of [
  "representativePayload",
  'uploadTargetMode: "direct-matter"',
  'directMatterId: "1881278195"',
  'directMatterDisplayNumber: "BRL_202600001"',
  "useSingleMasterClioStorage: true",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "allowDuplicateUploads: false",
  'documentKeys: ["summons-complaint"]',
  'workingDocumentDriveItemId: "WORKING_DOCUMENT_DRIVE_ITEM_ID_REPRESENTATIVE"',
  'fetch(`${BASE_URL}/api/documents/finalize`',
  "assertNoUpload(json)",
  "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: \"0\"",
  "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: \"0\""
]) {
  contains("smoke contains " + token, smoke, token);
}

notContains("smoke does not enable live write", smoke, 'CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: "1"');
notContains("smoke does not enable folder creation", smoke, 'CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: "1"');
notContains("smoke payload object does not include masterLawsuitId", smoke, "masterLawsuitId:");
notContains("smoke does not call Clio upload helper directly", smoke, "uploadBufferToClioMatterDocuments(");

for (const token of [
  "useDirectFinalizePreview",
  "singleMasterDryRun",
  "noUploadPerformed: true",
  'uploadTargetMode === "direct-matter"',
  "workingDocumentDriveItemId"
]) {
  contains("finalize route retains direct dry-run backend token " + token, finalize, token);
}

for (const token of [
  "if (!selectedDocumentKey || !workingDocumentDriveItemId || !workingDocumentKey) return null",
  "directMatterSingleMasterDryRunControlEnabled = false",
  "documentKeys: [selectedDocumentKey]"
]) {
  contains("matters page retains UI prerequisite token " + token, page, token);
}

contains("package Phase 43L smoke registered", JSON.stringify(pkg.scripts || {}), "smoke:phase43l-local-route-level-direct-ui-dry-run");
contains("package Phase 43L verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43l-local-route-level-direct-ui-dry-run-safety");

console.log("CONTRACT: Phase 43L route-level smoke is guarded local no-upload only.");
console.log("RESULT: Phase 43L local route-level direct UI dry-run safety verifier");
if (failed) process.exit(1);
