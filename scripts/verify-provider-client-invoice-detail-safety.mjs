#!/usr/bin/env node
import fs from "fs";

const routePath = "app/api/admin/clients/[id]/invoice/[invoiceId]/route.ts";
const packagePath = "package.json";
const route = fs.readFileSync(routePath, "utf8");
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

function mustNotMatch(label, text, regex, description) {
  if (!regex.test(text)) pass(`${label}: does not match ${description}`);
  else fail(`${label}: matched forbidden ${description}`);
}

console.log("=== VERIFY PROVIDER CLIENT INVOICE DETAIL SAFETY ===");

mustContain("route", route, "export async function GET");
mustContain("route", route, "provider-client-invoice-detail");
mustContain("route", route, "mode: \"read-only\"");
mustContain("route", route, "providerClientInvoice.findUnique");
mustContain("route", route, "include:");
mustContain("route", route, "lines:");
mustContain("route", route, "receiptRowsMarkedWithThisInvoiceId");
mustContain("route", route, "receiptLineSourceIds");
mustContain("route", route, "receiptRowsFound");
mustContain("route", route, "receiptLineSourceIdsMissing");
mustContain("route", route, "receiptRowsMarkedWithAnotherInvoiceId");
mustContain("route", route, "receiptRowsUnmarked");
mustContain("route", route, "receiptMarkDetails");
mustContain("route", route, "markStatus");
mustContain("route", route, "isDraft");
mustContain("route", route, "isFinalized");
mustContain("route", route, "Read-only invoice detail");
mustContain("route", route, "does not create, finalize, update, void, remit, print, email, queue");

mustNotMatch("route", route, /providerClientInvoice\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/i, "ProviderClientInvoice mutation");
mustNotMatch("route", route, /providerClientInvoiceLine\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/i, "ProviderClientInvoiceLine mutation");
mustNotMatch("route", route, /matterPaymentReceipt\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "MatterPaymentReceipt mutation");
mustNotMatch("route", route, /claimIndex\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "ClaimIndex mutation");
mustNotMatch("route", route, /clioFetch|fetchClio|updateClio|from\s+["'][^"']*clio/i, "Clio operational dependency");
mustNotMatch("route", route, /sendEmail|printQueue|generateDocument|finalizeDocument/i, "external output action");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const expectedScript = "node scripts/verify-provider-client-invoice-detail-safety.mjs";
if (pkg.scripts?.["verify:provider-client-invoice-detail-safety"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: provider client invoice detail safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: provider client invoice detail safety PASSED");
