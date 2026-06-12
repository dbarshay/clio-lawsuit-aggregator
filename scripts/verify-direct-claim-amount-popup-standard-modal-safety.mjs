import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const failures = [];

const start = page.indexOf('data-barsh-direct-claim-amount-edit-standard-modal="true"');
const end = page.indexOf('{directFieldEditModal === "dos" && (', start);
const region = start >= 0 && end > start ? page.slice(start, end) : "";

if (region === "") failures.push("could not isolate direct claim amount popup region");

for (const token of [
  'data-barsh-direct-claim-amount-edit-standard-modal="true"',
  'background: "#1e3a8a"',
  'color: "#ffffff"',
  'textAlign: "center"',
  'Confirm Edit',
  'type="submit"',
  'onSubmit={(event) =>',
  'onKeyDown={(event) => { if (event.key === "Escape")',
  'borderTop: "1px solid #e2e8f0"',
]) {
  if (region.includes(token) === false) failures.push("missing direct claim amount popup token: " + token);
}

for (const forbidden of [
  "This updates Claim Amount in ClaimIndex",
  "borderRadius: 22",
  'border: "1px solid #bfdbfe"',
  'background: "#16a34a"',
  ">\n                Save\n              </button>",
]) {
  if (region.includes(forbidden)) failures.push("direct claim amount popup still has old token: " + forbidden);
}

if (failures.length) {
  console.error("FAIL: direct claim amount popup standard modal safety");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: direct claim amount popup standard modal safety");
