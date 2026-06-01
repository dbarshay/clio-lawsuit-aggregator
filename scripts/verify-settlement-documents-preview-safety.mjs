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

console.log("=== VERIFY SETTLEMENT DOCUMENTS PREVIEW SAFETY ===");

const route = read("app/api/settlements/documents-preview/route.ts");
const templateRegistry = read("lib/documents/templateRegistry.ts");
const matterPage = read("app/matters/page.tsx");
const packageJson = read("package.json");
const verifyProd = read("scripts/verify-prod.sh");

console.log("");
console.log("=== VERIFY ROUTE IS PREVIEW-ONLY / READ-ONLY ===");
mustContain("settlement documents preview route", route, 'action: "settlement-documents-preview"');
mustContain("settlement documents preview route", route, "localFirst: true");
mustContain("settlement documents preview route", route, 'sourceOfTruth: "barsh-matters-local"');
mustContain("settlement documents preview route", route, "dryRun: true");
mustContain("settlement documents preview route", route, "previewOnly: true");
mustContain("settlement documents preview route", route, "readOnly: true");
mustContain("settlement documents preview route", route, "clioRecordsChanged: false");
mustContain("settlement documents preview route", route, "databaseRecordsChanged: false");
mustContain("settlement documents preview route", route, "documentsGenerated: false");
mustContain("settlement documents preview route", route, "printQueueChanged: false");
mustContain("settlement documents preview route", route, "persistentFilesCreated: false");
mustContain("settlement documents preview route", route, "mattersClosed: false");
mustContain("settlement documents preview route", route, "calendarEventsCreated: false");
mustContain("settlement documents preview route", route, "emailsSent: false");
mustContain("settlement documents preview route", route, "settlementWritebackPerformed: false");
mustContain("settlement documents preview route", route, "It does not read Clio settlement values");
mustContain("settlement documents preview route", route, "write Clio");
mustContain("settlement documents preview route", route, "generate documents");
mustContain("settlement documents preview route", route, "create files");
mustContain("settlement documents preview route", route, "change the print queue");
mustContain("settlement documents preview route", route, "close matters");
mustContain("settlement documents preview route", route, "send email");

mustNotContain("settlement documents preview route", route, "method: \"PATCH\"");
mustNotContain("settlement documents preview route", route, "method: \"POST\"");
mustNotContain("settlement documents preview route", route, ".create(");
mustNotContain("settlement documents preview route", route, ".update(");
mustNotContain("settlement documents preview route", route, ".delete(");
mustNotContain("settlement documents preview route", route, "writeFile");
mustNotContain("settlement documents preview route", route, "Packer.toBuffer");

console.log("");
console.log("=== VERIFY ROUTE READS LOCAL SETTLEMENT RECORDS ONLY ===");
mustContain("settlement documents preview route", route, "prisma.localSettlementRecord.findFirst");
mustContain("settlement documents preview route", route, "LocalSettlementRecord");
mustContain("settlement documents preview route", route, "LocalSettlementRow");
mustContain("settlement documents preview route", route, "voided: false");
mustContain("settlement documents preview route", route, "rows:");
mustContain("settlement documents preview route", route, "buildSettlementPlannedDocuments");
mustNotContain("settlement documents preview route", route, "/api/settlements/current-values");
mustNotContain("settlement documents preview route", route, "live-clio-read");
mustNotContain("settlement documents preview route", route, "clioFetch(");
mustNotContain("settlement documents preview route", route, "MATTER_CF.");

console.log("");
console.log("=== VERIFY PLANNED SETTLEMENT DOCUMENTS LIVE IN TEMPLATE REGISTRY ===");
mustContain("template registry", templateRegistry, "buildSettlementPlannedDocuments");
mustContain("template registry", templateRegistry, "Settlement Summary");
mustContain("template registry", templateRegistry, "Provider Remittance Breakdown");
mustContain("template registry", templateRegistry, "Attorney Fee Breakdown");
mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/settlement-summary"');
mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/provider-remittance-breakdown"');
mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/attorney-fee-breakdown"');
mustContain("template registry", templateRegistry, "routeOnly: true");

console.log("");
console.log("=== VERIFY SETTLEMENT DOCUMENTS PREVIEW UI IN MASTER MATTERS PAGE ===");
mustContain("matter page", matterPage, "Settlement Document Generation");
mustContain("matter page", matterPage, "settlement-documents-preview");
mustContain("matter page", matterPage, "/api/settlements/documents-preview?masterLawsuitId=");
mustContain("matter page", matterPage, "masterDocumentLaunchMode");
mustContain("matter page", matterPage, "masterDocumentDataPreview");
mustContain("matter page", matterPage, "documentLaunchMode");
mustContain("matter page", matterPage, "isSettlementDocumentMode");
mustContain("matter page", matterPage, "No final file is created until the workflow is finalized.");
mustContain("matter page", matterPage, "Preview-only");
mustNotContain("matter page", matterPage, "Generate Settlement Documents");
mustNotContain("matter page", matterPage, "Upload Settlement Documents to Clio");
mustNotContain("matter page", matterPage, "Queue Settlement Documents");

console.log("");
console.log("=== VERIFY SCRIPT REGISTRATION ===");
mustContain("package.json", packageJson, "verify:settlement-documents-preview-safety");
mustContain("verify-prod.sh", verifyProd, "verify:settlement-documents-preview-safety");

if (process.exitCode) {
  console.error("");
  console.error("=== SETTLEMENT DOCUMENTS PREVIEW SAFETY VERIFICATION FAILED ===");
  process.exit(process.exitCode);
}

console.log("");
console.log("=== SETTLEMENT DOCUMENTS PREVIEW SAFETY VERIFICATION PASSED ===");
console.log("No Clio records were changed by this verifier.");
console.log("No database writes were made by this verifier.");
console.log("No documents were generated by this verifier.");
console.log("No persistent files were created by this verifier.");
console.log("No print queue records were changed by this verifier.");
