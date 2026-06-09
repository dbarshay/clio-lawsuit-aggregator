#!/usr/bin/env node
import fs from "fs";

const routePath = "app/api/admin/clients/[id]/invoice/create/route.ts";
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

console.log("=== VERIFY PROVIDER CLIENT INVOICE CREATE DRAFT SAFETY ===");

mustContain("route", route, "export async function POST");
mustContain("route", route, "confirmCreateInvoiceDraft");
mustContain("route", route, "provider-client-invoice-create-draft");
mustContain("route", route, "mode: \"local-draft-created\"");
mustContain("route", route, "prisma.$transaction");
mustContain("route", route, "providerClientInvoice.create");
mustContain("route", route, "providerClientInvoiceLine.createMany");
mustContain("route", route, "status: \"draft\"");
mustContain("route", route, "uniqueInvoiceNumber");
mustContain("route", route, "Created a local draft invoice and frozen invoice lines only");
mustContain("route", route, "does not finalize invoices");
mustContain("route", route, "does not finalize invoices, update MatterPaymentReceipt.invoiceId");

mustNotMatch("route", route, /matterPaymentReceipt\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "MatterPaymentReceipt mutation");
mustNotMatch("route", route, /claimIndex\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "ClaimIndex mutation");
mustNotMatch("route", route, /finalizedAt\s*:\s*new Date|status\s*:\s*["']finalized["']/i, "finalization");
mustNotMatch("route", route, /clioFetch|fetchClio|updateClio|from\s+["'][^"']*clio/i, "Clio operational dependency");
mustNotMatch("route", route, /sendEmail|printQueue|generateDocument|finalizeDocument/i, "external output action");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const expectedScript = "node scripts/verify-provider-client-invoice-create-draft-safety.mjs";
if (pkg.scripts?.["verify:provider-client-invoice-create-draft-safety"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: provider client invoice create-draft safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: provider client invoice create-draft safety PASSED");
