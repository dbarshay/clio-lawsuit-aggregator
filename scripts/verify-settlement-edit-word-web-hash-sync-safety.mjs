import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const workingRoutePath = "app/api/documents/working-docx/route.ts";
const finalizeRoutePath = "app/api/settlements/documents-finalize-local/route.ts";

const page = fs.readFileSync(pagePath, "utf8");
const workingRoute = fs.readFileSync(workingRoutePath, "utf8");
const finalizeRoute = fs.readFileSync(finalizeRoutePath, "utf8");

let failed = false;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    failed = true;
    console.error(`FAIL: ${label}`);
  }
}

function mustContain(label, text, needle) {
  check(`${label}: found ${needle}`, text.includes(needle));
}

function mustNotContain(label, text, needle) {
  check(`${label}: does not contain ${needle}`, !text.includes(needle));
}

console.log("=== VERIFY SETTLEMENT EDIT WORD WEB HASH SYNC SAFETY ===");

mustContain("working-docx route", workingRoute, 'import { createHash } from "node:crypto";');
mustContain("working-docx route", workingRoute, "function sha256Hex(buffer: Buffer): string");
mustContain("working-docx route", workingRoute, "const sourceDocxSha256 = sha256Hex(buffer);");
mustContain("working-docx route", workingRoute, "sourceDocxSha256");
mustContain("working-docx route", workingRoute, "workingDocument: {");
mustContain("working-docx route", workingRoute, "...working");
mustContain("working-docx route", workingRoute, "sourceDocxByteLength: buffer.byteLength");

mustContain("settlement finalize route", finalizeRoute, 'import { createHash } from "node:crypto";');
mustContain("settlement finalize route", finalizeRoute, "function sha256Hex(buffer: Buffer): string");
mustContain("settlement finalize route", finalizeRoute, "downloadStableEditedWorkingDocxFromGraph");
mustContain("settlement finalize route", finalizeRoute, "originalSourceDocxSha256");
mustContain("settlement finalize route", finalizeRoute, "changedFromOriginalSource");
mustContain("settlement finalize route", finalizeRoute, "sha256Sequence");
mustContain("settlement finalize route", finalizeRoute, "downloadWorkingDocxFromGraph");
mustContain("settlement finalize route", finalizeRoute, "uploadWorkingDocxToGraph");
mustContain("settlement finalize route", finalizeRoute, "edited-word-web-working-document-downloaded-snapshot");
mustContain("settlement finalize route", finalizeRoute, "workingDocumentSourceDocxSha256");
mustContain("settlement finalize route", finalizeRoute, "Buffer.from(downloadedEditedDocx.buffer)");
mustContain("settlement finalize route", finalizeRoute, "editedSnapshotChangedFromOriginalSource");
mustContain("settlement finalize route", finalizeRoute, "editedSnapshotOriginalSourceDocxSha256");
mustContain("settlement finalize route", finalizeRoute, "editedSnapshotLatestSha256");

mustContain("settlement finalize route", finalizeRoute, "maxElapsedMs = originalSourceDocxSha256 ? 30000 : 12000");
mustContain("settlement finalize route", finalizeRoute, "elapsedMs >= minElapsedMs");
mustContain("settlement finalize route", finalizeRoute, "changedFromOriginalSource");
mustContain("settlement finalize route", finalizeRoute, "break;");

mustContain("matters page", page, 'documentLaunchMode: isSettlementDocumentMode ? "settlement" : "lawsuit"');
mustContain("matters page", page, "settlementRecordId: isSettlementDocumentMode");
mustContain("matters page", page, "workingDocumentSourceDocxSha256: masterDocumentFinalizationResult?.workingDocument?.sourceDocxSha256 ||");
mustContain("matters page", page, "Close older working-document tabs to avoid editing the wrong file.");
mustContain("matters page", page, "waitForWordWebAutosaveBeforeFinalize");

mustNotContain(
  "settlement finalize route",
  finalizeRoute,
  "const downloadedEditedDocx = await downloadWorkingDocxFromGraph(workingDocumentDriveItemId);"
);

if (failed) {
  console.error("FAIL: settlement edit Word Web hash sync safety verifier");
  process.exit(1);
}

console.log("PASS: settlement edit Word Web hash sync safety verifier");
