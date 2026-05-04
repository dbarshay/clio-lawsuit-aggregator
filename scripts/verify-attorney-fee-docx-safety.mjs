#!/usr/bin/env node
import fs from "fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function mustContain(label, text, needle) {
  if (!text.includes(needle)) {
    fail(`${label}: missing ${needle}`);
    return;
  }
  pass(`${label}: found ${needle}`);
}

function mustNotContain(label, text, needle) {
  if (text.includes(needle)) {
    fail(`${label}: must not contain ${needle}`);
    return;
  }
  pass(`${label}: does not contain ${needle}`);
}

console.log("=== VERIFY ATTORNEY FEE BREAKDOWN DOCX ROUTE SAFETY ===");

const route = read("app/api/settlements/attorney-fee-breakdown/route.ts");
const previewRoute = read("app/api/settlements/documents-preview/route.ts");
const packageJson = read("package.json");
const verifyProd = read("scripts/verify-prod.sh");

console.log("");
console.log("=== VERIFY ROUTE-ONLY DOCX GENERATION ===");
mustContain("attorney fee route", route, 'action: "attorney-fee-breakdown-docx"');
mustContain("attorney fee route", route, "generatedDocxResponseOnly: true");
mustContain("attorney fee route", route, "routeOnly: true");
mustContain("attorney fee route", route, "Packer.toBuffer(doc)");
mustContain(
  "attorney fee route",
  route,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
);
mustContain("attorney fee route", route, "Content-Disposition");
mustContain("attorney fee route", route, 'if (base.toLowerCase().endsWith(".docx")) return base;');
mustContain("attorney fee route", route, 'return `${base}.docx`;');
mustContain("attorney fee route", route, "/api/settlements/documents-preview");
mustContain("attorney fee route", route, 'method: "GET"');
mustContain("attorney fee route", route, 'cache: "no-store"');

console.log("");
console.log("=== VERIFY NO CLIO / DATABASE / FILE / PRINT QUEUE MUTATION ===");
mustContain("attorney fee route", route, "noClioRecordsChanged: true");
mustContain("attorney fee route", route, "noDatabaseRecordsChanged: true");
mustContain("attorney fee route", route, "noDocumentUploadPerformed: true");
mustContain("attorney fee route", route, "noPrintQueueRecordsChanged: true");
mustContain("attorney fee route", route, "noPersistentFilesCreated: true");
mustNotContain("attorney fee route", route, "clioFetch(");
mustNotContain("attorney fee route", route, "uploadBufferToClioMatterDocuments");
mustNotContain("attorney fee route", route, "listClioMatterDocuments");
mustNotContain("attorney fee route", route, "prisma.");
mustNotContain("attorney fee route", route, ".create(");
mustNotContain("attorney fee route", route, ".update(");
mustNotContain("attorney fee route", route, ".delete(");
mustNotContain("attorney fee route", route, "writeFile");
mustNotContain("attorney fee route", route, "appendFile");
mustNotContain("attorney fee route", route, "mkdir(");
mustNotContain("attorney fee route", route, "printQueue");
mustNotContain("attorney fee route", route, 'method: "PATCH"');
mustNotContain("attorney fee route", route, 'method: "POST"');
mustNotContain("attorney fee route", route, 'method: "DELETE"');

console.log("");
console.log("=== VERIFY PREVIEW ROUTE ADVERTISES ATTORNEY FEE AS AVAILABLE ===");
mustContain("settlement documents preview route", previewRoute, 'key: "attorney-fee-breakdown"');
mustContain("settlement documents preview route", previewRoute, 'label: "Attorney Fee Breakdown"');
mustContain("settlement documents preview route", previewRoute, 'generationEndpoint: "/api/settlements/attorney-fee-breakdown"');
mustContain("settlement documents preview route", previewRoute, "availableNow: true");
mustContain("settlement documents preview route", previewRoute, "routeOnly: true");
mustContain("settlement documents preview route", previewRoute, "noUploadToClio: true");
mustContain("settlement documents preview route", previewRoute, "noDatabaseRecordCreated: true");
mustContain("settlement documents preview route", previewRoute, "noPrintQueueRecordCreated: true");

console.log("");
console.log("=== VERIFY SCRIPT REGISTRATION ===");
mustContain("package.json", packageJson, "verify:attorney-fee-docx-safety");
mustContain("verify-prod.sh", verifyProd, "verify:attorney-fee-docx-safety");

if (process.exitCode) {
  console.error("");
  console.error("=== ATTORNEY FEE BREAKDOWN DOCX SAFETY VERIFICATION FAILED ===");
  process.exit(process.exitCode);
}

console.log("");
console.log("=== ATTORNEY FEE BREAKDOWN DOCX SAFETY VERIFICATION PASSED ===");
console.log("No Clio records were changed by this verifier.");
console.log("No database writes were made by this verifier.");
console.log("No documents were uploaded or persistently saved by this verifier.");
console.log("No print queue records were changed by this verifier.");
