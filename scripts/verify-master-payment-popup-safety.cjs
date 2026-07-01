const fs = require("fs");
const s = fs.readFileSync("app/matters/page.tsx", "utf8");
function assertOk(condition, message) { if (!condition) throw new Error(message); console.log("PASS:", message); }

const start = s.indexOf('{masterPaymentFormOpen && activeMasterWorkspaceTab === "payments" && (');
const end = s.indexOf('<div style={masterWorkspaceBillListStyle}>', start);
assertOk(start >= 0 && end > start, "Master Post Lawsuit Payment popup boundaries found");
const chunk = s.slice(start, end);

assertOk(chunk.includes('display: "flex"') && chunk.includes('alignItems: "center"') && chunk.includes('justifyContent: "center"'), "Payment popup uses centered overlay");
assertOk(chunk.includes('background: "rgba(15, 23, 42, 0.58)"'), "Payment popup uses standard overlay shade");
assertOk(chunk.includes('border: "1px solid #0a1c35"') && chunk.includes('boxShadow: "0 28px 90px rgba(15, 23, 42, 0.34)"'), "Payment popup uses standard shell");
assertOk(!chunk.includes("top: 104") && !chunk.includes("translateX(-50%)"), "Payment popup no longer uses old fixed top shell");
assertOk(chunk.includes('background: "#0a1c35"') && chunk.includes("Post Lawsuit Payment") && chunk.includes('color: "#ffffff"'), "Payment popup has navy centered header");
assertOk(!chunk.includes("×") && chunk.includes('data-barsh-standard-modal-close="removed"'), "Payment popup has no top-right close glyph");
assertOk(chunk.includes('event.key === "Escape"') && chunk.includes("setMasterPaymentFormOpen(false)"), "Payment popup supports Escape close");
assertOk(chunk.includes("onClick={() => setMasterPaymentFormOpen(false)}") && chunk.includes("event.stopPropagation()"), "Payment popup supports overlay close without inner click propagation");
assertOk(!chunk.includes('background: "#f0fdf4",\n                      borderTopLeftRadius'), "Old green header removed");
assertOk(chunk.includes("Cancel") && chunk.includes('background: "#dc2626"') && chunk.includes('border: "1px solid #dc2626"'), "Payment popup Cancel button is red");
assertOk(chunk.includes("Clear") && chunk.includes("onClick={resetMasterPaymentPreviewForm}"), "Payment popup Clear action remains present");
assertOk(chunk.includes("Post Payment") && chunk.includes("onClick={postMasterPaymentLocally}") && chunk.includes("masterPaymentSubmitDisabled()"), "Payment popup Post Payment action remains present");
assertOk(chunk.includes("Transaction Type") && chunk.includes("Transaction Status") && chunk.includes("Transaction Date"), "Payment popup preserves transaction fields");
assertOk(chunk.includes("Amount") && chunk.includes("Check Date") && chunk.includes("Check Number"), "Payment popup preserves amount/check fields");
assertOk(chunk.includes("Allocation Method") && chunk.includes("Allocation Preview") && chunk.includes("masterPaymentAllocationRows().map"), "Payment popup preserves allocation preview");
assertOk(s.includes("function masterPaymentAllocationRows()") && s.includes("async function postMasterPaymentLocally()"), "Payment allocation/posting logic remains present");
assertOk(s.includes("masterPaymentClosePromptOpen") && s.includes("Close After Payment?</h2>"), "Locked payment close prompt remains present");
assertOk(s.includes("data-barsh-master-info-edit-standard-modal=\"true\""), "Locked Master Info Edit popup remains present");
assertOk(s.includes("function parseMasterNotesFromMetadata") && s.includes("async function persistMasterNotes"), "Locked Master Notes persistence remains present");
assertOk(s.includes("function renderMasterViewDocumentsPopup()") && s.includes('params.set("mode", "email-pdf")'), "Locked Master View Documents behavior remains present");
console.log("PASS: master Post Lawsuit Payment popup verifier complete");
