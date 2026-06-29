import fs from "fs";

const route = fs.readFileSync("app/api/documents/working-docx/route.ts", "utf8");

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, token) { route.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }

has("working-docx reads signerEmail from body", "const signerEmail = clean(body?.signerEmail");
has("working-docx defines default resolved signer email", 'const resolvedSignerEmail = signerEmail || "dbarshay@brlfirm.com";');
has("Blank Letterhead sourceEndpoint includes default signerEmail", "signerEmail=dbarshay%40brlfirm.com");
has("Blank Letterhead fallback still exists", "requestedBlankLetterheadFallback");
has("Blank Letterhead fallback is selected", "requestedBlankLetterheadFallback ||");
has("DB DOCX storage kind remains", 'storageKind: "db-docx-base64"');

if (route.includes('new URL(selectedDocument.sourceEndpoint, req.nextUrl.origin)')) {
  has("dynamic sourceEndpoint URL forwards resolved signerEmail", 'searchParams.set("signerEmail", resolvedSignerEmail)');
} else {
  pass("route does not use selectedDocument.sourceEndpoint URL constructor; fallback endpoint carries signerEmail");
}

console.log("RESULT: working-docx signer forwarding verifier");
if (failed) process.exit(1);
