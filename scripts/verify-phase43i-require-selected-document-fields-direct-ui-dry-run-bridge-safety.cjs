const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p) => fs.existsSync(path.join(process.cwd(), p));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }

const docPath = "docs/clio-storage-refactor/phase43i-require-selected-document-fields-direct-ui-dry-run-bridge.md";
for (const f of [docPath, "app/matters/page.tsx", "package.json"]) {
  exists(f) ? pass("required Phase 43I file exists: " + f) : fail("missing required Phase 43I file: " + f);
}

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 43I",
  "Require Selected Document Fields",
  "no longer hard-codes `documentKeys: []`",
  "requires `selectedDocumentKey`",
  "requires `workingDocumentDriveItemId`",
  "requires `workingDocumentKey`",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "no live upload is enabled"
]) {
  contains("doc contains " + token, doc, token);
}

for (const token of [
  "type DirectMatterSingleMasterDryRunSelection",
  "selectedDocumentKey: string",
  "workingDocumentDriveItemId: string",
  "workingDocumentKey: string",
  "function renderDirectMatterSingleMasterDryRunControlForRow(row: MatterRow, selection: DirectMatterSingleMasterDryRunSelection)",
  "const selectedDocumentKey = String(selection.selectedDocumentKey || \"\").trim()",
  "const workingDocumentDriveItemId = String(selection.workingDocumentDriveItemId || \"\").trim()",
  "const workingDocumentKey = String(selection.workingDocumentKey || \"\").trim()",
  "if (!selectedDocumentKey || !workingDocumentDriveItemId || !workingDocumentKey) return null",
  "documentKeys: [selectedDocumentKey]",
  "workingDocumentDriveItemId",
  "workingDocumentKey",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true"
]) {
  contains("matters page contains Phase 43I selected-doc bridge token " + token, page, token);
}

const bridgeStart = page.indexOf("function renderDirectMatterSingleMasterDryRunControlForRow");
const bridgeEnd = page.indexOf("function masterDocumentPreviewText", bridgeStart);
const bridgeBlock = bridgeStart >= 0 && bridgeEnd > bridgeStart ? page.slice(bridgeStart, bridgeEnd) : "";
contains("bridge block captured", bridgeBlock, "renderDirectMatterSingleMasterDryRunControlForRow");
contains("bridge block requires selected document", bridgeBlock, "if (!selectedDocumentKey || !workingDocumentDriveItemId || !workingDocumentKey) return null");
contains("bridge block uses selected document key", bridgeBlock, "documentKeys: [selectedDocumentKey]");
notContains("bridge block no longer hard-codes empty documentKeys", bridgeBlock, "documentKeys: []");
notContains("bridge block no longer hard-codes blank working drive id", bridgeBlock, 'workingDocumentDriveItemId: ""');
notContains("bridge block no longer hard-codes blank working key", bridgeBlock, 'workingDocumentKey: ""');
notContains("bridge block does not include masterLawsuitId", bridgeBlock, "masterLawsuitId");
notContains("bridge block does not hard-code confirmUpload true", bridgeBlock, "confirmUpload: true");

const attachmentStart = page.indexOf("phase43f-direct-matter-ui-surface-attachment");
const attachmentEnd = attachmentStart >= 0 ? page.indexOf("</span>", attachmentStart) : -1;
const attachmentBlock = attachmentStart >= 0 && attachmentEnd > attachmentStart ? page.slice(attachmentStart, attachmentEnd + 7) : "";
contains("attachment block captured", attachmentBlock, "phase43f-direct-matter-ui-surface-attachment");
contains("attachment block passes selected doc from UI state", attachmentBlock, "selectedDocumentKey: masterSelectedDocumentTemplateKey");
contains("attachment block passes working doc drive id from finalization state", attachmentBlock, "workingDocumentDriveItemId: masterDocumentFinalizationResult?.workingDocument?.driveItemId");
contains("attachment block passes working doc key from selected document", attachmentBlock, "workingDocumentKey: masterDocumentFinalizationResult?.selectedDocument?.key");
notContains("attachment block does not pass empty documentKeys", attachmentBlock, "documentKeys: []");

contains("package Phase 43I verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43i-require-selected-document-fields-direct-ui-dry-run-bridge-safety");
console.log("CONTRACT: Phase 43I removes placeholder document fields from guarded direct UI dry-run bridge, still disabled/no-upload.");
console.log("RESULT: Phase 43I require selected document fields direct UI dry-run bridge verifier");
if (failed) process.exit(1);
