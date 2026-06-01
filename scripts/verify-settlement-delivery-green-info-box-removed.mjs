import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");

const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, needle) {
  if (page.includes(needle)) failures.push(`still contains ${label}: ${needle}`);
}

mustInclude("Send to Print Queue button", "Send to Print Queue");
mustInclude("Save Finalized PDF button", "Save Finalized PDF");
mustInclude("Print Finalized Document button", "Print Finalized Document");
mustInclude("Email Finalized Document button", "Email Finalized Document");

mustNotInclude(
  "settlement delivery green explanatory box copy",
  "Settlement delivery now uses the local settlement finalization record created in Step 2."
);
mustNotInclude(
  "old Save Locally generated DOCX explanatory copy",
  "Save Locally opens the generated DOCX route for desktop saving."
);

if (failures.length) {
  console.error("FAIL: settlement delivery green info box removal verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: settlement delivery green explanatory box removed while delivery action buttons remain.");
