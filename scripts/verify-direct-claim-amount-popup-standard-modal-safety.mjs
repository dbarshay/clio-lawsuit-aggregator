import fs from "fs";

// The direct claim-amount popup is now rendered through the shared <BarshModal> (see
// verify-barsh-modal-standard-safety for the standard chrome: navy header, Esc/Enter,
// draggable, resizable, footer). This verifier only checks the popup-specific wiring + content.

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const failures = [];

const start = page.indexOf('{directFieldEditModal === "claimAmount" && (');
const end = page.indexOf('{directFieldEditModal === "dos" && (', start);
const region = start >= 0 && end > start ? page.slice(start, end) : "";

if (region === "") failures.push("could not isolate direct claim amount popup region");

for (const token of [
  "<BarshModal",
  'title="Edit Claim Amount"',
  'dataModalId="direct-claim-amount-edit"',
  "submitLabel=",
  "Confirm Edit",
  "saveClaimAmountEditDialog",
  "onClose=",
  'data-barsh-direct-claim-amount-edit-standard-modal="true"',
  "Claim Amount is ClaimIndex-backed",
  'data-barsh-direct-claim-amount-current-card="true"',
]) {
  if (region.includes(token) === false) failures.push("missing direct claim amount popup token: " + token);
}

for (const forbidden of [
  "This updates Claim Amount in ClaimIndex",
  'background: "#16a34a"',
]) {
  if (region.includes(forbidden)) failures.push("direct claim amount popup still has old token: " + forbidden);
}

if (failures.length) {
  console.error("FAIL: direct claim amount popup standard modal safety");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: direct claim amount popup standard modal safety");
