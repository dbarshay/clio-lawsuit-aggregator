import fs from "node:fs";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function read(path) {
  if (!fs.existsSync(path)) fail(`Missing required file: ${path}`);
  return fs.readFileSync(path, "utf8");
}

const route = read("app/api/reference-data/import-cleanup-confirm/route.ts");
const page = read("app/admin/reference-data/page.tsx");
const pkg = JSON.parse(read("package.json"));
const verifyProd = read("scripts/verify-prod.sh");

if (!route.includes('action: "reference-import-cleanup-confirm"')) {
  fail("Cleanup confirm route must identify reference-import-cleanup-confirm.");
}

if (!route.includes("confirm: true")) {
  fail("Cleanup confirm route must require confirm: true.");
}

if (!route.includes('source: "barsh-matters-import"')) {
  fail("Cleanup confirm route must limit candidates to barsh-matters-import source.");
}

if (!route.includes("active: true")) {
  fail("Cleanup confirm route must limit candidates to active records.");
}

if (!route.includes("data: { active: false }")) {
  fail("Cleanup confirm route must only deactivate records.");
}

if (!route.includes("hardDeletePerformed: false")) {
  fail("Cleanup confirm route must state no hard delete was performed.");
}

if (!route.includes("aliasesDeleted: false")) {
  fail("Cleanup confirm route must state aliases were not deleted.");
}

if (!route.includes("noClioRecordsChanged: true")) {
  fail("Cleanup confirm route must state no Clio records changed.");
}

if (!route.includes("createMatterAuditLogEntry")) {
  fail("Cleanup confirm route must audit confirmed cleanup.");
}

for (const forbidden of [
  ".delete(",
  "deleteMany",
  "referenceAlias.update",
  "referenceAlias.delete",
  "clioFetch",
]) {
  if (route.includes(forbidden)) {
    fail(`Cleanup confirm route must not include forbidden operation: ${forbidden}`);
  }
}

if (!page.includes("/api/reference-data/import-cleanup-confirm")) {
  fail("Admin page must call cleanup confirm route.");
}

if (!page.includes("Confirm Deactivate Cleanup")) {
  fail("Admin page must include Confirm Deactivate Cleanup button.");
}

if (!page.includes("Type DEACTIVATE to enable cleanup")) {
  fail("Admin page must require typed DEACTIVATE confirmation before cleanup.");
}

if (!page.includes('cleanupConfirmText.trim() !== "DEACTIVATE"')) {
  fail("Confirm cleanup button must be disabled unless DEACTIVATE is typed.");
}

if (!page.includes('Type DEACTIVATE before confirming deactivate cleanup.')) {
  fail("Confirm cleanup handler must validate typed DEACTIVATE.");
}

if (!page.includes("No records were hard-deleted")) {
  fail("Admin page must state cleanup does not hard-delete records.");
}

if (!page.includes("no aliases were deleted")) {
  fail("Admin page must state cleanup does not delete aliases.");
}

if (pkg.scripts?.["verify:reference-import-cleanup-confirm-safety"] !== "node scripts/verify-reference-import-cleanup-confirm-safety.mjs") {
  fail("package.json must include verify:reference-import-cleanup-confirm-safety script.");
}

if (!verifyProd.includes("verify:reference-import-cleanup-confirm-safety")) {
  fail("verify-prod.sh must run reference import cleanup confirm safety verifier.");
}

console.log("Reference import cleanup confirm safety verifier passed.");
