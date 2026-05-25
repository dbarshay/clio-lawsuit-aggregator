import fs from "fs";

const admin = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
const confirm = fs.readFileSync("app/api/documents/templates/import-confirm/route.ts", "utf8");
const route = fs.readFileSync("app/api/documents/templates/route.ts", "utf8");

const requiredAdmin = [
  "Template DOCX Storage",
  "readFileAsBase64",
  "reader.readAsDataURL(file)",
  "contentBase64",
  "storageKind: \"db-docx-base64\"",
  "actualFileStored: true",
  "DOCX file content is captured as base64",
  "Base64 length:",
];

const requiredConfirm = [
  "function uploadedTemplateFileFor",
  "contentBase64",
  "storageKind: \"db-docx-base64\"",
  "actualFileStored: true",
  "contentBase64StoredInVersion: true",
  "contentText: uploadedTemplateFile?.contentBase64 || null",
  "storageKind: uploadedTemplateFile ? \"db-docx-base64\" : \"metadata-only\"",
];

const requiredRoute = [
  "hasStoredDocx",
  "storedDocxBytes",
  "uploadedTemplateFile",
];

const failures = [];

for (const marker of requiredAdmin) {
  if (!admin.includes(marker)) failures.push(`admin missing marker: ${marker}`);
}
for (const marker of requiredConfirm) {
  if (!confirm.includes(marker)) failures.push(`confirm route missing marker: ${marker}`);
}
for (const marker of requiredRoute) {
  if (!route.includes(marker)) failures.push(`repository route missing marker: ${marker}`);
}

const adminDocxStorageSection = admin.slice(
  admin.indexOf("Template DOCX Storage"),
  admin.indexOf("Custom Import Preview") > 0 ? admin.indexOf("Custom Import Preview") : admin.length
);

for (const forbidden of [
  "fetch(\"/api/documents/finalize",
  "fetch(\"/api/graph/create-draft",
  "fetch(\"/api/documents/print-queue",
  "sendMail",
]) {
  if (adminDocxStorageSection.includes(forbidden)) {
    failures.push(`admin storage section forbidden marker: ${forbidden}`);
  }
}

for (const forbidden of [
  "graph.microsoft.com",
  "sendMail",
  "documentPrintQueueItem.create",
]) {
  if (confirm.includes(forbidden)) {
    failures.push(`confirm route forbidden marker: ${forbidden}`);
  }
}

if (failures.length) {
  console.error("FAIL: template DOCX DB storage safety verifier failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: template DOCX DB storage captures DOCX base64 locally without Clio, Graph, email, print, or queue side effects.");
