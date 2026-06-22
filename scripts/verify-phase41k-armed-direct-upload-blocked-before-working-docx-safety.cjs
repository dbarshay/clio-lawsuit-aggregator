const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }

const docPath = "docs/clio-storage-refactor/phase41k-armed-direct-upload-blocked-before-working-docx-no-upload.md";
const smokePath = "scripts/smoke-phase41k-armed-direct-upload-blocked-before-working-docx-no-upload.cjs";
const finalizePath = "app/api/documents/finalize/route.ts";
for (const f of [docPath, smokePath, finalizePath, "lib/clioStorageWriteGuard.ts", "package.json"]) exists(f) ? pass("required Phase 41K file exists: " + f) : fail("missing required Phase 41K file: " + f);
const doc = exists(docPath) ? read(docPath) : "";
const smoke = exists(smokePath) ? read(smokePath) : "";
const finalize = exists(finalizePath) ? read(finalizePath) : "";
const guard = read("lib/clioStorageWriteGuard.ts");
const pkg = JSON.parse(read("package.json"));

for (const token of ["Phase 41K", "confirmUpload", "blocked", "before working-DOCX", "before working-DOCX/Graph", "no-upload", "CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED=0", "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED=0", "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED=0", "noUploadPerformed: true"]) contains("doc contains " + token, doc, token);
for (const token of ["confirmUpload: true", "singleMasterDryRun: false", "CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED: \"1\"", "CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED: \"0\"", "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: \"0\"", "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: \"0\"", "result.status === 403", "uploadRewireEnabled === false", "createFoldersEnabled === false", "liveClioWriteEnabled === false", "noUploadPerformed === true"]) contains("smoke contains " + token, smoke, token);
for (const forbidden of ["CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED: \"1\"", "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: \"1\"", "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: \"1\"", "singleMasterDryRun: true"]) notContains("smoke does not arm live upload path", smoke, forbidden);
for (const token of ["getClioStorageWriteGuard", "Single-master finalize upload is disabled unless CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED=1, CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED=1, and CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED=1.", "uploadRewired: false", "noUploadPerformed: true", "noDocumentUploadPerformed: true", "noDatabaseRecordsChanged: true"]) contains("finalize route keeps armed-blocked guard token " + token, finalize, token);
const guardIndex = finalize.indexOf("Single-master finalize upload is disabled unless CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED=1");
const uploadIndex = finalize.indexOf("uploadBufferToClioMatterDocuments(");
if (guardIndex >= 0 && uploadIndex >= 0 && guardIndex < uploadIndex) pass("upload guard occurs before Clio document upload call"); else fail("upload guard does not occur before Clio document upload call");
for (const token of ["CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED", "CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED", "CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED"]) contains("write/upload guard still references " + token, guard, token);
contains("package Phase 41K smoke registered", JSON.stringify(pkg.scripts || {}), "smoke:phase41k-armed-direct-upload-blocked-before-working-docx-no-upload");
contains("package Phase 41K verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase41k-armed-direct-upload-blocked-before-working-docx-safety");
console.log("CONTRACT: Phase 41K is armed-blocked/no-upload only.");
console.log("RESULT: Phase 41K armed direct upload blocked before working-DOCX safety verifier");
if (failed) process.exit(1);
