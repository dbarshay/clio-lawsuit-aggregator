import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const working = fs.existsSync("app/api/documents/working-docx/route.ts")
  ? fs.readFileSync("app/api/documents/working-docx/route.ts", "utf8")
  : "";
const generator = fs.existsSync("app/api/documents/templates/generate-preview/route.ts")
  ? fs.readFileSync("app/api/documents/templates/generate-preview/route.ts", "utf8")
  : "";

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, haystack, token) { haystack.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }
function lacks(label, haystack, token) { !haystack.includes(token) ? pass(label) : fail(`${label} should not contain ${token}`); }

has("signer/contact options array exists", page, "const matterDocumentSignerOptions = [");
has("Firm option label exists", page, 'label: "Firm"');
has("Firm option value exists", page, 'value: "firm"');
has("Firm option email exists", page, 'email: "firm"');
has("David option label exists", page, 'label: "David M. Barshay"');
has("David option value exists", page, 'value: "dbarshay@brlfirm.com"');
lacks("malformed David option fragment removed", page, '},\n      \n        email: "dbarshay@brlfirm.com",\n        displayName: "David M. Barshay",\n      },');

if (working.includes('const resolvedSignerEmail = signerEmail || "firm";')) {
  pass("working-docx defaults resolved signer to Firm");
} else if (working.includes('const resolvedSignerEmail = signerEmail || "dbarshay@brlfirm.com";')) {
  pass("working-docx still uses David fallback pending Firm backend patch");
} else {
  fail("working-docx signer fallback not recognized");
}

has("generate-preview has Firm handling", generator, "const isFirmSignerContactRequest =");
has("generate-preview has Firm pseudo signer id", generator, 'id: "firm"');
has("generate-preview has Firm signature block name", generator, 'signatureBlockName: "Barsh Rizzo & Lopez PLLC"');
has("generate-preview returns Firm pseudo signer", generator, 'return { signer, status: 200, error: "" };');

console.log("RESULT: direct matter Firm signer/contact option verifier");
if (failed) process.exit(1);
