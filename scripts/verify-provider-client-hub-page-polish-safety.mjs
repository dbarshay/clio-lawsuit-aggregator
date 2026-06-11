import fs from "fs";

const pagePath = "app/admin/clients/[id]/page.tsx";
const pkgPath = "package.json";
const page = fs.readFileSync(pagePath, "utf8");
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

function mustAvoidPattern(label, text, regex, description) {
  if (regex.test(text) === false) pass(`${label}: avoids ${description}`);
  else fail(`${label}: matched forbidden ${description}`);
}

console.log("=== VERIFY PROVIDER CLIENT HUB PAGE POLISH SAFETY ===");

mustContain("client page", page, "providerHubCardStyle");
mustContain("client page", page, "providerHubHeaderLabelStyle");
mustContain("client page", page, "providerHubSectionTitleStyle");
mustContain("client page", page, "providerHubButtonBaseStyle");
mustContain("client page", page, "PROVIDER ACCOUNT");
mustContain("client page", page, "Central account profile, billing terms, matter workflow access, and operational notes.");
mustContain("client page", page, "ACCOUNT WORKFLOW");
mustContain("client page", page, "Provider Workflow Hub");
mustContain("client page", page, "Launch account workflows, review related matters, and manage invoice/remittance activity.");
mustContain("client page", page, "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)");
mustContain("client page", page, "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)");
mustContain("client page", page, "linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)");
mustContain("client page", page, "Invoicing / Remittance");
mustContain("client page", page, "Individual Matters");
mustContain("client page", page, "Lawsuit Matters");
mustContain("client page", page, "Account Notes");
mustContain("client page", page, "Internal notes and account-specific reminders for this provider/client.");

mustAvoidPattern("client page", page, /providerClientInvoice\.(create|update|delete|upsert)\s*\(/i, "direct ProviderClientInvoice mutation on hub page");
mustAvoidPattern("client page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation on hub page");

const expected = "node scripts/verify-provider-client-hub-page-polish-safety.mjs";
if (pkg.scripts?.["verify:provider-client-hub-page-polish-safety"] === expected) {
  pass("package.json registers verify:provider-client-hub-page-polish-safety");
} else {
  fail("package.json missing verify:provider-client-hub-page-polish-safety");
}

if (failures) {
  console.error(`\nRESULT: provider/client hub page polish safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: provider/client hub page polish safety PASSED");
