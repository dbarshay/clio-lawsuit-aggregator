import fs from "node:fs";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function read(path) {
  if (!fs.existsSync(path)) fail(`Missing required file: ${path}`);
  return fs.readFileSync(path, "utf8");
}

const helperPath = "lib/referenceImport.ts";
const routePath = "app/api/reference-data/import-preview/route.ts";
const pagePath = "app/admin/reference-data/page.tsx";

const helper = read(helperPath);
const route = read(routePath);
const page = read(pagePath);
const pkg = JSON.parse(read("package.json"));
const verifyProd = read("scripts/verify-prod.sh");

if (!helper.includes("safetyImportPreview")) {
  fail("Shared import helper must define preview safety.");
}

if (!helper.includes("previewOnly: true")) {
  fail("Shared import helper must mark previewOnly true.");
}

if (!helper.includes("noDatabaseRecordsChanged: true")) {
  fail("Shared import helper must explicitly state no database records changed for preview.");
}

if (!helper.includes("confirmedImportSupported: false")) {
  fail("Shared import helper must explicitly state confirmed import is not supported by preview safety.");
}

if (!helper.includes("buildReferenceImportPreview")) {
  fail("Shared import helper must build the preview.");
}

if (!helper.includes("prisma.referenceEntity.findMany")) {
  fail("Preview helper should read existing reference entities for create/update preview classification.");
}

if (!route.includes('action: "reference-import-preview"')) {
  fail("Import preview route must identify reference-import-preview action.");
}

if (!route.includes("safetyImportPreview")) {
  fail("Import preview route must use preview safety.");
}

for (const forbidden of [
  "prisma.referenceEntity.create",
  "prisma.referenceEntity.update",
  "prisma.referenceEntity.delete",
  "prisma.referenceAlias.create",
  "prisma.referenceAlias.update",
  "prisma.referenceAlias.delete",
  "createMatterAuditLogEntry",
  "clioFetch",
]) {
  if (route.includes(forbidden)) {
    fail(`Preview-only route must not contain write/external operation: ${forbidden}`);
  }
}

if (!page.includes("CSV Import Preview")) {
  fail("Admin Reference Data page must include CSV Import Preview section.");
}

if (!page.includes("/api/reference-data/import-preview")) {
  fail("Admin Reference Data page must call import-preview API route.");
}

if (!page.includes("Preview Only")) {
  fail("Admin Reference Data page must visibly identify preview status.");
}

if (!page.includes("Store in Details but Hide/Internal")) {
  fail("Column mapping must include hidden/internal details option.");
}

if (!page.includes("Store in Details and Show")) {
  fail("Column mapping must include visible details option.");
}

if (pkg.scripts?.["verify:reference-import-preview-safety"] !== "node scripts/verify-reference-import-preview-safety.mjs") {
  fail("package.json must include verify:reference-import-preview-safety script.");
}

if (!verifyProd.includes("verify:reference-import-preview-safety")) {
  fail("verify-prod.sh must run reference import preview safety verifier.");
}

console.log("Reference import preview safety verifier passed.");
