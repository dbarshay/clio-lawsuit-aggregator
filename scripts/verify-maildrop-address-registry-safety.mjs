import fs from "node:fs";

let failures = 0;

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function mustContain(path, text, marker) {
  if (!text.includes(marker)) {
    console.error(`FAIL ${path}: missing ${marker}`);
    failures += 1;
  } else {
    console.log(`PASS ${path}: found ${marker}`);
  }
}

function mustNotContain(path, text, marker) {
  if (text.includes(marker)) {
    console.error(`FAIL ${path}: must not contain ${marker}`);
    failures += 1;
  } else {
    console.log(`PASS ${path}: does not contain ${marker}`);
  }
}

console.log("=== MAILDROP ADDRESS REGISTRY SAFETY VERIFICATION ===");

const schemaPath = "prisma/schema.prisma";
const migrationPath = "prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql";
const helperPath = "lib/graph/maildropRegistry.ts";
const discoveryPath = "app/api/graph/maildrop-discovery/route.ts";
const resolvePath = "app/api/documents/clio-maildrop-resolve/route.ts";
const packagePath = "package.json";

const schema = read(schemaPath);
const migration = read(migrationPath);
const helper = read(helperPath);
const discovery = read(discoveryPath);
const resolve = read(resolvePath);
const pkg = read(packagePath);

console.log("\n=== VERIFY SCHEMA AND MIGRATION ===");
[
  "model MaildropAddress",
  "clioMaildropEmail   String   @unique",
  "lastResolvedAt",
  "@@index([masterLawsuitId])",
].forEach((marker) => mustContain(schemaPath, schema, marker));

[
  'CREATE TABLE "MaildropAddress"',
  'CREATE UNIQUE INDEX "MaildropAddress_clioMaildropEmail_key"',
  'FROM "EmailThread"',
  'email_thread_backfill',
  'ON CONFLICT ("clioMaildropEmail") DO UPDATE',
].forEach((marker) => mustContain(migrationPath, migration, marker));

console.log("\n=== VERIFY REGISTRY HELPER ===");
[
  "export async function upsertMaildropAddress",
  "prisma.maildropAddress.upsert",
  "export async function loadKnownMaildropAddresses",
  "prisma.maildropAddress.findMany",
  "prisma.emailThread.findMany",
  "email_thread_fallback",
].forEach((marker) => mustContain(helperPath, helper, marker));

console.log("\n=== VERIFY DISCOVERY USES REGISTRY HELPER ===");
[
  'import { loadKnownMaildropAddresses } from "@/lib/graph/maildropRegistry";',
  "return loadKnownMaildropAddresses(limit);",
  "graph-maildrop-discovery",
].forEach((marker) => mustContain(discoveryPath, discovery, marker));

console.log("\n=== VERIFY CLIO MAILDROP RESOLVE UPSERTS LOCAL REGISTRY ONLY ===");
[
  'import { upsertMaildropAddress } from "@/lib/graph/maildropRegistry";',
  "await upsertMaildropAddress",
  'source: "clio_maildrop_resolve"',
  'route: "/api/documents/clio-maildrop-resolve"',
].forEach((marker) => mustContain(resolvePath, resolve, marker));

[
  "createDraft",
  "sendMail",
  ".sendMail",
  "persistGraphDraftMetadata",
  "clio.documents",
  "uploadDocument",
  "clioDocumentUpload",
  "settlementClioWriteback",
].forEach((marker) => mustNotContain(helperPath, helper, marker));

console.log("\n=== VERIFY PACKAGE SCRIPT REGISTRATION ===");
mustContain(packagePath, pkg, "verify:maildrop-address-registry-safety");

if (failures > 0) {
  console.error(`\n=== MAILDROP ADDRESS REGISTRY SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("\n=== MAILDROP ADDRESS REGISTRY SAFETY PASSED ===");
console.log("MailDrop registry stores local MailDrop metadata for discovery without draft creation, email sending, Clio writes, or document uploads.");
