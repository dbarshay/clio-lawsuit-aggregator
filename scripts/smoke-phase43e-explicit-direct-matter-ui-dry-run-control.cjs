const fs = require("fs");
const path = require("path");

let failed = false;
function pass(message) {
  console.log(`PASS: ${message}`);
}
function fail(message) {
  failed = true;
  console.error(`FAIL: ${message}`);
}
function functionBlock(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) return "";
  const brace = source.indexOf("{", start);
  if (brace < 0) return "";
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return "";
}

const pagePath = path.join(process.cwd(), "app/matters/page.tsx");
const source = fs.readFileSync(pagePath, "utf8");

const requiredTokens = [
  "static/no-server/no-upload",
  "directMatterSingleMasterDryRunControlEnabled = false",
  "handleDirectMatterSingleMasterDryRunControl",
  "renderDirectMatterSingleMasterDryRunControl",
  "runDirectMatterSingleMasterFinalizeDryRunFromUi",
  "confirmUpload: false",
  "singleMasterDryRun: true",
  "singleMasterResolveFolders: true",
  "allowDuplicateUploads: false",
  "data-phase43e-direct-matter-dry-run-control",
];

for (const token of requiredTokens) {
  if (source.includes(token)) pass(`Phase 43E smoke token present: ${token}`);
  else fail(`Phase 43E smoke token missing: ${token}`);
}

const controlBlock = functionBlock(source, "renderDirectMatterSingleMasterDryRunControl");
if (!controlBlock) {
  fail("Phase 43E dry-run control block captured");
} else {
  pass("Phase 43E dry-run control block captured");
}

if (controlBlock.includes("masterLawsuitId")) fail("Phase 43E control block contains masterLawsuitId");
else pass("Phase 43E control block does not contain masterLawsuitId");

if (controlBlock.includes("confirmUpload: true")) fail("Phase 43E control block contains confirmUpload true");
else pass("Phase 43E control block does not contain confirmUpload true");

console.log("CONTRACT: Phase 43E smoke is static/no-server/no-upload.");
console.log("RESULT: Phase 43E explicit direct matter UI dry-run control smoke");
if (failed) process.exit(1);
