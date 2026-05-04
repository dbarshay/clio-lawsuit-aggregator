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
const matterPage = read("app/matter/[id]/page.tsx");
const packageJson = read("package.json");
const verifyProd = read("scripts/verify-prod.sh");

console.log("");
console.log("=== VERIFY ROUTE IS PREVIEW-ONLY / READ-ONLY ===");
mustContain("settlement documents preview route", route, 'action: "settlement-documents-preview"');
mustContain("settlement documents preview route", route, "dryRun: true");
mustContain("settlement documents preview route", route, "previewOnly: true");
mustContain("settlement documents preview route", route, "readOnly: true");
mustContain("settlement documents preview route", route, "noClioRecordsChanged: true");
mustContain("settlement documents preview route", route, "noDatabaseRecordsChanged: true");
mustContain("settlement documents preview route", route, "noDocumentsGenerated: true");
mustContain("settlement documents preview route", route, "noPrintQueueRecordsChanged: true");
mustContain("settlement documents preview route", route, "noPersistentFilesCreated: true");
mustNotContain("settlement documents preview route", route, "method: \"PATCH\"");
mustNotContain("settlement documents preview route", route, "method: \"POST\"");
mustNotContain("settlement documents preview route", route, ".create(");
mustNotContain("settlement documents preview route", route, ".update(");
mustNotContain("settlement documents preview route", route, ".delete(");
mustNotContain("settlement documents preview route", route, "writeFile");
mustNotContain("settlement documents preview route", route, "Packer.toBuffer");
mustNotContain("settlement documents preview route", route, "printQueue");

console.log("");
console.log("=== VERIFY PLANNED SETTLEMENT DOCUMENTS ===");
mustContain("settlement documents preview route", route, "Settlement Summary");
mustContain("settlement documents preview route", route, "Provider Remittance Breakdown");
mustContain("settlement documents preview route", route, "Attorney Fee Breakdown");
mustContain("settlement documents preview route", route, "ready-route-only-docx");
mustContain("settlement documents preview route", route, 'generationEndpoint: "/api/settlements/settlement-summary"');
mustContain("settlement documents preview route", route, 'generationEndpoint: "/api/settlements/provider-remittance-breakdown"');
mustContain("settlement documents preview route", route, 'generationEndpoint: "/api/settlements/attorney-fee-breakdown"');
mustContain("settlement documents preview route", route, "availableNow: true");
mustContain("settlement documents preview route", route, "routeOnly: true");
mustContain("settlement documents preview route", route, "noUploadToClio: true");
mustContain("settlement documents preview route", route, "noDatabaseRecordCreated: true");
mustContain("settlement documents preview route", route, "noPrintQueueRecordCreated: true");

console.log("");
console.log("=== VERIFY CURRENT CLIO VALUES READBACK INTEGRATION ===");
mustContain("settlement documents preview route", route, "/api/settlements/current-values");
mustContain("settlement documents preview route", route, "cache: \"no-store\"");
mustContain("settlement documents preview route", route, "settledAmountTotal");
mustContain("settlement documents preview route", route, "allocatedSettlementTotal");
mustContain("settlement documents preview route", route, "totalFeeTotal");
mustContain("settlement documents preview route", route, "providerNetTotal");

console.log("");
console.log("=== VERIFY SETTLEMENT DOCUMENTS PREVIEW UI ===");
mustContain("matter page", matterPage, "Settlement Documents Preview");
mustContain("matter page", matterPage, "Preview Settlement Documents");
mustContain("matter page", matterPage, "/api/settlements/documents-preview?masterLawsuitId=");
mustContain("matter page", matterPage, "settlementDocumentsPreviewLoading");
mustContain("matter page", matterPage, "settlementDocumentsPreviewResult");
mustContain("matter page", matterPage, "async function loadSettlementDocumentsPreview");
mustContain("matter page", matterPage, "No settlement documents are generated here.");
mustContain("matter page", matterPage, "No Clio records, database records, or print queue records are changed.");
mustContain("matter page", matterPage, "Route-only DOCX");
mustContain("matter page", matterPage, "Download DOCX");
mustContain("matter page", matterPage, "canDownloadRouteOnlyDocx");
mustContain("matter page", matterPage, "doc.availableNow === true");
mustContain("matter page", matterPage, "doc.routeOnly === true");
mustContain("matter page", matterPage, "generationEndpoint");
mustContain("matter page", matterPage, "Preview-only");
mustContain("matter page", matterPage, "Raw settlement documents preview JSON");
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
console.log("No print queue records were changed by this verifier.");
