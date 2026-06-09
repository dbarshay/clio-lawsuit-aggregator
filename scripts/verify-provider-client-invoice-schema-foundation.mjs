#!/usr/bin/env node
import fs from "fs";

const schemaPath = "prisma/schema.prisma";
const packagePath = "package.json";
const schema = fs.readFileSync(schemaPath, "utf8");
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

function mustMatch(label, text, regex, description) {
  if (regex.test(text)) pass(`${label}: found ${description}`);
  else fail(`${label}: missing ${description}`);
}

console.log("=== VERIFY PROVIDER CLIENT INVOICE SCHEMA FOUNDATION ===");

mustContain("schema", schema, "model ProviderClientInvoice");
mustMatch("schema", schema, /\binvoiceNumber\s+String\s+@unique\b/, "unique invoiceNumber");
mustMatch("schema", schema, /\bproviderClientInfoId\s+String\?/, "providerClientInfoId optional string");
mustMatch("schema", schema, /\breferenceEntityId\s+String\b/, "referenceEntityId string");
mustMatch("schema", schema, /\bproviderDisplayName\s+String\b/, "providerDisplayName string");
mustMatch("schema", schema, /\bstatus\s+String\s+@default\("draft"\)/, "draft status default");
mustMatch("schema", schema, /\breceiptRowCount\s+Int\s+@default\(0\)/, "receipt row count default");
mustMatch("schema", schema, /\bprincipalInterestTotal\s+Float\s+@default\(0\)/, "principal interest total default");
mustMatch("schema", schema, /\bfilingFeePaymentTotal\s+Float\s+@default\(0\)/, "filing fee payment total default");
mustMatch("schema", schema, /\bcostsExpendedTotal\s+Float\s+@default\(0\)/, "costs expended total default");
mustMatch("schema", schema, /\bretainerFeeTotal\s+Float\s+@default\(0\)/, "retainer fee total default");
mustMatch("schema", schema, /\binvoicePackageTotal\s+Float\s+@default\(0\)/, "invoice package total default");
mustMatch("schema", schema, /\bclientSnapshot\s+Json\?/, "client snapshot json");
mustMatch("schema", schema, /\bfilterSnapshot\s+Json\?/, "filter snapshot json");
mustMatch("schema", schema, /\btotalsSnapshot\s+Json\?/, "totals snapshot json");
mustMatch("schema", schema, /\blines\s+ProviderClientInvoiceLine\[\]/, "invoice lines relation");

mustContain("schema", schema, "model ProviderClientInvoiceLine");
mustMatch("schema", schema, /\blineType\s+String\b/, "lineType string");
mustMatch("schema", schema, /\bsourceId\s+String\?/, "sourceId optional string");
mustMatch("schema", schema, /\bsourceTable\s+String\?/, "sourceTable optional string");
mustMatch("schema", schema, /\bretainerFee\s+Float\s+@default\(0\)/, "line retainer fee default");
mustMatch("schema", schema, /\browSnapshot\s+Json\?/, "row snapshot json");
mustContain("schema", schema, "invoice ProviderClientInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)");

mustContain("schema", schema, "@@index([invoiceId])");
mustContain("schema", schema, "@@index([referenceEntityId])");
mustContain("schema", schema, "@@index([providerClientInfoId])");
mustContain("schema", schema, "@@index([status])");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const expectedScript = "node scripts/verify-provider-client-invoice-schema-foundation.mjs";
if (pkg.scripts?.["verify:provider-client-invoice-schema-foundation"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: provider client invoice schema foundation FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: provider client invoice schema foundation PASSED");
