import fs from "node:fs";

const helper = fs.readFileSync("lib/documents/templateImport.ts", "utf8");
const confirm = fs.readFileSync("app/api/documents/templates/import-confirm/route.ts", "utf8");
const page = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
const pkg = fs.readFileSync("package.json", "utf8");
const failures = [];

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures.push(label);
  }
}

check("visibility type includes visible UI", helper.includes('"visible_ui"'));
check("visibility type includes hidden internal", helper.includes('"hidden_internal"'));
check("visibility type includes computed", helper.includes('"computed"'));
check("visibility type includes system", helper.includes('"system"'));
check("helper exports visibility normalizer", helper.includes("mergeFieldVisibility"));
check("helper builds metadata with visibility", helper.includes("mergeFieldMetadataWithVisibility"));
check("helper marks isVisibleInUi", helper.includes("isVisibleInUi"));
check("helper marks isHiddenInternal", helper.includes("isHiddenInternal"));
check("helper summary includes visible merge fields", helper.includes("visibleMergeFields"));
check("helper summary includes hidden internal merge fields", helper.includes("hiddenInternalMergeFields"));
check("confirm route preserves visibility metadata", confirm.includes("visibility: field.visibility") && confirm.includes("isHiddenInternal"));
check("admin page displays visible UI merge fields", page.includes("Visible UI merge fields"));
check("admin page displays hidden/internal merge fields", page.includes("Hidden/internal merge fields"));
check("admin warning mentions hidden/internal data fields", page.includes("hidden/internal data fields"));
check("package script registered", pkg.includes("verify:document-template-merge-field-visibility-safety"));

check("no prisma migration needed", !fs.readFileSync("prisma/schema.prisma", "utf8").includes("mergeFieldVisibility"));
check("no Clio call introduced", !helper.includes("uploadDocumentToClio") && !confirm.includes("uploadDocumentToClio"));
check("no document generation introduced", !helper.includes("Packer.toBuffer") && !confirm.includes("Packer.toBuffer"));
check("no email send introduced", !helper.includes("sendMail(") && !confirm.includes("sendMail("));

if (failures.length) {
  console.error(`FAIL: document template merge field visibility safety verifier (${failures.length} failure(s))`);
  process.exit(1);
}

console.log("PASS: document template merge field visibility safety verifier");
