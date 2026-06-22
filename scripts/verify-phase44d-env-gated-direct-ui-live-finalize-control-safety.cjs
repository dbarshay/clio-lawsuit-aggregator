const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p) => fs.existsSync(path.join(process.cwd(), p));
const contains = (label, text, token) => text.includes(token) ? pass(label) : fail(label + " missing token: " + token);
const notContains = (label, text, token) => !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token);

const docPath = "docs/clio-storage-refactor/phase44d-env-gated-direct-ui-live-finalize-control.md";
for (const f of [
  docPath,
  "app/matters/page.tsx",
  "app/api/documents/finalize/route.ts",
  "package.json",
]) exists(f) ? pass("required Phase 44D file exists: " + f) : fail("missing required Phase 44D file: " + f);

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const route = read("app/api/documents/finalize/route.ts");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 44D",
  "Env-Gated Direct UI Live Finalize Control",
  "NEXT_PUBLIC_BARSH_DIRECT_MATTER_CLIO_LIVE_FINALIZE_ENABLED=1",
  "confirmUpload: true",
  "singleMasterDryRun: false",
  "allowDuplicateUploads: false",
  "workingDocumentDriveItemId",
  "workingDocumentKey",
  "does not include `masterLawsuitId`",
  "server-side Phase 44C admin authorization remains required",
  "no live smoke/upload is run"
]) contains("doc contains " + token, doc, token);

for (const token of [
  "directMatterSingleMasterLiveFinalizeControlEnabled",
  "NEXT_PUBLIC_BARSH_DIRECT_MATTER_CLIO_LIVE_FINALIZE_ENABLED",
  "handleDirectMatterSingleMasterLiveFinalizeControl",
  "renderDirectMatterSingleMasterLiveFinalizeControl",
  "uiOriginatedDirectMatterLiveFinalize: true",
  "Admin Finalize Direct Matter to Clio",
  "confirmUpload: true",
  "singleMasterDryRun: false",
  "singleMasterResolveFolders: true",
  "allowDuplicateUploads: false",
  "documentKeys: [selectedDocumentKey]",
  "if (!selectedDocumentKey || !workingDocumentDriveItemId || !workingDocumentKey) return null"
]) contains("matters page contains Phase 44D live control token " + token, page, token);

function functionBlock(text, name) {
  const start = text.indexOf("function " + name);
  if (start < 0) return "";
  const brace = text.indexOf("{", start);
  if (brace < 0) return "";
  let depth = 0;
  for (let i = brace; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return "";
}

const liveBlock = functionBlock(page, "renderDirectMatterSingleMasterLiveFinalizeControl");
contains("live control block captured", liveBlock, "renderDirectMatterSingleMasterLiveFinalizeControl");
contains("live control block is env gated", liveBlock, "directMatterSingleMasterLiveFinalizeControlEnabled");
contains("live control block calls live handler", liveBlock, "handleDirectMatterSingleMasterLiveFinalizeControl");
notContains("live control block does not include masterLawsuitId", liveBlock, "masterLawsuitId");
notContains("live control block does not enable duplicates", liveBlock, "allowDuplicateUploads: true");

const rowBlock = functionBlock(page, "renderDirectMatterSingleMasterDryRunControlForRow");
contains("row bridge block captured", rowBlock, "renderDirectMatterSingleMasterDryRunControlForRow");
contains("row bridge still gates selected document", rowBlock, "selectedDocumentKey");
contains("row bridge still gates working doc drive id", rowBlock, "workingDocumentDriveItemId");
contains("row bridge still gates working doc key", rowBlock, "workingDocumentKey");
contains("row bridge renders dry-run control", rowBlock, "renderDirectMatterSingleMasterDryRunControl(params)");
contains("row bridge renders live control", rowBlock, "renderDirectMatterSingleMasterLiveFinalizeControl(params)");
notContains("row bridge does not include masterLawsuitId", rowBlock, "masterLawsuitId");

for (const token of [
  "isDirectMatterLiveFinalizeRequest",
  "isAdminRequestAuthorized",
  "adminUnauthorizedJson(403)",
  "confirmUpload === true",
  "singleMasterDryRun !== true",
  "uploadBufferToClioMatterDocuments("
]) contains("server-side Phase 44C guard remains " + token, route, token);

contains("package Phase 44D verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase44d-env-gated-direct-ui-live-finalize-control-safety");
notContains("package does not register Phase 44D live smoke", JSON.stringify(pkg.scripts || {}), "smoke:phase44d-live");

console.log("CONTRACT: Phase 44D exposes env-gated direct UI live control only; no live smoke/upload is run.");
console.log("RESULT: Phase 44D env-gated direct UI live finalize control verifier");
if (failed) process.exit(1);
