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
const finalizePath = "app/api/documents/finalize/route.ts";
const planPath = "lib/clioStoragePlan.ts";
const pkgPath = "package.json";

for (const file of [
  docPath,
  finalizePath,
  planPath,
  "docs/clio-storage-refactor/phase41d-direct-individual-finalize-disabled-guard-smoke.md",
  "docs/clio-storage-refactor/phase41e-direct-individual-armed-no-working-docx-smoke.md",
  pkgPath,
]) {
  if (exists(file)) pass(`required Phase 41F file exists: ${file}`);
  else fail(`missing required Phase 41F file: ${file}`);
}

const doc = exists(docPath) ? read(docPath) : "";
const finalize = exists(finalizePath) ? read(finalizePath) : "";
const plan = exists(planPath) ? read(planPath) : "";
const pkg = exists(pkgPath) ? JSON.parse(read(pkgPath)) : { scripts: {} };

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
  "resolveClioMatterFolderWithGuard",
  "buildClioStorageFolderResolutionPreview",
  "getClioStorageWriteGuard",
  "uploadBufferToClioMatterDocuments",
  "recordDocumentFinalizationAttempt",
]) {
  contains(`finalize route inspected anchor ${token}`, finalize, token);
}

const hasOriginalDirectBlocker =
  finalize.includes("Single-master Clio storage for direct matters is blocked") &&
  finalize.includes("direct-matter numbering/folder convention");
const hasPhase41GGuardedDirectWiring =
  finalize.includes("CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED") &&
  finalize.includes("storageTargetKind: \"individual_matter\"") &&
  finalize.includes("directMatterFileNumber") &&
  finalize.includes("bmMatterId: directMatterFileNumber") &&
  finalize.includes("displayNumber: directMatterFileNumber");

if (hasOriginalDirectBlocker) {
  pass("finalize route retains original direct-matter blocked throw inspected in Phase 41F");
} else if (hasPhase41GGuardedDirectWiring) {
  pass("finalize route has Phase 41G successor guard for direct target-input wiring");
} else {
  fail("finalize route has neither the original Phase 41F direct blocker nor the Phase 41G guarded direct target-input wiring");
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
  notContains("finalize route does not hard-code direct live audit anchor", finalize, forbidden);
}

const directBlock = (finalize.match(/if \(isDirectMatter\) \{[\s\S]*?\n  \}/) || [""])[0];
for (const forbidden of ["patient", "provider", "insurer", "claimNumber", "claim number", "denial"]) {
  if (!new RegExp(forbidden, "i").test(directBlock)) pass(`direct route blocker/guard avoids ${forbidden}`);
  else fail(`direct route blocker/guard contains ${forbidden}`);
}

contains("package Phase 41F verifier script registered", JSON.stringify(pkg.scripts || {}), "verify:phase41f-finalize-route-direct-target-input-inspection");

console.log("CONTRACT: Phase 41F is inspection/readiness only and does not enable direct upload.");
console.log("CONTRACT: direct upload remains blocked either by the original explicit direct-matter throw or by the later Phase 41G default-off guarded direct target-input wiring.");
console.log("RESULT: Phase 41F finalize route direct target-input inspection verifier");

if (failed) process.exit(1);
