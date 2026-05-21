import fs from "node:fs";

const failures = [];

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function mustInclude(path, needle, label = needle) {
  const text = read(path);
  if (!text.includes(needle)) {
    failures.push(`${path}: missing ${label}`);
  }
}

function mustNotInclude(path, needle, label = needle) {
  const text = read(path);
  if (text.includes(needle)) {
    failures.push(`${path}: forbidden ${label}`);
  }
}

const routePath = "app/api/settlements/documents-finalize-local/route.ts";
const pagePath = "app/matters/page.tsx";

if (!fs.existsSync(routePath)) {
  failures.push(`${routePath}: missing route`);
} else {
  mustInclude(routePath, "settlement-document-finalize-local");
  mustInclude(routePath, "prisma.localSettlementRecord.findFirst");
  mustInclude(routePath, "prisma.documentFinalization.create");
  mustInclude(routePath, "local-settlement-finalized-placeholder");
  mustInclude(routePath, "noUploadPerformed: true");
  mustInclude(routePath, "finalizedPdfGenerated: false");
  mustInclude(routePath, "persistentFileCreated: false");
  mustInclude(routePath, "clioRecordsChanged: false");
  mustInclude(routePath, "clioDocumentsUploaded: false");
  mustInclude(routePath, "printQueueChanged: false");
  mustInclude(routePath, "emailsSent: false");
  mustInclude(routePath, "outlookDraftsCreated: false");
  mustInclude(routePath, "noPdfPretended: true");
  mustNotInclude(routePath, "uploadDocumentToClio", "Clio document upload call");
  mustNotInclude(routePath, "graphFetchJson", "Graph draft call");
  mustNotInclude(routePath, "documentPrintQueueItem.create", "print queue write");
  mustNotInclude(routePath, "fs.writeFile", "filesystem persistent file write");
}

mustInclude(pagePath, "masterDocumentFinalizing");
mustInclude(pagePath, "masterDocumentFinalizationResult");
mustInclude(pagePath, "finalizeMasterSettlementDocumentPlaceholder");
mustInclude(pagePath, "/api/settlements/documents-finalize-local");
mustInclude(pagePath, "confirmFinalize: true");
mustInclude(pagePath, "Local Finalization Record Created");
mustInclude(pagePath, "No PDF was generated, no Clio upload occurred, no Outlook draft was created, and no print queue record was written.");

if (failures.length) {
  console.error("FAIL: settlement document local finalization safety verifier");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("PASS: settlement document local finalization safety verifier");
