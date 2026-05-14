import fs from "node:fs";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function read(path) {
  if (!fs.existsSync(path)) fail(`Missing required file: ${path}`);
  return fs.readFileSync(path, "utf8");
}

const helper = read("lib/referenceImport.ts");
const previewRoute = read("app/api/reference-data/import-preview/route.ts");
const confirmRoute = read("app/api/reference-data/import-confirm/route.ts");
const page = read("app/admin/reference-data/page.tsx");
const pkg = JSON.parse(read("package.json"));
const verifyProd = read("scripts/verify-prod.sh");

if (!helper.includes("buildReferenceImportPreview")) {
  fail("Shared import helper must build server-side preview.");
}

if (!helper.includes("mergeImportDetails")) {
  fail("Shared import helper must merge visible/hidden details.");
}

if (!helper.includes("_hiddenImportFields")) {
  fail("Hidden/internal import fields must be stored under _hiddenImportFields.");
}

if (!helper.includes("safetyConfirmedImport")) {
  fail("Shared import helper must define confirmed import safety.");
}

if (!helper.includes("noClioRecordsChanged: true")) {
  fail("Confirmed import safety must state no Clio records changed.");
}

if (!helper.includes("hardDeletePerformed: false")) {
  fail("Confirmed import safety must state no hard delete was performed.");
}

if (!previewRoute.includes("safetyImportPreview")) {
  fail("Preview route must use preview safety.");
}

if (previewRoute.includes("prisma.referenceEntity.create") || previewRoute.includes("prisma.referenceEntity.update")) {
  fail("Preview route must not directly write reference entities.");
}

if (!confirmRoute.includes('action: "reference-import-confirm"')) {
  fail("Confirm route must identify reference-import-confirm.");
}

if (!confirmRoute.includes("confirm: true")) {
  fail("Confirm route must require confirm: true.");
}

if (!confirmRoute.includes("buildReferenceImportPreview")) {
  fail("Confirm route must re-run preview validation server-side.");
}

if (!confirmRoute.includes("summary.invalidRows > 0")) {
  fail("Confirm route must block invalid rows.");
}

if (!confirmRoute.includes("summary.duplicateOrConflictRows > 0")) {
  fail("Confirm route must block duplicate/conflict rows.");
}

if (!confirmRoute.includes("prisma.referenceEntity.create")) {
  fail("Confirm route must support local reference entity creates.");
}

if (!confirmRoute.includes("prisma.referenceEntity.update")) {
  fail("Confirm route must support local reference entity updates.");
}

if (!confirmRoute.includes("prisma.referenceAlias.create")) {
  fail("Confirm route must support local alias creates.");
}

if (!confirmRoute.includes("createMatterAuditLogEntry")) {
  fail("Confirm route must audit confirmed imports.");
}

if (!confirmRoute.includes("safetyConfirmedImport")) {
  fail("Confirm route must use confirmed import safety.");
}

for (const forbidden of [
  "clioFetch",
  "deleteMany",
  "referenceEntity.delete",
  "referenceAlias.delete",
  "printQueue",
]) {
  if (confirmRoute.includes(forbidden)) {
    fail(`Confirm route must not include forbidden operation: ${forbidden}`);
  }
}

if (!page.includes("/api/reference-data/import-confirm")) {
  fail("Admin UI must call import-confirm route.");
}

if (!page.includes("Confirm Import to Local Reference Data")) {
  fail("Admin UI must include confirm import button.");
}

if (!page.includes("invalidRows")) {
  fail("Admin UI must consider invalid rows before confirming.");
}

if (!page.includes("duplicateOrConflictRows")) {
  fail("Admin UI must consider duplicate/conflict rows before confirming.");
}

if (!page.includes("does not") || !page.includes("Clio")) {
  fail("Admin UI must clearly state no Clio writes.");
}

if (pkg.scripts?.["verify:reference-import-confirm-safety"] !== "node scripts/verify-reference-import-confirm-safety.mjs") {
  fail("package.json must include verify:reference-import-confirm-safety script.");
}

if (!verifyProd.includes("verify:reference-import-confirm-safety")) {
  fail("verify-prod.sh must run reference import confirm safety verifier.");
}

console.log("Reference import confirm safety verifier passed.");
