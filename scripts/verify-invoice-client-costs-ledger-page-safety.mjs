import fs from "fs";

const invoicePagePath = "app/admin/clients/[id]/invoice/page.tsx";
const ledgerPagePath = "app/admin/clients/[id]/invoice/client-costs-ledger/page.tsx";
const pkgPath = "package.json";

const invoicePage = fs.readFileSync(invoicePagePath, "utf8");
const ledgerPage = fs.readFileSync(ledgerPagePath, "utf8");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

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

function mustAvoid(label, text, needle) {
  if (!text.includes(needle)) pass(`${label}: avoids ${needle}`);
  else fail(`${label}: still contains ${needle}`);
}

function mustAvoidPattern(label, text, regex, description) {
  if (regex.test(text) === false) pass(`${label}: avoids ${description}`);
  else fail(`${label}: matched forbidden ${description}`);
}

console.log("=== VERIFY INVOICE CLIENT COSTS LEDGER PAGE SAFETY ===");

mustContain("invoice page", invoicePage, "Open Client Costs Ledger");
mustContain("invoice page", invoicePage, "/invoice/client-costs-ledger");
mustContain("invoice page", invoicePage, 'window.open(`/admin/clients/${encodeURIComponent(id)}/invoice/client-costs-ledger`, "_blank", "noopener,noreferrer");');
mustAvoid("invoice page", invoicePage, "{renderClientCostLedger()}");
mustAvoid("invoice page", invoicePage, 'document.getElementById("client-cost-ledger")?.scrollIntoView');

mustContain("ledger page", ledgerPage, '"use client";');
mustContain("ledger page", ledgerPage, "Client Costs Ledger");
mustContain("ledger page", ledgerPage, "Back to Invoice Workflow");
mustContain("ledger page", ledgerPage, "/invoice/cost-ledger");
mustContain("ledger page", ledgerPage, "Refresh Ledger");
mustContain("ledger page", ledgerPage, "Export CSV");
mustContain("ledger page", ledgerPage, "Eligible for Future Invoice");
mustContain("ledger page", ledgerPage, "Read-only cost activity");
mustContain("ledger page", ledgerPage, "Finalized non-voided invoice lines block the same cost");

mustAvoidPattern("invoice page", invoicePage, /providerClientInvoice\.(create|update|delete|upsert)\s*\(/i, "direct ProviderClientInvoice mutation in invoice UI");
mustAvoidPattern("ledger page", ledgerPage, /providerClientInvoice\.(create|update|delete|upsert)\s*\(/i, "direct ProviderClientInvoice mutation in ledger page");
mustAvoidPattern("ledger page", ledgerPage, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in ledger page");

const expected = "node scripts/verify-invoice-client-costs-ledger-page-safety.mjs";
if (pkg.scripts?.["verify:invoice-client-costs-ledger-page-safety"] === expected) {
  pass("package.json registers verify:invoice-client-costs-ledger-page-safety");
} else {
  fail("package.json missing verify:invoice-client-costs-ledger-page-safety");
}

if (failures) {
  console.error(`\nRESULT: invoice client costs ledger page safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: invoice client costs ledger page safety PASSED");
