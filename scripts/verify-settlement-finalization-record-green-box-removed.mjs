import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");

const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, needle) {
  if (page.includes(needle)) failures.push(`still contains ${label}: ${needle}`);
}

mustInclude("Document Delivery section", "Document Delivery");
mustInclude("Send to Print Queue button", "Send to Print Queue");
mustInclude("Save Finalized PDF button", "Save Finalized PDF");
mustInclude("Print Finalized Document button", "Print Finalized Document");
mustInclude("Email Finalized Document button", "Email Finalized Document");

mustNotInclude("Finalization Record Created green box heading", "Finalization Record Created");
mustNotInclude("Placeholder DOCX route ready finalization status copy", "Placeholder DOCX route ready:");
mustNotInclude("Planned filename finalization status copy", "Planned filename:");

if (failures.length) {
  console.error("FAIL: settlement finalization record green box removal verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: settlement finalization record green status box removed while delivery actions remain.");
