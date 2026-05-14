#!/usr/bin/env node

import fs from "fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function mustContain(label, text, needle) {
  if (text.includes(needle)) {
    pass(`${label}: found ${needle}`);
  } else {
    fail(`${label}: missing ${needle}`);
  }
}

function mustNotContain(label, text, needle) {
  if (!text.includes(needle)) {
    pass(`${label}: does not contain ${needle}`);
  } else {
    fail(`${label}: unexpectedly contains ${needle}`);
  }
}

console.log("=== VERIFY LOCAL REFERENCE DATA SAFETY ===");

const schema = read("prisma/schema.prisma");
const helper = read("lib/referenceData.ts");
const entityRoute = read("app/api/reference-data/entities/route.ts");
const aliasRoute = read("app/api/reference-data/aliases/route.ts");
const packageJson = read("package.json");
const verifyProd = read("scripts/verify-prod.sh");

console.log("");
console.log("=== VERIFY PRISMA LOCAL REFERENCE MODELS ===");
mustContain("schema", schema, "model ReferenceEntity");
mustContain("schema", schema, "model ReferenceAlias");
mustContain("schema", schema, "aliases");
mustContain("schema", schema, "ReferenceAlias[]");
mustContain("schema", schema, "entity");
mustContain("schema", schema, "ReferenceEntity @relation");
mustContain("schema", schema, "@@unique([type, normalizedName])");
mustContain("schema", schema, "@@unique([entityId, normalizedAlias])");
mustContain("schema", schema, "active");
mustContain("schema", schema, "Boolean  @default(true)");
mustContain("schema", schema, "details");
mustContain("schema", schema, "Json?");
mustContain("schema", schema, "source");
mustContain("schema", schema, 'String   @default("barsh-matters-local")');

console.log("");
console.log("=== VERIFY TARGETED TYPE FOUNDATION ===");
mustContain("helper", helper, "REFERENCE_ENTITY_TYPES");
mustContain("helper", helper, "individual");
mustContain("helper", helper, "adversary_attorney");
mustContain("helper", helper, "insurer_company");
mustContain("helper", helper, "provider_client");
mustContain("helper", helper, "treating_provider");
mustContain("helper", helper, "patient");
mustContain("helper", helper, "court_venue");
mustContain("helper", helper, "service_type");
mustContain("helper", helper, "denial_reason");
mustContain("helper", helper, "transaction_type");
mustContain("helper", helper, "transaction_status");
mustContain("helper", helper, "normalizeReferenceEntityType");
mustContain("helper", helper, "normalizeReferenceText");

console.log("");
console.log("=== VERIFY ENTITY ROUTE IS LOCAL-FIRST AND AUDITED ===");
mustContain("entity route", entityRoute, "export async function GET");
mustContain("entity route", entityRoute, "export async function POST");
mustContain("entity route", entityRoute, "export async function PATCH");
mustContain("entity route", entityRoute, "prisma.referenceEntity.findMany");
mustContain("entity route", entityRoute, "prisma.referenceEntity.create");
mustContain("entity route", entityRoute, "prisma.referenceEntity.update");
mustContain("entity route", entityRoute, "createMatterAuditLogEntry");
mustContain("entity route", entityRoute, "reference_entity_created");
mustContain("entity route", entityRoute, "reference_entity_updated");
mustContain("entity route", entityRoute, "reference_entity_deactivated");
mustContain("entity route", entityRoute, "reference_entity_reactivated");
mustContain("entity route", entityRoute, "parseDetails");
mustContain("entity route", entityRoute, "Details must be valid JSON.");
mustContain("entity route", entityRoute, "localBarshMattersReferenceData: true");
mustContain("entity route", entityRoute, "clioData: false");
mustContain("entity route", entityRoute, "noClioRecordsChanged: true");
mustContain("entity route", entityRoute, "hardDeleteSupported: false");
mustNotContain("entity route", entityRoute, "export async function DELETE");
mustNotContain("entity route", entityRoute, "clioFetch(");
mustNotContain("entity route", entityRoute, ".delete(");

console.log("");
console.log("=== VERIFY ALIAS ROUTE IS LOCAL-FIRST AND AUDITED ===");
mustContain("alias route", aliasRoute, "export async function POST");
mustContain("alias route", aliasRoute, "export async function PATCH");
mustContain("alias route", aliasRoute, "prisma.referenceAlias.create");
mustContain("alias route", aliasRoute, "prisma.referenceAlias.update");
mustContain("alias route", aliasRoute, "createMatterAuditLogEntry");
mustContain("alias route", aliasRoute, "reference_alias_created");
mustContain("alias route", aliasRoute, "reference_alias_updated");
mustContain("alias route", aliasRoute, "localBarshMattersReferenceData: true");
mustContain("alias route", aliasRoute, "clioData: false");
mustContain("alias route", aliasRoute, "noClioRecordsChanged: true");
mustContain("alias route", aliasRoute, "hardDeleteSupported: false");
mustNotContain("alias route", aliasRoute, "export async function DELETE");
mustNotContain("alias route", aliasRoute, "clioFetch(");
mustNotContain("alias route", aliasRoute, ".delete(");

console.log("");
console.log("=== VERIFY SCRIPT REGISTRATION ===");
mustContain("package.json", packageJson, "verify:reference-data-safety");
mustContain("verify-prod.sh", verifyProd, "verify:reference-data-safety");

if (process.exitCode) {
  console.error("");
  console.error("=== LOCAL REFERENCE DATA SAFETY VERIFICATION FAILED ===");
  process.exit(process.exitCode);
}

console.log("");
console.log("=== LOCAL REFERENCE DATA SAFETY VERIFICATION PASSED ===");
console.log("No Clio records are changed by the local reference data routes.");
console.log("Reference records are deactivated/reactivated, not hard-deleted.");
console.log("Reference data changes are written to the local audit log.");
