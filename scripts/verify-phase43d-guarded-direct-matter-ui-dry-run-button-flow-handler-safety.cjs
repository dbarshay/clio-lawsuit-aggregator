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

const docPath = "docs/clio-storage-refactor/phase43d-guarded-direct-matter-ui-dry-run-button-flow-handler.md";
for (const f of [docPath, "app/matters/page.tsx", "app/api/documents/finalize/route.ts", "package.json"]) {
  exists(f) ? pass("required Phase 43D file exists: " + f) : fail("missing required Phase 43D file: " + f);
}

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const finalize = read("app/api/documents/finalize/route.ts");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 43D",
  "Guarded Direct Matter UI Dry-Run Button-Flow Handler",
  "not a live upload button enablement",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "allowDuplicateUploads: false",
  "does not include `masterLawsuitId`"
]) {
  contains("doc contains " + token, doc, token);
}

for (const token of [
  "runDirectMatterSingleMasterFinalizeDryRunFromUi",
  "buildDirectMatterSingleMasterFinalizeDryRunPayload(params)",
  'fetch("/api/documents/finalize"',
  "uiOriginatedDirectMatterDryRun: true",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "noUploadPerformed",
  "databaseMutation",
  "uploadRewired"
]) {
  contains("matters page contains Phase 43D dry-run handler token " + token, page, token);
}

const handlerStart = page.indexOf("async function runDirectMatterSingleMasterFinalizeDryRunFromUi");
const handlerEndCandidates = [
  page.indexOf("\n  async function", handlerStart + 10),
  page.indexOf("\n  function", handlerStart + 10),
  page.indexOf("\n  const", handlerStart + 10),
  page.indexOf("\n  return", handlerStart + 10),
].filter((index) => index > handlerStart);
const handlerEnd = handlerEndCandidates.length ? Math.min(...handlerEndCandidates) : Math.min(page.length, handlerStart + 2400);
const handlerBlock = handlerStart >= 0 ? page.slice(handlerStart, handlerEnd) : "";
contains("handler block captured", handlerBlock, "runDirectMatterSingleMasterFinalizeDryRunFromUi");
contains("handler block uses dry-run helper", handlerBlock, "buildDirectMatterSingleMasterFinalizeDryRunPayload(params)");
contains("handler block posts to finalize endpoint", handlerBlock, 'fetch("/api/documents/finalize"');
notContains("handler block does not include masterLawsuitId", handlerBlock, "masterLawsuitId");
notContains("handler block does not hard-code confirmUpload true", handlerBlock, "confirmUpload: true");
notContains("handler block does not call working-docx", handlerBlock, "/api/documents/working-docx");
notContains("handler block does not call upload helper", handlerBlock, "uploadBufferToClioMatterDocuments");

for (const token of [
  "buildDirectMatterSingleMasterFinalizeDryRunPayload",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "allowDuplicateUploads: false"
]) {
  contains("matters page retains Phase 43C dry-run helper " + token, page, token);
}

for (const token of [
  "useDirectFinalizePreview",
  "singleMasterDryRun",
  "noUploadPerformed: true",
  "uploadTargetMode === \"direct-matter\""
]) {
  contains("finalize route retains no-upload backend anchor " + token, finalize, token);
}

contains("package Phase 43D verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43d-guarded-direct-matter-ui-dry-run-button-flow-handler-safety");
console.log("CONTRACT: Phase 43D adds UI-originated direct dry-run handler only; no upload path is enabled.");
console.log("RESULT: Phase 43D guarded direct matter UI dry-run button-flow handler verifier");
if (failed) process.exit(1);
