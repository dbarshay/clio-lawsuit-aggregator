const fs = require("fs");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8");
const contains = (label, text, token) => text.includes(token) ? pass(label) : fail(`${label} missing token: ${token}`);
const notContains = (label, text, token) => !text.includes(token) ? pass(label) : fail(`${label} contains forbidden token: ${token}`);

const scriptPath = "scripts/inspect-phase48f-signer-addressee-court-source-resolution.cjs";
const verifyPath = "scripts/verify-phase48f-signer-addressee-court-source-resolution-inspection.cjs";
const mdPath = "docs/template-generation-refactor/phase48f-signer-addressee-court-source-resolution-inspection.md";
const jsonPath = "docs/template-generation-refactor/phase48f-signer-addressee-court-source-resolution-inspection.json";
const pkgPath = "package.json";

for (const p of [scriptPath, verifyPath, mdPath, jsonPath, pkgPath]) exists(p) ? pass(`required file exists: ${p}`) : fail(`missing required file: ${p}`);

const script = exists(scriptPath) ? read(scriptPath) : "";
const md = exists(mdPath) ? read(mdPath) : "";
const json = exists(jsonPath) ? JSON.parse(read(jsonPath)) : {};
const pkg = exists(pkgPath) ? JSON.parse(read(pkgPath)) : { scripts: {} };

for (const token of [
  "Signer defaults to the logged-in Barsh Matters user",
  "Other users must be selectable from the Generate Documents dialog",
  "Fax number, email address, and extension are preset per selected signer",
  "adversary_attorney",
  "insurer",
  "court",
  "settled_with_contact",
  "manual",
  "{{addresseeSourceType}}",
  "{{addresseeName}}",
  "{{courtName}}",
  "{{courtVenue}}",
  "{{indexNumber}}",
  "Settled-with contact",
  "Ask Dave before implementing or mapping",
  "Phase 48G"
]) contains(`doc contains ${token}`, md, token);

for (const token of [
  "signerTerms",
  "addresseeTerms",
  "courtTerms",
  "settlementTerms",
  "generationDialogTerms",
  "readOnlyInspection",
  "noFieldMapping"
]) contains(`inspection script contains ${token}`, script, token);

json.ok === true ? pass("inspection JSON ok true") : fail("inspection JSON ok not true");
json.signer?.requiredBehavior?.defaultToLoggedInGeneratingUser === true ? pass("JSON signer defaults to logged-in user") : fail("JSON signer default missing");
json.signer?.requiredBehavior?.otherUsersSelectableInGenerateDocumentsDialog === true ? pass("JSON signer selectable users true") : fail("JSON signer selectable missing");
Array.isArray(json.addressee?.allowedSourceTypes) && json.addressee.allowedSourceTypes.includes("settled_with_contact") && json.addressee.allowedSourceTypes.includes("manual") ? pass("JSON addressee source types complete") : fail("JSON addressee source types incomplete");
Array.isArray(json.court?.proposedFields) && json.court.proposedFields.includes("courtName") && json.court.proposedFields.includes("indexNumber") ? pass("JSON court proposed fields include courtName/indexNumber") : fail("JSON court proposed fields incomplete");
json.safety?.readOnlyInspection === true ? pass("JSON safety read-only true") : fail("JSON read-only safety missing");
json.safety?.noDatabaseMutation === true ? pass("JSON no DB mutation true") : fail("JSON no DB mutation missing");
json.safety?.noFieldMapping === true ? pass("JSON no field mapping true") : fail("JSON no field mapping missing");

for (const token of [
  "documentTemplate.create(",
  "documentTemplate.update(",
  "uploadBufferToClioMatterDocuments(",
  "CONFIRM_LIVE_TERMINAL_FINALIZE=YES",
  "confirmUpload: true",
  "documentPrintQueueItem.create(",
  "sendMail"
]) notContains(`inspection/doc no write/finalization marker ${token}`, script + "\n" + md, token);

pkg.scripts?.["inspect:phase48f-signer-addressee-court-source-resolution"] === "node scripts/inspect-phase48f-signer-addressee-court-source-resolution.cjs" ? pass("package inspection script registered") : fail("package inspection script missing");
pkg.scripts?.["verify:phase48f-signer-addressee-court-source-resolution-inspection"] === "node scripts/verify-phase48f-signer-addressee-court-source-resolution-inspection.cjs" ? pass("package verifier script registered") : fail("package verifier script missing");

if (failed) {
  console.error("FAIL: Phase 48F signer/addressee/court source-resolution inspection verifier failed");
  process.exit(1);
}
console.log("PASS: Phase 48F signer/addressee/court source-resolution inspection verifier passed");
