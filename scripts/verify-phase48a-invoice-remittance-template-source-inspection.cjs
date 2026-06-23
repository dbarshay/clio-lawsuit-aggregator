const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8");
const contains = (label, text, token) => text.includes(token) ? pass(label) : fail(`${label} missing token: ${token}`);
const notContains = (label, text, token) => !text.includes(token) ? pass(label) : fail(`${label} contains forbidden token: ${token}`);

const mdPath = "docs/template-generation-refactor/phase48a-invoice-remittance-template-source-inspection.md";
const jsonPath = "docs/template-generation-refactor/phase48a-invoice-remittance-template-source-inspection.json";
const inspectPath = "scripts/inspect-phase48a-invoice-remittance-template-source.cjs";
const pkgPath = "package.json";

for (const p of [mdPath, jsonPath, inspectPath, pkgPath]) exists(p) ? pass(`required file exists: ${p}`) : fail(`missing required file: ${p}`);

const md = exists(mdPath) ? read(mdPath) : "";
const json = exists(jsonPath) ? JSON.parse(read(jsonPath)) : {};
const inspect = exists(inspectPath) ? read(inspectPath) : "";
const pkg = exists(pkgPath) ? JSON.parse(read(pkgPath)) : { scripts: {} };


for (const token of [
  "Invoices and remittance documents will not be generated through the normal document template workflow",
  "app-generated/code-rendered from the invoice/remittance workflow data",
  "DOCX-based non-generation reference assets",
  "should not appear in Generate Documents",
  "should not be treated as selectable generation templates",
]) contains(`doc contains invoice rule ${token}`, md, token);

for (const token of [
  "Invoice/remittance templates are not currently stored as DOCX templates",
  "app-generated/code-rendered workflow output",
  "Barsh Matters template repository",
  "provider-invoice-summary",
  "provider-remittance-statement",
  "attorney-fee-report",
  "read-only inspection",
]) contains(`doc contains ${token}`, md, token);

Array.isArray(json.repositoryTemplateKeys) ? pass("inspection JSON has repositoryTemplateKeys") : fail("inspection JSON missing repositoryTemplateKeys");
json.repositoryTemplateKeys?.includes("lawsuit-stipulation-of-settlement") ? pass("inspection JSON sees stipulation template") : fail("inspection JSON missing stipulation template");
json.repositoryTemplateKeys?.includes("letterhead-simple") ? pass("inspection JSON sees letterhead asset") : fail("inspection JSON missing letterhead asset");
json.invoiceRemittanceDocxTemplatesCurrentlyImported === 0 ? pass("inspection JSON confirms no invoice/remittance DOCX templates imported") : fail("invoice/remittance DOCX template count not zero");
json.safety?.readOnlyInspection === true ? pass("inspection JSON read-only safety true") : fail("inspection JSON read-only safety missing");
json.safety?.noDatabaseMutation === true ? pass("inspection JSON no DB mutation true") : fail("inspection JSON no DB mutation missing");

contains("inspection script queries DocumentTemplate", inspect, "documentTemplate.findMany");
contains("inspection script writes inspection JSON", inspect, "phase48a-invoice-remittance-template-source-inspection.json");

for (const token of ["documentTemplate.create(", "documentTemplate.update(", "documentTemplate.delete", "uploadBufferToClioMatterDocuments(", "CONFIRM_LIVE_TERMINAL_FINALIZE=YES", "confirmUpload: true", "documentPrintQueueItem.create(", "sendMail"]) {
  notContains(`inspection/doc no write/finalization marker ${token}`, md + "\n" + inspect, token);
}

if (pkg.scripts?.["inspect:phase48a-invoice-remittance-template-source"] === "node scripts/inspect-phase48a-invoice-remittance-template-source.cjs") pass("package inspection script registered"); else fail("package inspection script missing");
if (pkg.scripts?.["verify:phase48a-invoice-remittance-template-source-inspection"] === "node scripts/verify-phase48a-invoice-remittance-template-source-inspection.cjs") pass("package verifier script registered"); else fail("package verifier script missing");

if (failed) {
  console.error("FAIL: Phase 48A invoice/remittance template source inspection verifier failed");
  process.exit(1);
}
console.log("PASS: Phase 48A invoice/remittance template source inspection verifier passed");
