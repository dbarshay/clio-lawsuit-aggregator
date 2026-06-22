const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const finalizePreview = read("app/api/documents/finalize-preview/route.ts");
const directPreview = read("app/api/documents/direct-finalize-preview/route.ts");
const finalize = read("app/api/documents/finalize/route.ts");

for (const [label, text] of [["finalize-preview", finalizePreview], ["direct-finalize-preview", directPreview]]) {
  for (const forbidden of ["clioFetch(", "resolveClioMatterByDisplayNumber", "listClioMatterDocuments("]) {
    if (!text.includes(forbidden)) pass(`${label} excludes ${forbidden}`);
    else fail(`${label} still contains ${forbidden}`);
  }
}

if (finalizePreview.includes("singleMasterClioStorage") && finalizePreview.includes('"single-master-lawsuit-storage"')) {
  pass("finalize-preview supports single-master lawsuit storage");
} else {
  fail("finalize-preview missing single-master lawsuit storage support");
}

if (directPreview.includes('"single-master-direct-individual-storage"') && directPreview.includes("Legacy Clio matter-shell direct finalization preview is disabled")) {
  pass("direct-finalize-preview supports single-master direct storage and blocks legacy shell preview");
} else {
  fail("direct-finalize-preview missing single-master direct storage guard");
}

if (finalize.includes('previewUrl.searchParams.set("singleMasterClioStorage", "1")')) {
  pass("finalize route passes singleMasterClioStorage=1 to preview");
} else {
  fail("finalize route does not pass singleMasterClioStorage=1 to preview");
}


if (finalize.includes("noConfigRequired: true") && finalize.includes("!(params as any).singleMasterDryRun")) {
  pass("finalize no-live dry-run can build target preview without live storage env gates");
} else {
  fail("finalize no-live dry-run env-gate bypass is missing");
}

console.log("RESULT: single-master finalize preview no-shell safety verifier");
if (failed) process.exit(1);
