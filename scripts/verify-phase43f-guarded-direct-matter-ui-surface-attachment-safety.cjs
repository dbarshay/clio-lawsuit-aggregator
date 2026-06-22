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

const docPath = "docs/clio-storage-refactor/phase43f-guarded-direct-matter-ui-surface-attachment.md";
for (const f of [docPath, "app/matters/page.tsx", "package.json"]) {
  exists(f) ? pass("required Phase 43F file exists: " + f) : fail("missing required Phase 43F file: " + f);
}

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 43F",
  "Guarded Direct Matter UI Surface Attachment",
  "guarded off by default",
  "renderDirectMatterSingleMasterDryRunControlForRow",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "no live upload is enabled"
]) {
  contains("doc contains " + token, doc, token);
}

for (const token of [
  "renderDirectMatterSingleMasterDryRunControlForRow",
  "renderDirectMatterSingleMasterDryRunControl({",
  "directMatterId: row.id",
  "directMatterDisplayNumber: row.displayNumber",
  "documentKeys: [selectedDocumentKey]",
  "workingDocumentDriveItemId",
  "workingDocumentKey",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "directMatterSingleMasterDryRunControlEnabled = false",
  "data-phase43e-direct-matter-dry-run-control",
  "phase43f-direct-matter-ui-surface-attachment"
]) {
  contains("matters page contains Phase 43F surface attachment token " + token, page, token);
}

const bridgeStart = page.indexOf("function renderDirectMatterSingleMasterDryRunControlForRow");
const bridgeEndCandidates = [
  page.indexOf("\n  function masterDocumentPreviewText", bridgeStart + 10),
  page.indexOf("\n  async function loadMasterDocumentDataPreview", bridgeStart + 10),
].filter((index) => index > bridgeStart);
const bridgeEnd = bridgeEndCandidates.length ? Math.min(...bridgeEndCandidates) : Math.min(page.length, bridgeStart + 1600);
const bridgeBlock = bridgeStart >= 0 ? page.slice(bridgeStart, bridgeEnd) : "";
contains("bridge block captured", bridgeBlock, "renderDirectMatterSingleMasterDryRunControlForRow");
contains("bridge block passes row id", bridgeBlock, "directMatterId: row.id");
contains("bridge block passes row display number", bridgeBlock, "directMatterDisplayNumber: row.displayNumber");
contains("bridge block forces confirmUpload false", bridgeBlock, "confirmUpload: false");
contains("bridge block forces dry-run true", bridgeBlock, "singleMasterDryRun: true");
notContains("bridge block does not include masterLawsuitId", bridgeBlock, "masterLawsuitId");
notContains("bridge block does not hard-code confirmUpload true", bridgeBlock, "confirmUpload: true");
notContains("bridge block does not call finalize endpoint", bridgeBlock, "/api/documents/finalize");

const attachmentCount = (page.match(/phase43f-direct-matter-ui-surface-attachment/g) || []).length;
if (attachmentCount >= 1) pass("Phase 43F surface attachment marker appears at least once");
else fail("Phase 43F surface attachment marker missing");

contains("package Phase 43F verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43f-guarded-direct-matter-ui-surface-attachment-safety");
console.log("CONTRACT: Phase 43F attaches guarded direct dry-run control to a UI surface, still disabled/no-upload.");
console.log("RESULT: Phase 43F guarded direct matter UI surface attachment verifier");
if (failed) process.exit(1);
