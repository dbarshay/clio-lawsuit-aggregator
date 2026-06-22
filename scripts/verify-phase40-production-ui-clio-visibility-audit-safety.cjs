const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const smoke = read("scripts/smoke-phase40-production-ui-clio-visibility-audit.cjs");
const pkg = JSON.parse(read("package.json"));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }
contains("smoke is read-only contract", smoke, "read-only audit only");
contains("smoke checks production no-upload preview", smoke, "production no-upload preview");
contains("smoke checks production target path", smoke, "production target folder path correct");
contains("smoke checks Clio folder visibility", smoke, "documents.json?parent_id");
contains("smoke checks Clio document id", smoke, "CLIO_DOCUMENT_ID = 22068617600");
contains("smoke checks final folder id", smoke, "FINAL_FOLDER_ID = 22062362060");
contains("smoke checks DB audit record", smoke, "FINALIZATION_RECORD_ID = 103");
notContains("smoke does not upload document bytes", smoke, "method: \"PUT\"");
notContains("smoke does not PATCH Clio document", smoke, "method: \"PATCH\"");
notContains("smoke does not create DB record", smoke, "INSERT INTO");
notContains("smoke does not update DB record", smoke, "UPDATE \"DocumentFinalization\"");
notContains("smoke does not delete DB record", smoke, "DELETE FROM");
if (exists("scripts/smoke-phase40-production-ui-clio-visibility-audit.cjs")) pass("Phase 40 smoke file exists"); else fail("Phase 40 smoke file missing");
if (pkg.scripts && pkg.scripts["verify:phase40-production-ui-clio-visibility-audit-safety"] === "node scripts/verify-phase40-production-ui-clio-visibility-audit-safety.cjs") pass("package verifier script registered"); else fail("package verifier script missing");
if (pkg.scripts && pkg.scripts["smoke:phase40-production-ui-clio-visibility-audit"] === "node scripts/smoke-phase40-production-ui-clio-visibility-audit.cjs") pass("package smoke script registered"); else fail("package smoke script missing");
console.log("RESULT: Phase 40 production/UI/Clio visibility audit safety verifier");
if (failed) process.exit(1);
