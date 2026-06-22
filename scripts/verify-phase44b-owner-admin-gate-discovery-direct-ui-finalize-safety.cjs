const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p) => fs.existsSync(path.join(process.cwd(), p));
const contains = (label, text, token) => text.includes(token) ? pass(label) : fail(label + " missing token: " + token);
const notContains = (label, text, token) => !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token);

const docPath = "docs/clio-storage-refactor/phase44b-owner-admin-gate-discovery-direct-ui-finalize.md";
for (const f of [
  docPath,
  "app/matters/page.tsx",
  "app/api/documents/finalize/route.ts",
  "app/api/admin/permissions/check/route.ts",
  "package.json",
]) {
  exists(f) ? pass("required Phase 44B file exists: " + f) : fail("missing required Phase 44B file: " + f);
}

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const finalize = read("app/api/documents/finalize/route.ts");
const pkg = JSON.parse(read("package.json"));

const optionalFiles = [
  "lib/admin-auth.ts",
  "lib/admin-permissions.ts",
  "lib/admin-permission-registry.ts",
  "lib/current-admin-user.ts",
  "lib/permissions.ts",
  "lib/auth.ts",
  "middleware.ts",
  "proxy.ts",
].filter(exists);

const optionalSource = optionalFiles.map((f) => "\n// FILE: " + f + "\n" + read(f)).join("\n");

for (const token of [
  "Phase 44B",
  "Owner/Admin Gate Discovery",
  "does not change app behavior",
  "does not enable live upload",
  "selectedDocumentKey",
  "workingDocumentDriveItemId",
  "workingDocumentKey",
  "allowDuplicateUploads: false",
  "confirmUpload: true",
  "preserve lawsuit/master separation"
]) contains("doc contains " + token, doc, token);

for (const token of [
  "directMatterSingleMasterDryRunControlEnabled = false",
  "runDirectMatterSingleMasterFinalizeDryRunFromUi",
  "renderDirectMatterSingleMasterDryRunControl",
  "handleDirectMatterSingleMasterDryRunControl",
  "buildDirectMatterSingleMasterFinalizeDryRunPayload",
  "buildDirectMatterSingleMasterFinalizePayload",
  "if (!selectedDocumentKey || !workingDocumentDriveItemId || !workingDocumentKey) return null",
  "allowDuplicateUploads: false",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  'uploadTargetMode: "direct-matter"',
  "directMatterId",
  "directMatterDisplayNumber",
  "masterLawsuitId",
  'uploadTargetMode: "master-lawsuit"'
]) contains("matters page retains direct/lawsuit separation and prerequisite token " + token, page, token);

const controlStart = page.indexOf("function renderDirectMatterSingleMasterDryRunControl");
const controlEnd = page.indexOf("function directMatterSingleMasterDryRunSurfaceRow", controlStart);
const controlBlock = controlStart >= 0 && controlEnd > controlStart ? page.slice(controlStart, controlEnd) : "";
contains("direct dry-run control block captured", controlBlock, "renderDirectMatterSingleMasterDryRunControl");
contains("direct dry-run control block is guarded off", controlBlock, "directMatterSingleMasterDryRunControlEnabled");
contains("direct dry-run control block calls dry-run handler", controlBlock, "handleDirectMatterSingleMasterDryRunControl");
notContains("direct dry-run control block does not expose live confirmUpload", controlBlock, "confirmUpload: true");
notContains("direct dry-run control block does not include masterLawsuitId", controlBlock, "masterLawsuitId");

const helperStart = page.indexOf("type DirectMatterSingleMasterDocumentPayloadParams");
const helperEnd = page.indexOf("export default", helperStart);
const helperBlock = helperStart >= 0 && helperEnd > helperStart ? page.slice(helperStart, helperEnd) : "";
contains("direct helper block captured", helperBlock, "DirectMatterSingleMasterDocumentPayloadParams");
contains("direct helper block supports confirmUpload parameter", helperBlock, "confirmUpload");
contains("direct helper block supports dry-run parameter", helperBlock, "singleMasterDryRun");
contains("direct helper block preserves duplicate prevention", helperBlock, "allowDuplicateUploads: false");
notContains("direct helper block does not include masterLawsuitId", helperBlock, "masterLawsuitId");

const authTokens = [
  "owner_admin",
  "bootstrapSafe",
  "permissions",
  "admin",
  "permission",
  "BARSH_ADMIN_PERMISSIONS_ENFORCEMENT",
  "BARSH_ADMIN_PERMISSION_OVERRIDES_JSON",
].filter((token) => optionalSource.includes(token) || page.includes(token) || finalize.includes(token));

if (authTokens.length > 0) {
  pass("owner/admin/auth-related primitives discovered: " + authTokens.join(", "));
} else {
  fail("no owner/admin/auth-related primitives discovered");
}

contains("finalize route retains direct path token useDirectFinalizePreview", finalize, "useDirectFinalizePreview");
contains("finalize route retains direct path token singleMasterDryRun", finalize, "singleMasterDryRun");
contains("finalize route retains upload helper token for future live control", finalize, "uploadBufferToClioMatterDocuments(");
contains("finalize route retains duplicate prevention token", finalize, "allowDuplicateUploads");

contains("package Phase 44B verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase44b-owner-admin-gate-discovery-direct-ui-finalize-safety");
notContains("package does not register Phase 44B live smoke", JSON.stringify(pkg.scripts || {}), "smoke:phase44b-live");

console.log("OPTIONAL_AUTH_FILES_FOUND=" + JSON.stringify(optionalFiles));
console.log("CONTRACT: Phase 44B discovers owner/admin gate primitives only; no UI live upload is enabled.");
console.log("RESULT: Phase 44B owner/admin gate discovery direct UI finalize verifier");
if (failed) process.exit(1);
