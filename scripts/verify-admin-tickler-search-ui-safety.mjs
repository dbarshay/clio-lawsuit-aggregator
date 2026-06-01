import fs from "node:fs";

const page = fs.readFileSync("app/admin/ticklers/page.tsx", "utf8");
const route = fs.readFileSync("app/api/admin/ticklers/search/route.ts", "utf8");
const adminHome = fs.readFileSync("app/admin/page.tsx", "utf8");

const failures = [];

function mustInclude(label, haystack, needle) {
  if (!haystack.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, haystack, needle) {
  if (haystack.includes(needle)) failures.push(`forbidden ${label}: ${needle}`);
}

mustInclude("admin home Ticklers card", adminHome, 'href: "/admin/ticklers"');
mustInclude("admin ticklers page title", page, "Ticklers");
mustInclude("admin tickler search API call", page, "/api/admin/ticklers/search?");
mustInclude("route read-only safety", route, "readOnly: true");
mustInclude("route no-runner note", route, "does not run or process ticklers");

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
  "Search Ticklers",
  "Clear Filters",
  "Tickler Results",
].forEach((label) => mustInclude(`page label ${label}`, page, label));

mustNotInclude("top explanatory copy removed", page, "Search local Barsh Matters ticklers by type, status, due date, matter, or lawsuit.");
mustNotInclude("Search Filters heading removed", page, "Search Filters");
mustNotInclude("old keyword filter removed", page, "title, note, matter...");
mustNotInclude("old all statuses removed", page, "All statuses");
mustNotInclude("old all priorities removed", page, "All priorities");
mustNotInclude("run ticklers button", page, "Run Ticklers");
mustNotInclude("process ticklers button", page, "Process Ticklers");
mustNotInclude("complete ticklers button", page, "Complete Ticklers");
mustNotInclude("create tickler button", page, "Create Tickler");
mustNotInclude("page POST write", page, 'method: "POST"');
mustNotInclude("page PATCH write", page, 'method: "PATCH"');
mustNotInclude("page DELETE write", page, 'method: "DELETE"');

if (failures.length) {
  console.error("FAIL: admin tickler search UI safety verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: Administrator Ticklers page provides the simplified read-only searchable tickler UI with no runner controls.");
