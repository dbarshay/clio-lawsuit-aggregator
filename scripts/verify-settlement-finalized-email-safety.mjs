import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");
const finalizeRoute = fs.readFileSync("app/api/settlements/documents-finalize-local/route.ts", "utf8");
const createDraftRoute = fs.readFileSync("app/api/graph/create-draft/route.ts", "utf8");

const checks = [
  {
    label: "settlement-specific finalized PDF candidate helper exists",
    ok: page.includes("function settlementFinalizedPdfCandidateFromResult()"),
  },
  {
    label: "settlement email launcher exists",
    ok: page.includes("async function launchSettlementFinalizedDocumentEmail()"),
  },
  {
    label: "settlement email launcher prepares existing delivery draft payload before creating Outlook draft",
    ok: page.includes('fetch("/api/documents/delivery-draft-preview"'),
  },
  {
    label: "settlement email launcher identifies settlement finalized PDF delivery source",
    ok: page.includes('source: "settlement_finalized_pdf_delivery"'),
  },
  {
    label: "settlement email launcher uses finalized Clio document id",
    ok: page.includes("selectedCandidate.clioDocumentId"),
  },
  {
    label: "Step 3 Email Finalized Document button calls settlement-specific launcher",
    ok: page.includes("onClick={() => void launchSettlementFinalizedDocumentEmail()}"),
  },
  {
    label: "Step 3 email button is enabled only after finalization record exists",
    ok: page.includes("disabled={!masterDocumentFinalizationResult?.finalizationRecord?.id}"),
  },
  {
    label: "Step 3 explanatory copy says Microsoft Graph / Outlook draft is created",
    ok: page.includes("Email Finalized Document creates a Microsoft Graph / Outlook draft"),
  },
  {
    label: "duplicate-skipped finalized PDFs expose clioDocumentId alias",
    ok: finalizeRoute.includes("clioDocumentId: existingMatch.id"),
  },
  {
    label: "duplicate-skipped finalized PDFs expose clioDocumentVersionUuid alias",
    ok: finalizeRoute.includes("clioDocumentVersionUuid: existingMatch.latestDocumentVersion?.uuid || null"),
  },
  {
    label: "settlement finalized email preview popup renderer exists",
    ok: page.includes("function renderSettlementFinalizedEmailPreviewPopup()"),
  },
  {
    label: "settlement finalized email click does not open preview popup",
    ok: page.includes("setMasterSettlementEmailPreviewPopupOpen(false)"),
  },
  {
    label: "settlement finalized email flow creates Outlook draft directly after payload preparation",
    ok: page.includes("await createMasterDocumentOutlookDraft(nextPreview, draftWindow)"),
  },
  {
    label: "settlement finalized email opens a draft window from click path",
    ok: page.includes('const draftWindow = window.open("", "_blank")'),
  },
  {
    label: "draft create function accepts draft window for Outlook webLink navigation",
    ok: page.includes("async function createMasterDocumentOutlookDraft(previewOverride?: any, draftWindow?: Window | null)"),
  },
  {
    label: "draft create function navigates opened window to Outlook draft webLink",
    ok: page.includes("draftWindow.location.href = outlookDraftUrl"),
  },
  {
    label: "settlement finalized email bypasses To/Cc readiness gate for Outlook edit-in-draft flow",
    ok: page.includes("settlementFinalizedPdfDelivery") && page.includes("!settlementFinalizedPdfDelivery && !isDocumentDeliveryReadyForGraphDraft(previewState)"),
  },


  {
    label: "backend Graph draft route allows settlement finalized PDF drafts without recipient readiness",
    ok:
      createDraftRoute.includes("settlementFinalizedPdfDelivery") &&
      createDraftRoute.includes("hasFinalizedSettlementPdfAttachment") &&
      createDraftRoute.includes("!(settlementFinalizedPdfDelivery && hasFinalizedSettlementPdfAttachment)"),
  },
  {
    label: "settlement finalization route still states no email is created during finalization",
    ok: finalizeRoute.includes("No Outlook draft was created, no email was sent"),
  },
];

let failed = 0;
for (const check of checks) {
  if (check.ok) {
    console.log(`PASS: ${check.label}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${check.label}`);
  }
}

if (failed) {
  console.error(`\nSettlement finalized email safety verifier failed: ${failed} check(s).`);
  process.exit(1);
}

console.log("\nSettlement finalized email safety verifier passed.");
