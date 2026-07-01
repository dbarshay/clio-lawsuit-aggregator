const fs = require("fs");
const s = fs.readFileSync("app/matters/page.tsx", "utf8");
function assertOk(condition, message) { if (!condition) throw new Error(message); console.log("PASS:", message); }

const start = s.indexOf('{masterInfoEditDialog && activeMasterWorkspaceTab === "payments" && (');
const end = s.indexOf('{activeMasterWorkspaceTab === "payments" && masterSettlementHistory?.ok', start);
assertOk(start >= 0 && end > start, "Master info edit popup boundaries found");
const chunk = s.slice(start, end);

assertOk(chunk.includes('display: "flex"') && chunk.includes('alignItems: "center"') && chunk.includes('justifyContent: "center"'), "Master info edit popup uses centered overlay");
assertOk(chunk.includes('background: "rgba(15, 23, 42, 0.58)"'), "Master info edit popup uses standard overlay shade");
assertOk(chunk.includes('border: "1px solid #0a1c35"') && chunk.includes('boxShadow: "0 28px 90px rgba(15, 23, 42, 0.34)"'), "Master info edit popup uses standard shell");
assertOk(!chunk.includes("top: 154") && !chunk.includes("translateX(-50%)"), "Master info edit popup no longer uses old fixed top shell");
assertOk(chunk.includes('background: "#0a1c35"') && chunk.includes('data-barsh-standard-modal-title="true"'), "Master info edit popup has navy centered header");
assertOk(!chunk.includes("×") && chunk.includes('data-barsh-standard-modal-close="removed"'), "Master info edit popup has no top-right close glyph");
assertOk(chunk.includes('event.key === "Escape"') && chunk.includes("closeMasterInfoEditDialog()"), "Master info edit popup supports Escape close");
assertOk(chunk.includes("onClick={closeMasterInfoEditDialog}") && chunk.includes("event.stopPropagation()"), "Master info edit popup supports overlay close without inner click propagation");
assertOk(!chunk.includes('>\\n                      \\n                    </div>'), "Master info edit popup has no empty status bubble");
assertOk(chunk.includes('background: "#dc2626"') && chunk.includes('border: "1px solid #dc2626"'), "Master info edit popup Cancel button is red");
assertOk(chunk.includes('background: "#16a34a"') && chunk.includes('border: "1px solid #15803d"'), "Master info edit popup Confirm button is green");
assertOk(chunk.includes('masterInfoFieldKind(masterInfoEditDialog.field) === "status"'), "Master info edit popup preserves status input");
assertOk(chunk.includes('masterInfoFieldKind(masterInfoEditDialog.field) === "court"'), "Master info edit popup preserves court input");
assertOk(chunk.includes('masterInfoFieldKind(masterInfoEditDialog.field) === "contact"'), "Master info edit popup preserves contact input");
assertOk(chunk.includes("New Cost Amount"), "Master info edit popup preserves cost input");
assertOk(s.includes("async function confirmMasterInfoEditDialog()") && s.includes('fetch("/api/lawsuits/update-metadata"'), "Master info edit persistence remains present");
assertOk(s.includes("function parseMasterNotesFromMetadata") && s.includes("async function persistMasterNotes"), "Locked master note persistence remains present");
assertOk(s.includes("masterCloseDialogOpen") && s.includes('background: masterClosing ? "#fecaca" : "#dc2626"'), "Locked Close Lawsuit popup remains present");
assertOk(s.includes("function renderMasterViewDocumentsPopup()") && s.includes('params.set("mode", "email-pdf")'), "Locked Master View Documents behavior remains present");
console.log("PASS: master info edit popup verifier complete");
