import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initialBillingLetterMergeCodeReadinessContract as contract } from "../src/lib/templates/template-layout-composition-registry-source.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "test/fixtures/templates/templates-phase18a-initial-billing-letter-merge-code-readiness-fixtures.json"), "utf8"));
const doc = fs.readFileSync(path.join(root, "docs/templates/templates-phase18a-initial-billing-letter-merge-code-readiness.md"), "utf8");
function fail(message) { throw new Error(message); }
function same(a, b, label) { if (JSON.stringify(a) === JSON.stringify(b)) return; fail(label + " mismatch"); }
function eq(a, b, label) { if (a === b) return; fail(label + " mismatch"); }
function has(text, value, label) { if (text.includes(value)) return; fail(label + " missing " + value); }
eq(fixture.templateId, "initial-billing-letter", "template id");
eq(fixture.templateName, "Initial Billing Letter", "template name");
eq(fixture.documentKind, "letter", "document kind");
eq(fixture.layoutDependency, "letterhead-simple", "layout dependency");
eq(fixture.matterScope, "individual", "matter scope");
eq(fixture.testMatterFileNumber, "BRL_202600003", "test matter");
eq(fixture.generationWired, false, "generation flag");
eq(fixture.clioCallsAllowed, false, "Clio flag");
eq(fixture.storageCallsAllowed, false, "storage flag");
eq(fixture.docxImportAllowedInThisPhase, false, "DOCX import flag");
same(contract.legacyTokenInventory, fixture.legacyTokenInventory, "registry legacy tokens");
same(contract.requiredStandardTokens, fixture.requiredStandardTokens, "registry standard tokens");
eq(contract.matterScope, "individual", "registry matter scope");
eq(contract.testMatterFileNumber, "BRL_202600003", "registry test matter");
const mappedLegacy = new Set();
const mappedStandard = new Set();
for (const mapping of fixture.replacementMappings) {
  for (const token of mapping.legacy) mappedLegacy.add(token);
  for (const token of mapping.standard) mappedStandard.add(token);
}
for (const token of fixture.legacyTokenInventory) {
  if (mappedLegacy.has(token) === false) fail("unmapped legacy token " + token);
  has(doc, token, "doc legacy coverage");
}
for (const token of fixture.requiredStandardTokens) {
  if (mappedStandard.has(token) === false) fail("unmapped standard token " + token);
  has(doc, token, "doc standard coverage");
}
has(doc, "individual Barsh Matters only", "doc scope");
has(doc, "BRL_202600003", "doc test matter");
has(doc, "no generation wiring", "doc non-goal");
has(doc, "no Clio or storage calls", "doc non-goal");
console.log("PASS: Templates Phase 18A Initial Billing Letter merge-code readiness verified");
