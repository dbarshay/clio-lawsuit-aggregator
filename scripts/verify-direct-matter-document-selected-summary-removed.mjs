import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, token) { page.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }
function lacks(label, token) { !page.includes(token) ? pass(label) : fail(`${label} should not contain ${token}`); }

has("document dropdown remains", 'data-barsh-direct-document-generation-template-dropdown="true"');
has("Blank Letterhead option remains", '<option value="blank-letterhead">Blank Letterhead</option>');
has("selectBlankLetterhead helper remains", "const selectBlankLetterhead = () => {");
has("selecting Blank Letterhead still advances to signer", 'setMatterDocumentWorkflowStage("signer");');
has("signer section remains", 'data-barsh-direct-document-generation-signer-only-section="true"');
has("generate action section remains", 'data-barsh-direct-document-generation-actions-section="true"');

lacks("selected document summary block removed", 'data-barsh-direct-document-generation-selected-document-summary="true"');
lacks("Selected Blank Letterhead summary label removed", "Selected: Blank Letterhead");
lacks("repository description removed from direct popup page", "Current stored DOCX template from the local Barsh Matters template repository.");

console.log("RESULT: direct matter selected document summary removed verifier");
if (failed) process.exit(1);
