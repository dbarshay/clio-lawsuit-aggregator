import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, token) { page.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }
function lacks(label, token) { !page.includes(token) ? pass(label) : fail(`${label} should not contain ${token}`); }

has("original topbar style restored", '<div style={bmGlobalTopBarStyle}>');
has("original left wrapper restored", '<div style={bmGlobalLeftLogoWrapStyle}>');
has("original BRL logo tag restored", '<img src="/brl-logo.png" alt="BRL Logo" style={bmGlobalBrlLogoStyle} />');
has("original nav padding restored", '<div style={{ paddingTop: 8 }}>');
has("original right logo link restored", '<a href="/" title="Return to Barsh Matters entry screen" style={bmGlobalLogoLinkStyle}>');
has("original Barsh Matters logo tag restored", '<img src="/barsh-matters-cropped-transparent.png" alt="Barsh Matters Logo" style={bmGlobalLogoStyle} />');

for (const token of [
  "data-barsh-matter-header-grid",
  "data-barsh-matter-header-two-row",
  "data-barsh-matter-header-left",
  "data-barsh-matter-header-utility-row",
  "data-barsh-matter-header-right-logo-link",
  "data-barsh-matter-header-right-logo-hidden",
  "data-barsh-matter-left-logo",
  "data-barsh-matter-right-logo",
  "data-barsh-header-logo-containment",
  "paddingBottom",
]) {
  lacks(`removed ${token}`, token);
}

has("document then signer flow still present", 'data-barsh-direct-document-generation-continue-to-signer="true"');
has("signer step still present", 'data-barsh-direct-document-generation-signer-step="true"');

console.log("RESULT: direct matter header restored verifier");
if (failed) process.exit(1);
