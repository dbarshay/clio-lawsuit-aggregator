import fs from "node:fs";

const page = fs.readFileSync("app/admin/ticklers/page.tsx", "utf8");
const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, needle) {
  if (page.includes(needle)) failures.push(`forbidden ${label}: ${needle}`);
}

[
  "Type / Kind",
  "Due From",
  "Due Through",
  "Search Criteria",
  "Provider / Client",
  "Patient",
  "Insurance Company",
  "Claim Number",
  "Date of Loss",
  "Denial Reason",
  "Status",
  "Closed Reason",
  "Court",
  "Date Filed From",
  "Date Filed Through",
  "Master Lawsuit",
  "Matter Number",
].forEach((label) => mustInclude(`page label ${label}`, label));

const providerIndex = page.indexOf("Provider / Client");
const patientIndex = page.indexOf("Patient", providerIndex);
const insurerIndex = page.indexOf("Insurance Company", patientIndex);
const claimIndex = page.indexOf("Claim Number", insurerIndex);
const dolIndex = page.indexOf("Date of Loss", claimIndex);

const denialIndex = page.indexOf("Denial Reason", dolIndex);
const statusIndex = page.indexOf("Status", denialIndex);
const closedIndex = page.indexOf("Closed Reason", statusIndex);

const courtIndex = page.indexOf("Court", closedIndex);
const filedFromIndex = page.indexOf("Date Filed From", courtIndex);
const filedThroughIndex = page.indexOf("Date Filed Through", filedFromIndex);

const masterIndex = page.indexOf("Master Lawsuit", filedThroughIndex);
const matterIndex = page.indexOf("Matter Number", masterIndex);

if (!(providerIndex >= 0 && patientIndex > providerIndex && insurerIndex > patientIndex && claimIndex > insurerIndex && dolIndex > claimIndex)) {
  failures.push("first search-criteria row is not ordered as Provider / Client, Patient, Insurance Company, Claim Number, Date of Loss");
}

if (!(denialIndex >= 0 && statusIndex > denialIndex && closedIndex > statusIndex)) {
  failures.push("second search-criteria row is not ordered as Denial Reason, Status, Closed Reason");
}

if (!(courtIndex >= 0 && filedFromIndex > courtIndex && filedThroughIndex > filedFromIndex)) {
  failures.push("third search-criteria row is not ordered as Court, Date Filed From, Date Filed Through");
}

if (!(masterIndex >= 0 && matterIndex > masterIndex)) {
  failures.push("matter context row is not ordered as Master Lawsuit, Matter Number");
}

mustNotInclude("top explanatory copy", "Search local Barsh Matters ticklers by type, status, due date, matter, or lawsuit.");
mustNotInclude("Search Filters heading", "Search Filters");
mustNotInclude("Run Ticklers button", "Run Ticklers");
mustNotInclude("Process Ticklers button", "Process Ticklers");

if (failures.length) {
  console.error("FAIL: admin tickler search criteria layout verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: admin tickler search criteria layout uses the requested row groupings, including a standalone Court / Date Filed row.");
