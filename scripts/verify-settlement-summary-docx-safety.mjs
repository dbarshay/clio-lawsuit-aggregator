#!/usr/bin/env node

import fs from "fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function mustContain(label, text, needle) {
  if (text.includes(needle)) {
    pass(`${label}: found ${needle}`);
  } else {
    fail(`${label}: missing ${needle}`);
  }
}

function mustNotContain(label, text, needle) {
  if (!text.includes(needle)) {
    pass(`${label}: does not contain ${needle}`);
  } else {
    fail(`${label}: unexpectedly contains ${needle}`);
  }
}

console.log("=== VERIFY SETTLEMENT SUMMARY DOCX ROUTE SAFETY ===");

const settlementSummaryRoute = read("app/api/settlements/settlement-summary/route.ts");
const previewRoute = read("app/api/settlements/documents-preview/route.ts");
const templateRegistry = read("lib/documents/templateRegistry.ts");
const packageJson = read("package.json");
const verifyProd = read("scripts/verify-prod.sh");

console.log("");
console.log("=== VERIFY ROUTE-ONLY DOCX GENERATION ===");
mustContain("settlement summary route", settlementSummaryRoute, 'action: "settlement-summary-docx"');
mustContain("settlement summary route", settlementSummaryRoute, "generatedDocxResponseOnly: true");
mustContain("settlement summary route", settlementSummaryRoute, "routeOnly: true");
mustContain("settlement summary route", settlementSummaryRoute, "Packer.toBuffer(doc)");
mustContain("settlement summary route", settlementSummaryRoute, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
mustContain("settlement summary route", settlementSummaryRoute, "Content-Disposition");
mustContain("settlement summary route", settlementSummaryRoute, 'if (base.toLowerCase().endsWith(".docx")) return base;');
mustContain("settlement summary route", settlementSummaryRoute, "return `${base}.docx`;");
mustContain("settlement summary route", settlementSummaryRoute, "/api/settlements/documents-preview");
mustContain("settlement summary route", settlementSummaryRoute, 'method: "GET"');
mustContain("settlement summary route", settlementSummaryRoute, 'cache: "no-store"');

console.log("");
console.log("=== VERIFY NO CLIO / DATABASE / FILE / PRINT QUEUE MUTATION ===");
mustContain("settlement summary route", settlementSummaryRoute, "noClioRecordsChanged: true");
mustContain("settlement summary route", settlementSummaryRoute, "noDatabaseRecordsChanged: true");
mustContain("settlement summary route", settlementSummaryRoute, "noDocumentUploadPerformed: true");
mustContain("settlement summary route", settlementSummaryRoute, "noPrintQueueRecordsChanged: true");
mustContain("settlement summary route", settlementSummaryRoute, "noPersistentFilesCreated: true");
mustNotContain("settlement summary route", settlementSummaryRoute, "clioFetch(");
mustNotContain("settlement summary route", settlementSummaryRoute, "uploadBufferToClioMatterDocuments");
mustNotContain("settlement summary route", settlementSummaryRoute, "listClioMatterDocuments");
mustNotContain("settlement summary route", settlementSummaryRoute, "prisma.");
mustNotContain("settlement summary route", settlementSummaryRoute, ".create(");
mustNotContain("settlement summary route", settlementSummaryRoute, ".update(");
mustNotContain("settlement summary route", settlementSummaryRoute, ".delete(");
mustNotContain("settlement summary route", settlementSummaryRoute, "writeFile");
mustNotContain("settlement summary route", settlementSummaryRoute, "appendFile");
mustNotContain("settlement summary route", settlementSummaryRoute, "mkdir(");
mustNotContain("settlement summary route", settlementSummaryRoute, "printQueue");
mustNotContain("settlement summary route", settlementSummaryRoute, 'method: "PATCH"');
mustNotContain("settlement summary route", settlementSummaryRoute, 'method: "POST"');
mustNotContain("settlement summary route", settlementSummaryRoute, 'method: "DELETE"');

console.log("");
console.log("=== VERIFY TEMPLATE REGISTRY ADVERTISES ROUTE-ONLY SETTLEMENT DOCX OPTIONS ===");
mustContain("template registry", templateRegistry, "buildSettlementPlannedDocuments");
mustContain("template registry", templateRegistry, "Settlement Summary");
mustContain("template registry", templateRegistry, "Provider Remittance Breakdown");
mustContain("template registry", templateRegistry, "Attorney Fee Breakdown");
mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/settlement-summary"');
mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/provider-remittance-breakdown"');
mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/attorney-fee-breakdown"');
mustContain("template registry", templateRegistry, "routeOnly: true");

console.log("");
console.log("=== VERIFY DOCUMENTS PREVIEW ROUTE DELEGATES PLANNED DOCUMENTS TO TEMPLATE REGISTRY ===");
mustContain("settlement documents preview route", previewRoute, "buildSettlementPlannedDocuments");
mustContain("settlement documents preview route", previewRoute, "plannedDocuments");
mustContain("settlement documents preview route", previewRoute, 'action: "settlement-documents-preview"');
mustContain("settlement documents preview route", previewRoute, "previewOnly: true");
mustContain("settlement documents preview route", previewRoute, "readOnly: true");
mustContain("settlement documents preview route", previewRoute, "documentsGenerated: false");
mustContain("settlement documents preview route", previewRoute, "persistentFilesCreated: false");
mustContain("settlement documents preview route", previewRoute, "printQueueChanged: false");
mustNotContain("settlement documents preview route", previewRoute, "/api/settlements/current-values");
mustNotContain("settlement documents preview route", previewRoute, "live-clio-read");
mustNotContain("settlement documents preview route", previewRoute, "clioFetch(");
mustNotContain("settlement documents preview route", previewRoute, "MATTER_CF.");

console.log("");
console.log("=== VERIFY SCRIPT REGISTRATION ===");
mustContain("package.json", packageJson, "verify:settlement-summary-docx-safety");
mustContain("verify-prod.sh", verifyProd, "verify:settlement-summary-docx-safety");

if (process.exitCode) {
  console.error("");
  console.error("=== SETTLEMENT SUMMARY DOCX SAFETY VERIFICATION FAILED ===");
  process.exit(process.exitCode);
}

console.log("");
console.log("=== SETTLEMENT SUMMARY DOCX SAFETY VERIFICATION PASSED ===");
console.log("No Clio records were changed by this verifier.");
console.log("No database writes were made by this verifier.");
console.log("No documents were uploaded by this verifier.");
console.log("No persistent files were created by this verifier.");
console.log("No print queue records were changed by this verifier.");
