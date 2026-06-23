import { readFileSync } from "node:fs";

const docPath = "docs/templates/templates-phase10-admin-exposure-readiness-plan.md";
const fixturePath = "test/fixtures/templates/templates-phase10-admin-exposure-readiness-fixtures.json";

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
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

requireIncludes(doc, "Templates Phase 10 - Combined Admin Exposure Readiness Plan", "Phase 10 title");
requireIncludes(doc, "Combined design and readiness lock", "combined readiness status");
requireIncludes(doc, "does not create routes, pages, API handlers", "no route creation guardrail");
requireIncludes(doc, "production UI", "no UI implementation guardrail");
requireIncludes(doc, "external document-storage interaction", "external storage guardrail");
requireIncludes(doc, fixture.requiredRoutePlan, "planned admin route");
requireIncludes(doc, fixture.requiredApiPlan, "planned admin API route");
requireIncludes(doc, fixture.requiredPermission, "planned permission key");
requireIncludes(doc, fixture.requiredSuiteScript, "suite script reference");

for (const item of fixture.combinedPlanningItems) {
  requireIncludes(doc, item, `combined planning item ${item}`);
}

for (const guardrail of fixture.requiredGuardrails) {
  requireIncludes(doc, guardrail, `required guardrail ${guardrail}`);
}

if (!packageJson.scripts?.[fixture.requiredSuiteScript]) {
  fail(`package.json missing ${fixture.requiredSuiteScript}`);
}

if (!packageJson.scripts[fixture.requiredSuiteScript].includes("verify-templates-layout-composition-validation-suite.mjs")) {
  fail(`${fixture.requiredSuiteScript} does not run the validation suite`);
}

pass("Templates Phase 10 combined admin exposure readiness plan checks passed");
