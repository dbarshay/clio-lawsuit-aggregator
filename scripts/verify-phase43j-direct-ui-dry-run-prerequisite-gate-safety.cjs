const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p) => fs.existsSync(path.join(process.cwd(), p));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }

const docPath = "docs/clio-storage-refactor/phase43j-direct-ui-dry-run-prerequisite-gate-verifier.md";
for (const f of [docPath, "app/matters/page.tsx", "package.json"]) {
  exists(f) ? pass("required Phase 43J file exists: " + f) : fail("missing required Phase 43J file: " + f);
}

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 43J",
  "Direct UI Dry-Run Prerequisite Gate Verifier",
  "No app behavior is changed",
  "requires `selectedDocumentKey`",
  "requires `workingDocumentDriveItemId`",
  "requires `workingDocumentKey`",
  "returns `null` unless all three values are present",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "no live upload is enabled"
]) {
  contains("doc contains " + token, doc, token);
}

const bridgeStart = page.indexOf("function renderDirectMatterSingleMasterDryRunControlForRow");
const bridgeEnd = page.indexOf("function masterDocumentPreviewText", bridgeStart);
const bridgeBlock = bridgeStart >= 0 && bridgeEnd > bridgeStart ? page.slice(bridgeStart, bridgeEnd) : "";
contains("bridge block captured", bridgeBlock, "renderDirectMatterSingleMasterDryRunControlForRow");
contains("bridge block defines selectedDocumentKey local", bridgeBlock, "const selectedDocumentKey = String(selection.selectedDocumentKey || \"\").trim()");
contains("bridge block defines workingDocumentDriveItemId local", bridgeBlock, "const workingDocumentDriveItemId = String(selection.workingDocumentDriveItemId || \"\").trim()");
contains("bridge block defines workingDocumentKey local", bridgeBlock, "const workingDocumentKey = String(selection.workingDocumentKey || \"\").trim()");
contains("bridge block gates all prerequisites", bridgeBlock, "if (!selectedDocumentKey || !workingDocumentDriveItemId || !workingDocumentKey) return null");
contains("bridge block uses non-empty selected document key", bridgeBlock, "documentKeys: [selectedDocumentKey]");
contains("bridge block passes non-empty working doc drive id variable", bridgeBlock, "workingDocumentDriveItemId,");
contains("bridge block passes non-empty working doc key variable", bridgeBlock, "workingDocumentKey,");
contains("bridge block forces confirmUpload false", bridgeBlock, "confirmUpload: false");
contains("bridge block forces singleMasterDryRun true", bridgeBlock, "singleMasterDryRun: true");
contains("bridge block forces singleMasterResolveFolders true", bridgeBlock, "singleMasterResolveFolders: true");
notContains("bridge block does not hard-code empty documentKeys", bridgeBlock, "documentKeys: []");
notContains("bridge block does not hard-code blank workingDocumentDriveItemId", bridgeBlock, 'workingDocumentDriveItemId: ""');
notContains("bridge block does not hard-code blank workingDocumentKey", bridgeBlock, 'workingDocumentKey: ""');
notContains("bridge block does not include masterLawsuitId", bridgeBlock, "masterLawsuitId");
notContains("bridge block does not hard-code confirmUpload true", bridgeBlock, "confirmUpload: true");

const attachmentStart = page.indexOf("phase43f-direct-matter-ui-surface-attachment");
const attachmentEnd = attachmentStart >= 0 ? page.indexOf("</span>", attachmentStart) : -1;
const attachmentBlock = attachmentStart >= 0 && attachmentEnd > attachmentStart ? page.slice(attachmentStart, attachmentEnd + 7) : "";
contains("attachment block captured", attachmentBlock, "phase43f-direct-matter-ui-surface-attachment");
contains("attachment block resolves direct row", attachmentBlock, "const phase43fDirectMatterDryRunRow = directMatterSingleMasterDryRunSurfaceRow()");
contains("attachment block passes selected document key", attachmentBlock, "selectedDocumentKey: masterSelectedDocumentTemplateKey");
contains("attachment block passes working doc drive id", attachmentBlock, "workingDocumentDriveItemId: masterDocumentFinalizationResult?.workingDocument?.driveItemId || \"\"");
contains("attachment block passes working doc key", attachmentBlock, "workingDocumentKey: masterDocumentFinalizationResult?.selectedDocument?.key || masterSelectedDocumentTemplateKey");
notContains("attachment block does not pass masterLawsuitId", attachmentBlock, "masterLawsuitId");
notContains("attachment block does not force confirmUpload true", attachmentBlock, "confirmUpload: true");

const controlStart = page.indexOf("const directMatterSingleMasterDryRunControlEnabled = false");
const controlEnd = page.indexOf("function directMatterSingleMasterDryRunSurfaceRow", controlStart);
const controlBlock = controlStart >= 0 && controlEnd > controlStart ? page.slice(controlStart, controlEnd) : "";
contains("control block remains guarded off", controlBlock, "directMatterSingleMasterDryRunControlEnabled = false");
contains("control block still calls dry-run handler", controlBlock, "handleDirectMatterSingleMasterDryRunControl");
contains("control block still returns null when guard off", controlBlock, "if (!directMatterSingleMasterDryRunControlEnabled) return null");
notContains("control block does not enable guard", controlBlock, "directMatterSingleMasterDryRunControlEnabled = true");

contains("package Phase 43J verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43j-direct-ui-dry-run-prerequisite-gate-safety");
console.log("CONTRACT: Phase 43J statically proves selected-document/working-DOCX prerequisites gate the direct UI dry-run control.");
console.log("RESULT: Phase 43J direct UI dry-run prerequisite gate verifier");
if (failed) process.exit(1);
