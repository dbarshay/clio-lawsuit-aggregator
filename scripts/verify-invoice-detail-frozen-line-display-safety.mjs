#!/usr/bin/env node
import fs from "fs";

const files = {
  page: "app/admin/clients/[id]/invoice/page.tsx",
  detailRoute: "app/api/admin/clients/[id]/invoice/[invoiceId]/route.ts",
  finalizeRoute: "app/api/admin/clients/[id]/invoice/[invoiceId]/finalize/route.ts",
  schema: "prisma/schema.prisma",
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

function mustMatch(label, body, regex, description) {
  if (regex.test(body)) pass(`${label}: matched ${description}`);
  else fail(`${label}: missing ${description}`);
}

function mustNotMatch(label, body, regex, description) {
  if (!regex.test(body)) pass(`${label}: avoids ${description}`);
  else fail(`${label}: matched forbidden ${description}`);
}

console.log("=== VERIFY INVOICE DETAIL FROZEN LINE DISPLAY SAFETY ===");

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) fail(`missing file ${file}`);
}

const page = text(files.page);
const detailRoute = text(files.detailRoute);
const finalizeRoute = text(files.finalizeRoute);
const schema = text(files.schema);
const pkg = JSON.parse(text(files.packageJson));

for (const field of [
  "dateOfLoss",
  "dateOfService",
  "dosEnd",
  "caseType",
  "checkDate",
  "checkNumber",
  "billedAmount",
  "amount",
  "retainer",
  "sourceType",
  "sourceMatterId",
  "sourceMatterDisplayNumber",
  "sourcePaymentReceiptId",
  "sourceSettlementId",
  "rowSnapshot",
]) {
  mustContain("ProviderClientInvoiceLine schema", schema, field);
}

mustContain("detail route", detailRoute, "include: {");
mustContain("detail route", detailRoute, "lines:");
mustContain("detail route", detailRoute, "action: \"provider-client-invoice-detail\"");
mustContain("detail route", detailRoute, "mode: \"read-only\"");
mustContain("detail route", detailRoute, "This route does not create, finalize, update, void, remit, print, email, queue, mutate source payment rows, update ClaimIndex, or mutate Clio.");

mustContain("invoice page", page, "function invoiceLineDosEnd");
mustContain("invoice page", page, "line?.dosEnd");
mustContain("invoice page", page, "line?.rowSnapshot?.dateOfServiceEnd");
mustContain("invoice page", page, "line?.rowSnapshot?.dosEnd");
mustContain("invoice page", page, "dateOnly(invoiceLineDosEnd(line))");
mustContain("invoice page", page, "dateOnly(line.dateOfLoss)");
mustContain("invoice page", page, "line.caseType");
mustContain("invoice page", page, "dateOnly(line.checkDate)");
mustContain("invoice page", page, "line.checkNumber");
mustContain("invoice page", page, "money(line.billedAmount)");
mustContain("invoice page", page, "money(line.amount)");
mustContain("invoice page", page, "money(line.retainerFee)");

// Narrow display contract: Step 2 may still use create-preview elsewhere on the page.
// Invoice detail/review must render from persisted invoice.lines returned by the detail endpoint.
mustMatch(
  "invoice page",
  page,
  /const\s+lines\s*=\s*Array\.isArray\(invoice\.lines\)\s*\?\s*invoice\.lines\s*:\s*\[\]/,
  "persisted invoice.lines are used for invoice detail printable/review display"
);

mustContain("invoice page", page, "async function loadInvoiceDetail(invoiceId: string)");
mustContain(
  "invoice page",
  page,
  "fetch(`/api/admin/clients/${encodeURIComponent(id)}/invoice/${encodeURIComponent(invoiceId)}`"
);

mustContain("finalize route", finalizeRoute, "include: { lines: true }");
mustContain("finalize route", finalizeRoute, "invoice.lines");
mustContain("finalize route", finalizeRoute, "tx.matterPaymentReceipt.updateMany");
mustContain("finalize route", finalizeRoute, "data: { invoiceId: invoice.id }");
mustContain("finalize route", finalizeRoute, "does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records");

mustNotMatch(
  "detail route",
  detailRoute,
  /claimIndex\.(?:findMany|findFirst|findUnique|create|update|upsert|delete|deleteMany|updateMany)\s*\(/i,
  "ClaimIndex dependency for invoice detail display"
);

mustNotMatch(
  "detail route",
  detailRoute,
  /matterPaymentReceipt\.(?:create|update|updateMany|upsert|delete|deleteMany)\s*\(/i,
  "MatterPaymentReceipt mutation in invoice detail"
);

mustNotContain(
  "invoice page",
  page,
  "[dateOnly(line.dateOfService), dateOnly(line.dateOfServiceEnd)]"
);

const expectedScript = "node scripts/verify-invoice-detail-frozen-line-display-safety.mjs";
if (pkg.scripts?.["verify:invoice-detail-frozen-line-display-safety"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: invoice detail frozen-line display safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: invoice detail frozen-line display safety PASSED");
