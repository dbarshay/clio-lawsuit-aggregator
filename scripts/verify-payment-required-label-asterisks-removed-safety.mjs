import fs from "node:fs";

const directPage = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const lawsuitPage = fs.readFileSync("app/matters/page.tsx", "utf8");
const directVerifier = fs.readFileSync("scripts/verify-direct-post-payment-workflow-safety.mjs", "utf8");
const lawsuitVerifier = fs.readFileSync("scripts/verify-lawsuit-post-payment-workflow-safety.mjs", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function mustContain(label, text, needle) {
  if (!text.includes(needle)) fail(`${label} missing ${JSON.stringify(needle)}`);
  else pass(label);
}

function mustNotContain(label, text, needle) {
  if (text.includes(needle)) fail(`${label} must not contain ${JSON.stringify(needle)}`);
  else pass(label);
}

// Scope this check to visible JSX label text only. Do not check generic "Amount *",
// because that also matches legitimate arithmetic identifiers such as baseAmount * percent.
const forbiddenVisibleLabelSnippets = [
  "<span>Transaction Type *</span>",
  "<span>Transaction Status *</span>",
  "<span>Transaction Date *</span>",
  "<span>Check Date *</span>",
  "<span>Check Number *</span>",
  "<span>Payment Amount *</span>",
  "<span>Amount *</span>",
  ">Transaction Type *</",
  ">Transaction Status *</",
  ">Transaction Date *</",
  ">Check Date *</",
  ">Check Number *</",
  ">Payment Amount *</",
  ">Amount *</",
];

for (const snippet of forbiddenVisibleLabelSnippets) {
  mustNotContain(`direct payment visible label removes ${snippet}`, directPage, snippet);
  mustNotContain(`lawsuit payment visible label removes ${snippet}`, lawsuitPage, snippet);
}

for (const label of [
  "Transaction Type",
  "Transaction Status",
  "Transaction Date",
  "Check Date",
  "Check Number",
]) {
  mustContain(`direct payment still shows ${label}`, directPage, label);
  mustContain(`lawsuit payment still shows ${label}`, lawsuitPage, label);
}

mustContain("direct transaction type still required by source", directPage, "paymentTransactionTypeInput");
mustContain("direct transaction status still required by source", directPage, "paymentTransactionStatusInput");
mustContain("direct transaction date still required by source", directPage, "paymentDateInput");
mustContain("direct check date still required by source", directPage, "paymentCheckDateInput");
mustContain("direct check number still required by source", directPage, "paymentCheckNumberInput");
mustContain("direct required helper remains", directPage, "function paymentFormRequiredFieldsComplete()");
mustContain("direct disabled submit remains", directPage, "function paymentFormSubmitDisabled()");
mustContain("direct existing verifier confirms required-field completion helper", directVerifier, "direct UI has required-field completion helper");
mustContain("direct existing verifier confirms disabled submit", directVerifier, "direct UI disables submit until required fields complete");

mustContain("lawsuit required helper remains", lawsuitPage, "function masterPaymentRequiredFieldsComplete()");
mustContain("lawsuit transaction type still required", lawsuitPage, "!!String(masterPaymentTransactionTypeInput ||");
mustContain("lawsuit transaction status still required", lawsuitPage, "!!String(masterPaymentTransactionStatusInput ||");
mustContain("lawsuit transaction date still required", lawsuitPage, "!!String(masterPaymentDateInput ||");
mustContain("lawsuit check date still required", lawsuitPage, "!!String(masterPaymentCheckDateInput ||");
mustContain("lawsuit check number still required", lawsuitPage, "!!String(masterPaymentCheckNumberInput ||");
mustContain("lawsuit disabled submit remains", lawsuitPage, "disabled={masterPaymentSubmitDisabled()}");
mustContain("lawsuit existing verifier confirms required checks", lawsuitVerifier, "lawsuit payment requires Check Number");

mustContain("package.json registers verifier", packageJson, "verify:payment-required-label-asterisks-removed-safety");

if (process.exitCode) process.exit(process.exitCode);

console.log("PASS: payment required visible label asterisks removed while validation remains.");
