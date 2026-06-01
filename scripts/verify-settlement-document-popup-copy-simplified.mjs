import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");
const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, needle) {
  if (page.includes(needle)) failures.push(`still contains ${label}: ${needle}`);
}

mustInclude("Settlement Document Generation title", "Settlement Document Generation");
mustInclude("Document Delivery heading", "Document Delivery");
mustInclude("Send to Print Queue button", "Send to Print Queue");
mustInclude("Save Finalized PDF button", "Save Finalized PDF");
mustInclude("Print Finalized Document button", "Print Finalized Document");
mustInclude("Email Finalized Document button", "Email Finalized Document");

mustNotInclude(
  "top settlement document explanatory copy",
  "Select a settlement document, preview or edit it, then finalize."
);
mustNotInclude(
  "local settlement source explanatory copy",
  "This settlement path reads Barsh Matters local settlement records only."
);
mustNotInclude(
  "stale delivery wiring copy",
  "Delivery actions will be enabled after the finalized-document email, print, and queue workflows are wired."
);
mustNotInclude(
  "stale Step 3 Clio upload copy",
  "Master/Lawsuit final upload to Clio is now handled in Step 3."
);

if (failures.length) {
  console.error("FAIL: settlement document popup copy simplification verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: settlement document popup explanatory copy simplified while delivery buttons remain.");
