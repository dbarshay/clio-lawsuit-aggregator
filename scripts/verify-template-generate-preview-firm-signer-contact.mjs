import fs from "fs";

const route = fs.readFileSync("app/api/documents/templates/generate-preview/route.ts", "utf8");
const firm = fs.readFileSync("lib/firmContact.ts", "utf8");
const fnIndex = route.indexOf("async function resolveSigner(req: NextRequest)");
const queryIndex = route.indexOf("const query = req.nextUrl.searchParams;", fnIndex);
const emailIndex = route.indexOf("const signerEmail =", fnIndex);
const firmIndex = route.indexOf("const isFirmSignerContactRequest =", fnIndex);
const userIndex = route.indexOf("const user =", fnIndex);
const errorIndex = route.indexOf('error: "Selected signer was not found."', fnIndex);

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, token) { route.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }
function hasIn(label, source, token) { source.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }
function lacks(label, token) { !route.includes(token) ? pass(label) : fail(`${label} should not contain ${token}`); }

has("resolveSigner header is valid", "async function resolveSigner(req: NextRequest): Promise<{ signer: ResolvedSigner | null; error?: string; status?: number }> {");
has("Firm signer/contact request flag exists", "const isFirmSignerContactRequest =");
has("Firm request accepts firm value", '"firm"');
has("Firm request accepts aliases", '"firm-contact"');
has("generate-preview sources firm from single firm-contact constant", "BARSH_FIRM_CONTACT");
hasIn("Firm contact pseudo signer id", firm, 'id: "firm"');
hasIn("Firm contact email", firm, 'email: "info@brlfirm.com"');
hasIn("Firm contact display name", firm, 'displayName: "Firm"');
hasIn("Firm contact signature block name", firm, 'signatureBlockName: "Barshay, Rizzo & Lopez, PLLC"');
hasIn("Firm contact fax", firm, 'faxNumber: "(516) 706-5055"');
has("Firm signer profile is complete", 'signerProfileStatus: "Complete"');
has("Firm resolver returns signer", 'return { signer, status: 200, error: "" };');
has("selected signer not found guard remains for real missing signers", 'error: "Selected signer was not found."');
lacks("Firm block must not be inside Promise return type", "Promise<{\n  const isFirmSignerContactRequest");

if (fnIndex >= 0 && fnIndex < queryIndex && queryIndex < emailIndex && emailIndex < firmIndex && firmIndex < userIndex && userIndex < errorIndex) {
  pass("Firm pseudo signer resolves after signerEmail parse and before Admin User lookup/not-found guard");
} else {
  fail(`Firm resolver ordering invalid: fn=${fnIndex} query=${queryIndex} email=${emailIndex} firm=${firmIndex} user=${userIndex} error=${errorIndex}`);
}

console.log("RESULT: template generate-preview Firm signer/contact verifier");
if (failed) process.exit(1);
