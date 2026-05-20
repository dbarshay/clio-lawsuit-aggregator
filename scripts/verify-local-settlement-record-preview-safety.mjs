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

const routePath = "app/api/settlements/local-record-preview/route.ts";
const pagePath = "app/matters/page.tsx";
const packagePath = "package.json";

const route = read(routePath);
const page = read(pagePath);
const packageJson = read(packagePath);

console.log("=== LOCAL SETTLEMENT RECORD PREVIEW SAFETY VERIFICATION ===");

[
  "export async function POST",
  'action: "local-settlement-record-preview"',
  "previewOnly: true",
  "wouldSaveRecord",
  'targetModel: "LocalSettlementRecord"',
  'targetRowModel: "LocalSettlementRow"',
  "readyForLocalSettlementRecordSavePreview",
  "databaseRecordsChanged: false",
  "clioRecordsChanged: false",
  "documentsGenerated: false",
  "printQueueChanged: false",
  "mattersClosed: false",
  "settlementWritebackPerformed: false",
  "does not write the database, write Clio, generate documents, print, queue, or close matters",
].forEach((needle) => mustContain(routePath, route, needle));

[
  "prisma.",
  "clioFetch(",
  "method: \"PATCH\"",
  "method: \"DELETE\"",
  ".create(",
  ".update(",
  ".delete(",
  "LocalSettlementRecord.create",
  "LocalSettlementRow.create",
].forEach((needle) => mustNotContain(routePath, route, needle));

[
  "masterSettlementRecordPreview",
  "runMasterSettlementRecordPreview",
  "/api/settlements/local-record-preview",
  "data-barsh-record-local-settlement-guarded-button",
  "Local Settlement Save Preview",
  "would save to LocalSettlementRecord",
].forEach((needle) => mustContain(pagePath, page, needle));

mustContain(packagePath, packageJson, '"verify:local-settlement-record-preview-safety"');

if (failures) {
  console.error(`=== LOCAL SETTLEMENT RECORD PREVIEW SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== LOCAL SETTLEMENT RECORD PREVIEW SAFETY PASSED ===");
