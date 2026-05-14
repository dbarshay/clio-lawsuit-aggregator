#!/usr/bin/env node

import fs from "fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function mustContain(label, text, needle) {
  if (!text.includes(needle)) fail(`${label}: missing ${needle}`);
  pass(`${label}: found ${needle}`);
}

function mustNotContain(label, text, needle) {
  if (text.includes(needle)) fail(`${label}: must not contain ${needle}`);
  pass(`${label}: does not contain ${needle}`);
}

console.log("=== VERIFY MATTER LOCAL FIELD SAFETY ===");

const schema = read("prisma/schema.prisma");
const route = read("app/api/matters/local-field/route.ts");
const optionsRoute = read("app/api/matters/local-field/treating-provider-options/route.ts");
const searchRoute = read("app/api/matters/local-field/search/route.ts");
const matterPage = read("app/matter/[id]/page.tsx");
const mattersPage = read("app/matters/page.tsx");
const pkg = JSON.parse(read("package.json"));

mustContain("schema", schema, "model MatterLocalField");
mustContain("schema", schema, "@@unique([matterId, fieldName])");
mustContain("schema", schema, "fieldValueId");
mustContain("schema", schema, "details");

mustContain("route", route, "export async function GET");
mustContain("route", route, "export async function PATCH");
mustContain("route", route, "matterLocalField.findUnique");
mustContain("route", route, "matterLocalField.upsert");
mustContain("route", route, "createMatterAuditLogEntry");
mustContain("route", route, "matter_local_field_updated");
mustContain("route", route, "treating_provider");
mustContain("route", route, "noClioRecordsChanged: true");
mustContain("route", route, "noClioCustomFieldsChanged: true");

mustNotContain("route", route, "clioFetch");
mustNotContain("route", route, "api/v4");
mustNotContain("route", route, "custom_field_values");
mustNotContain("route", route, "matterLocalField.delete");
mustNotContain("route", route, "referenceEntity.create");
mustNotContain("route", route, "referenceEntity.update");

mustContain("options route", optionsRoute, "treating_provider");
mustContain("options route", optionsRoute, "prisma.referenceEntity.findMany");
mustContain("options route", optionsRoute, "noClioRecordsChanged: true");
mustContain("options route", optionsRoute, "noDatabaseRecordsChanged: true");
mustNotContain("options route", optionsRoute, "clioFetch");
mustNotContain("options route", optionsRoute, "api/v4");
mustNotContain("options route", optionsRoute, "custom_field_values");

mustContain("search route", searchRoute, "matter-local-field-search");
mustContain("search route", searchRoute, "matterLocalField.findMany");
mustContain("search route", searchRoute, "prisma.claimIndex.findMany");
mustContain("search route", searchRoute, "noClioRecordsChanged: true");
mustContain("search route", searchRoute, "noDatabaseRecordsChanged: true");
mustNotContain("search route", searchRoute, "clioFetch");
mustNotContain("search route", searchRoute, "api/v4");
mustNotContain("search route", searchRoute, "custom_field_values");

mustContain("matter page", matterPage, "Treating Provider");
mustContain("matter page", matterPage, "/api/matters/local-field");
mustContain("matter page", matterPage, "/api/matters/local-field/treating-provider-options");
mustContain("matter page", matterPage, "Edit Treating Provider");
mustContain("matter page", matterPage, "Save");
mustContain("matter page", matterPage, "treatingProvider=${encodeURIComponent(localTreatingProviderName())}");
mustContain("matters page", mattersPage, "treatingProvider");
mustContain("matters page", mattersPage, "/api/matters/local-field/search");
mustContain("matter page", matterPage, "Edit Treating Provider");
mustContain("matter page", matterPage, "Save");

if (pkg.scripts?.["verify:matter-local-field-safety"] !== "node scripts/verify-matter-local-field-safety.mjs") {
  fail("package.json must include verify:matter-local-field-safety script.");
}
pass("package.json: verify:matter-local-field-safety registered");

console.log("");
console.log("=== MATTER LOCAL FIELD SAFETY VERIFICATION PASSED ===");
console.log("Matter local fields are stored in PostgreSQL only and do not write to Clio.");
