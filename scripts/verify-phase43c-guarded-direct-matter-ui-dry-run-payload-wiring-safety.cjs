const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }

const docPath = "docs/clio-storage-refactor/phase43c-guarded-direct-matter-ui-dry-run-payload-wiring.md";
for (const f of [docPath, "app/matters/page.tsx", "app/api/documents/finalize/route.ts", "package.json"]) {
  exists(f) ? pass("required Phase 43C file exists: " + f) : fail("missing required Phase 43C file: " + f);
}

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const finalize = read("app/api/documents/finalize/route.ts");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 43C",
  "dry-run/no-upload",
  "uploadTargetMode: \"direct-matter\"",
  "directMatterId",
  "directMatterDisplayNumber",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "allowDuplicateUploads: false",
  "workingDocumentDriveItemId",
  "workingDocumentKey"
]) {
  contains("doc contains " + token, doc, token);
}

for (const token of [
  "buildDirectMatterSingleMasterFinalizeDryRunPayload",
  "buildDirectMatterSingleMasterFinalizePayload",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "DirectMatterSingleMasterDocumentPayloadParams"
]) {
  contains("matters page contains dry-run UI payload anchor " + token, page, token);
}

const foundationStart = page.indexOf("function buildDirectMatterSingleMasterWorkingDocxPayload");
const exportDefault = page.indexOf("export default", foundationStart);
const block = foundationStart >= 0 && exportDefault > foundationStart ? page.slice(foundationStart, exportDefault) : "";
contains("direct helper block contains dry-run helper", block, "buildDirectMatterSingleMasterFinalizeDryRunPayload");
contains("direct helper block keeps duplicate prevention default", block, "allowDuplicateUploads: false");
contains("direct helper block uses direct matter upload target", block, 'uploadTargetMode: "direct-matter"');
notContains("direct helper block does not include masterLawsuitId", block, "masterLawsuitId");
notContains("direct helper block does not introduce hard-coded direct confirmUpload true", block, "confirmUpload: true");

for (const token of [
  "singleMasterDryRun",
  "confirmUpload",
  "noUploadPerformed: true",
  "useDirectFinalizePreview"
]) {
  contains("finalize route retains no-upload/dry-run backend anchor " + token, finalize, token);
}

contains("package Phase 43C verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43c-guarded-direct-matter-ui-dry-run-payload-wiring-safety");
console.log("CONTRACT: Phase 43C adds guarded direct UI dry-run payload wiring only; no upload path is enabled.");
console.log("RESULT: Phase 43C guarded direct matter UI dry-run payload wiring verifier");
if (failed) process.exit(1);
