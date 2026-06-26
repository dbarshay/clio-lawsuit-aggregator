import { existsSync, readFileSync } from "node:fs";

const forbiddenDocx = [
  "templates/docx/base/letterhead-simple.docx",
  "templates/docx/incoming/Initial Billing Letter.docx",
  "templates/docx/letters/initial-billing-letter.docx",
  "templates/docx/letters/vr-response.docx",
];

const requiredDoc = "docs/templates/template-generation-phase1c-single-docx-baseline.md";

const requiredDocSnippets = [
  "Fresh Local DOCX Baseline",
  "user creates a local Word DOCX outside the repository",
  "copies canonical merge fields from the Template Builder UI",
  "{{insurer.fullAddressBlock}}",
  "{{adversary.fullAddressBlock}}",
  "Street\nCity, State Zip",
  "restore letterhead-simple architecture",
  "restore pleading-paper architecture",
  "build legacy-token compatibility",
  "import a DOCX into the database",
  "upload to Clio",
  "call Microsoft Graph",
  "print or queue documents",
];

const failures = [];

for (const file of forbiddenDocx) {
  if (existsSync(file)) {
    failures.push("legacy DOCX still present: " + file);
  }
}

if (!existsSync(requiredDoc)) {
  failures.push("missing baseline doc: " + requiredDoc);
} else {
  const text = readFileSync(requiredDoc, "utf8");
  for (const snippet of requiredDocSnippets) {
    if (!text.includes(snippet)) {
      failures.push("baseline doc missing snippet: " + snippet);
    }
  }
}

if (failures.length) {
  console.error("FAIL: Template Generation Phase 1D fresh local DOCX reset verifier");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Template Generation Phase 1D fresh local DOCX reset verified");
