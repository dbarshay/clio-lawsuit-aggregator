import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const registryModulePath = path.join(root, 'src/lib/templates/template-layout-composition-registry-source.mjs');
const fixturePath = path.join(root, 'test/fixtures/templates/templates-phase13-template-file-inventory-merge-field-contract-fixtures.json');
const registryModule = await import(pathToFileURL(registryModulePath).href + `?phase13=${Date.now()}`);
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pickRegistry(mod) {
  const candidates = [mod.default, ...Object.values(mod)].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && (Array.isArray(candidate.templates) || candidate.templatesById || candidate.templateRecords)) return candidate;
  }
  return null;
}

function templateList(registry) {
  if (Array.isArray(registry.templates)) return registry.templates;
  if (Array.isArray(registry.templateRecords)) return registry.templateRecords;
  if (registry.templatesById && typeof registry.templatesById === 'object') return Object.values(registry.templatesById);
  return [];
}

function templateId(template) {
  return template.id || template.templateId || template.key || template.slug;
}

function mergeFieldKeySet(definitions) {
  if (!definitions) return new Set();
  if (Array.isArray(definitions)) return new Set(definitions.map((entry) => typeof entry === 'string' ? entry : entry.id || entry.key || entry.name).filter(Boolean));
  if (typeof definitions === 'object') return new Set(Object.keys(definitions));
  return new Set();
}

function layoutAssetList(registry) {
  if (Array.isArray(registry.layoutAssets)) return registry.layoutAssets;
  if (registry.layoutAssetsById && typeof registry.layoutAssetsById === 'object') return Object.values(registry.layoutAssetsById);
  return [];
}

function assertNoUnsafeExecutableReferences() {
  const executableFiles = [
    'src/lib/templates/template-layout-composition-registry-source.mjs',
    'scripts/verify-templates-phase13-template-file-inventory-merge-field-contract.mjs',
    'scripts/verify-templates-layout-composition-validation-suite.mjs',
  ];
  const forbidden = ['generateDocument', 'uploadDocument', 'documentUpload', 'finalizeDocument', 'api/documents/finalize', 'externalDocumentStorage'];
  for (const file of executableFiles) {
    const body = fs.readFileSync(path.join(root, file), 'utf8');
    for (const token of forbidden) {
      if (body.includes(token)) fail(`${file} contains prohibited executable token: ${token}`);
    }
  }
}

const registry = pickRegistry(registryModule);
if (!registry) fail('registry source export was not found');
const templates = registry ? templateList(registry) : [];
const mergeFields = registry ? mergeFieldKeySet(registry.mergeFieldDefinitions) : new Set();
const approvedPrefixes = fixture.approvedTemplatePathPrefixes;

if (!templates.length) fail('registry has no templates');
if (!mergeFields.size) fail('registry has no mergeFieldDefinitions');

for (const template of templates) {
  const id = templateId(template);
  if (!id) { fail('template record is missing id/templateId/key/slug'); continue; }
  if (!template.templateFile || typeof template.templateFile !== 'object') { fail(`${id} missing templateFile object`); continue; }
  if (!template.templateFile.kind) fail(`${id} missing templateFile.kind`);
  if (!template.templateFile.path) fail(`${id} missing templateFile.path`);
  if (typeof template.templateFile.required !== 'boolean') fail(`${id} missing boolean templateFile.required`);
  if (template.templateFile.kind !== 'docx') fail(`${id} templateFile.kind must be docx`);
  if (path.isAbsolute(template.templateFile.path)) fail(`${id} templateFile.path must be relative`);
  if (!approvedPrefixes.some((prefix) => template.templateFile.path.startsWith(prefix))) fail(`${id} templateFile.path is outside approved in-repo roots: ${template.templateFile.path}`);
  if (!Array.isArray(template.expectedMergeFields)) fail(`${id} expectedMergeFields must be an array`);
  else {
    if (!template.expectedMergeFields.length) fail(`${id} expectedMergeFields must not be empty`);
    for (const field of template.expectedMergeFields) if (!mergeFields.has(field)) fail(`${id} expectedMergeFields references undefined merge field: ${field}`);
  }
}

for (const asset of layoutAssetList(registry)) {
  const id = asset.id || asset.key || asset.name || 'unknown-layout-asset';
  const required = asset.requiredMergeFields || [];
  if (!Array.isArray(required)) fail(`${id} requiredMergeFields must be an array when present`);
  for (const field of required) if (!mergeFields.has(field)) fail(`${id} requiredMergeFields references undefined merge field: ${field}`);
}

for (const contract of fixture.templateContracts) {
  const match = templates.find((template) => templateId(template) === contract.id);
  if (!match) { fail(`fixture contract missing from registry: ${contract.id}`); continue; }
  if (match.templateFile?.path !== contract.templateFile.path) fail(`${contract.id} registry path does not match fixture`);
  for (const field of contract.expectedMergeFields) if (!match.expectedMergeFields?.includes(field)) fail(`${contract.id} missing fixture expected merge field: ${field}`);
}

assertNoUnsafeExecutableReferences();

if (process.exitCode) process.exit(process.exitCode);
console.log('PASS: Templates Phase 13 template file inventory and merge-field contract verified');
