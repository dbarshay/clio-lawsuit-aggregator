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

const schemaPath = "prisma/schema.prisma";
const migrationPath = "prisma/migrations/20260520120500_add_local_settlement_records/migration.sql";
const packagePath = "package.json";
const pagePath = "app/matters/page.tsx";

const schema = read(schemaPath);
const migration = read(migrationPath);
const packageJson = read(packagePath);
const page = read(pagePath);

console.log("=== LOCAL SETTLEMENT PERSISTENCE SCHEMA SAFETY VERIFICATION ===");

[
  "model LocalSettlementRecord",
  "model LocalSettlementRow",
  "rows LocalSettlementRow[]",
  "LocalSettlementRecord @relation",
  "masterLawsuitId",
  "settledWith",
  "settlementDate",
  "paymentExpectedDate",
  "grossSettlementAmount",
  "allocatedSettlementTotal",
  "interestAmountTotal",
  "principalFeeTotal",
  "interestFeeTotal",
  "totalFee",
  "providerNetTotal",
  "previewSnapshot",
  "roundingAdjustmentsSnapshot",
  "safetySnapshot",
  "voided",
  "@@index([masterLawsuitId])",
  "@@index([settlementRecordId])",
].forEach((needle) => mustContain(schemaPath, schema, needle));

[
  'CREATE TABLE IF NOT EXISTS "LocalSettlementRecord"',
  'CREATE TABLE IF NOT EXISTS "LocalSettlementRow"',
  'FOREIGN KEY ("settlementRecordId")',
  'REFERENCES "LocalSettlementRecord"("id")',
  'ON DELETE CASCADE',
  '"LocalSettlementRecord_masterLawsuitId_idx"',
  '"LocalSettlementRow_matterId_idx"',
].forEach((needle) => mustContain(migrationPath, migration, needle));

[
  '"verify:local-settlement-persistence-schema-safety"',
].forEach((needle) => mustContain(packagePath, packageJson, needle));

[
  "Record Local Settlement",
  "data-barsh-record-local-settlement-guarded-button",
  "Save the settlement to Barsh Matters local settlement tables only",
].forEach((needle) => mustContain(pagePath, page, needle));

[
  "clioFetch(",
  "writeSettlementToClio",
  "settlementWritebackPerformed: true",
].forEach((needle) => mustNotContain(schemaPath, schema, needle));

if (failures) {
  console.error(`=== LOCAL SETTLEMENT PERSISTENCE SCHEMA SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== LOCAL SETTLEMENT PERSISTENCE SCHEMA SAFETY PASSED ===");
