import fs from "node:fs";

const routePath = "app/api/admin/ticklers/duplicates/cleanup-preview/route.ts";
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

mustInclude("cleanup preview route", route, 'const SETTLEMENT_PAYMENT_DUE_KIND = "settlement_payment_due_followup"');
mustInclude("cleanup preview route", route, 'status: "open"');
mustInclude("cleanup preview route", route, "duplicateKeyFor");
mustInclude("cleanup preview route", route, "settlementRecordId");
mustInclude("cleanup preview route", route, "masterLawsuitId");
mustInclude("cleanup preview route", route, "dueDate");
mustInclude("cleanup preview route", route, "readOnly: true");
mustInclude("cleanup preview route", route, "previewOnly: true");
mustInclude("cleanup preview route", route, "writePerformed: false");
mustInclude("cleanup preview route", route, "cleanupPerformed: false");
mustInclude("cleanup preview route", route, "wouldRetainId");
mustInclude("cleanup preview route", route, "wouldRemoveCandidateIds");
mustInclude("cleanup preview route", route, "wouldRemoveTotal");
mustInclude("cleanup preview route", route, "cleanupPreviewGroups");
mustInclude("cleanup preview route", route, "Preview-only duplicate settlement payment follow-up tickler cleanup plan");

mustInclude("Admin Ticklers page", page, 'data-barsh-admin-duplicate-settlement-tickler-cleanup-preview-button="true"');
mustInclude("Admin Ticklers page", page, 'data-barsh-admin-duplicate-settlement-tickler-cleanup-preview-results="true"');
mustInclude("Admin Ticklers page", page, 'data-barsh-admin-duplicate-settlement-tickler-cleanup-preview-group="true"');
mustInclude("Admin Ticklers page", page, 'fetch("/api/admin/ticklers/duplicates/cleanup-preview")');
mustInclude("Admin Ticklers page", page, "Preview Cleanup Plan");
mustInclude("Admin Ticklers page", page, "No cleanup performed.  No write performed.");
mustInclude("Admin Ticklers page", page, "Would retain:");
mustInclude("Admin Ticklers page", page, "Would remove:");
mustInclude("Admin Ticklers page", page, "No duplicate cleanup candidates found.");

const forbiddenRouteTokens = [
  ".update(",
  ".updateMany(",
  ".delete(",
  ".deleteMany(",
  ".create(",
  ".createMany(",
  ".upsert(",
  "status: \"completed\"",
];

for (const token of forbiddenRouteTokens) {
  mustNotInclude("cleanup preview route must not write", route, token);
}

const forbiddenPageTokens = [
  "Confirm Cleanup",
  "Run Cleanup",
  "Delete Duplicate",
  "Delete Candidate",
  "Complete Duplicate",
  "Merge Duplicate",
  "Reopen Tickler",
  "Rerun Tickler",
  "Post Payment",
  "Close Paid Settlements",
];

for (const token of forbiddenPageTokens) {
  mustNotInclude("cleanup preview page must not expose write action", page, token);
}

if (!pkg.scripts?.["verify:admin-duplicate-settlement-tickler-cleanup-preview-safety"]) {
  failures.push("package.json missing verify:admin-duplicate-settlement-tickler-cleanup-preview-safety script");
}

if (failures.length) {
  console.error("FAIL: Admin duplicate settlement tickler cleanup preview safety verifier");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: Admin duplicate settlement tickler cleanup preview is preview-only and identifies retain/remove candidates without writes.");
