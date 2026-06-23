import { readFileSync } from "node:fs";
import { buildTemplateLayoutCompositionAdminReadinessPayload } from "../src/lib/templates/layout-composition-admin-readiness.mjs";

const docPath = "docs/templates/templates-phase9-layout-composition-admin-readiness-payload.md";
const sourcePath = "src/lib/templates/layout-composition-admin-readiness.mjs";
const batchFixturePath = "test/fixtures/templates/layout-composition-batch-validator-fixtures.json";
const readinessFixturePath = "test/fixtures/templates/layout-composition-admin-readiness-fixtures.json";

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
const readinessFixtures = JSON.parse(readFileSync(readinessFixturePath, "utf8"));

requireIncludes(doc, "Templates Phase 9 — Layout Composition Admin-Readiness Payload", "Phase 9 title");
requireIncludes(doc, "isolated admin-readiness payload builder", "isolated payload wording");
requireIncludes(doc, "not wired into production generation", "no production wiring guardrail");
requireIncludes(doc, "external document-storage interaction", "external storage guardrail");
requireIncludes(source, "export function buildTemplateLayoutCompositionAdminReadinessPayload", "payload builder export");
requireIncludes(source, "buildTemplateLayoutCompositionValidationReport", "Phase 6 report builder use");
requireIncludes(source, "cards", "summary cards");
requireIncludes(source, "sections", "report sections");
requireIncludes(source, "rawReport", "raw report passthrough");

const payload = buildTemplateLayoutCompositionAdminReadinessPayload({
  templates: batchFixtures.templates,
  registry: batchFixtures.registry,
});

if (payload.status !== readinessFixtures.expectedStatus) {
  fail(`expected status ${readinessFixtures.expectedStatus} got ${payload.status}`);
}

for (const expectedCard of readinessFixtures.expectedCards) {
  const actual = payload.cards.find((item) => item.id === expectedCard.id);
  if (!actual) fail(`missing expected card ${expectedCard.id}`);
  if (actual.value !== expectedCard.value) fail(`card ${expectedCard.id} expected value ${expectedCard.value} got ${actual.value}`);
  if (actual.severity !== expectedCard.severity) fail(`card ${expectedCard.id} expected severity ${expectedCard.severity} got ${actual.severity}`);
}

const sectionIds = payload.sections.map((item) => item.id);
for (const sectionId of readinessFixtures.expectedSectionIds) {
  if (!sectionIds.includes(sectionId)) fail(`missing expected section ${sectionId}`);
}

for (const templateId of readinessFixtures.expectedInvalidTemplateIds) {
  const invalidSection = payload.sections.find((item) => item.id === "invalidTemplates");
  if (!invalidSection.rows.some((item) => item.templateId === templateId)) {
    fail(`missing invalid template row ${templateId}`);
  }
}

for (const code of readinessFixtures.expectedErrorCodes) {
  const errorCodeSection = payload.sections.find((item) => item.id === "errorCodes");
  if (!errorCodeSection.rows.some((item) => item.code === code)) {
    fail(`missing error code row ${code}`);
  }
}

if (!payload.markdown.includes("# Template Layout Composition Validation Report")) {
  fail("payload markdown is missing report title");
}

if (!payload.rawReport || payload.rawReport.summary.templateCount !== 3) {
  fail("payload raw report passthrough is missing expected summary");
}

const secondPayload = buildTemplateLayoutCompositionAdminReadinessPayload({
  templates: batchFixtures.templates,
  registry: batchFixtures.registry,
});

if (JSON.stringify(payload.cards) !== JSON.stringify(secondPayload.cards)) {
  fail("payload cards must be deterministic across repeated runs");
}

if (JSON.stringify(payload.sections) !== JSON.stringify(secondPayload.sections)) {
  fail("payload sections must be deterministic across repeated runs");
}

pass("Templates Phase 9 admin-readiness payload source, fixtures, and behavior checks passed");
