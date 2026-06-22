const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const finalize = read("app/api/documents/finalize/route.ts");
const helper = read("lib/clioDocumentUpload.ts");
const resolver = read("lib/clioFolderResolverExecutor.ts");
const pkg = JSON.parse(read("package.json"));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }
contains("finalize imports folder document lister", finalize, "listClioFolderDocuments");
contains("finalize imports upload write guard", finalize, "getClioStorageWriteGuard");
contains("single-master non-dry-run checks upload guard", finalize, "uploadGuard.uploadRewireEnabled");
contains("single-master non-dry-run requires live write", finalize, "uploadGuard.liveClioWriteEnabled");
contains("single-master non-dry-run requires folder create flag", finalize, "uploadGuard.createFoldersEnabled");
contains("single-master disabled branch reports no upload", finalize, "noDocumentUploadPerformed: true");
contains("single-master disabled branch reports no DB mutation", finalize, "noDatabaseRecordsChanged: true");
contains("single-master upload resolves folder before upload", finalize, "singleMasterFolderResolution = await resolveClioMatterFolderWithGuard(singleMasterTargetInput)");
contains("single-master upload validates folder id", finalize, "Single-master finalize upload could not resolve a valid Clio folder upload target");
contains("single-master duplicate lookup uses folder docs", finalize, "await listClioFolderDocuments(Number(singleMasterUploadFolderId))");
contains("legacy duplicate lookup remains matter docs", finalize, "await listClioMatterDocuments(matterId)");
contains("upload call uses Folder parent when rewired", finalize, "parentType: uploadRewiredToSingleMasterFolder ? \"Folder\" : \"Matter\"");
contains("upload call passes folder parent id when rewired", finalize, "parentId: uploadRewiredToSingleMasterFolder ? Number(singleMasterUploadFolderId) : undefined");
contains("uploaded payload records Clio upload parent", finalize, "clioUploadParent");
contains("success response reports uploadRewired", finalize, "uploadRewired: uploadRewiredToSingleMasterFolder");
contains("success safety reports resolved folder upload", finalize, "uploadedToResolvedSingleMasterFolder: uploadRewiredToSingleMasterFolder");
contains("dry-run branch still no upload", finalize, "generationSkipped: true");
contains("dry-run branch still no DB mutation", finalize, "databaseMutation: false");
notContains("old Phase 34A disabled upload message removed", finalize, "Single-master finalize upload remains disabled in Phase 34A");
for (const token of ["22059999515", "22059999545", "bucket-002001-003000", "matter-2026.05.00001"]) notContains("finalize does not hard-code " + token, finalize, token);
const targetFn = (finalize.match(/function buildSingleMasterFinalizeTargetInput[\s\S]*?\n}\n\nasync function generateDocumentBuffer/) || [""])[0];
for (const forbidden of ["patient", "provider", "insurer", "claimNumber", "claim number", "denial"]) {
  if (!new RegExp(forbidden, "i").test(targetFn)) pass("single-master target input avoids " + forbidden); else fail("single-master target input contains " + forbidden);
}
contains("helper supports Folder parent", helper, "parentType?: ClioDocumentParentType");
contains("helper supports folder document lookup", helper, "export async function listClioFolderDocuments");
contains("resolver remains explicit get-or-create", resolver, "getOrCreateExactClioChildFolderWithGuard");
if (pkg.scripts && pkg.scripts["verify:phase36b-finalize-single-master-folder-upload-wiring-safety"] === "node scripts/verify-phase36b-finalize-single-master-folder-upload-wiring-safety.cjs") pass("package verifier script registered"); else fail("package verifier script missing");
console.log("RESULT: Phase 36B finalize single-master folder upload wiring safety verifier");
if (failed) process.exit(1);
