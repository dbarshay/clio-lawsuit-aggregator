#!/usr/bin/env node
import fs from "fs";

const files = {
  page: "app/admin/clients/[id]/invoice/page.tsx",
  finalizeRoute: "app/api/admin/clients/[id]/invoice/[invoiceId]/finalize/route.ts",
  detailRoute: "app/api/admin/clients/[id]/invoice/[invoiceId]/route.ts",
  packageJson: "package.json",
};

let failures = 0;

function text(file) {
  return fs.readFileSync(file, "utf8");
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function mustContain(label, body, needle) {
  if (body.includes(needle)) pass(`${label}: found ${needle}`);
  else fail(`${label}: missing ${needle}`);
}

function mustNotContain(label, body, needle) {
  if (!body.includes(needle)) pass(`${label}: avoids ${needle}`);
  else fail(`${label}: contains forbidden ${needle}`);
}

function mustNotMatch(label, body, regex, description) {
  if (!regex.test(body)) pass(`${label}: avoids ${description}`);
  else fail(`${label}: matched forbidden ${description}`);
}

console.log("=== VERIFY INVOICE STEP 4 FINALIZE OUTPUT SAFETY ===");

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) fail(`missing file ${file}`);
}

const page = text(files.page);
const finalizeRoute = text(files.finalizeRoute);
const detailRoute = text(files.detailRoute);
const pkg = JSON.parse(text(files.packageJson));

mustContain("invoice page", page, "function invoiceReceiptLineCount");
mustContain("invoice page", page, "Frozen invoice lines will remain the invoice review/output source.");
mustContain("invoice page", page, "This will not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records.");
mustContain("invoice page", page, "receiptRowsMarkedWithThisInvoiceId");
mustContain("invoice page", page, "await loadInvoiceDetail(invoiceId);");
mustContain("invoice page", page, "setInvoiceDetailVisible(true);");
mustContain("invoice page", page, "frozen invoice line");

const finalizeFunctionMatch = page.match(/async function finalizeInvoice\([\s\S]*?\n  async function voidInvoice/);
if (!finalizeFunctionMatch) {
  fail("invoice page: could not isolate finalizeInvoice function");
} else {
  const finalizeFunction = finalizeFunctionMatch[0];
  mustContain("finalize function", finalizeFunction, "await loadInvoiceDetail(invoiceId);");
  mustContain("finalize function", finalizeFunction, "setInvoiceDetailVisible(true);");
  mustNotContain(
    "finalize function",
    finalizeFunction,
    "setInvoiceDetailVisible(false);"
  );
  mustNotContain(
    "finalize function",
    finalizeFunction,
    "setInvoiceDetail(null);"
  );
}

mustContain("printable invoice", page, "Principal / Interest Received");
mustContain("printable invoice", page, "Costs Received");
mustContain("printable invoice", page, "Fees and Costs Expended");
mustContain("printable invoice", page, "Date of Loss");
mustContain("printable invoice", page, "Date of Service");
mustContain("printable invoice", page, "Check Date");
mustContain("printable invoice", page, "Check Number");
mustContain("printable invoice", page, "Billed Amount");
mustContain("printable invoice", page, "Retainer Fee");
mustContain("printable invoice", page, "Remit to Provider");
mustContain("printable invoice", page, "invoiceLineDosEnd(line)");
mustContain("printable invoice", page, "printableDos(line)");
mustContain("printable invoice", page, "Word/DOCX is not a delivery format");
mustContain("printable invoice", page, "Print / Save as PDF");
mustContain("printable invoice", page, "Package Summary");

mustNotContain("printable invoice", page, "<strong>Receipt Marking</strong>");
mustNotContain("printable invoice", page, "<th>Date</th><th>Matter</th><th>Patient</th><th>Provider</th><th>Description</th><th style=\"text-align:right;\">Amount</th><th style=\"text-align:right;\">Retainer Fee</th>");
mustNotMatch("printable invoice", page, /<div class="total"><span>Invoice Total<\/span><span>[^`]*?<div class="total"><span>Invoice Total<\/span>/, "duplicate printable invoice total block");

mustContain("finalize route", finalizeRoute, "tx.matterPaymentReceipt.updateMany");
mustContain("finalize route", finalizeRoute, "data: { invoiceId: invoice.id }");
mustContain("finalize route", finalizeRoute, "receiptRowsMarkedWithThisInvoiceId");
mustContain("finalize route", finalizeRoute, "does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records");
mustNotMatch("finalize route", finalizeRoute, /clioFetch|from\s+["'][^"']*clio/i, "Clio operational dependency");
mustNotMatch("finalize route", finalizeRoute, /claimIndex\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/i, "ClaimIndex mutation");
mustNotMatch("finalize route", finalizeRoute, /providerClientInvoiceLine\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/i, "ProviderClientInvoiceLine mutation during finalize");

mustContain("detail route", detailRoute, "receiptRowsMarkedWithThisInvoiceId");
mustContain("detail route", detailRoute, "receiptRowsUnmarked");
mustContain("detail route", detailRoute, "receiptMarkDetails");

const expectedScript = "node scripts/verify-invoice-step4-finalize-output-safety.mjs";
if (pkg.scripts?.["verify:invoice-step4-finalize-output-safety"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: invoice Step 4 finalize/output safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: invoice Step 4 finalize/output safety PASSED");
