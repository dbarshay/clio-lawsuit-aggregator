#!/usr/bin/env node
import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const pkgPath = "package.json";
const text = fs.existsSync(pagePath) ? fs.readFileSync(pagePath, "utf8") : "";
const pkg = fs.existsSync(pkgPath) ? fs.readFileSync(pkgPath, "utf8") : "";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

for (const marker of [
  "masterSettlementTicklers",
  "masterSettlementTicklersLoading",
  "masterSettlementTicklerCreate",
  "masterSettlementTicklerCreateLoading",
  "loadMasterSettlementTicklers",
  "createMasterSettlementPaymentDueTickler",
  "/api/ticklers/settlement-payment-due",
  "data-barsh-settlement-payment-due-tickler-strip",
  "Payment Due Follow-Up",
  "Generic Barsh Matters tickler system",
  "Settlement payment due is the first tickler kind",
  "Create Payment Due Tickler",
  "duplicatePrevented",
]) {
  if (!text.includes(marker)) fail(`${pagePath} missing ${marker}`);
}

const stripIndex = text.indexOf("data-barsh-settlement-payment-due-tickler-strip");
const stripWindow = stripIndex >= 0 ? text.slice(stripIndex, stripIndex + 9000) : "";

for (const forbidden of [
  "/api/settlements/writeback",
  "/api/settlements/current-values",
  "/api/documents/finalize",
  "/api/documents/print-queue",
  "calendarEventsCreated: true",
  "emailsSent: true",
  "mattersClosed: true",
]) {
  if (stripWindow.includes(forbidden)) fail(`tickler UI strip contains forbidden side-effect marker ${forbidden}`);
}

if (!pkg.includes("verify:settlement-payment-due-tickler-ui-safety")) {
  fail(`${pkgPath} missing verify:settlement-payment-due-tickler-ui-safety script`);
}

if (!process.exitCode) {
  pass("settlement payment due tickler UI wiring is local-first and side-effect safe");
}
