import fs from "fs";

const invoicePagePath = "app/admin/clients/[id]/invoice/page.tsx";
const historyPagePath = "app/admin/clients/[id]/invoice/history/page.tsx";
const pkgPath = "package.json";

const invoicePage = fs.readFileSync(invoicePagePath, "utf8");
const historyPage = fs.readFileSync(historyPagePath, "utf8");
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

console.log("=== VERIFY INVOICE HISTORY PAGE SAFETY ===");

mustContain("invoice page", invoicePage, "Open Invoice History");
mustContain("invoice page", invoicePage, "/invoice/history");
mustContain("invoice page", invoicePage, 'window.open(`/admin/clients/${encodeURIComponent(id)}/invoice/history`, "_blank", "noopener,noreferrer");');
mustAvoid("invoice page", invoicePage, 'id="invoice-history"');
mustAvoid("invoice page", invoicePage, 'document.getElementById("invoice-history")');
mustAvoid("invoice page", invoicePage, "setInvoiceHistoryVisible(true)");
mustAvoid("invoice page", invoicePage, "invoiceHistoryVisible && (");

mustContain("history page", historyPage, '"use client";');
mustContain("history page", historyPage, "Client Invoice History");
mustContain("history page", historyPage, "Back to Invoice Workflow");
mustContain("history page", historyPage, "/api/admin/clients/");
mustContain("history page", historyPage, "/invoice");
mustContain("history page", historyPage, "Refresh");
mustContain("history page", historyPage, "Export CSV");
mustContain("history page", historyPage, "Final Net Remit");
mustContain("history page", historyPage, "Cost Ledger");

mustAvoidPattern("invoice page", invoicePage, /providerClientInvoice\.(create|update|delete|upsert)\s*\(/i, "direct ProviderClientInvoice mutation in invoice UI");
mustAvoidPattern("history page", historyPage, /providerClientInvoice\.(create|update|delete|upsert)\s*\(/i, "direct ProviderClientInvoice mutation in history page");
mustAvoidPattern("history page", historyPage, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in history page");

const expected = "node scripts/verify-invoice-history-page-safety.mjs";
if (pkg.scripts?.["verify:invoice-history-page-safety"] === expected) {
  pass("package.json registers verify:invoice-history-page-safety");
} else {
  fail("package.json missing verify:invoice-history-page-safety");
}

if (failures) {
  console.error(`\nRESULT: invoice history page safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: invoice history page safety PASSED");
