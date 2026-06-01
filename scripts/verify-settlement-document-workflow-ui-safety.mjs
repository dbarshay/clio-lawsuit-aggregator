import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

let failed = false;

function check(label, ok) {
  if (ok) {
    console.log(`PASS: ${label}`);
  } else {
    failed = true;
    console.error(`FAIL: ${label}`);
  }
}

check("settlement document launch mode exists", page.includes('useState<"lawsuit" | "settlement">("lawsuit")'));
check("settlement document record id state exists", page.includes("masterDocumentSettlementRecordId"));
check("settlement document preview endpoint is used", page.includes("/api/settlements/documents-preview"));
check("commit settlement creates payment due tickler", page.includes("await createMasterSettlementPaymentDueTickler(savedSettlementRecordId)"));
check("commit settlement launches settlement document dialog", page.includes('mode: "settlement"') && page.includes("settlementRecordId: savedSettlementRecordId"));
check("preview panel is visible when workflow stage is preview", page.includes('{masterDocumentWorkflowStage === "preview" && displayedSelectedTemplate && ('));
check("edit panel is visible when workflow stage is edit", page.includes('{masterDocumentWorkflowStage === "edit" && displayedSelectedTemplate && ('));
check("old preview false guard removed", !page.includes('{false && masterDocumentWorkflowStage === "preview"'));
check("old edit false guard removed", !page.includes('{false && masterDocumentWorkflowStage === "edit"'));
check("preview copy no longer says placeholder state", !page.includes("no PDF or final file is generated in this placeholder state"));
check("edit copy no longer says no Word integration is faked", !page.includes("No Word integration is faked here"));
check(
  "settlement delivery exposes Email Finalized Document",
  page.includes("Email Finalized Document") &&
    page.includes("launchSettlementFinalizedDocumentEmail")
);
check(
  "settlement delivery exposes Print Finalized Document",
  page.includes('"Print Finalized Document"') &&
    page.includes("launchMasterDocumentPrint")
);
check(
  "settlement delivery exposes Send to Print Queue",
  page.includes('"Send to Print Queue"') &&
    page.includes("sendMasterDocumentToPrintQueue")
);
check(
  "settlement delivery copy reflects finalized local delivery contract",
  page.includes("Settlement delivery now uses the local settlement finalization record created in Step 2.") &&
    page.includes("Send to Print Queue writes a local Barsh Matters print-queue item only.") &&
    page.includes("Email Finalized Document creates a Microsoft Graph / Outlook draft")
);
check(
  "settlement document delivery does not expose temporary void shortcut",
  !page.slice(page.indexOf("Settlement delivery now uses the local settlement finalization record created in Step 2.") - 2500, page.indexOf("Settlement delivery now uses the local settlement finalization record created in Step 2.") + 1200).includes("Temporary Void Settlement")
);

check("document picker matches displayed settlement options", page.includes("const match = displayedTemplateOptions.find"));
check("document picker has explicit Continue action", page.includes('"Continue"') && page.includes("Continue to preview or edit the selected document."));

check("selected template falls back to typed/displayed label", page.includes("option.label.toLowerCase() === masterDocumentTemplateQuery.trim().toLowerCase()"));
check("selected template reuses displayedSelectedTemplate", page.includes("const selectedTemplate =\n      displayedSelectedTemplate || null;"));



if (failed) {
  process.exit(1);
}

console.log("PASS: settlement document workflow UI safety verifier");
