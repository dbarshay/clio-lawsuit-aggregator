import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, token) { page.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }

has("workflow has signer stage type", 'useState<"select" | "signer" | "chooseAction"');
has("document selection continues to signer stage", 'setMatterDocumentWorkflowStage("signer")');
has("signer stage boolean exists", 'const showSignerStep = matterDocumentWorkflowStage === "signer";');
has("signer-only section exists", 'data-barsh-direct-document-generation-signer-only-section="true"');
has("signer heading exists", 'data-barsh-direct-document-generation-signer-heading="true"');
has("signer dropdown still exists", '<select');
has("signer display name still exists", 'displayName: "David M. Barshay"');
has("continue to generate exists", 'data-barsh-direct-document-generation-continue-to-actions="true"');
has("continue to generate switches to actions", 'onClick={() => setMatterDocumentWorkflowStage("chooseAction")}');
has("actions heading exists", 'data-barsh-direct-document-generation-actions-heading="true"');
has("action step remains separate", 'const showActionStep = matterDocumentWorkflowStage === "chooseAction";');

const signerIndex = page.indexOf('data-barsh-direct-document-generation-signer-only-section="true"');
const actionsIndex = page.indexOf('data-barsh-direct-document-generation-actions-heading="true"');
if (signerIndex >= 0 && actionsIndex > signerIndex) pass("actions appear after signer-only section");
else fail("actions are not after signer-only section");

console.log("RESULT: dedicated signer step verifier");
if (failed) process.exit(1);
