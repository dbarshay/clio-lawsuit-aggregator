import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const failures = [];

const start = page.indexOf('data-barsh-direct-treating-provider-edit-standard-modal="true"');
const end = page.indexOf('{(matterHydrationLoading || matterHydrationError) && (', start);
const region = start >= 0 && end > start ? page.slice(start, end) : "";

if (region === "") failures.push("could not isolate direct treating provider popup region");

for (const token of [
  'data-barsh-direct-treating-provider-edit-standard-modal="true"',
  'data-barsh-direct-treating-provider-current-card="true"',
  'localTreatingProviderName() || "—"',
  'background: "#1e3a8a"',
  'color: "#ffffff"',
  'textAlign: "center"',
  'Confirm Edit',
  'type="submit"',
  'onSubmit={(event) =>',
  'onKeyDown={(event) => { if (event.key === "Escape")',
  'borderTop: "1px solid #e2e8f0"',
]) {
  if (region.includes(token) === false) failures.push("missing direct treating provider popup token: " + token);
}

for (const forbidden of [
  "CLAIMINDEX IDENTITY FIELD",
  "Matter:",
  "Close",
  "borderRadius: 22",
  'border: "1px solid #bfdbfe"',
  'background: "#16a34a"',
  ">\n                Save\n              </button>",
]) {
  if (region.includes(forbidden)) failures.push("direct treating provider popup still has old token: " + forbidden);
}

if (failures.length) {
  console.error("FAIL: direct treating provider popup standard modal safety");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: direct treating provider popup standard modal safety");
