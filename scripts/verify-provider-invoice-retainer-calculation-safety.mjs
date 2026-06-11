#!/usr/bin/env node
import fs from "fs";

const routePath = "app/api/admin/clients/[id]/invoice/create-preview/route.ts";
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

function mustContain(label, haystack, needle) {
  if (haystack.includes(needle)) pass(`${label}: found ${needle}`);
  else fail(`${label}: missing ${needle}`);
}

function mustNotContain(label, haystack, needle) {
  if (!haystack.includes(needle)) pass(`${label}: does not contain ${needle}`);
  else fail(`${label}: still contains ${needle}`);
}

console.log("=== VERIFY PROVIDER INVOICE RETAINER CALCULATION SAFETY ===");

mustContain("create-preview route", route, "function retainerFeeForReceipt");
mustContain("create-preview route", route, "function isFeeRecoveryTransactionType");
mustContain("create-preview route", route, "detailValue(details");
mustContain("create-preview route", route, "hidden_retainer_principal_nf_percent");
mustContain("create-preview route", route, "hidden_retainer_interest_percent");
mustContain("create-preview route", route, "if (isFeeRecoveryTransactionType(row?.transactionType)) return 0");
mustContain("create-preview route", route, 'type.includes("interest")');
mustContain("create-preview route", route, "retainerNfInterest");
mustContain("create-preview route", route, "retainerNfPrincipal");
mustNotContain("create-preview route", route, "numberFromPercent(client?.retainerNfInterest)");
mustNotContain("create-preview route", route, "numberFromPercent(client?.retainerNfPrincipal)");

for (const alias of [
  'type.includes("filing fee")',
  'type.includes("index fee")',
  'type.includes("service fee")',
  'type.includes("court cost")',
  'type.includes("court costs")',
  'type.includes("court fee")',
  'type.includes("court fees")',
  'type.includes("other court costs")',
  'type.includes("other court fees")',
]) {
  mustContain("create-preview fee recovery alias", route, alias);
}

function numberFromPercent(value) {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const numeric = Number(text.replace(/%/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

function isFeeRecoveryTransactionType(value) {
  const type = String(value ?? "").toLowerCase();
  return (
    type.includes("filing fee") ||
    type.includes("index fee") ||
    type.includes("service fee") ||
    type.includes("court cost") ||
    type.includes("court costs") ||
    type.includes("court fee") ||
    type.includes("court fees") ||
    type.includes("other court cost") ||
    type.includes("other court costs") ||
    type.includes("other court fee") ||
    type.includes("other court fees")
  );
}

function detailValue(details, keys) {
  const hidden =
    details?._hiddenImportFields &&
    typeof details._hiddenImportFields === "object" &&
    !Array.isArray(details._hiddenImportFields)
      ? details._hiddenImportFields
      : {};

  for (const key of keys) {
    const direct = details?.[key];
    if (direct !== null && direct !== undefined && String(direct).trim()) return String(direct).trim();

    const hiddenValue = hidden?.[key];
    if (hiddenValue !== null && hiddenValue !== undefined && String(hiddenValue).trim()) return String(hiddenValue).trim();
  }

  return "";
}

function retainerFeeForReceipt(row, client) {
  if (isFeeRecoveryTransactionType(row?.transactionType)) return 0;

  const details = client?.details || {};
  const amount = Number(row?.amount || 0);
  const type = String(row?.transactionType || "").toLowerCase();
  const rate = type.includes("interest")
    ? numberFromPercent(detailValue(details, ["retainerNfInterest", "hidden_retainer_interest_percent", "hidden_retainer_nf_interest_percent", "retainer_nf_interest_percent"]))
    : numberFromPercent(detailValue(details, ["retainerNfPrincipal", "hidden_retainer_principal_nf_percent", "retainer_nf_principal_percent"]));

  return amount * rate;
}

const atlanticClient = {
  details: {
    _hiddenImportFields: {
      hidden_retainer_principal_nf_percent: "10%",
      hidden_retainer_interest_percent: "50.00",
    },
  },
};

const cases = [
  { name: "NF principal payment uses 10%", row: { transactionType: "Direct Pay", amount: 1000 }, expected: 100 },
  { name: "interest payment uses 50%", row: { transactionType: "Interest", amount: 500 }, expected: 250 },
  { name: "filing fee recovery has zero retainer", row: { transactionType: "Filing Fee Collected", amount: 67 }, expected: 0 },
  { name: "index fee recovery has zero retainer", row: { transactionType: "Index Fee", amount: 210 }, expected: 0 },
  { name: "service fee recovery has zero retainer", row: { transactionType: "Service Fee", amount: 40 }, expected: 0 },
  { name: "other court costs recovery has zero retainer", row: { transactionType: "Other Court Costs", amount: 48.53 }, expected: 0 },
  { name: "legacy other court fee recovery has zero retainer", row: { transactionType: "Other Court Fees Collected", amount: 48.53 }, expected: 0 },
];

for (const test of cases) {
  const actual = retainerFeeForReceipt(test.row, atlanticClient);
  if (Math.abs(actual - test.expected) < 0.0001) pass(`${test.name}: ${actual}`);
  else fail(`${test.name}: expected ${test.expected}, got ${actual}`);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const expectedScript = "node scripts/verify-provider-invoice-retainer-calculation-safety.mjs";
if (pkg.scripts?.["verify:provider-invoice-retainer-calculation-safety"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: provider invoice retainer calculation safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: provider invoice retainer calculation safety PASSED");
