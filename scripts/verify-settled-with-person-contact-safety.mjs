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

console.log("=== VERIFY SETTLED WITH PERSON-CONTACT SAFETY ===");

const contactSearchRoute = read("app/api/clio/contacts/search/route.ts");
const writebackHelper = read("lib/settlementClioWriteback.ts");
const writebackPreviewRoute = read("app/api/settlements/writeback-preview/route.ts");
const writebackRoute = read("app/api/settlements/writeback/route.ts");
const packageJson = read("package.json");

console.log("");
console.log("=== VERIFY GENERAL CONTACT SEARCH IS READ-ONLY ===");
mustContain("contact search route", contactSearchRoute, "readOnly: true");
mustContain("contact search route", contactSearchRoute, "noClioRecordsChanged: true");
mustContain("contact search route", contactSearchRoute, "noDatabaseRecordsChanged: true");
mustContain("contact search route", contactSearchRoute, "noDocumentsGenerated: true");
mustContain("contact search route", contactSearchRoute, "noPrintQueueRecordsChanged: true");
mustContain("contact search route", contactSearchRoute, "normalizeContactTypeFilter");
mustContain("contact search route", contactSearchRoute, "filterContacts");
mustContain("contact search route", contactSearchRoute, "contactTypeFilter");
mustNotContain("contact search route", contactSearchRoute, "method: \"PATCH\"");
mustNotContain("contact search route", contactSearchRoute, "method: \"POST\"");
mustNotContain("contact search route", contactSearchRoute, "method: \"DELETE\"");

console.log("");
console.log("=== VERIFY WRITEBACK HELPER VALIDATES SETTLED_WITH CONTACT TYPE ===");
mustContain("writeback helper", writebackHelper, "function isPersonContactType");
mustContain("writeback helper", writebackHelper, 'text(type).toLowerCase() === "person"');
mustContain("writeback helper", writebackHelper, "async function readClioContact");
mustContain("writeback helper", writebackHelper, "/api/v4/contacts/${id}.json");
mustContain("writeback helper", writebackHelper, "id,name,type");
mustContain("writeback helper", writebackHelper, "SETTLED_WITH must be a valid Clio person contact ID.");
mustContain("writeback helper", writebackHelper, "SETTLED_WITH must be a Person contact.");
mustContain("writeback helper", writebackHelper, "Selected contact");
mustContain("writeback helper", writebackHelper, "invalidContactFields");
mustContain("writeback helper", writebackHelper, "settledWithContact");
mustContain("writeback helper", writebackHelper, "readClioContact(params.request.fields.SETTLED_WITH)");

console.log("");
console.log("=== VERIFY WRITEBACK PREVIEW BLOCKS INVALID CONTACTS WITHOUT WRITES ===");
mustContain("writeback preview route", writebackPreviewRoute, "invalidContactResults");
mustContain("writeback preview route", writebackPreviewRoute, "invalidContactCount");
mustContain("writeback preview route", writebackPreviewRoute, "SETTLED_WITH must be a Clio Person contact.");
mustContain("writeback preview route", writebackPreviewRoute, "canWriteIfConfirmed: ok");
mustContain("writeback preview route", writebackPreviewRoute, "noClioRecordsChanged: true");
mustContain("writeback preview route", writebackPreviewRoute, "noDatabaseRecordsChanged: true");
mustContain("writeback preview route", writebackPreviewRoute, "noDocumentsGenerated: true");
mustContain("writeback preview route", writebackPreviewRoute, "noPrintQueueRecordsChanged: true");
mustContain("writeback preview route", writebackPreviewRoute, "Dry run only.");
mustNotContain("writeback preview route", writebackPreviewRoute, "method: \"PATCH\"");
mustNotContain("writeback preview route", writebackPreviewRoute, ".create(");
mustNotContain("writeback preview route", writebackPreviewRoute, ".update(");
mustNotContain("writeback preview route", writebackPreviewRoute, ".delete(");

console.log("");
console.log("=== VERIFY WRITEBACK ROUTE HAS INVALID CONTACT BLOCKING PATH ===");
mustContain("writeback route", writebackRoute, "invalidContactResults");
mustContain("writeback route", writebackRoute, "invalidContactCount");
mustContain("writeback route", writebackRoute, "blocked-readiness-validation");
mustContain("writeback route", writebackRoute, "SETTLED_WITH must be a Clio Person contact.");
mustContain("writeback route", writebackRoute, "confirmWrite");
mustContain("writeback route", writebackRoute, "written-to-clio");

console.log("");
console.log("=== VERIFY PACKAGE SCRIPT IS REGISTERED ===");
mustContain("package.json", packageJson, "verify:settled-with-person-contact-safety");

if (process.exitCode) {
  console.error("");
  console.error("=== SETTLED WITH PERSON-CONTACT SAFETY VERIFICATION FAILED ===");
  process.exit(process.exitCode);
}

console.log("");
console.log("=== SETTLED WITH PERSON-CONTACT SAFETY VERIFICATION PASSED ===");
console.log("No Clio records were changed by this verifier.");
console.log("No database writes were made by this verifier.");
console.log("No documents were generated by this verifier.");
console.log("No print queue records were changed by this verifier.");
