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
const docPath = "docs/clio-storage-refactor/phase42a-working-docx-readiness-no-finalized-upload.md";
const smokePath = "scripts/smoke-phase42a-working-docx-readiness-no-finalized-upload.cjs";
for (const f of [docPath, smokePath, "app/api/documents/working-docx/route.ts", "app/api/documents/finalize/route.ts", "package.json"]) exists(f) ? pass("required Phase 42A file exists: " + f) : fail("missing required Phase 42A file: " + f);
const doc = read(docPath);
const smoke = read(smokePath);
const workingRoute = read("app/api/documents/working-docx/route.ts");
const finalize = read("app/api/documents/finalize/route.ts");
const pkg = JSON.parse(read("package.json"));
for (const token of ["Phase 42A", "working DOCX", "BRL_202600001", "1881278195", "must not call `/api/documents/finalize` for a finalized upload", "must not convert to final PDF", "must not upload a finalized PDF to Clio"]) contains("doc contains " + token, doc, token);
for (const token of ["confirmCreate: true", "directMatterId: DIRECT_MATTER_ID", "directMatterDisplayNumber: DIRECT_FILE_NUMBER", "useSingleMasterClioStorage: true", "singleMasterDirectStorage: true", "/api/documents/working-docx", "workingDocument", "driveItemId", "WORKING_DOCUMENT_DRIVE_ITEM_ID_REDACTED"]) contains("smoke contains " + token, smoke, token);
for (const forbidden of ["confirmUpload: true", "uploadBufferToClioMatterDocuments", "/api/documents/finalize\",", "convertWorkingDocxDriveItemToPdf"]) notContains("smoke avoids finalized upload/conversion path", smoke, forbidden);
for (const token of ["workingDocument", "...working", "singleMasterDirectStorage", "previewUrl.searchParams.set(\"singleMasterDirectStorage\", \"1\")"]) contains("working-docx route exposes " + token, workingRoute, token);
for (const token of ["Finalize Document now requires a saved working Word document", "workingDocumentDriveItemId", "convertWorkingDocxDriveItemToPdf", "uploadBufferToClioMatterDocuments("]) contains("finalize retains later upload prerequisite " + token, finalize, token);
contains("package Phase 42A smoke registered", JSON.stringify(pkg.scripts || {}), "smoke:phase42a-working-docx-readiness-no-finalized-upload");
contains("package Phase 42A verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase42a-working-docx-readiness-no-finalized-upload-safety");
console.log("CONTRACT: Phase 42A creates/confirms working DOCX only and performs no finalized upload.");
console.log("RESULT: Phase 42A working-DOCX readiness no-finalized-upload safety verifier");
if (failed) process.exit(1);
