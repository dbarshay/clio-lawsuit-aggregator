const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const docPath = "docs/clio-storage-refactor/phase41c-direct-individual-finalize-wiring-design.md";
const doc = exists(docPath) ? read(docPath) : "";
const pkg = JSON.parse(read("package.json"));
const plan = read("lib/clioStoragePlan.ts");
const finalize = read("app/api/documents/finalize/route.ts");
const helper = read("lib/clioDocumentUpload.ts");
const phase41a = read("scripts/smoke-phase41a-direct-individual-folder-resolution-no-upload.cjs");
const phase41b = read("scripts/smoke-phase41b-live-direct-individual-exact-child-reuse-no-upload.cjs");
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }
if (exists(docPath)) pass("Phase 41C design doc exists"); else fail("Phase 41C design doc missing");
for (const token of [
  "Phase 41C is a design/readiness lock only",
  "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001",
  "Individual Matters = 22062400790",
  "BRL-202600001-BRL-202600999 = 22062400880",
  "BRL_202600001 = 22062401000",
  "Barsh Matters owns and assigns direct/individual file numbers",
  "Clio must not assign or determine Barsh Matters file numbers",
  "BRL_YYYYNNNNN",
  "YYYY.MM.NNNNN",
  "storageTargetKind: \"individual_matter\"",
  "directMatterFileNumber",
  "existing direct matter documents must not be moved automatically",
  "Disabled guard smoke",
  "Armed no-working-doc smoke",
  "Live direct finalized PDF upload smoke",
  "Read-only Clio/DB audit",
  "Production no-upload smoke"
]) contains("design doc contains " + token, doc, token);
for (const forbidden of ["patient name", "provider name", "insurer name", "claim number", "denial reason", "Clio-assigned display number", "Clio matter id"]) contains("design doc explicitly forbids deriving from " + forbidden, doc, forbidden);
contains("planner supports Individual Matters taxonomy", plan, "Individual Matters");
contains("planner supports individual_matter", plan, "individual_matter");
contains("planner supports direct_matter alias", plan, "direct_matter");
contains("planner supports directMatterFileNumber", plan, "directMatterFileNumber");
contains("planner has BRL_YYYYNNNNN guard", plan, "BRL_YYYYNNNNN");
contains("Phase 41A planner smoke exists and locks direct path", phase41a, "PHASE41A_DIRECT_PATH");
contains("Phase 41B exact-child smoke exists and locks original final folder", phase41b, "PHASE41B_FINAL_FOLDER_ID");
contains("upload helper supports Folder parent", helper, "parentType");
contains("upload helper supports parentId", helper, "parentId");
notContains("design doc does not authorize live direct upload now", doc, "Phase 41C enables direct live upload");
notContains("finalize route does not hard-code direct folder id 22062401000", finalize, "22062401000");
notContains("finalize route does not hard-code direct folder id 22062400790", finalize, "22062400790");
notContains("finalize route does not hard-code direct folder id 22062400880", finalize, "22062400880");
notContains("finalize route does not hard-code direct path", finalize, "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001");
const namingBlock = (plan.match(/function buildIndividualMatterRangeFolderName[\\s\\S]*?export function buildClioStorageTargetPlan/) || [""])[0];
for (const token of ["patient", "provider", "insurer", "claimNumber", "claim number"]) { if (!new RegExp(token, "i").test(namingBlock)) pass("direct folder naming path avoids " + token); else fail("direct folder naming path contains " + token); }
if (pkg.scripts && pkg.scripts["verify:phase41c-direct-individual-finalize-wiring-design-safety"] === "node scripts/verify-phase41c-direct-individual-finalize-wiring-design-safety.cjs") pass("package verifier script registered"); else fail("package verifier script missing");
console.log("RESULT: Phase 41C direct/individual finalize wiring design safety verifier");
if (failed) process.exit(1);
