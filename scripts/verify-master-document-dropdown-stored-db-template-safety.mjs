import fs from "fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");

const required = [
  "storedRepositoryDocumentOptions",
  "...storedRepositoryDocumentOptions",
  "Stored local DOCX templates appear first",
  "Stored DOCX",
  "hasStoredDocx",
  "storedDocxBytes",
  "masterDocumentRepositoryTemplates",
  "repositoryDocumentOptions",
];

const forbidden = [
  "fetch(`/api/documents/finalize",
  "fetch(`/api/graph/create-draft",
  "fetch(`/api/documents/print-queue",
  "sendMail",
];

const failures = [];

for (const marker of required) {
  if (!page.includes(marker)) failures.push(`missing required marker: ${marker}`);
}

const selectStepStart = page.indexOf("function renderMasterDocumentGenerationPopup()");
const selectStepEnd = page.indexOf("function renderMasterDocumentDeliveryPopup()");
const section = selectStepStart >= 0 && selectStepEnd > selectStepStart
  ? page.slice(selectStepStart, selectStepEnd)
  : "";

for (const marker of forbidden) {
  if (section.includes(marker)) failures.push(`forbidden side-effect marker in dropdown section: ${marker}`);
}

const storedSpreadCount = (page.match(/\.\.\.storedRepositoryDocumentOptions/g) || []).length;
if (storedSpreadCount < 2) {
  failures.push(`expected storedRepositoryDocumentOptions spread in both master document popup builders; found ${storedSpreadCount}`);
}

if (failures.length) {
  console.error("FAIL: master document dropdown stored DB template verifier failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: master document generation dropdown surfaces stored DB DOCX templates without delivery/finalization side effects.");
