#!/usr/bin/env node
import fs from "fs";

const pagePath = "app/matter/[id]/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const requiredMarkers = [
  "Settlement Workflow Status",
  "settlementWorkflowChecklist",
  "settlementWorkflowCompletedCount",
  "Settlement preview ready",
  "Provider fee defaults loaded",
  "Writeback preview ready",
  "Settlement values written to Clio",
  "Current Clio values match expected settlement values",
  "Payment confirmed",
  "Child/bill matters eligible to close",
  "Close Paid Settlements completed",
  "This panel is read-only and does not write to Clio",
  "persistent files, or the print queue",
  "Closure remains separate from settlement writeback",
  "payment must be confirmed before Close Paid",
  "master matters remain excluded",
  "already closed/final-status matters remain blocked",
  'gridTemplateColumns: "repeat(2, minmax(0, 1fr))"',
];

const missing = requiredMarkers.filter((marker) => !page.includes(marker));

if (missing.length > 0) {
  console.error("FAIL: Settlement Workflow Status UI safety verifier missing required marker(s):");
  for (const marker of missing) {
    console.error(`- ${marker}`);
  }
  process.exit(1);
}

const statusPanelHeading = page.indexOf("Settlement Workflow Status");
const clioValuesHeadingAfterStatus = page.indexOf(
  "Current Clio Settlement Values",
  statusPanelHeading + "Settlement Workflow Status".length
);

if (statusPanelHeading < 0) {
  console.error("FAIL: Settlement Workflow Status heading not found.");
  process.exit(1);
}

if (clioValuesHeadingAfterStatus < 0) {
  console.error("FAIL: Current Clio Settlement Values heading was not found after Settlement Workflow Status.");
  process.exit(1);
}

const statusPanelRegion = page.slice(statusPanelHeading, clioValuesHeadingAfterStatus);

const forbiddenMarkers = [
  "fetch(",
  "await ",
  "loadSettlementDocumentsPreview(",
  "closePaidSettlements(",
  "saveSettlementToClio(",
  "setPrintQueue",
];

const forbiddenFound = forbiddenMarkers.filter((marker) => statusPanelRegion.includes(marker));

if (forbiddenFound.length > 0) {
  console.error("FAIL: Settlement Workflow Status panel must remain display-only. Found forbidden marker(s):");
  for (const marker of forbiddenFound) {
    console.error(`- ${marker}`);
  }
  process.exit(1);
}

console.log("Settlement Workflow Status UI safety verifier passed.");
console.log("- Checklist markers present.");
console.log("- Current Clio Settlement Values appears after the status panel.");
console.log("- 2-column layout marker present.");
console.log("- No direct API/writeback/document/print-queue action markers found in the status panel region.");
