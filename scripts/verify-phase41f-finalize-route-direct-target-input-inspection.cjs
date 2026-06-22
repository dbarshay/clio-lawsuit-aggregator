const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => {
  failed = true;
  console.error("FAIL: " + m);
};

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));

function contains(label, text, token) {
  if (text.includes(token)) pass(label);
  else fail(`${label} missing token: ${token}`);
}

function notContains(label, text, token) {
  if (!text.includes(token)) pass(label);
  else fail(`${label} contains forbidden token: ${token}`);
}

const docPath = "docs/clio-storage-refactor/phase41f-finalize-route-direct-target-input-inspection.md";
const routePath = "app/api/documents/finalize/route.ts";
const planPath = "lib/clioStoragePlan.ts";
const doc = exists(docPath) ? read(docPath) : "";
const route = exists(routePath) ? read(routePath) : "";
const plan = exists(planPath) ? read(planPath) : "";
const pkg = JSON.parse(read("package.json"));

for (const file of [
  docPath,
  routePath,
  planPath,
  "docs/clio-storage-refactor/phase41d-direct-individual-finalize-disabled-guard-smoke.md",
  "docs/clio-storage-refactor/phase41e-direct-individual-armed-no-working-docx-smoke.md",
  "package.json",
]) {
  if (exists(file)) pass(`required Phase 41F file exists: ${file}`);
  else fail(`missing required Phase 41F file: ${file}`);
}

for (const token of [
  "Phase 41F is a read-only inspection lock",
  "direct/individual finalized upload remains blocked",
  "uploadTargetMode === \"direct-matter\"",
  "Individual Matters",
  "individual_matter",
  "direct_matter",
  "directMatterFileNumber",
  "BRL_YYYYNNNNN",
  "storageTargetKind: \"individual_matter\"",
  "does not enable direct/individual upload",
]) {
  contains(`doc contains ${token}`, doc, token);
}

for (const token of [
  "function buildSingleMasterFinalizeTargetInput",
  "const isDirectMatter = params.uploadTargetMode === \"direct-matter\"",
  "if (isDirectMatter)",
  "Single-master Clio storage for direct matters is blocked",
  "direct-matter numbering/folder convention",
  "resolveClioMatterFolderWithGuard",
  "buildClioStorageFolderResolutionPreview",
  "getClioStorageWriteGuard",
  "uploadBufferToClioMatterDocuments",
  "recordDocumentFinalizationAttempt",
]) {
  contains(`finalize route inspected anchor ${token}`, route, token);
}

for (const token of [
  "Individual Matters",
  "individual_matter",
  "direct_matter",
  "directMatterFileNumber",
  "BRL_YYYYNNNNN",
  "storageTargetKind?: \"lawsuit\" | \"individual_matter\" | \"direct_matter\" | null",
]) {
  contains(`planner direct target support ${token}`, plan, token);
}

for (const forbidden of [
  "22062400790",
  "22062400880",
  "22062401000",
  "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001",
]) {
  notContains("finalize route does not hard-code direct live audit anchor", route, forbidden);
}

const directThrowBlock =
  (route.match(/const isDirectMatter = params\.uploadTargetMode === "direct-matter";[\s\S]*?const displayNumber = clean/) || [""])[0];

for (const token of ["patient", "provider", "insurer", "claimNumber", "claim number", "denial"]) {
  if (!new RegExp(token, "i").test(directThrowBlock)) pass(`direct route blocker avoids ${token}`);
  else fail(`direct route blocker contains ${token}`);
}

if (
  pkg.scripts &&
  pkg.scripts["verify:phase41f-finalize-route-direct-target-input-inspection"] ===
    "node scripts/verify-phase41f-finalize-route-direct-target-input-inspection.cjs"
) {
  pass("package Phase 41F verifier script registered");
} else {
  fail("package Phase 41F verifier script missing");
}

console.log("CONTRACT: Phase 41F is inspection/readiness only and does not enable direct upload.");
console.log("CONTRACT: direct upload remains blocked by the explicit direct-matter throw until a later guarded wiring phase replaces it.");
console.log("RESULT: Phase 41F finalize route direct target-input inspection verifier");

if (failed) process.exit(1);
