import fs from "node:fs";

const checks = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (name, condition) => checks.push({ name, pass: Boolean(condition) });

const md = read("docs/templates/templates-phase19c-vr-response-header-composition-override-contract.md");
const jsonText = read("docs/templates/templates-phase19c-vr-response-header-composition-override-contract.json");
let parsed = null;
try { parsed = JSON.parse(jsonText); } catch { parsed = null; }

assert("Templates Phase 19C markdown exists", md.includes("VR Response Header-Composition Override Contract"));
assert("Templates Phase 19C JSON parses", parsed !== null);
assert("Phase 19B baseline documented", md.includes("templates-phase19b-vr-response-source-import-readiness-20260623"));
assert("runtime mutation false", parsed?.runtimeMutation === false);
assert("DOCX mutation false", parsed?.docxMutation === false);
assert("corrected decision says no copy from Initial Billing Letter", md.includes("not a copied block from Initial Billing Letter"));
assert("same composition mechanism required", md.includes("same shared letterhead/header asset composition mechanism as Initial Billing Letter"));
assert("vr-response template id recorded", parsed?.templateId === "vr-response");
assert("approved header override recorded", md.includes("445 Broadhollow Road | Suite CL18") && md.includes("Fax: (516) 706-5055") && md.includes("Email: info@brlfirm.com"));
assert("hard-coded Angelo signature preserved", md.includes("Angelo F. Rizzo, Esquire"));
assert("runtime signer selection false", md.includes("Runtime signer selection required: `false`"));
assert("Initial Billing Letter DOCX protected", md.includes("Do not modify `templates/docx/letters/initial-billing-letter.docx`"));
assert("letterhead-simple DOCX protected", md.includes("Do not modify `templates/docx/base/letterhead-simple.docx`"));
assert("legacy compatibility rejected", md.includes("Do not add legacy-token compatibility layers"));
assert("next phase recorded", md.includes("Templates Phase 19D"));

const failed = checks.filter((check) => check.pass === false);
for (const check of checks) console.log(`${check.pass ? "PASS" : "FAIL"}: ${check.name}`);
if (failed.length > 0) process.exit(1);
