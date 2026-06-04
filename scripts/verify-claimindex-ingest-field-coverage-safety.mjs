#!/usr/bin/env node
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function mustContain(label, text, needle) {
  if (!text.includes(needle)) {
    console.error(`FAIL: ${label}: missing ${needle}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}: found ${needle}`);
  }
}

function mustNotContain(label, text, needle) {
  if (text.includes(needle)) {
    console.error(`FAIL: ${label}: unexpected ${needle}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}: does not contain ${needle}`);
  }
}

console.log("RESULT: verify ClaimIndex local ingest/upsert field coverage safety");

const upsert = read("lib/claimIndexUpsert.ts");
const localHelper = read("lib/claimIndex.ts");
const query = read("lib/claimIndexQuery.ts");
const pkg = read("package.json");

const upsertFields = [
  "matter.display_number",
  "matter.description",
  "matter.status",
  "matter?.matter_stage?.name",
  "matter?.client?.name",
  "matter.custom_field_values?.find",
  "claim_number_raw",
  "claim_number_normalized",
  "patient_name",
  "client_name",
  "provider_name",
  "insurer_name",
  "claim_amount",
  "payment_amount",
  "balance_amount",
  "bill_number",
  "dos_start",
  "dos_end",
  "denial_reason",
  "service_type",
  "policy_number",
  "date_of_loss",
  "payment_voluntary",
  "balance_presuit",
  "master_lawsuit_id",
  "index_aaa_number",
  "status",
  "close_reason",
  "final_status",
  "matter_stage_name",
  "raw_json: JSON.stringify(matter)",
  "indexed_at: new Date()",
];

for (const field of upsertFields) {
  mustContain("claimIndexUpsert", upsert, field);
}

const localFields = [
  "claim_number_raw",
  "claim_number_normalized",
  "patient_name",
  "client_name",
  "provider_name",
  "insurer_name",
  "claim_amount",
  "payment_amount",
  "balance_amount",
  "bill_number",
  "dos_start",
  "dos_end",
  "denial_reason",
  "service_type",
  "policy_number",
  "date_of_loss",
  "payment_voluntary",
  "balance_presuit",
  "master_lawsuit_id",
  "index_aaa_number",
  "status",
  "close_reason",
  "final_status",
  "matter_stage_name",
  "treating_provider",
];

for (const field of localFields) {
  mustContain("local ClaimIndex helper", localHelper, `${field}: row.${field}`);
  mustContain("CLAIM_INDEX_SELECT", query, `${field}: true`);
}

mustContain("package.json", pkg, "verify:claimindex-ingest-field-coverage-safety");
mustNotContain("claimIndexUpsert must not write back to Clio", upsert, "method: \"PATCH\"");
mustNotContain("claimIndexUpsert must not create Clio records", upsert, "method: \"POST\"");
mustNotContain("claimIndexUpsert must not delete Clio records", upsert, "method: \"DELETE\"");
mustNotContain("claimIndexUpsert must not set custom_field_values payload", upsert, "custom_field_values: payload");

if (process.exitCode) {
  console.error("FAILURES=1");
  process.exit(1);
}

console.log("FAILURES=0");
console.log("No Clio records were changed by this verifier.");
console.log("No database writes were made by this verifier.");
