import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");

const required = [
  "matterDocumentActivityPopupOpen",
  "matterDocumentActivityLoading",
  "matterDocumentActivityError",
  "matterDocumentActivityResult",
  "function directMatterDisplayNumberForDocumentActivity()",
  "function openMatterDocumentActivityPopup()",
  "function closeMatterDocumentActivityPopup()",
  "function renderMatterDocumentActivityPopup()",
  "Document Activity",
  "Open this direct matter's document activity.",
  "/api/documents/finalization-history?matterDisplayNumber=",
  "finalized documents, drafted emails, print queue records, and delivery status",
  "This popup does not email, print, upload, queue, or write records.",
  "{renderMatterDocumentActivityPopup()}",
];

const failures = [];

for (const marker of required) {
  if (!page.includes(marker)) failures.push(`missing required marker: ${marker}`);
}

const helperStart = page.indexOf("function renderMatterDocumentActivityPopup()");
const helperEnd = page.indexOf("function renderMatterClioDocumentsPanel()");
const helperSection = helperStart >= 0 && helperEnd > helperStart ? page.slice(helperStart, helperEnd) : "";

for (const forbidden of [
  "fetch(`/api/graph/create-draft",
  "fetch(`/api/documents/print-queue",
  "fetch(`/api/documents/finalize",
  "sendMail",
  "uploadFinalDocumentsToClio",
  "sendMatterDocumentToPrintQueue",
]) {
  if (helperSection.includes(forbidden)) {
    failures.push(`forbidden marker present in direct matter document activity UI section: ${forbidden}`);
  }
}

const activityButtonIndex = page.indexOf("Open this direct matter's document activity.");
const viewButtonIndex = page.indexOf("Open the Direct Matter Clio document picker.");
if (activityButtonIndex === -1) failures.push("Document Activity button title not found.");
if (viewButtonIndex === -1) failures.push("View Documents title not found.");
if (activityButtonIndex !== -1 && viewButtonIndex !== -1 && activityButtonIndex > viewButtonIndex) {
  failures.push("Document Activity button should appear before View Documents.");
}

if (failures.length) {
  console.error("FAIL: direct matter document activity UI verifier failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: direct matter document activity UI is read-only and wired to the local document delivery history route.");
