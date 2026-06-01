#!/usr/bin/env node

import fs from "fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

let failures = 0;

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  console.error(`FAIL ${message}`);
  failures += 1;
}

function mustContain(label, text, marker) {
  if (!text.includes(marker)) {
    fail(`${label}: missing ${marker}`);
    return;
  }
  pass(`${label}: found ${marker}`);
}

function mustNotContain(label, text, marker) {
  if (text.includes(marker)) {
    fail(`${label}: must not contain ${marker}`);
    return;
  }
  pass(`${label}: does not contain ${marker}`);
}

function mustMatch(label, text, regex, description) {
  if (!regex.test(text)) {
    fail(`${label}: missing ${description}`);
    return;
  }
  pass(`${label}: found ${description}`);
}

console.log("=== MAILDROP ADDRESS REGISTRY SAFETY VERIFICATION ===");

const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql");
const registry = read("lib/graph/maildropRegistry.ts");
const discoveryRoute = read("app/api/graph/maildrop-discovery/route.ts");
const resolveRoute = read("app/api/documents/clio-maildrop-resolve/route.ts");
const packageJson = read("package.json");

console.log("");
console.log("=== VERIFY SCHEMA AND MIGRATION ===");
mustContain("prisma/schema.prisma", schema, "model MaildropAddress");
mustMatch(
  "prisma/schema.prisma",
  schema,
  /clioMaildropEmail\s+String\??\s+@unique/,
  "clioMaildropEmail String/String? @unique"
);
mustContain("prisma/schema.prisma", schema, "lastResolvedAt");
mustContain("prisma/schema.prisma", schema, "@@index([masterLawsuitId])");

mustContain("prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql", migration, 'CREATE TABLE "MaildropAddress"');
mustContain("prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql", migration, 'CREATE UNIQUE INDEX "MaildropAddress_clioMaildropEmail_key"');
mustContain("prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql", migration, 'FROM "EmailThread"');
mustContain("prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql", migration, "email_thread_backfill");
mustContain("prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql", migration, 'ON CONFLICT ("clioMaildropEmail") DO UPDATE');

console.log("");
console.log("=== VERIFY REGISTRY HELPER ===");
mustContain("lib/graph/maildropRegistry.ts", registry, "export async function upsertMaildropAddress");
mustContain("lib/graph/maildropRegistry.ts", registry, "prisma.maildropAddress.upsert");
mustContain("lib/graph/maildropRegistry.ts", registry, "export async function loadKnownMaildropAddresses");
mustContain("lib/graph/maildropRegistry.ts", registry, "prisma.maildropAddress.findMany");
mustContain("lib/graph/maildropRegistry.ts", registry, "prisma.emailThread.findMany");
mustContain("lib/graph/maildropRegistry.ts", registry, "email_thread_fallback");

console.log("");
console.log("=== VERIFY DISCOVERY USES REGISTRY HELPER ===");
mustContain("app/api/graph/maildrop-discovery/route.ts", discoveryRoute, 'import { loadKnownMaildropAddresses } from "@/lib/graph/maildropRegistry";');
mustContain("app/api/graph/maildrop-discovery/route.ts", discoveryRoute, "return loadKnownMaildropAddresses(limit);");
mustContain("app/api/graph/maildrop-discovery/route.ts", discoveryRoute, "graph-maildrop-discovery");

console.log("");
console.log("=== VERIFY CLIO MAILDROP RESOLVE UPSERTS LOCAL REGISTRY ONLY ===");
mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'import { upsertMaildropAddress } from "@/lib/graph/maildropRegistry";');
mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, "await upsertMaildropAddress");
mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'source: "clio_maildrop_resolve"');
mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'route: "/api/documents/clio-maildrop-resolve"');

[
  "createDraft",
  "sendMail",
  ".sendMail",
  "persistGraphDraftMetadata",
  "clio.documents",
  "uploadDocument",
  "clioDocumentUpload",
  "settlementClioWriteback",
].forEach((marker) => mustNotContain("lib/graph/maildropRegistry.ts", registry, marker));

console.log("");
console.log("=== VERIFY PACKAGE SCRIPT REGISTRATION ===");
mustContain("package.json", packageJson, "verify:maildrop-address-registry-safety");

if (failures > 0) {
  console.error(`\n=== MAILDROP ADDRESS REGISTRY SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("");
console.log("=== MAILDROP ADDRESS REGISTRY SAFETY PASSED ===");
console.log("MailDrop registry schema, migration, helper, discovery usage, and Clio MailDrop resolve upsert behavior are verified.");
console.log("No draft creation, email sending, Clio document upload, or settlement writeback is wired through the MailDrop registry helper.");
