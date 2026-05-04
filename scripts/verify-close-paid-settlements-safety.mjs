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

console.log("=== VERIFY CLOSE PAID SETTLEMENTS SAFETY ===");

const route = read("app/api/settlements/close/route.ts");
const matterPage = read("app/matter/[id]/page.tsx");
const packageJson = read("package.json");
const verifyProd = read("scripts/verify-prod.sh");

console.log("");
console.log("=== VERIFY ROUTE REQUIRES EXPLICIT PAYMENT CONFIRMATION ===");
mustContain("close paid settlements route", route, 'action: "close-paid-settlements"');
mustContain("close paid settlements route", route, 'actionLabel: "Close Paid Settlements"');
mustContain("close paid settlements route", route, "const confirmPaid = body.confirmPaid === true");
mustContain("close paid settlements route", route, "const confirmClosePaidSettlements = body.confirmClosePaidSettlements === true");
mustContain("close paid settlements route", route, "blocked-missing-payment-confirmation");
mustContain("close paid settlements route", route, "Settlement agreement or settlement financial writeback alone is not enough to close a matter.");

console.log("");
console.log("=== VERIFY ROUTE WRITES ONLY PAID SETTLEMENT CLOSE FIELDS ===");
mustContain("close paid settlements route", route, 'const PAID_SETTLEMENT_CLOSE_REASON = "PAID (SETTLEMENT)"');
mustContain("close paid settlements route", route, "const PAID_SETTLEMENT_OPTION_ID = 12497555");
mustContain("close paid settlements route", route, "const CLOSE_REASON_FIELD_ID = 22145660");
mustContain("close paid settlements route", route, 'status: "closed"');
mustContain("close paid settlements route", route, "custom_field_values");
mustContain("close paid settlements route", route, "method: \"PATCH\"");
mustContain("close paid settlements route", route, "patchMatterClosedAsPaidSettlement");

console.log("");
console.log("=== VERIFY MASTER/CLOSED/BLOCKED RULES ===");
mustContain("close paid settlements route", route, "Master matter is excluded from Close Paid Settlements.");
mustContain("close paid settlements route", route, "Close Reason custom field value record is missing.");
mustContain("close paid settlements route", route, "Matter already has a closed status or final close reason.");
mustContain("close paid settlements route", route, "canCloseIfPaidConfirmed");
mustContain("close paid settlements route", route, "blocked-no-eligible-paid-settlements");
mustContain("close paid settlements route", route, "master_lawsuit_id: masterLawsuitId");

console.log("");
console.log("=== VERIFY CLAIMINDEX REFRESH AFTER WRITE ===");
mustContain("close paid settlements route", route, "ingestMattersFromClioBatch([matterId])");
mustContain("close paid settlements route", route, "upsertClaimIndexFromMatter(freshAfterWrite)");
mustContain("close paid settlements route", route, "refreshMatterIntoClaimIndexAfterWrite(row.matterId)");

console.log("");
console.log("=== VERIFY NO DOCUMENT OR PRINT QUEUE MUTATION ===");
mustContain("close paid settlements route", route, "noDocumentsGenerated: true");
mustContain("close paid settlements route", route, "noPrintQueueRecordsChanged: true");
mustNotContain("close paid settlements route", route, "printQueue");
mustNotContain("close paid settlements route", route, "documentGeneration");
mustNotContain("close paid settlements route", route, "finalize");
mustNotContain("close paid settlements route", route, ".create(");
mustNotContain("close paid settlements route", route, ".delete(");

console.log("");
console.log("=== VERIFY CLOSE PAID SETTLEMENTS UI ===");
mustContain("matter page", matterPage, "settlementCloseWritebackLoading");
mustContain("matter page", matterPage, "settlementCloseWritebackResult");
mustContain("matter page", matterPage, "async function closePaidSettlements");
mustContain("matter page", matterPage, "/api/settlements/close");
mustContain("matter page", matterPage, "confirmPaid: true");
mustContain("matter page", matterPage, "confirmClosePaidSettlements: true");
mustContain("matter page", matterPage, "Close Paid Settlements");
mustContain("matter page", matterPage, "Use only after payment is confirmed.");
mustContain("matter page", matterPage, "Preview does not close anything.");
mustContain("matter page", matterPage, "Close Paid Settlements Result");
mustContain("matter page", matterPage, "settlementClosePreviewResult?.validation?.canCloseIfConfirmed");
mustNotContain("matter page", matterPage, "Close Settlement Matters Now");
mustNotContain("matter page", matterPage, "Confirm Settlement Close");

console.log("");
console.log("=== VERIFY SCRIPT REGISTRATION ===");
mustContain("package.json", packageJson, "verify:close-paid-settlements-safety");
mustContain("verify-prod.sh", verifyProd, "verify:close-paid-settlements-safety");

if (process.exitCode) {
  console.error("");
  console.error("=== CLOSE PAID SETTLEMENTS SAFETY VERIFICATION FAILED ===");
  process.exit(process.exitCode);
}

console.log("");
console.log("=== CLOSE PAID SETTLEMENTS SAFETY VERIFICATION PASSED ===");
console.log("No Clio calls were made by this verifier.");
console.log("No database writes were made by this verifier.");
console.log("No documents were generated by this verifier.");
console.log("No print queue records were changed by this verifier.");
