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

console.log("=== VERIFY PROVIDER REMITTANCE BREAKDOWN DOCX ROUTE SAFETY ===");

const route = read("app/api/settlements/provider-remittance-breakdown/route.ts");
const previewRoute = read("app/api/settlements/documents-preview/route.ts");
const packageJson = read("package.json");
const verifyProd = read("scripts/verify-prod.sh");

console.log("");
console.log("=== VERIFY ROUTE-ONLY DOCX GENERATION ===");
mustContain("provider remittance route", route, 'action: "provider-remittance-breakdown-docx"');
mustContain("provider remittance route", route, "generatedDocxResponseOnly: true");
mustContain("provider remittance route", route, "routeOnly: true");
mustContain("provider remittance route", route, "Packer.toBuffer(doc)");
mustContain(
  "provider remittance route",
  route,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
);
mustContain("provider remittance route", route, "Content-Disposition");
mustContain("provider remittance route", route, 'if (base.toLowerCase().endsWith(".docx")) return base;');
mustContain("provider remittance route", route, 'return `${base}.docx`;');
mustContain("provider remittance route", route, "/api/settlements/documents-preview");
mustContain("provider remittance route", route, 'method: "GET"');
mustContain("provider remittance route", route, 'cache: "no-store"');

console.log("");
console.log("=== VERIFY NO CLIO / DATABASE / FILE / PRINT QUEUE MUTATION ===");
mustContain("provider remittance route", route, "noClioRecordsChanged: true");
mustContain("provider remittance route", route, "noDatabaseRecordsChanged: true");
mustContain("provider remittance route", route, "noDocumentUploadPerformed: true");
mustContain("provider remittance route", route, "noPrintQueueRecordsChanged: true");
mustContain("provider remittance route", route, "noPersistentFilesCreated: true");
mustNotContain("provider remittance route", route, "clioFetch(");
mustNotContain("provider remittance route", route, "uploadBufferToClioMatterDocuments");
mustNotContain("provider remittance route", route, "listClioMatterDocuments");
mustNotContain("provider remittance route", route, "prisma.");
mustNotContain("provider remittance route", route, ".create(");
mustNotContain("provider remittance route", route, ".update(");
mustNotContain("provider remittance route", route, ".delete(");
mustNotContain("provider remittance route", route, "writeFile");
mustNotContain("provider remittance route", route, "appendFile");
mustNotContain("provider remittance route", route, "mkdir(");
mustNotContain("provider remittance route", route, "printQueue");
mustNotContain("provider remittance route", route, 'method: "PATCH"');
mustNotContain("provider remittance route", route, 'method: "POST"');
mustNotContain("provider remittance route", route, 'method: "DELETE"');

console.log("");
console.log("=== VERIFY PREVIEW ROUTE ADVERTISES PROVIDER REMITTANCE AS AVAILABLE ===");
mustContain("settlement documents preview route", previewRoute, 'key: "provider-remittance-breakdown"');
mustContain("settlement documents preview route", previewRoute, 'label: "Provider Remittance Breakdown"');
mustContain("settlement documents preview route", previewRoute, 'generationEndpoint: "/api/settlements/provider-remittance-breakdown"');
mustContain("settlement documents preview route", previewRoute, "availableNow: true");
mustContain("settlement documents preview route", previewRoute, "routeOnly: true");
mustContain("settlement documents preview route", previewRoute, "noUploadToClio: true");
mustContain("settlement documents preview route", previewRoute, "noDatabaseRecordCreated: true");
mustContain("settlement documents preview route", previewRoute, "noPrintQueueRecordCreated: true");
mustContain("settlement documents preview route", previewRoute, "Attorney Fee Breakdown");

console.log("");
console.log("=== VERIFY SCRIPT REGISTRATION ===");
mustContain("package.json", packageJson, "verify:provider-remittance-docx-safety");
mustContain("verify-prod.sh", verifyProd, "verify:provider-remittance-docx-safety");

if (process.exitCode) {
  console.error("");
  console.error("=== PROVIDER REMITTANCE BREAKDOWN DOCX SAFETY VERIFICATION FAILED ===");
  process.exit(process.exitCode);
}

console.log("");
console.log("=== PROVIDER REMITTANCE BREAKDOWN DOCX SAFETY VERIFICATION PASSED ===");
console.log("No Clio records were changed by this verifier.");
console.log("No database writes were made by this verifier.");
console.log("No documents were uploaded or persistently saved by this verifier.");
console.log("No print queue records were changed by this verifier.");
