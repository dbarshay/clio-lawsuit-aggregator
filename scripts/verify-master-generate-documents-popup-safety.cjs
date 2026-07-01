#!/usr/bin/env node
const fs = require("fs");
const page = fs.readFileSync("app/matters/page.tsx", "utf8");
function pass(name) { console.log(`PASS: ${name}`); }
function fail(name, detail) { console.error(`FAIL: ${name}`); if (detail) console.error(detail); process.exitCode = 1; }
function mustContain(name, text, needle) { text.includes(needle) ? pass(name) : fail(name, `Missing: ${needle}`); }
function mustNotContain(name, text, needle) { !text.includes(needle) ? pass(name) : fail(name, `Unexpected: ${needle}`); }
const popupStart = page.indexOf(`function renderMasterDocumentGenerationPopup()`);
if (popupStart < 0) { fail("master_popup_boundaries", "Could not find renderMasterDocumentGenerationPopup function."); process.exit(1); }
const standaloneDeliveryStart = page.indexOf(`aria-label="Master Lawsuit Document Delivery"`, popupStart);
if (standaloneDeliveryStart < 0) { fail("master_popup_boundaries", "Could not find standalone delivery popup boundary after Generate Documents popup."); process.exit(1); }
const popup = page.slice(popupStart, standaloneDeliveryStart);
const popupJsxStart = popup.indexOf(`aria-label="Master Lawsuit Document Generation"`);
if (popupJsxStart < 0) { fail("master_popup_jsx_boundary", "Could not find Generate Documents dialog aria label inside render function."); process.exit(1); }
const popupJsx = popup.slice(popupJsxStart);
pass("master_popup_boundaries");
mustContain("standard_shell", popup, `data-barsh-master-document-generation-header-standard="true"`);
mustContain("navy_header", popup, `background: "#00346e"`);
mustContain("no_top_right_x", popup, `data-barsh-standard-modal-close="removed"`);
mustNotContain("no_top_right_x_old_button", popup, `aria-label="Close document generation"`);
mustContain("step1_direct_text", popup, `Select the document template for this matter.`);
mustContain("step1_placeholder", popup, `placeholder="Select document template"`);
mustContain("badge_completed_active_contract", popup, `const badgeBackground = isComplete ? "#16a34a" : isActive ? "#dcfce7" : "#dcfce7";`);
mustContain("badge_completed_active_contract_circle", popup, `const circleBackground = isComplete ? "#15803d" : isActive ? "#16a34a" : "#bbf7d0";`);
mustNotContain("no_purple_badges", popupJsx, `#7c3aed`);
mustNotContain("no_purple_badges_alt", popupJsx, `#8b5cf6`);
mustContain("action_buttons_navy", popup, `border: disabled ? "1px solid #cbd5e1" : "1px solid #00346e"`);
mustContain("action_buttons_navy_background", popup, `background: disabled ? "#f8fafc" : "#00346e"`);
mustContain("step2_card_preview_pdf", popup, `Preview PDF`);
mustContain("step2_card_edit_document", popup, `Edit Document`);
mustContain("step2_card_finalize_document", popup, `Finalize Document`);
mustContain("step2_parent_visible_for_preview_edit", popup, `display: showActionStep || showPreviewStep || showEditStep ? "grid" : "none"`);
mustContain("step2_action_header_choose_action_only", popup, `<div style={{ display: showActionStep ? "block" : "none" }}>`);
mustContain("step2_action_buttons_choose_action_only", popup, `<div style={{ display: showActionStep ? "flex" : "none", gap: 10, flexWrap: "wrap" }}>`);
mustContain("step2_footer_back_cancel", popup, `Back`);
mustContain("step2_footer_visible_for_preview_edit", popup, `{(showActionStep || showPreviewStep || showEditStep) && (`);
mustContain("step2_footer_back_preview_edit_returns_to_step2", popup, `setMasterDocumentWorkflowStage(showPreviewStep || showEditStep ? "chooseAction" : "select")`);
mustContain("step2_footer_cancel", popup, `Cancel`);
const step2ActionLabels = [`Preview PDF`, `Edit Document`, `Finalize Document`].filter((label) => popup.includes(label)).length;
step2ActionLabels === 3 ? pass("step2_card_three_actions_only") : fail("step2_card_three_actions_only", `Expected Step 2 labels Preview PDF/Edit Document/Finalize Document, found ${step2ActionLabels}.`);
const previewMinimalStart = popup.indexOf(`<h3 style={{ margin: 0, fontSize: 18 }}>Preview PDF</h3>`);
mustContain("preview_stage_not_gated_by_selected_template", popup, `{masterDocumentWorkflowStage === "preview" && (`);
mustNotContain("preview_stage_not_gated_by_selected_template_old", popup, `{masterDocumentWorkflowStage === "preview" && displayedSelectedTemplate && (`);
if (previewMinimalStart < 0) fail("preview_minimal_like_direct", "Could not find minimal Preview PDF card title.");
else { const previewMinimal = popup.slice(previewMinimalStart, Math.min(popup.length, previewMinimalStart + 2600)); mustContain("preview_minimal_like_direct_title", previewMinimal, `Preview PDF`); mustNotContain("preview_inner_back_removed", previewMinimal, `setMasterDocumentWorkflowStage("chooseAction")`); mustContain("preview_minimal_like_direct_finalize", previewMinimal, `Finalize Document`); mustNotContain("preview_old_blue_explainer_removed", previewMinimal, `Preview the selected document before finalizing`); pass("preview_minimal_like_direct"); }
const editStart = popup.indexOf(`Working Word document`);
if (editStart < 0) fail("edit_block_preserved", "Could not find edit block.");
else { const editBlock = popup.slice(editStart, Math.min(popup.length, editStart + 5200)); mustContain("edit_block_working_word_document", editBlock, `Working Word document`); mustContain("edit_block_try_desktop_word", editBlock, `Try Desktop Word`); mustContain("edit_block_open_word_web", editBlock, `Open in Word Web`); mustContain("edit_block_copy_word_web_link", editBlock, `Copy Word Web Link`); pass("edit_block_preserved"); }
const deliveryMarkers = [...popup.matchAll(/\{masterDocumentWorkflowStage === "delivery" && \(/g)].map((m) => m.index);
if (deliveryMarkers.length < 1) fail("delivery_step_preserved", "No in-popup delivery marker found.");
else { const delivery = popup.slice(deliveryMarkers[deliveryMarkers.length - 1]); mustContain("delivery_step_heading", delivery, `Document Delivery`); mustContain("delivery_step_print_queue", delivery, `Send to Print Queue`); mustContain("delivery_step_save_locally", delivery, `"Save Locally"`); mustContain("delivery_step_print_finalized", delivery, `Print Finalized Document`); mustContain("delivery_step_email_finalized", delivery, `Email Finalized Document`); mustContain("delivery_step_save_handler", delivery, `saveMasterSettlementDocumentLocally(displayedSelectedTemplate)`); mustContain("delivery_step_print_handler", delivery, `launchMasterDocumentPrint(displayedSelectedTemplate)`); mustContain("delivery_step_queue_handler", delivery, `sendMasterDocumentToPrintQueue(displayedSelectedTemplate)`); mustContain("delivery_step_email_handler", delivery, `launchSettlementFinalizedDocumentEmail()`); mustNotContain("delivery_step_not_standalone_popup", delivery, `aria-label="Master Lawsuit Document Delivery"`); pass("delivery_step_preserved"); }
(page.includes(`previewMasterDocumentPdf`) || page.includes(`previewMasterDocuments`) || page.includes(`loadMasterDocumentDataPreview`)) ? pass("workflow_actions_preserved_preview") : fail("workflow_actions_preserved_preview", "Missing previewMasterDocumentPdf, previewMasterDocuments, or loadMasterDocumentDataPreview");
(page.includes(`createMasterWorkingDocument`) || page.includes(`createMasterDocumentForEditing`) || page.includes(`masterDocumentFinalizationResult?.workingDocument`)) ? pass("workflow_actions_preserved_working_doc") : fail("workflow_actions_preserved_working_doc", "Missing createMasterWorkingDocument, createMasterDocumentForEditing, or workingDocument flow");
mustContain("workflow_actions_preserved_finalize", page, `finalizeMasterSettlementDocumentPlaceholder`);
mustContain("workflow_actions_preserved_save", page, `saveMasterSettlementDocumentLocally`);
mustContain("workflow_actions_preserved_print", page, `launchMasterDocumentPrint`);
mustContain("workflow_actions_preserved_queue", page, `sendMasterDocumentToPrintQueue`);
mustContain("workflow_actions_preserved_email", page, `launchSettlementFinalizedDocumentEmail`);
pass("workflow_actions_preserved");

const finalizeHandlerStart = page.indexOf(`async function finalizeMasterDocumentFromStep2`);
if (finalizeHandlerStart < 0) fail("finalize_handler_present", "Missing finalizeMasterDocumentFromStep2 handler.");
else {
  const nextFunctionCandidates = [page.indexOf(`\n  function `, finalizeHandlerStart + 1), page.indexOf(`\n  async function `, finalizeHandlerStart + 1)].filter((idx) => idx > finalizeHandlerStart);
  const finalizeHandlerEnd = Math.min(...nextFunctionCandidates);
  const finalizeHandler = page.slice(finalizeHandlerStart, Number.isFinite(finalizeHandlerEnd) ? finalizeHandlerEnd : finalizeHandlerStart + 5000);
  mustNotContain("finalize_warning_prompt_removed", finalizeHandler, `confirm(`);
  mustNotContain("finalize_window_confirm_removed", finalizeHandler, `window.confirm(`);
}


mustNotContain("delivery_no_master_final_upload_complete_panel", popup, `Master Final Upload Complete`);
mustNotContain("delivery_no_open_delivery_options_button", popup, `Open Delivery Options`);
mustNotContain("delivery_no_old_hidden_actions_explainer", popup, `Email, print, and queue actions remain hidden until finalized-document delivery is wired.`);
mustContain("delivery_direct_style_to_email_label", popup, `To Email for Document Delivery`);
mustContain("delivery_direct_style_email_button", popup, `Email Document`);
mustContain("delivery_direct_style_print_button", popup, `Print Document`);
const finalizeStep2Start = page.indexOf(`async function finalizeMasterDocumentFromStep2`);
if (finalizeStep2Start < 0) fail("finalize_step2_handler_present", "Missing finalizeMasterDocumentFromStep2 handler.");
else {
  const finalizeStep2End = page.indexOf(`async function finalizeMasterSettlementDocumentPlaceholder`, finalizeStep2Start);
  const finalizeStep2Handler = page.slice(finalizeStep2Start, finalizeStep2End > finalizeStep2Start ? finalizeStep2End : finalizeStep2Start + 7000);
  mustNotContain("delivery_no_standalone_popup_launch_after_finalize", finalizeStep2Handler, `setMasterDocumentDeliveryPopupOpen(true)`);
}


const deliveryHeadingIndex = popup.indexOf(`<h3 style={{ margin: 0, fontSize: 18 }}>Document Delivery</h3>`);
const deliveryFooterIndex = popup.indexOf(`data-barsh-master-generate-documents-delivery-footer="true"`);
if (deliveryHeadingIndex < 0 || deliveryFooterIndex < 0 || deliveryFooterIndex <= deliveryHeadingIndex) {
  fail("delivery_footer_below_delivery_card", "Step 3 footer must render after the Document Delivery card.");
} else {
  pass("delivery_footer_below_delivery_card");
}
mustContain("delivery_footer_back_button", popup, `onClick={() => setMasterDocumentWorkflowStage("chooseAction")}`);
mustContain("delivery_footer_cancel_button", popup, `onClick={() => setMasterDocumentGenerationPopupOpen(false)}`);


mustContain("delivery_email_uses_preview_handler", popup, `() => launchMasterDocumentEmail(displayedSelectedTemplate)`);
const deliveryEmailButtonIndex = popup.indexOf(`"Email Document"`);
if (deliveryEmailButtonIndex < 0) {
  fail("delivery_email_button_present", "Missing Step 3 Email Document button.");
} else {
  const deliveryEmailButtonBlock = popup.slice(deliveryEmailButtonIndex, deliveryEmailButtonIndex + 650);
  mustContain("delivery_email_uses_preview_handler_scoped", deliveryEmailButtonBlock, `() => launchMasterDocumentEmail(displayedSelectedTemplate)`);
  mustNotContain("delivery_email_not_direct_draft_helper", deliveryEmailButtonBlock, `() => void createMasterDocumentOutlookDraft()`);
}


mustNotContain("delivery_no_docx_route_opened_status_panel", popup, `DOCX Route Opened`);
mustNotContain("delivery_no_placeholder_docx_route_status_copy", popup, `The placeholder-seeded generated DOCX route was opened.`);
mustNotContain("delivery_no_printable_local_route_status_copy", popup, `Printable local route:`);


mustContain("delivery_uses_existing_email_validator", popup, `isValidDocumentDeliveryEmail(masterDocumentDeliveryToOverride)`);
mustNotContain("delivery_no_missing_master_email_validator", popup, `isValidMasterDocumentDeliveryEmail`);


const finalizeStep2HandlerStartForAlert = page.indexOf(`async function finalizeMasterDocumentFromStep2`);
if (finalizeStep2HandlerStartForAlert < 0) fail("finalize_handler_present_for_alert_lock", "Missing finalizeMasterDocumentFromStep2 handler.");
else {
  const finalizeStep2HandlerEndForAlert = page.indexOf(`async function finalizeMasterSettlementDocumentPlaceholder`, finalizeStep2HandlerStartForAlert);
  const finalizeStep2HandlerForAlert = page.slice(finalizeStep2HandlerStartForAlert, finalizeStep2HandlerEndForAlert > finalizeStep2HandlerStartForAlert ? finalizeStep2HandlerEndForAlert : finalizeStep2HandlerStartForAlert + 7000);
  mustNotContain("finalize_no_completion_alert", finalizeStep2HandlerForAlert, `Document finalization complete.`);
  mustNotContain("finalize_no_opening_delivery_alert", finalizeStep2HandlerForAlert, `Opening Document Delivery.`);
}


const masterEmailHandlerStart = page.indexOf(`async function launchMasterDocumentEmail`);
if (masterEmailHandlerStart < 0) fail("delivery_email_handler_present", "Missing launchMasterDocumentEmail handler.");
else {
  const masterEmailHandlerEnd = page.indexOf(`function appendDocumentOpenMode`, masterEmailHandlerStart);
  const masterEmailHandler = page.slice(masterEmailHandlerStart, masterEmailHandlerEnd > masterEmailHandlerStart ? masterEmailHandlerEnd : masterEmailHandlerStart + 7000);
  mustContain("delivery_email_creates_graph_draft", masterEmailHandler, `/api/graph/create-draft?confirm=create-graph-draft`);
  mustContain("delivery_email_opens_outlook_draft", masterEmailHandler, `window.open(outlookDraftUrl, "_blank", "noopener,noreferrer")`);
  mustContain("delivery_email_uses_override_to", masterEmailHandler, `buildDocumentDeliveryToOverrideRecipient()`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log("PASS: master Generate Documents popup standardization contract locked");
