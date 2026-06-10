#!/usr/bin/env node
import fs from "fs";

const routePath = "app/api/admin/clients/[id]/route.ts";
const route = fs.readFileSync(routePath, "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

const required = [
  "function parseCostEntryHistory",
  "voided: Boolean(row?.voided || row?.isVoided || row?.voidedAt || row?.voided_at)",
  "voidedAt: formatDateValue(row?.voidedAt || row?.voided_at)",
  "voidReason: clean(row?.voidReason || row?.void_reason)",
  ".filter((row) => row.amount && row.date && !row.voided)",
  "function costEntryHistoryFromOptions",
  "const historyRows = costEntryHistoryFromOptions(options, candidate.metadataField)",
  "source: \"Lawsuit.lawsuitOptions cost entry history\"",
  "isVoided: false",
  "voidReason: \"\"",
  "costsExpended: {",
  "total: expendedCostRows.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)",
];

const forbidden = [
  ".filter((row) => row.amount && row.date);",
];

let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}

for (const marker of required) {
  if (route.includes(marker)) pass(`route contains ${marker}`);
  else fail(`route missing ${marker}`);
}

for (const marker of forbidden) {
  if (route.includes(marker)) fail(`route still contains stale marker ${marker}`);
  else pass(`route does not contain stale marker ${marker}`);
}

const expectedScript = "node scripts/verify-remittance-excludes-voided-master-costs-safety.mjs";
if (pkg.scripts?.["verify:remittance-excludes-voided-master-costs-safety"] === expectedScript) {
  pass("package.json registers verify:remittance-excludes-voided-master-costs-safety");
} else {
  fail("package.json missing verify:remittance-excludes-voided-master-costs-safety registration");
}

if (failures) {
  console.error(`\nRESULT: remittance excludes voided master costs safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nPASS: remittance excludes voided master costs safety passed");
