import fs from "node:fs";

const route = fs.readFileSync("app/api/admin/ticklers/search/route.ts", "utf8");
const page = fs.readFileSync("app/admin/ticklers/page.tsx", "utf8");

const failures = [];

function mustInclude(label, haystack, needle) {
  if (!haystack.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, haystack, needle) {
  if (haystack.includes(needle)) failures.push(`forbidden ${label}: ${needle}`);
}

[
  "patient",
  "provider",
  "insuranceCompany",
  "claim",
  "dateOfLoss",
  "denialReason",
  "claimStatus",
  "closeReason",
  "court",
  "dateFiledFrom",
  "dateFiledTo",
].forEach((param) => {
  mustInclude(`route reads ${param}`, route, `url.searchParams.get("${param}")`);
  mustInclude(`page sends ${param}`, page, `params.set("${param}"`);
});

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
].forEach((label) => mustInclude(`page label ${label}`, page, label));

mustInclude("route supports ClaimIndex bridge", route, "const claimIndexFilters =");
mustInclude("route queries ClaimIndex", route, "prisma.claimIndex.findMany");
mustInclude("route combines tickler filters with claim filters", route, "where.AND =");
mustInclude("route links matter ids", route, "matterId: { in: matterIds }");
mustInclude("route links display numbers", route, "displayNumber: { in: displayNumbers }");
mustInclude("route links master lawsuits", route, "masterLawsuitId: { in: masterLawsuitIds }");
mustInclude("route note says filters are combinable", route, "Filters are combinable across tickler fields and Advanced Search identity fields");
mustInclude("route remains read-only", route, "readOnly: true");
mustInclude("route no runner", route, "does not run or process ticklers");

mustNotInclude("top explanatory copy removed", page, "Search local Barsh Matters ticklers by type, status, due date, matter, or lawsuit.");
mustNotInclude("Search Filters heading removed", page, "Search Filters");
mustNotInclude("old keyword filter removed", page, "title, note, matter...");
mustNotInclude("old all priorities removed", page, "All priorities");
mustNotInclude("old all statuses removed", page, "All statuses");
mustNotInclude("route create side effect", route, ".create(");
mustNotInclude("route update side effect", route, ".update(");
mustNotInclude("route delete side effect", route, ".delete");
mustNotInclude("page runner button", page, "Run Ticklers");
mustNotInclude("page process button", page, "Process Ticklers");

if (failures.length) {
  console.error("FAIL: admin tickler advanced search fields verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: admin tickler search supports the current grouped search criteria layout while remaining combinable and read-only.");
