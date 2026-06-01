import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, needle) {
  if (page.includes(needle)) failures.push(`still contains ${label}: ${needle}`);
}

mustInclude("Save Finalized PDF button", '"Save Finalized PDF"');
mustInclude("finalized PDF download URL variable", "const finalizedPdfDownloadUrl = selectedCandidate");
mustInclude("uses selectedFinalizedDocumentUrl download mode", 'selectedFinalizedDocumentUrl(selectedCandidate, "download")');
mustInclude("finalized PDF filename variable", "const finalizedPdfFilename =");
mustInclude("save result action", "settlement-document-finalized-pdf-save-local-opened");
mustInclude("finalized PDF save success copy", "The finalized settlement PDF from the mapped master Clio matter Documents tab was opened for local saving.");
mustInclude("Save Finalized PDF handler action", "settlement-document-finalized-pdf-save-local-opened");
mustInclude("Save Finalized PDF button calls save handler", "() => saveMasterSettlementDocumentLocally(displayedSelectedTemplate)");

mustNotInclude("old Save Locally button label", '"Save Locally",');
mustNotInclude("old generated DOCX delivery explanation", "Save Locally opens the generated DOCX route for desktop saving.");
mustNotInclude("old generated DOCX save success copy", "The generated DOCX route was opened so the user can save the settlement document locally.");

const saveFunctionStart = page.indexOf("async function saveMasterSettlementDocumentLocally");
const saveFunctionEnd = page.indexOf("async function", saveFunctionStart + 1);
const saveFunction = page.slice(saveFunctionStart, saveFunctionEnd > saveFunctionStart ? saveFunctionEnd : page.length);

if (saveFunction.includes("generatedDocument?.downloadUrl") || saveFunction.includes("docxDownloadUrl")) {
  failures.push("save handler still references generated DOCX download URL fields");
}

if (failures.length) {
  console.error("FAIL: settlement finalized PDF save verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: settlement Save Finalized PDF downloads the finalized PDF candidate instead of the generated DOCX route.");
