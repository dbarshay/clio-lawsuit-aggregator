import fs from "node:fs";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function read(path) {
  if (!fs.existsSync(path)) fail(`Missing required file: ${path}`);
  return fs.readFileSync(path, "utf8");
}

const route = read("app/api/reference-data/import-cleanup-preview/route.ts");
const page = read("app/admin/reference-data/page.tsx");
const pkg = JSON.parse(read("package.json"));
const verifyProd = read("scripts/verify-prod.sh");

if (!route.includes('action: "reference-import-cleanup-preview"')) {
  fail("Cleanup preview route must identify reference-import-cleanup-preview.");
}

if (!route.includes("previewOnly: true")) {
  fail("Cleanup preview route must mark previewOnly true.");
}

if (!route.includes("noDatabaseRecordsChanged: true")) {
  fail("Cleanup preview route must state no database records changed.");
}

if (!route.includes("noClioRecordsChanged: true")) {
  fail("Cleanup preview route must state no Clio records changed.");
}

if (!route.includes("hardDeletePerformed: false")) {
  fail("Cleanup preview route must state no hard delete was performed.");
}

if (!route.includes("deactivateOnly: true")) {
  fail("Cleanup preview route must be deactivate-only.");
}

if (!route.includes('source: "barsh-matters-import"')) {
  fail("Cleanup preview route must limit candidates to barsh-matters-import source.");
}

if (!route.includes("prisma.referenceEntity.findMany")) {
  fail("Cleanup preview route must read reference entities.");
}

for (const forbidden of [
  ".create(",
  ".update(",
  ".delete(",
  "deleteMany",
  "createMatterAuditLogEntry",
  "clioFetch",
]) {
  if (route.includes(forbidden)) {
    fail(`Cleanup preview route must not include write/external operation: ${forbidden}`);
  }
}

if (!page.includes("Import Cleanup Preview")) {
  fail("Admin page must include Import Cleanup Preview panel.");
}

if (!page.includes("/api/reference-data/import-cleanup-preview")) {
  fail("Admin page must call import-cleanup-preview route.");
}

if (!page.includes("Preview Cleanup")) {
  fail("Admin page must include Preview Cleanup button.");
}

if (!page.includes("deactivate-only")) {
  fail("Cleanup preview copy must state deactivate-only behavior.");
}

if (!page.includes("does not hard-delete records")) {
  fail("Cleanup preview copy must state no hard delete.");
}

if (pkg.scripts?.["verify:reference-import-cleanup-preview-safety"] !== "node scripts/verify-reference-import-cleanup-preview-safety.mjs") {
  fail("package.json must include verify:reference-import-cleanup-preview-safety script.");
}

if (!verifyProd.includes("verify:reference-import-cleanup-preview-safety")) {
  fail("verify-prod.sh must run reference import cleanup preview safety verifier.");
}

console.log("Reference import cleanup preview safety verifier passed.");
