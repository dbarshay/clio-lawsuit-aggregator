#!/usr/bin/env node
import fs from "node:fs";

const schemaPath = "prisma/schema.prisma";
const routePath = "app/api/ticklers/settlement-payment-due/route.ts";
const migrationPath = "prisma/migrations/20260520213000_add_local_workflow_ticklers/migration.sql";
const pkgPath = "package.json";

const schema = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, "utf8") : "";
const route = fs.existsSync(routePath) ? fs.readFileSync(routePath, "utf8") : "";
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, "utf8") : "";
const pkg = fs.existsSync(pkgPath) ? fs.readFileSync(pkgPath, "utf8") : "";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

for (const marker of [
  "model LocalWorkflowTickler",
  "kind",
  "source",
  "status",
  "priority",
  "masterLawsuitId",
  "settlementRecordId",
  "dueDate",
  "@@index([settlementRecordId])",
]) {
  if (!schema.includes(marker)) fail(`${schemaPath} missing ${marker}`);
}

for (const marker of [
  'CREATE TABLE "LocalWorkflowTickler"',
  '"settlementRecordId" TEXT',
  '"dueDate" TEXT',
  'CREATE INDEX "LocalWorkflowTickler_settlementRecordId_idx"',
]) {
  if (!migration.includes(marker)) fail(`${migrationPath} missing ${marker}`);
}

for (const marker of [
  'const TICKLER_KIND = "settlement_payment_due_followup"',
  "prisma.localSettlementRecord.findFirst",
  "prisma.localWorkflowTickler.findMany",
  "prisma.localWorkflowTickler.findFirst",
  "prisma.localWorkflowTickler.create",
  "previewOnly",
  "duplicatePrevented",
  "sourceOfTruth: \"barsh-matters-local\"",
  "clioRecordsChanged: false",
  "documentsGenerated: false",
  "printQueueChanged: false",
  "mattersClosed: false",
  "calendarEventsCreated: false",
  "emailsSent: false",
]) {
  if (!route.includes(marker)) fail(`${routePath} missing ${marker}`);
}

for (const forbidden of [
  "clio.",
  "clioDocumentUpload",
  "fetch(\"https://app.clio.com",
  "sendMail",
  "graphClient",
  "calendar.events",
  "prisma.localSettlementRecord.update",
  "prisma.localSettlementRow.update",
]) {
  if (route.includes(forbidden)) fail(`${routePath} contains forbidden side-effect marker ${forbidden}`);
}

if (!pkg.includes("verify:local-settlement-tickler-foundation-safety")) {
  fail(`${pkgPath} missing verify:local-settlement-tickler-foundation-safety`);
}

if (!process.exitCode) {
  pass("local settlement tickler foundation is local-first and side-effect safe");
}
