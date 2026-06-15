import fs from "fs";
const path = "app/matter/[id]/page.tsx";
const s = fs.readFileSync(path, "utf8");
function sliceBetween(name, startToken, endToken) {
  const a = s.indexOf(startToken);
  if (a < 0) throw new Error("Missing start token for " + name + ": " + startToken);
  const b = s.indexOf(endToken, a);
  if (b < 0) throw new Error("Missing end token for " + name + ": " + endToken);
  return s.slice(a, b);
}
function assertOk(condition, message) {
  if (!condition) throw new Error(message);
  console.log("PASS:", message);
}
const ranges = {
  audit: sliceBetween("audit", "{matterAuditHistoryPopupOpen && (", "{directFieldEditModal === \"claimAmount\""),
  docActivity: sliceBetween("docActivity", "function renderMatterDocumentActivityPopup()", "function renderMatterClioDocumentsPanel()"),
  viewEmails: sliceBetween("viewEmails", "function renderMatterViewEmailsPopup()", "function renderMatterDocumentDataPreviewPanel()"),
  docGeneration: sliceBetween("docGeneration", "function renderMatterDocumentGenerationPopup()", "function renderMatterViewEmailsPopup()"),
  metadata: sliceBetween("metadata", "{showMetadataModal && (", "{showLawsuitOptionsModal && ("),
  claimAmount: sliceBetween("claimAmount", "data-barsh-direct-claim-amount-edit-standard-modal", "{directFieldEditModal === \"dos\""),
};
for (const [name, chunk] of Object.entries({ audit: ranges.audit, docActivity: ranges.docActivity, viewEmails: ranges.viewEmails, docGeneration: ranges.docGeneration, metadata: ranges.metadata })) {
  assertOk(chunk.includes("background: \"#1e3a8a\""), name + " has navy centered header");
  assertOk(!chunk.includes("×"), name + " has no top-right close glyph");
  assertOk(chunk.includes("event.key === \"Escape\""), name + " supports Escape close");
  assertOk(chunk.includes("Close") || chunk.includes("Cancel"), name + " has explicit footer action");
}
const docGenerationVisible = ranges.docGeneration.split("<details", 1)[0];
assertOk(!ranges.metadata.toLowerCase().includes("stored locally"), "Metadata visible popup has no local-storage explanatory copy");
assertOk(!ranges.metadata.toLowerCase().includes("post-filing fields"), "Metadata visible popup has no post-filing explanatory copy");
assertOk(ranges.metadata.includes("placeholder=\"Court / venue\""), "Metadata court placeholder is clean");
assertOk(ranges.metadata.includes("placeholder=\"Total lawsuit amount sought\""), "Metadata amount placeholder is clean");
assertOk(ranges.metadata.includes("placeholder=\"Index / AAA Number\""), "Metadata index placeholder is clean");
assertOk(ranges.metadata.includes("placeholder=\"Notes\""), "Metadata notes placeholder is clean");
assertOk(docGenerationVisible.includes("placeholder=\"Select document template\""), "Document Generation template placeholder is clean");
assertOk(docGenerationVisible.includes("placeholder=\"Recipient email\""), "Document Generation email placeholder is clean");
assertOk(!docGenerationVisible.toLowerCase().includes("metadata-only"), "Document Generation visible popup has no metadata-only copy");
assertOk(!docGenerationVisible.toLowerCase().includes("sample options"), "Document Generation visible popup has no sample-options copy");
const refreshStart = s.indexOf("onClick={loadMatterEmailThreadPreview}");
const refreshEnd = s.indexOf("Refresh Emails", refreshStart);
const refreshChunk = s.slice(refreshStart, refreshEnd);
assertOk(refreshChunk.includes("borderRadius: 10"), "Refresh Emails button is rounded");
assertOk(refreshChunk.includes("height: 38"), "Refresh Emails button matches popup button height");
assertOk(refreshChunk.includes("fontWeight: 900"), "Refresh Emails button matches popup button weight");
const redCancelTokens = [
  "background: directFieldEditLoading ? \"#fecaca\" : \"#dc2626\"",
  "background: identityFieldEditLoading ? \"#fecaca\" : \"#dc2626\"",
  "background: treatingProviderSaving ? \"#fecaca\" : \"#dc2626\"",
  "background: metadataSaving ? \"#fecaca\" : \"#dc2626\"",
  "background: submitting ? \"#fecaca\" : \"#dc2626\"",
  "background: closing ? \"#fecaca\" : \"#dc2626\"",
  "background: documentPreviewLoading || finalizeUploadLoading ? \"#fecaca\" : \"#dc2626\"",
  "background: paymentApplyLoading ? \"#fecaca\" : \"#dc2626\"",
];
for (const token of redCancelTokens) assertOk(s.includes(token), "Red Cancel token present: " + token);
assertOk(ranges.claimAmount.includes("background: directFieldEditLoading ? \"#fecaca\" : \"#dc2626\""), "Claim Amount Cancel is red");
console.log("PASS: direct visible popup standardization safety verifier complete");
