const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p) => fs.existsSync(path.join(process.cwd(), p));
function contains(label, text, token) { text.includes(token) ? pass(label) : fail(label + " missing token: " + token); }
function notContains(label, text, token) { !text.includes(token) ? pass(label) : fail(label + " contains forbidden token: " + token); }

const docPath = "docs/clio-storage-refactor/phase43h-strict-direct-only-dry-run-surface-row.md";
for (const f of [docPath, "app/matters/page.tsx", "package.json"]) {
  exists(f) ? pass("required Phase 43H file exists: " + f) : fail("missing required Phase 43H file: " + f);
}

const doc = read(docPath);
const page = read("app/matters/page.tsx");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "Phase 43H",
  "Strict Direct-Only Dry-Run Surface Row",
  "directRows[0] || null",
  "no `rows[0]` fallback remains",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "no live upload is enabled"
]) {
  contains("doc contains " + token, doc, token);
}

for (const token of [
  "function directMatterSingleMasterDryRunSurfaceRow(): MatterRow | null",
  "const directRows = rows.filter",
  "!row.isMaster",
  "!row.is_master",
  "return directRows[0] || null",
  "directMatterSingleMasterDryRunControlEnabled = false",
  "phase43f-direct-matter-ui-surface-attachment"
]) {
  contains("matters page contains Phase 43H strict resolver token " + token, page, token);
}

const resolverStart = page.indexOf("function directMatterSingleMasterDryRunSurfaceRow");
const resolverEnd = page.indexOf("function renderDirectMatterSingleMasterDryRunControlForRow", resolverStart);
const resolverBlock = resolverStart >= 0 && resolverEnd > resolverStart ? page.slice(resolverStart, resolverEnd) : "";
contains("resolver block captured", resolverBlock, "directMatterSingleMasterDryRunSurfaceRow");
contains("resolver block returns direct row only", resolverBlock, "return directRows[0] || null");
notContains("resolver block does not fall back to rows[0]", resolverBlock, "|| rows[0]");
notContains("resolver block does not include masterLawsuitId", resolverBlock, "masterLawsuitId");
notContains("resolver block does not call finalize", resolverBlock, "/api/documents/finalize");
contains("package Phase 43H verifier registered", JSON.stringify(pkg.scripts || {}), "verify:phase43h-strict-direct-only-dry-run-surface-row-safety");

console.log("CONTRACT: Phase 43H enforces strict direct-row only dry-run resolver, still disabled/no-upload.");
console.log("RESULT: Phase 43H strict direct-only dry-run surface row verifier");
if (failed) process.exit(1);
