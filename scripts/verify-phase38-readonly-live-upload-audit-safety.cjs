const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const smoke = read("scripts/smoke-phase38-readonly-live-upload-audit.cjs");
const pkg = JSON.parse(read("package.json"));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }

contains("smoke is read-only contract", smoke, "read-only verification only");
contains("smoke checks final folder id", smoke, "FINAL_FOLDER_ID = 22062362060");
contains("smoke checks Clio document id", smoke, "CLIO_DOCUMENT_ID = 22068617600");
contains("smoke checks finalization record id", smoke, "FINALIZATION_RECORD_ID = 103");
contains("smoke queries Clio by parent_id", smoke, "parent_id=");
contains("smoke checks parent type Folder", smoke, "Clio document parent type is Folder");
contains("smoke checks fully uploaded", smoke, "fully uploaded");
contains("smoke reads DocumentFinalization by SQL", smoke, "FROM \"DocumentFinalization\" WHERE id = $1");
contains("smoke checks uploaded-to-clio status", smoke, "uploaded-to-clio");
contains("smoke may POST only to OAuth token refresh", smoke, "/oauth/token");
notContains("smoke does not POST Clio documents endpoint", smoke, "/documents.json?fields=id,name,latest_document_version");
notContains("smoke does not POST Clio folders endpoint", smoke, "/folders.json");
notContains("smoke does not PUT upload bytes", smoke, "method: \"PUT\"");
notContains("smoke does not PATCH finalize document", smoke, "method: \"PATCH\"");
notContains("smoke does not create DB record", smoke, "INSERT INTO");
notContains("smoke does not update DB record", smoke, "UPDATE \"DocumentFinalization\"");
notContains("smoke does not delete DB record", smoke, "DELETE FROM");
if (exists("scripts/smoke-phase38-readonly-live-upload-audit.cjs")) pass("Phase 38 smoke file exists"); else fail("Phase 38 smoke file missing");
if (pkg.scripts && pkg.scripts["verify:phase38-readonly-live-upload-audit-safety"] === "node scripts/verify-phase38-readonly-live-upload-audit-safety.cjs") pass("package verifier script registered"); else fail("package verifier script missing");
if (pkg.scripts && pkg.scripts["smoke:phase38-readonly-live-upload-audit"] === "node scripts/smoke-phase38-readonly-live-upload-audit.cjs") pass("package smoke script registered"); else fail("package smoke script missing");
console.log("RESULT: Phase 38 read-only live upload audit safety verifier");
if (failed) process.exit(1);
