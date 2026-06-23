import { readFileSync } from "node:fs";
import { buildTemplateLayoutCompositionValidationReport } from "../src/lib/templates/layout-composition-validation-report.mjs";

const docPath = "docs/templates/templates-phase6-layout-composition-validation-report-builder.md";
const sourcePath = "src/lib/templates/layout-composition-validation-report.mjs";
const batchFixturePath = "test/fixtures/templates/layout-composition-batch-validator-fixtures.json";
const reportFixturePath = "test/fixtures/templates/layout-composition-validation-report-fixtures.json";

function fail(message) {
  console.error(`\x1b[1;31mFAIL:\x1b[0m ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`\x1b[1;32mPASS:\x1b[0m ${message}`);
}

function requireIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) fail(`missing ${label}: ${needle}`);
}

const doc = readFileSync(docPath, "utf8");
const source = readFileSync(sourcePath, "utf8");
const batchFixtures = JSON.parse(readFileSync(batchFixturePath, "utf8"));
const reportFixtures = JSON.parse(readFileSync(reportFixturePath, "utf8"));

requireIncludes(doc, "Templates Phase 6 — Layout Composition Validation Report Builder", "Phase 6 title");
requireIncludes(doc, "pure validation report builder", "pure report wording");
requireIncludes(doc, "not wired into production generation", "no production wiring guardrail");
requireIncludes(doc, "external document-storage interaction", "external storage guardrail");
requireIncludes(source, "export function buildTemplateLayoutCompositionValidationReport", "report builder export");
requireIncludes(source, "validateTemplateLayoutCompositionBatch", "Phase 5 batch validator use");
requireIncludes(source, "errorSummaryByCode", "error summary grouping");
requireIncludes(source, "warningSummaryByCode", "warning summary grouping");
requireIncludes(source, "markdown", "markdown report output");

const report = buildTemplateLayoutCompositionValidationReport({
  templates: batchFixtures.templates,
  registry: batchFixtures.registry,
});

if (report.ok !== false) {
  fail(`expected report ok=false got ${report.ok}`);
}

for (const code of reportFixtures.expectedErrorSummaryCodes) {
  if (!report.errorSummaryByCode.some((item) => item.code === code && item.count >= 1)) {
    fail(`missing expected error summary code ${code}`);
  }
}

for (const code of reportFixtures.expectedWarningSummaryCodes) {
  if (!report.warningSummaryByCode.some((item) => item.code === code && item.count >= 1)) {
    fail(`missing expected warning summary code ${code}`);
  }
}

for (const templateId of reportFixtures.expectedInvalidTemplateIds) {
  if (!report.invalidTemplates.some((item) => item.templateId === templateId)) {
    fail(`missing expected invalid template ${templateId}`);
  }
}

for (const needle of reportFixtures.expectedMarkdownIncludes) {
  requireIncludes(report.markdown, needle, "expected markdown output");
}

const secondReport = buildTemplateLayoutCompositionValidationReport({
  templates: batchFixtures.templates,
  registry: batchFixtures.registry,
});

if (report.markdown !== secondReport.markdown) {
  fail("report markdown must be deterministic across repeated runs");
}

pass("Templates Phase 6 validation report builder source, fixtures, and behavior checks passed");
