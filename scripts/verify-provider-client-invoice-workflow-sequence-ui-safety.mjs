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

console.log("=== VERIFY PROVIDER CLIENT INVOICE WORKFLOW SEQUENCE UI SAFETY ===");

mustContain("invoice page", page, "1. Preview");
mustContain("invoice page", page, "2. Review Invoice Package");
mustContain("invoice page", page, "3. Create Draft Invoice");
mustContain("invoice page", page, "4. Finalize Invoice");
mustContain("invoice page", page, "→");
mustContain("invoice page", page, "color: hasPreviewed ? \"#16a34a\" : \"#94a3b8\"");
mustContain("invoice page", page, "color: invoiceDraftPreview ? \"#16a34a\" : \"#94a3b8\"");
mustContain("invoice page", page, "color: createdInvoice ? \"#16a34a\" : \"#94a3b8\"");
mustContain("invoice page", page, "disabled={!hasPreviewed || invoiceDraftPreviewLoading}");
mustContain("invoice page", page, "disabled={!invoiceDraftPreview || createInvoiceLoading || !!createdInvoice}");
mustContain("invoice page", page, "disabled");
mustContain("invoice page", page, "createInvoiceDraft");
mustContain("invoice page", page, "/invoice/create");
mustContain("invoice page", page, "confirmCreateInvoiceDraft: true");
mustContain("invoice page", page, "createdInvoice");
mustContain("invoice page", page, "Draft Invoice Created");
mustContain("invoice page", page, "Local draft invoice saved with frozen line snapshots");
mustContain("invoice page", page, "source payment rows have not been marked invoiced");
mustContain("invoice page", page, "Draft Total");
mustContain("invoice page", page, "Next Step:");
mustContain("invoice page", page, "Not finalized");
mustContain("invoice page", page, "Export CSV");
mustContain("invoice page", page, "marginLeft: \"auto\"");
mustContain("invoice page", page, "background: \"#16a34a\", color: \"#fff\"");
mustContain("invoice page", page, "background: \"#dcfce7\"");
mustContain("invoice page", page, "color: !hasPreviewed ? \"#166534\"");
mustContain("invoice page", page, "color: !invoiceDraftPreview ? \"#166534\"");

mustNotContain("invoice page", page, "Invoice Workflow Status");
mustNotContain("invoice page", page, "Create invoice record");
mustNotContain("invoice page", page, "Finalize printable/exportable package");
mustNotContain("invoice page", page, "providerClientInvoice.create");
mustNotContain("invoice page", page, "providerClientInvoiceLine.create");
mustNotContain("invoice page", page, "matterPaymentReceipt.updateMany");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const expectedScript = "node scripts/verify-provider-client-invoice-workflow-sequence-ui-safety.mjs";
if (pkg.scripts?.["verify:provider-client-invoice-workflow-sequence-ui-safety"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: provider client invoice workflow sequence UI safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: provider client invoice workflow sequence UI safety PASSED");
