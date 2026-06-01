import fs from "node:fs";

const routePath = "app/api/admin/ticklers/duplicates/route.ts";
const pagePath = "app/admin/ticklers/page.tsx";
const pkgPath = "package.json";

const route = fs.readFileSync(routePath, "utf8");
const page = fs.readFileSync(pagePath, "utf8");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const failures = [];

function mustInclude(label, text, token) {
  if (!text.includes(token)) failures.push(`${label}: missing ${token}`);
}

function mustNotInclude(label, text, token) {
  if (text.includes(token)) failures.push(`${label}: forbidden ${token}`);
}

mustInclude("duplicate route", route, 'const SETTLEMENT_PAYMENT_DUE_KIND = "settlement_payment_due_followup"');
mustInclude("duplicate route", route, 'status: "open"');
mustInclude("duplicate route", route, "duplicateKeyFor");
mustInclude("duplicate route", route, "settlementRecordId");
mustInclude("duplicate route", route, "masterLawsuitId");
mustInclude("duplicate route", route, "dueDate");
mustInclude("duplicate route", route, "readOnly: true");
mustInclude("duplicate route", route, "writePerformed: false");
mustInclude("duplicate route", route, "duplicateGroups");
mustInclude("duplicate route", route, "duplicateGroupCount");
mustInclude("duplicate route", route, "retainedCandidateId");
mustInclude("duplicate route", route, "duplicateCandidateIds");
mustInclude("duplicate route", route, "Read-only duplicate settlement payment follow-up tickler diagnostic");

mustInclude("Admin Ticklers page", page, 'data-barsh-admin-duplicate-settlement-tickler-diagnostic="true"');
mustInclude("Admin Ticklers page", page, 'data-barsh-admin-duplicate-settlement-tickler-preview-button="true"');
mustInclude("Admin Ticklers page", page, 'data-barsh-admin-duplicate-settlement-tickler-results="true"');
mustInclude("Admin Ticklers page", page, 'data-barsh-admin-duplicate-settlement-tickler-group="true"');
mustInclude("Admin Ticklers page", page, 'fetch("/api/admin/ticklers/duplicates")');
mustInclude("Admin Ticklers page", page, "No write performed.");
mustInclude("Admin Ticklers page", page, "No duplicate open settlement payment follow-up ticklers found.");
mustInclude("Admin Ticklers page", page, "No delete, complete, merge, reopen, rerun, payment, closure, Clio, email, print, queue, or write action is available here.");

const forbiddenRouteTokens = [
  ".update(",
  ".updateMany(",
  ".delete(",
  ".deleteMany(",
  ".create(",
  ".createMany(",
  ".upsert(",
  "status: \"completed\"",
  "completedAt",
  "completedBy",
  "completedNote",
];

for (const token of forbiddenRouteTokens) {
  mustNotInclude("duplicate route must be read-only", route, token);
}

const forbiddenPageTokens = [
  "Delete Duplicate",
  "Complete Duplicate",
  "Merge Duplicate",
  "Cleanup Duplicate",
  "Reopen Tickler",
  "Rerun Tickler",
  "Post Payment",
  "Close Paid Settlements",
];

for (const token of forbiddenPageTokens) {
  mustNotInclude("duplicate page must be preview-only", page, token);
}

if (!pkg.scripts?.["verify:admin-duplicate-settlement-tickler-diagnostic-safety"]) {
  failures.push("package.json missing verify:admin-duplicate-settlement-tickler-diagnostic-safety script");
}

if (failures.length) {
  console.error("FAIL: Admin duplicate settlement tickler diagnostic safety verifier");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: Admin duplicate settlement tickler diagnostic is read-only and groups open settlement follow-up duplicates safely.");
