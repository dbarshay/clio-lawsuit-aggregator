import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const pkgPath = "package.json";
const page = fs.readFileSync(pagePath, "utf8");
const pkg = fs.readFileSync(pkgPath, "utf8");
const failures = [];

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures.push(label);
  }
}

check("print result state exists", page.includes("masterDocumentPrintResult"));
check("settlement print uses finalized PDF candidate helper", page.includes("settlementFinalizedPdfCandidateFromResult()"));
check("settlement print uses finalized PDF URL resolver", page.includes('selectedFinalizedDocumentUrl(selectedCandidate, "inline")'));
check("finalized document URL resolver builds Clio document open route", page.includes("/api/documents/clio-document-open?") && page.includes('params.set("documentId", String(clioDocumentId))'));
check("settlement print requires finalization record id", page.includes("masterDocumentFinalizationResult?.finalizationRecord?.id"));
check("settlement print opens finalized PDF window", page.includes("printWindow.location.href = printableUrl"));
check("print warns to finalize first", page.includes("Finalize the settlement document before opening the print dialog."));
check("print success panel exists", page.includes("masterDocumentPrintResult"));
check("print success copy reflects finalized PDF print path", page.includes("The finalized settlement PDF from the mapped master Clio matter Documents tab was opened for printing."));
check("settlement print action marker exists", page.includes('action: "settlement-document-finalized-pdf-print-opened"'));
check("Print Finalized Document button present", page.includes('"Print Finalized Document"') && page.includes("launchMasterDocumentPrint"));
check("package verifier script registered", pkg.includes("verify:settlement-document-print-docx-route-ui-safety"));

check("does not add Clio upload from print", !page.includes("uploadDocumentToClio"));
check("does not add email send from print", !page.includes("sendMail("));
check("marks finalized PDF ready in print result", page.includes("finalizedPdfGenerated: true") && page.includes("printablePdfReady: true"));

if (failures.length) {
  console.error(`FAIL: settlement document print DOCX route UI safety verifier (${failures.length} failure(s))`);
  process.exit(1);
}

console.log("PASS: settlement document print DOCX route UI safety verifier");
