#!/usr/bin/env node
import fs from "node:fs";

const path = "app/matters/page.tsx";
const text = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

if (!text) fail(`${path} missing or empty`);

const required = [
  "masterSettlementHistory",
  "masterSettlementHistoryLoading",
  "loadMasterSettlementHistory",
  "/api/settlements/local-history?masterLawsuitId=",
  "data-barsh-local-settlement-history-panel",
  "Recorded Settlement",
  "Barsh Matters local settlement readback",
  "Clio is not the source of truth for this panel",
  "Refresh Settlement",
  "No local settlement has been recorded for this lawsuit yet",
  "allocatedSettlementTotal",
  "interestAmountTotal",
  "totalFee",
  "providerNetTotal",
  "providerNet",
  "formatSettlementHistoryMoney",
];

for (const marker of required) {
  if (!text.includes(marker)) fail(`missing marker: ${marker}`);
}

const panelIndex = text.indexOf("data-barsh-local-settlement-history-panel");
if (panelIndex < 0) {
  fail("missing local settlement history panel marker");
}

const panelWindow = panelIndex >= 0 ? text.slice(panelIndex, panelIndex + 24000) : "";

const requiredNearPanel = [
  "Recorded Settlement",
  "Refresh Settlement",
  "Payment Due",
  "Principal",
  "Interest",
  "Attorney Fee",
  "Provider Net",
  "record.rows.map",
];

for (const marker of requiredNearPanel) {
  if (!panelWindow.includes(marker)) fail(`panel missing marker: ${marker}`);
}

const forbiddenNearPanel = [
  "/api/settlements/current-values",
  "/api/settlements/writeback",
  "/api/settlements/writeback-preview",
  "settlementWritebackPerformed: true",
];

for (const marker of forbiddenNearPanel) {
  if (panelWindow.includes(marker)) fail(`forbidden legacy/Clio marker near panel: ${marker}`);
}

if (!process.exitCode) {
  pass("master local settlement readback UI is present and local-first");
}
