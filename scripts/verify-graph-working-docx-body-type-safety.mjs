import fs from "fs";

const file = fs.readFileSync("lib/documents/graphWorkingDocuments.ts", "utf8");

const required = [
  "const docxBody = new Uint8Array(params.docxBuffer);",
  "body: docxBody,",
  "Content-Type",
  "DOCX_CONTENT_TYPE",
];

const forbidden = [
  "body: params.docxBuffer,",
  "sendMail",
  "documentPrintQueueItem.create",
];

const failures = [];

for (const marker of required) {
  if (!file.includes(marker)) failures.push(`missing required marker: ${marker}`);
}

for (const marker of forbidden) {
  if (file.includes(marker)) failures.push(`forbidden marker present: ${marker}`);
}

if (failures.length) {
  console.error("FAIL: Graph working DOCX upload body type verifier failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: Graph working DOCX upload uses a Uint8Array body without delivery side effects.");
