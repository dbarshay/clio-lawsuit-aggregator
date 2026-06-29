import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const working = fs.readFileSync("app/api/documents/working-docx/route.ts", "utf8");

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, text, token) { text.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }
function lacks(label, text, token) { !text.includes(token) ? pass(label) : fail(`${label} should not contain ${token}`); }

has("fallback has source endpoint", working, 'sourceEndpoint: "/api/documents/templates/generate-preview?key=blank-letterhead"');
has("fallback wouldGenerate true", working, "wouldGenerate: true");
has("fallback availableNow true", working, "availableNow: true");
has("working-docx accepts signerEmail", working, "const signerEmail = clean(body?.signerEmail");
has("Blank Letterhead fallback still present", working, "requestedBlankLetterheadFallback");
has("selectedDocument uses fallback", working, "requestedBlankLetterheadFallback ||");

has("signer step marker exists", page, 'data-barsh-direct-document-generation-signer-step="true"');
has("signer display name exists", page, 'displayName: "David M. Barshay"');
has("signer select exists", page, "<select");
lacks("signer email placeholder absent", page, 'placeholder="dbarshay@brlfirm.com"');

const signerIndex = page.indexOf('data-barsh-direct-document-generation-signer-step="true"');
const step1Index = page.indexOf("Step 1: Select Document");
const step2Index = page.indexOf("Step 2");
if (step1Index >= 0 && step2Index >= 0 && signerIndex > step2Index) pass("signer appears after Step 2 begins");
else fail("signer does not appear after Step 2 begins");

const selectSectionStart = page.indexOf("Step 1: Select Document");
const selectSectionEnd = page.indexOf("Step 2", selectSectionStart);
const selectSection = selectSectionStart >= 0 && selectSectionEnd > selectSectionStart ? page.slice(selectSectionStart, selectSectionEnd) : "";
lacks("Step 1 section does not contain signer panel", selectSection, "data-barsh-direct-document-generation-signer-default");

console.log("RESULT: Blank Letterhead source endpoint and signer step order verifier");
if (failed) process.exit(1);
