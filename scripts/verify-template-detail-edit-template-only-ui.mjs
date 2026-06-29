import fs from "node:fs";

const page = fs.readFileSync("app/admin/document-templates/[key]/page.tsx", "utf8");
const route = fs.readFileSync("app/api/documents/templates/edit-working-docx/route.ts", "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

must(page.includes('data-barsh-admin-document-template-edit-template-workflow="true"'), "missing Edit Template workflow panel");
must(page.includes('data-barsh-admin-document-template-edit-template-button="true"'), "missing Edit Template button");
must(page.includes('data-barsh-admin-document-template-save-edited-template-button="true"'), "missing Save Edited Template button");
must(page.includes("async function launchEditTemplate()"), "missing launchEditTemplate function");
must(page.includes("async function saveEditedTemplate()"), "missing saveEditedTemplate function");
must(page.includes('fetch("/api/documents/templates/edit-working-docx"'), "page does not call edit-working-docx route");

must(!page.includes('data-barsh-admin-document-template-text-editor="true"'), "Template Text Editor panel should be removed");
must(!page.includes("Template Text Editor"), "Template Text Editor heading should be removed");
must(!page.includes('data-barsh-admin-document-template-replacement-workflow="true"'), "Replace DOCX workflow panel should be removed");
must(!page.includes("Replace DOCX / Upload New Version"), "Replace DOCX heading should be removed");
must(!page.includes("Preview Text Edit"), "Preview Text Edit button should be removed");
must(!page.includes("Confirm Text Edit Version"), "Confirm Text Edit button should be removed");
must(!page.includes("Preview Replacement"), "Preview Replacement button should be removed");
must(!page.includes("Confirm Replacement Version"), "Confirm Replacement Version button should be removed");

must(route.includes("uploadWorkingDocxToGraph"), "Edit Template route must upload current repo DOCX to Graph");
must(route.includes("downloadWorkingDocxFromGraph"), "Edit Template route must download edited DOCX from Graph");
must(route.includes("tx.documentTemplateVersion.create"), "Edit Template save must create new DocumentTemplateVersion");
must(route.includes("currentVersionId: version.id"), "Edit Template save must update currentVersionId");
must(route.includes("preservesPriorVersions: true"), "Edit Template route safety must preserve prior versions");
must(route.includes("clioWrites: false"), "Edit Template route safety must block Clio writes");
must(route.includes("emailsSent: false"), "Edit Template route safety must block emails");
must(route.includes("printQueued: false"), "Edit Template route safety must block print queue");
must(route.includes("documentsGenerated: false"), "Edit Template route safety must block generation side effects");

if (failures.length) {
  console.error("FAILURES=" + failures.length);
  for (const failure of failures) console.error("FAIL=" + failure);
  process.exit(1);
}

console.log("PASS: template detail page exposes only the Edit Template workflow");
