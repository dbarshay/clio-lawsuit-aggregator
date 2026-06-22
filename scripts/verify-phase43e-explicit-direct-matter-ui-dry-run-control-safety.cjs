const fs = require("fs");
const path = require("path");

let failed = false;
function pass(message) {
  console.log(`PASS: ${message}`);
}
function fail(message) {
  failed = true;
  console.error(`FAIL: ${message}`);
}
function requiredFile(file) {
  if (fs.existsSync(path.join(process.cwd(), file))) pass(`required Phase 43E file exists: ${file}`);
  else fail(`required Phase 43E file missing: ${file}`);
}
function contains(label, source, token) {
  if (source.includes(token)) pass(label);
  else fail(`${label} missing token: ${token}`);
}
function notContains(label, source, token) {
  if (!source.includes(token)) pass(label);
  else fail(`${label} contains forbidden token: ${token}`);
}
function functionBlock(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) return "";
  const brace = source.indexOf("{", start);
  if (brace < 0) return "";
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return "";
}

const docPath = "docs/clio-storage-refactor/phase43e-explicit-direct-matter-ui-dry-run-control-smoke.md";
const pagePath = "app/matters/page.tsx";
const smokePath = "scripts/smoke-phase43e-explicit-direct-matter-ui-dry-run-control.cjs";
const pkgPath = "package.json";

for (const file of [docPath, pagePath, smokePath, pkgPath]) requiredFile(file);

const doc = fs.readFileSync(path.join(process.cwd(), docPath), "utf8");
const page = fs.readFileSync(path.join(process.cwd(), pagePath), "utf8");
const smoke = fs.readFileSync(path.join(process.cwd(), smokePath), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), pkgPath), "utf8"));

for (const token of [
  "Phase 43E",
  "Explicit Direct Matter UI Dry-Run Control Smoke",
  "guarded off by default",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "does not include `masterLawsuitId`",
  "static/no-server/no-upload",
]) {
  contains(`doc contains ${token}`, doc, token);
}

for (const token of [
  "directMatterSingleMasterDryRunControlEnabled = false",
  "handleDirectMatterSingleMasterDryRunControl",
  "renderDirectMatterSingleMasterDryRunControl",
  "data-phase43e-direct-matter-dry-run-control",
  "Direct Matter Clio Dry Run",
  "runDirectMatterSingleMasterFinalizeDryRunFromUi",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
]) {
  contains(`matters page contains Phase 43E control token ${token}`, page, token);
}

const controlBlock = functionBlock(page, "renderDirectMatterSingleMasterDryRunControl");
if (!controlBlock) fail("control block captured");
else pass("control block captured");

contains("control block is guarded off by default", controlBlock, "directMatterSingleMasterDryRunControlEnabled");
contains("control block calls dry-run handler", controlBlock, "handleDirectMatterSingleMasterDryRunControl");
notContains("control block does not include masterLawsuitId", controlBlock, "masterLawsuitId");
notContains("control block does not call working-docx", controlBlock, "/api/documents/working-docx");
notContains("control block does not call Clio upload helper", controlBlock, "uploadBufferToClioMatterDocuments");
notContains("control block does not hard-code confirmUpload true", controlBlock, "confirmUpload: true");

const dryRunHandlerBlock = functionBlock(page, "handleDirectMatterSingleMasterDryRunControl");
if (!dryRunHandlerBlock) fail("dry-run handler block captured");
else pass("dry-run handler block captured");
contains("dry-run handler forces confirmUpload false", dryRunHandlerBlock, "confirmUpload: false");
contains("dry-run handler forces singleMasterDryRun true", dryRunHandlerBlock, "singleMasterDryRun: true");
contains("dry-run handler forces folder resolution true", dryRunHandlerBlock, "singleMasterResolveFolders: true");
notContains("dry-run handler does not include masterLawsuitId", dryRunHandlerBlock, "masterLawsuitId");
notContains("dry-run handler does not hard-code confirmUpload true", dryRunHandlerBlock, "confirmUpload: true");

for (const token of [
  "runDirectMatterSingleMasterFinalizeDryRunFromUi",
  "buildDirectMatterSingleMasterFinalizeDryRunPayload(params)",
  "fetch(\"/api/documents/finalize\"",
  "uiOriginatedDirectMatterDryRun: true",
]) {
  contains(`Phase 43D handler retained ${token}`, page, token);
}

for (const token of [
  "static/no-server/no-upload",
  "directMatterSingleMasterDryRunControlEnabled = false",
  "handleDirectMatterSingleMasterDryRunControl",
  "renderDirectMatterSingleMasterDryRunControl",
  "confirmUpload: false",
  "singleMasterDryRun: true",
]) {
  contains(`smoke contains ${token}`, smoke, token);
}

contains("package Phase 43E verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43e-explicit-direct-matter-ui-dry-run-control-safety");
contains("package Phase 43E smoke registered", JSON.stringify(pkg.scripts || {}), "smoke:phase43e-explicit-direct-matter-ui-dry-run-control");

console.log("CONTRACT: Phase 43E adds a guarded explicit UI dry-run control path only; no upload path is enabled.");
console.log("RESULT: Phase 43E explicit direct matter UI dry-run control safety verifier");
if (failed) process.exit(1);
