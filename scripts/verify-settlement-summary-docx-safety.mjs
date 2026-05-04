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

console.log("=== VERIFY SETTLEMENT SUMMARY DOCX ROUTE SAFETY ===");

const route = read("app/api/settlements/settlement-summary/route.ts");
const previewRoute = read("app/api/settlements/documents-preview/route.ts");
const packageJson = read("package.json");
const verifyProd = read("scripts/verify-prod.sh");

console.log();
console.log("=== VERIFY ROUTE-ONLY DOCX GENERATION ===");
mustContain("settlement summary route", route, 'action: "settlement-summary-docx"');
mustContain("settlement summary route", route, "generatedDocxResponseOnly: true");
mustContain("settlement summary route", route, "routeOnly: true");
mustContain("settlement summary route", route, "Packer.toBuffer(doc)");
mustContain(
  "settlement summary route",
  route,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
);
mustContain("settlement summary route", route, "Content-Disposition");
mustContain("settlement summary route", route, 'if (base.toLowerCase().endsWith(".docx")) return base;');
mustContain("settlement summary route", route, 'return `${base}.docx`;');
mustContain("settlement summary route", route, "/api/settlements/documents-preview");
mustContain("settlement summary route", route, 'method: "GET"');
mustContain("settlement summary route", route, 'cache: "no-store"');

console.log();
console.log("=== VERIFY NO CLIO / DATABASE / FILE / PRINT QUEUE MUTATION ===");
mustContain("settlement summary route", route, "noClioRecordsChanged: true");
mustContain("settlement summary route", route, "noDatabaseRecordsChanged: true");
mustContain("settlement summary route", route, "noDocumentUploadPerformed: true");
mustContain("settlement summary route", route, "noPrintQueueRecordsChanged: true");
mustContain("settlement summary route", route, "noPersistentFilesCreated: true");
mustNotContain("settlement summary route", route, "clioFetch(");
mustNotContain("settlement summary route", route, "uploadBufferToClioMatterDocuments");
mustNotContain("settlement summary route", route, "listClioMatterDocuments");
mustNotContain("settlement summary route", route, "prisma.");
mustNotContain("settlement summary route", route, ".create(");
mustNotContain("settlement summary route", route, ".update(");
mustNotContain("settlement summary route", route, ".delete(");
mustNotContain("settlement summary route", route, "writeFile");
mustNotContain("settlement summary route", route, "appendFile");
mustNotContain("settlement summary route", route, "mkdir(");
mustNotContain("settlement summary route", route, "printQueue");
mustNotContain("settlement summary route", route, 'method: "PATCH"');
mustNotContain("settlement summary route", route, 'method: "POST"');
mustNotContain("settlement summary route", route, 'method: "DELETE"');

console.log();
console.log("=== VERIFY PREVIEW ROUTE ADVERTISES ONLY SETTLEMENT SUMMARY AS AVAILABLE ===");
mustContain("settlement documents preview route", previewRoute, 'key: "settlement-summary"');
mustContain("settlement documents preview route", previewRoute, 'status: blockingErrors.length === 0 ? "ready-route-only-docx" : "blocked"');
mustContain("settlement documents preview route", previewRoute, "availableNow: true");
mustContain("settlement documents preview route", previewRoute, 'generationEndpoint: "/api/settlements/settlement-summary"');
mustContain("settlement documents preview route", previewRoute, "routeOnly: true");
mustContain("settlement documents preview route", previewRoute, "noUploadToClio: true");
mustContain("settlement documents preview route", previewRoute, "noDatabaseRecordCreated: true");
mustContain("settlement documents preview route", previewRoute, "noPrintQueueRecordCreated: true");
mustContain("settlement documents preview route", previewRoute, "Provider Remittance Breakdown");
mustContain("settlement documents preview route", previewRoute, "Attorney Fee Breakdown");
mustContain("settlement documents preview route", previewRoute, "availableNow: false");

console.log();
console.log("=== VERIFY SCRIPT REGISTRATION ===");
mustContain("package.json", packageJson, "verify:settlement-summary-docx-safety");
mustContain("verify-prod.sh", verifyProd, "verify:settlement-summary-docx-safety");

if (process.exitCode) {
  console.error();
  console.error("=== SETTLEMENT SUMMARY DOCX SAFETY VERIFICATION FAILED ===");
  process.exit(process.exitCode);
}

console.log();
console.log("=== SETTLEMENT SUMMARY DOCX SAFETY VERIFICATION PASSED ===");
console.log("No Clio records were changed by this verifier.");
console.log("No database writes were made by this verifier.");
console.log("No documents were uploaded or persistently saved by this verifier.");
console.log("No print queue records were changed by this verifier.");
