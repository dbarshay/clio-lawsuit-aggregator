#!/usr/bin/env node
import fs from "fs";

const seed = fs.readFileSync("scripts/seed-transaction-reference-options.mjs", "utf8");
const optionsRoute = fs.readFileSync("app/api/reference-data/options/route.ts", "utf8");
const contract = fs.readFileSync("scripts/verify-transaction-type-management-contract-safety.mjs", "utf8");
const pkg = fs.readFileSync("package.json", "utf8");

function pass(msg) { console.log(`PASS: ${msg}`); }
function fail(msg) { console.error(`FAIL: ${msg}`); process.exitCode = 1; }
function must(text, needle, label) { text.includes(needle) ? pass(label) : fail(`${label}: missing ${needle}`); }

console.log("=== VERIFY TRANSACTION TYPE METADATA SAFETY ===");

for (const key of [
  "remittanceCategory",
  "directMatterAllowed",
  "lawsuitAllowed",
  "defaultStatus",
  "includeOnInvoicePreview",
  "retainerEligible",
  "sortOrder",
  "costCategory",
  "retainerRateKind",
]) must(seed, key, `seed includes ${key}`);

for (const value of [
  'remittanceCategory: "principal_interest"',
  'remittanceCategory: "cost_recovery"',
  'remittanceCategory: "attorney_fee"',
  'defaultStatus: "Do Not Show on Remittance"',
  'includeOnInvoicePreview: false',
  'retainerEligible: false',
]) must(seed, value, `seed includes ${value}`);

must(optionsRoute, "details: true", "options route selects details");
must(optionsRoute, "details: entity.details || null", "options route returns details");
must(contract, "verify:transaction-type-management-contract-safety", "management contract verifier remains registered");
must(pkg, "verify:transaction-type-metadata-safety", "package registers metadata verifier");

if (process.exitCode) {
  console.error("=== TRANSACTION TYPE METADATA SAFETY FAILED ===");
  process.exit(process.exitCode);
}
console.log("=== TRANSACTION TYPE METADATA SAFETY PASSED ===");
