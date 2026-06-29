import fs from "fs";

const route = fs.readFileSync("app/api/documents/templates/generate-preview/route.ts", "utf8");
const errorIndex = route.indexOf('error: "Selected signer was not found."');
const firmIndex = route.indexOf("const isFirmSignerContactRequest =");

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, token) { route.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }

has("Firm signer/contact request flag exists", "const isFirmSignerContactRequest =");
has("Firm request accepts firm value", '"firm"');
has("Firm request accepts aliases", '"firm-contact"');
has("Firm pseudo signer id exists", 'id: "firm"');
has("Firm email exists", 'email: "info@brlfirm.com"');
has("Firm display name exists", 'displayName: "Firm"');
has("Firm signature block name exists", 'signatureBlockName: "Barsh Rizzo & Lopez PLLC"');
has("Firm fax exists", 'faxNumber: "(516) 706-5055"');
has("Firm signer profile is complete", 'signerProfileStatus: "Complete"');
has("Firm resolver returns signer", 'return { signer, status: 200, error: "" };');
has("selected signer not found guard remains for real missing signers", 'error: "Selected signer was not found."');

if (firmIndex >= 0 && errorIndex >= 0 && firmIndex < errorIndex) {
  pass("Firm pseudo signer resolves before Admin User not-found guard");
} else {
  fail("Firm pseudo signer resolves before Admin User not-found guard");
}

console.log("RESULT: template generate-preview Firm signer/contact verifier");
if (failed) process.exit(1);
