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
check("settlement print uses generated DOCX URL", page.includes("settlement-document-docx-open-for-print"));
check("print reads generatedDocument downloadUrl", page.includes("masterDocumentFinalizationResult?.generatedDocument?.downloadUrl"));
check("print opens docx route", page.includes("window.open(docxDownloadUrl"));
check("print warns to finalize first", page.includes("Finalize the settlement document before opening the generated DOCX route."));
check("print success panel exists", page.includes("DOCX Route Opened"));
check("print success copy avoids fake PDF", page.includes("The generated DOCX route was opened.  No PDF was generated, no Clio upload occurred, no Outlook draft was created, and no email was sent."));
check("opened DOCX route displayed", page.includes("Opened DOCX route"));
check("existing Print Document button still present", page.includes('"Print Document"') && page.includes("launchMasterDocumentPrint"));
check("package verifier script registered", pkg.includes("verify:settlement-document-print-docx-route-ui-safety"));

check("does not add Clio upload from print", !page.includes("uploadDocumentToClio"));
check("does not add email send from print", !page.includes("sendMail("));
check("does not fake PDF ready in print result", page.includes("finalizedPdfGenerated: false") && page.includes("printablePdfReady: false"));

if (failures.length) {
  console.error(`FAIL: settlement document print DOCX route UI safety verifier (${failures.length} failure(s))`);
  process.exit(1);
}

console.log("PASS: settlement document print DOCX route UI safety verifier");
