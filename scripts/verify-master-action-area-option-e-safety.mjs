import fs from "fs";
const page = fs.readFileSync("app/matters/page.tsx", "utf8");
const failures = [];
const required = [
  "data-barsh-master-action-area-option-e=\"true\"",
  "data-barsh-master-actions-section-heading=\"true\"",
  "data-barsh-master-action-panel=\"true\"",
  "data-barsh-master-action-tab={key}",
  "Payments",
  "Post Payment",
  "data-barsh-master-view-payments-button=\"true\"",
  "View Payments",
  "data-barsh-master-payments-panel=\"true\"",
  "Recent Receipts",
  "Settlement",
  "Record Settlement",
  "data-barsh-master-view-settlements-button=\"true\"",
  "View Settlements",
  "Documents",
  "data-barsh-master-view-documents-button=\"true\"",
  "View Documents",
  "data-barsh-master-view-emails-button=\"true\"",
  "View Emails",
  "data-barsh-master-generate-documents-button=\"true\"",
  "Generate Documents",
  "Court Dates",
  "Add New Court Date",
  "View / Edit Court Dates",
  "data-barsh-master-close-under-balance=\"true\"",
];
for (const token of required) {
  if (page.includes(token) === false) failures.push("missing " + token);
}
if (page.includes("Lawsuit Actions")) failures.push("old Lawsuit Actions heading still present");
if (page.includes("Payment controls: Active")) failures.push("old payment controls status text still present");
if (page.includes("data-barsh-master-action-section=\"closing\"")) failures.push("Close Lawsuit should not be a top action group");
if (failures.length) {
  console.error("FAIL: master action area option E safety");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("PASS: master action area option E safety");
