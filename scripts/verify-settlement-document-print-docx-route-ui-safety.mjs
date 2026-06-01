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
check("settlement print uses local finalized-document print route", page.includes("/api/settlements/documents-print-local?finalizationId="));
check("settlement print requires finalization record id", page.includes("masterDocumentFinalizationResult?.finalizationRecord?.id"));
check("settlement print opens printable route", page.includes("window.open(printableUrl"));
check("print warns to finalize first", page.includes("Finalize the settlement document before opening the print dialog."));
check("print success panel exists", page.includes("masterDocumentPrintResult"));
check("print success copy reflects local printable view", page.includes("Opened a local printable settlement document view and launched the browser print dialog."));
check("settlement print action marker exists", page.includes('action: "settlement-document-print-dialog-opened"'));
check("Print Finalized Document button present", page.includes('"Print Finalized Document"') && page.includes("launchMasterDocumentPrint"));
check("package verifier script registered", pkg.includes("verify:settlement-document-print-docx-route-ui-safety"));

check("does not add Clio upload from print", !page.includes("uploadDocumentToClio"));
check("does not add email send from print", !page.includes("sendMail("));
check("does not fake PDF ready in print result", page.includes("finalizedPdfGenerated: false") && page.includes("printablePdfReady: false"));

if (failures.length) {
  console.error(`FAIL: settlement document print DOCX route UI safety verifier (${failures.length} failure(s))`);
  process.exit(1);
}

console.log("PASS: settlement document print DOCX route UI safety verifier");
