import fs from "node:fs";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function read(path) {
  if (!fs.existsSync(path)) fail(`Missing required file: ${path}`);
  return fs.readFileSync(path, "utf8");
}

const route = read("app/api/reference-data/import-history/route.ts");
const page = read("app/admin/reference-data/page.tsx");
const pkg = JSON.parse(read("package.json"));
const verifyProd = read("scripts/verify-prod.sh");

if (!route.includes('action: "reference-import-history"')) {
  fail("Import history route must identify reference-import-history.");
}

if (!route.includes("readOnly: true")) {
  fail("Import history route must mark itself read-only.");
}

if (!route.includes("noDatabaseRecordsChanged: true")) {
  fail("Import history route must state no database records changed.");
}

if (!route.includes("noClioRecordsChanged: true")) {
  fail("Import history route must state no Clio records changed.");
}

if (!route.includes("prisma.auditLog.findMany")) {
  fail("Import history route must read AuditLog.");
}

if (!route.includes("reference_data_csv_import_confirmed")) {
  fail("Import history route must filter confirmed CSV import audit entries.");
}

for (const forbidden of [
  ".create(",
  ".update(",
  ".delete(",
  "clioFetch",
  "createMatterAuditLogEntry",
]) {
  if (route.includes(forbidden)) {
    fail(`Import history route must not include write/external operation: ${forbidden}`);
  }
}

if (!page.includes("Reference Import History")) {
  fail("Admin page must include Reference Import History panel.");
}

if (!page.includes("/api/reference-data/import-history")) {
  fail("Admin page must call import-history route.");
}

if (!page.includes("Refresh History")) {
  fail("Admin page must include Refresh History button.");
}

if (!page.includes("does not modify local records or Clio")) {
  fail("History panel must state it is read-only and does not modify local records or Clio.");
}

if (pkg.scripts?.["verify:reference-import-history-safety"] !== "node scripts/verify-reference-import-history-safety.mjs") {
  fail("package.json must include verify:reference-import-history-safety script.");
}

if (!verifyProd.includes("verify:reference-import-history-safety")) {
  fail("verify-prod.sh must run reference import history safety verifier.");
}

console.log("Reference import history safety verifier passed.");
