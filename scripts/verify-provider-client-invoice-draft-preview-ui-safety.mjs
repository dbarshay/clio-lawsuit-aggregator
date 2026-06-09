#!/usr/bin/env node
import fs from "fs";

const pagePath = "app/admin/clients/[id]/invoice/page.tsx";
const packagePath = "package.json";
const page = fs.readFileSync(pagePath, "utf8");
let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}

function mustContain(label, text, needle) {
  if (text.includes(needle)) pass(`${label}: found ${needle}`);
  else fail(`${label}: missing ${needle}`);
}

function mustNotContain(label, text, needle) {
  if (!text.includes(needle)) pass(`${label}: does not contain ${needle}`);
  else fail(`${label}: still contains ${needle}`);
}

console.log("=== VERIFY PROVIDER CLIENT INVOICE DRAFT PREVIEW UI SAFETY ===");

mustContain("invoice page", page, "invoiceDraftPreview");
mustContain("invoice page", page, "invoiceDraftPreviewLoading");
mustContain("invoice page", page, "prepareInvoiceDraftPreview");
mustContain("invoice page", page, "/invoice/create-preview?");
mustContain("invoice page", page, "Review Invoice Package");
mustContain("invoice page", page, "Invoice Package Review");
mustContain("invoice page", page, "Package Snapshot:");
mustContain("invoice page", page, "Review the invoice header and frozen line snapshot");
mustContain("invoice page", page, "Package Total");
mustContain("invoice page", page, "Retainer Fee");
mustContain("invoice page", page, "Read-only");

mustNotContain("invoice page", page, "providerClientInvoice.create");
mustNotContain("invoice page", page, "providerClientInvoiceLine.create");
mustNotContain("invoice page", page, "matterPaymentReceipt.updateMany");
mustNotContain("invoice page", page, "Create Invoice is enabled");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const expectedScript = "node scripts/verify-provider-client-invoice-draft-preview-ui-safety.mjs";
if (pkg.scripts?.["verify:provider-client-invoice-draft-preview-ui-safety"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: provider client invoice draft-preview UI safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: provider client invoice draft-preview UI safety PASSED");
