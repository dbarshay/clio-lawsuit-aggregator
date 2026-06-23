import { readFileSync } from "node:fs";
import { templateLayoutCompositionRegistrySource } from "../src/lib/templates/template-layout-composition-registry-source.mjs";
import { validateTemplateLayoutCompositionBatch } from "../src/lib/templates/layout-composition-batch-validator.mjs";

const fixture = JSON.parse(readFileSync("test/fixtures/templates/templates-phase12-real-registry-source-fixtures.json", "utf8"));
const source = readFileSync(fixture.source, "utf8");
const page = readFileSync(fixture.page, "utf8");
const api = readFileSync(fixture.api, "utf8");
const doc = readFileSync("docs/templates/templates-phase12-real-template-registry-source.md", "utf8");

function fail(message) { console.error(`\x1b[1;31mFAIL:\x1b[0m ${message}`); process.exit(1); }
function pass(message) { console.log(`\x1b[1;32mPASS:\x1b[0m ${message}`); }
function mustInclude(text, needle, label) { if (!text.includes(needle)) fail(`missing ${label}: ${needle}`); }
function mustNotInclude(text, needle, label) { if (text.includes(needle)) fail(`unexpected ${label}: ${needle}`); }

mustInclude(doc, "Templates Phase 12 - Real Template Registry Source", "Phase 12 title");
mustInclude(source, "templateLayoutCompositionRegistrySource", "registry source export");
for (const role of fixture.requiredRoles) mustInclude(source, role, `role ${role}`);
for (const templateId of fixture.requiredTemplates) mustInclude(source, templateId, `template ${templateId}`);
mustInclude(page, "templateLayoutCompositionRegistrySource", "page registry source import");
mustInclude(api, "templateLayoutCompositionRegistrySource", "api registry source import");
mustNotInclude(page, "test/fixtures", "page fixture import");
mustNotInclude(api, "test/fixtures", "api fixture path");
mustNotInclude(api, "readFile", "api request-time file read");
mustNotInclude(api, "node:fs", "api fs import");
const result = validateTemplateLayoutCompositionBatch(templateLayoutCompositionRegistrySource);
if (!result.ok) fail(`registry source should validate cleanly; errors=${result.errors.map((item) => item.code).join(",")}`);
if (result.summary.templateCount !== fixture.requiredTemplates.length) fail(`expected ${fixture.requiredTemplates.length} templates got ${result.summary.templateCount}`);
pass("Templates Phase 12 real registry source checks passed");
