import { readFileSync } from "node:fs";
import { validateTemplateLayoutCompositionBatch } from "../src/lib/templates/layout-composition-batch-validator.mjs";

const docPath = "docs/templates/templates-phase5-layout-composition-batch-validator.md";
const sourcePath = "src/lib/templates/layout-composition-batch-validator.mjs";
const fixturePath = "test/fixtures/templates/layout-composition-batch-validator-fixtures.json";

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
const fixtures = JSON.parse(readFileSync(fixturePath, "utf8"));

requireIncludes(doc, "Templates Phase 5 — Layout Composition Batch Validator", "Phase 5 title");
requireIncludes(doc, "pure batch validator", "pure batch wording");
requireIncludes(doc, "not wired into production generation", "no production wiring guardrail");
requireIncludes(doc, "external document-storage interaction", "external storage guardrail");
requireIncludes(source, "export function validateTemplateLayoutCompositionBatch", "batch validator export");
requireIncludes(source, "validateTemplateLayoutComposition", "Phase 4 validator use");
requireIncludes(source, "templateResults", "per-template results");
requireIncludes(source, "invalidTemplateCount", "summary invalid count");
requireIncludes(source, "warningCount", "summary warning count");

const result = validateTemplateLayoutCompositionBatch({
  templates: fixtures.templates,
  registry: fixtures.registry,
});

for (const [key, expected] of Object.entries(fixtures.expectedSummary)) {
  if (result.summary[key] !== expected) {
    fail(`summary ${key}: expected ${expected} got ${result.summary[key]}`);
  }
}

if (result.ok !== false) {
  fail(`expected batch ok=false got ${result.ok}`);
}

for (const code of fixtures.expectedErrorCodes) {
  if (!result.errors.some((item) => item.code === code)) {
    fail(`missing expected batch error code ${code}; got ${result.errors.map((item) => item.code).join(",")}`);
  }
}

for (const code of fixtures.expectedWarningCodes) {
  if (!result.warnings.some((item) => item.code === code)) {
    fail(`missing expected batch warning code ${code}; got ${result.warnings.map((item) => item.code).join(",")}`);
  }
}

if (!result.templateResults.some((item) => item.templateId === "tpl-valid-three" && item.ok === true)) {
  fail("missing valid per-template result for tpl-valid-three");
}

if (!result.errors.every((item) => item.templateId && item.templateName)) {
  fail("flattened errors must include template identity");
}

pass("Templates Phase 5 batch validator source, fixtures, and behavior checks passed");
