const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p) => fs.existsSync(path.join(process.cwd(), p));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }

const docPath = "docs/clio-storage-refactor/phase43m-lawsuit-document-path-regression-audit.md";
for (const f of [
  docPath,
  "app/matters/page.tsx",
  "app/api/documents/finalize/route.ts",
  "app/api/documents/working-docx/route.ts",
  "app/api/documents/direct-finalize-preview/route.ts",
  "package.json",
]) {
  exists(f) ? pass("required Phase 43M file exists: " + f) : fail("missing required Phase 43M file: " + f);
}

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const finalize = read("app/api/documents/finalize/route.ts");
const working = read("app/api/documents/working-docx/route.ts");
const directPreview = read("app/api/documents/direct-finalize-preview/route.ts");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 43M",
  "Lawsuit Document Path Regression Audit",
  "static/read-only",
  "masterLawsuitId",
  "uploadTargetMode: \"master-lawsuit\"",
  "Lawsuits / YYYY-MM / YYYY.MM.NNNNN",
  "Individual Matters / BRL-YYYY00001-BRL-YYYY00999 / BRL_YYYYNNNNN",
  "no live upload is enabled",
  "no document is uploaded"
]) {
  contains("doc contains " + token, doc, token);
}

for (const token of [
  "currentMasterLawsuitIdForDocumentPreview",
  "masterDocumentWorkflowStage",
  "masterDocumentFinalizationResult",
  "launchMasterStep2GeneratedDocumentEdit",
  "launchMasterStep2PdfPreview",
  "/api/documents/working-docx",
  "/api/documents/finalize",
  "masterLawsuitId",
  'uploadTargetMode: "master-lawsuit"',
  "Finalize Document"
]) {
  contains("matters page retains lawsuit/master document UI token " + token, page, token);
}

const workingDocxIndex = page.indexOf('fetch("/api/documents/working-docx"');
const workingDocxBlock = workingDocxIndex >= 0 ? page.slice(Math.max(0, workingDocxIndex - 1200), workingDocxIndex + 1800) : "";
contains("lawsuit working-docx UI block captured", workingDocxBlock, "/api/documents/working-docx");
contains("lawsuit working-docx UI block sends masterLawsuitId", workingDocxBlock, "masterLawsuitId");
contains("lawsuit working-docx UI block sends master-lawsuit target", workingDocxBlock, 'uploadTargetMode: "master-lawsuit"');
notContains("lawsuit working-docx UI block does not send direct target", workingDocxBlock, 'uploadTargetMode: "direct-matter"');
notContains("lawsuit working-docx UI block does not send directMatterId", workingDocxBlock, "directMatterId");
notContains("lawsuit working-docx UI block does not send directMatterDisplayNumber", workingDocxBlock, "directMatterDisplayNumber");

const finalizeIndex = page.indexOf('fetch("/api/documents/finalize"');
const finalizeBlocks = [];
let start = 0;
while (true) {
  const i = page.indexOf('fetch("/api/documents/finalize"', start);
  if (i < 0) break;
  finalizeBlocks.push(page.slice(Math.max(0, i - 1400), i + 2200));
  start = i + 20;
}
if (finalizeBlocks.length > 0) pass("matters page has finalize fetch blocks");
else fail("matters page missing finalize fetch blocks");

const masterFinalizeBlock = finalizeBlocks.find((block) => block.includes("masterLawsuitId") || block.includes('uploadTargetMode: "master-lawsuit"')) || "";
contains("lawsuit finalize UI block captured", masterFinalizeBlock, "/api/documents/finalize");
contains("lawsuit finalize UI block sends masterLawsuitId", masterFinalizeBlock, "masterLawsuitId");
contains("lawsuit finalize UI block sends master-lawsuit target", masterFinalizeBlock, 'uploadTargetMode: "master-lawsuit"');
notContains("lawsuit finalize UI block does not send direct target", masterFinalizeBlock, 'uploadTargetMode: "direct-matter"');
notContains("lawsuit finalize UI block does not send direct matter id", masterFinalizeBlock, "directMatterId");
notContains("lawsuit finalize UI block does not send direct display number", masterFinalizeBlock, "directMatterDisplayNumber");

const directHelperStart = page.indexOf("type DirectMatterSingleMasterDocumentPayloadParams");
const directHelperEnd = page.indexOf("export default", directHelperStart);
const directHelperBlock = directHelperStart >= 0 && directHelperEnd > directHelperStart ? page.slice(directHelperStart, directHelperEnd) : "";
contains("direct helper block captured separately", directHelperBlock, "DirectMatterSingleMasterDocumentPayloadParams");
contains("direct helper block uses direct target", directHelperBlock, 'uploadTargetMode: "direct-matter"');
contains("direct helper block uses directMatterId", directHelperBlock, "directMatterId");
notContains("direct helper block does not include masterLawsuitId", directHelperBlock, "masterLawsuitId");

for (const token of [
  "storageTargetKind",
  "masterLawsuitId",
  "individual_matter",
  "useDirectFinalizePreview",
  'uploadTargetMode === "direct-matter"',
  "uploadTargetMode",
  "masterLawsuitId"
]) {
  contains("finalize route retains routing token " + token, finalize, token);
}

for (const token of [
  "masterLawsuitId",
  'uploadTargetMode === "direct-matter"',
  "singleMasterDirectStorage",
  "workingDocument"
]) {
  contains("working-docx route retains master/direct separation token " + token, working, token);
}

for (const token of [
  "single-master-direct-individual-storage",
  "directMatterFileNumber",
  "matterDisplayNumber",
  "singleMasterDirectStorage"
]) {
  contains("direct preview remains direct-only token " + token, directPreview, token);
}

notContains("lawsuit regression verifier does not invoke live upload smoke", JSON.stringify(pkg.scripts || {}), "smoke:phase43m-live");
contains("package Phase 43M verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43m-lawsuit-document-path-regression-audit-safety");

console.log("CONTRACT: Phase 43M is lawsuit/master document path static regression audit only; no upload path is enabled.");
console.log("RESULT: Phase 43M lawsuit document path regression audit verifier");
if (failed) process.exit(1);
