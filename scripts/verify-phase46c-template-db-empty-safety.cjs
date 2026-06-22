const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

let failed = false;
const root = process.cwd();
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };

function contains(label, text, token) {
  text.includes(token) ? pass(label) : fail(`${label} missing token: ${token}`);
}
function notContains(label, text, token) {
  !text.includes(token) ? pass(label) : fail(`${label} contains forbidden token: ${token}`);
}

const docPath = "docs/template-generation-refactor/phase46c-delete-all-test-document-templates.md";
const pkgPath = "package.json";

for (const p of [docPath, pkgPath]) {
  exists(p) ? pass(`required file exists: ${p}`) : fail(`missing required file: ${p}`);
}

const doc = exists(docPath) ? read(docPath) : "";
const pkg = exists(pkgPath) ? JSON.parse(read(pkgPath)) : { scripts: {} };

contains("doc states all stored DB templates were test templates", doc, "All stored database document templates were test templates");
contains("doc lists DocumentTemplate deletion", doc, "all `DocumentTemplate` rows");
contains("doc lists DocumentTemplateVersion deletion", doc, "all `DocumentTemplateVersion` rows");
contains("doc lists merge-field deletion", doc, "all `DocumentTemplateMergeField` rows");
contains("doc confirms no Clio upload", doc, "upload to Clio");
contains("doc notes placeholder generators remain", doc, "hardcoded master/lawsuit placeholder document generators");
contains("doc notes code-registry fallback remains for later phase", doc, "code-registry fallback definitions");

if (pkg.scripts && pkg.scripts["verify:phase46c-template-db-empty-safety"] === "node scripts/verify-phase46c-template-db-empty-safety.cjs") {
  pass("package Phase 46C verifier script registered");
} else {
  fail("package Phase 46C verifier script missing");
}

for (const token of [
  "confirmUpload: true",
  "CONFIRM_LIVE_TERMINAL_FINALIZE=YES",
  "uploadBufferToClioMatterDocuments(",
  "documentPrintQueueItem.create("
]) {
  notContains(`doc no live/write marker ${token}`, doc, token);
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const counts = {
      documentTemplates: await prisma.documentTemplate.count(),
      documentTemplateVersions: await prisma.documentTemplateVersion.count(),
      documentTemplateMergeFields: await prisma.documentTemplateMergeField.count(),
    };

    console.log("TEMPLATE_DB_COUNTS=" + JSON.stringify(counts));

    if (counts.documentTemplates === 0) pass("DocumentTemplate table empty");
    else fail(`DocumentTemplate table not empty: ${counts.documentTemplates}`);

    if (counts.documentTemplateVersions === 0) pass("DocumentTemplateVersion table empty");
    else fail(`DocumentTemplateVersion table not empty: ${counts.documentTemplateVersions}`);

    if (counts.documentTemplateMergeFields === 0) pass("DocumentTemplateMergeField table empty");
    else fail(`DocumentTemplateMergeField table not empty: ${counts.documentTemplateMergeFields}`);
  } finally {
    await prisma.$disconnect();
  }

  if (failed) {
    console.error("FAIL: Phase 46C template DB empty safety verifier failed");
    process.exit(1);
  }

  console.log("PASS: Phase 46C template DB empty safety verifier passed");
})().catch((err) => {
  console.error("FAIL:", err && err.stack ? err.stack : err);
  process.exit(1);
});
