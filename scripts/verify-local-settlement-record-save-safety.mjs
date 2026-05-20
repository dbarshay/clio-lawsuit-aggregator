import fs from "node:fs";

let failures = 0;

function read(path) {
  try {
    return fs.readFileSync(path, "utf8");
  } catch {
    failures += 1;
    console.error(`FAIL: missing ${path}`);
    return "";
  }
}

function mustContain(label, text, needle) {
  if (text.includes(needle)) console.log(`PASS: ${label}: found ${needle}`);
  else {
    failures += 1;
    console.error(`FAIL: ${label}: missing ${needle}`);
  }
}

function mustNotContain(label, text, needle) {
  if (!text.includes(needle)) console.log(`PASS: ${label}: does not contain ${needle}`);
  else {
    failures += 1;
    console.error(`FAIL: ${label}: must not contain ${needle}`);
  }
}

const routePath = "app/api/settlements/local-record/route.ts";
const pagePath = "app/matters/page.tsx";
const packagePath = "package.json";

const route = read(routePath);
const page = read(pagePath);
const packageJson = read(packagePath);

console.log("=== LOCAL SETTLEMENT RECORD SAVE SAFETY VERIFICATION ===");

[
  "export async function POST",
  'action: "local-settlement-record-save"',
  "prisma.localSettlementRecord.create",
  "rows: {",
  "create: validation.settlementRows.map",
  'databaseWriteScope: ["LocalSettlementRecord", "LocalSettlementRow"]',
  "clioRecordsChanged: false",
  "documentsGenerated: false",
  "printQueueChanged: false",
  "mattersClosed: false",
  "settlementWritebackPerformed: false",
  "An active local settlement record already exists",
].forEach((needle) => mustContain(routePath, route, needle));

[
  "clioFetch(",
  "writeSettlementToClio",
  "previewSettlementWritebackToClio",
  "prisma.claimIndex.update",
  "prisma.claimIndex.create",
  "prisma.documentPrintQueueItem.create",
  "prisma.documentFinalization.create",
  "prisma.settlementWriteback.create",
  "method: \"PATCH\"",
  "method: \"DELETE\"",
].forEach((needle) => mustNotContain(routePath, route, needle));

[
  "/api/settlements/local-record",
  "Local Settlement Save Result",
  "Barsh Matters local settlement tables only",
  "databaseRecordsChanged",
].forEach((needle) => mustContain(pagePath, page, needle));

mustContain(packagePath, packageJson, '"verify:local-settlement-record-save-safety"');

if (failures) {
  console.error(`=== LOCAL SETTLEMENT RECORD SAVE SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== LOCAL SETTLEMENT RECORD SAVE SAFETY PASSED ===");
