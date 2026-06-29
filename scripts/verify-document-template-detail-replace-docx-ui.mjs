import fs from "node:fs";

const page = fs.readFileSync("app/admin/document-templates/[key]/page.tsx", "utf8");
const route = fs.readFileSync("app/api/documents/templates/replace-version/route.ts", "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

must(page.includes('data-barsh-admin-document-template-replacement-workflow="true"'), "missing replacement workflow marker");
must(page.includes('data-barsh-admin-document-template-replace-docx="true"'), "missing Replace DOCX UI panel");
must(page.includes('data-barsh-admin-document-template-replace-docx-file="true"'), "missing replacement DOCX file input");
must(page.includes('data-barsh-admin-document-template-replace-docx-label="true"'), "missing replacement label input");
must(page.includes('data-barsh-admin-document-template-preview-replacement-button="true"'), "missing Preview Replacement button");
must(page.includes('data-barsh-admin-document-template-confirm-replacement-button="true"'), "missing Confirm Replacement Version button");
must(page.includes('data-barsh-admin-document-template-replacement-preview-summary="true"'), "missing replacement preview summary");
must(page.includes('data-barsh-admin-document-template-replace-docx-message="true"'), "missing replacement message anchor");
must(page.includes("async function previewReplacementDocxVersion()"), "missing previewReplacementDocxVersion function");
must(page.includes("async function confirmReplacementDocxVersion()"), "missing confirmReplacementDocxVersion function");
must(page.includes('fetch("/api/documents/templates/replace-version"'), "detail UI does not call replace-version API");
must(page.includes('previewForm.append("apply", "false")'), "replacement UI must preview before apply");
must(page.includes('applyForm.append("apply", "true")'), "replacement UI must explicitly apply only after preview");
must(page.includes("!replacementPreview"), "confirm button/function must require preview");
must(page.includes("Prior versions are preserved"), "replacement UI missing prior-version preservation language");
must(page.includes("new DocumentTemplateVersion"), "replacement UI missing new DocumentTemplateVersion behavior language");
must(page.includes("currentVersionId is updated only after confirmation"), "replacement UI missing currentVersionId confirmation language");
must(page.includes("does not generate documents, upload to Clio, send email, create drafts, print, or queue documents"), "replacement UI missing safety language");
must(route.includes("tx.documentTemplateVersion.create"), "replace-version route must create a new version");
must(route.includes("currentVersionId: version.id"), "replace-version route must update currentVersionId");
must(route.includes("preserved prior versions") || route.includes("preservesPriorVersions: true"), "replace-version route must document preservation");
must(route.includes("draftsCreated: false"), "replace-version route must preserve no-drafts safety");
must(route.includes("emailsSent: false"), "replace-version route must preserve no-email safety");
must(route.includes("printQueued: false"), "replace-version route must preserve no-print safety");

if (failures.length) {
  console.error("FAILURES=" + failures.length);
  for (const failure of failures) console.error("FAIL=" + failure);
  process.exit(1);
}
console.log("PASS: template detail Replace DOCX / Upload New Version UI is wired safely");
