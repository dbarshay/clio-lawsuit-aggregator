import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const layout = fs.readFileSync("app/layout.tsx", "utf8");

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, text, token) { text.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }
function lacks(label, text, token) { !text.includes(token) ? pass(label) : fail(`${label} should not contain ${token}`); }

has("root layout suppresses hydration warning", layout, "suppressHydrationWarning");
has("Step 1 continues to signer", page, 'data-barsh-direct-document-generation-continue-to-signer="true"');
has("continue button sets chooseAction stage", page, 'setMatterDocumentWorkflowStage("chooseAction")');
has("Step 2 signer heading exists", page, 'data-barsh-direct-document-generation-signer-heading="true"');
has("signer step marker exists", page, 'data-barsh-direct-document-generation-signer-step="true"');
has("signer display name is shown", page, 'displayName: "David M. Barshay"');
has("signer select exists", page, "<select");
lacks("signer email text box placeholder absent", page, 'placeholder="dbarshay@brlfirm.com"');
has("step badge says signer generate", page, '"Select Signer / Generate"');

const continueIndex = page.indexOf('data-barsh-direct-document-generation-continue-to-signer="true"');
const signerIndex = page.indexOf('data-barsh-direct-document-generation-signer-step="true"');
if (continueIndex >= 0 && signerIndex > continueIndex) pass("signer step occurs after document continue control");
else fail("signer step ordering is wrong");

console.log("RESULT: document-then-signer flow verifier");
if (failed) process.exit(1);
