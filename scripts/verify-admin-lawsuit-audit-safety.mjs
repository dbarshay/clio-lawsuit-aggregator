import fs from "node:fs";

const failures = [];

const routePath = "app/api/admin/lawsuits/audit/route.ts";
const pagePath = "app/admin/lawsuits/audit/page.tsx";
const adminPath = "app/admin/page.tsx";
const claimAuditPath = "app/admin/claim-index/audit/page.tsx";
const packagePath = "package.json";

function read(path) {
  if (!fs.existsSync(path)) {
    failures.push(`${path}: missing file`);
    return "";
  }
  return fs.readFileSync(path, "utf8");
}

function mustContain(label, text, needle) {
  if (!text.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function mustNotContain(label, text, needle) {
  if (text.includes(needle)) failures.push(`${label}: forbidden ${needle}`);
}

const route = read(routePath);
const page = read(pagePath);
const admin = read(adminPath);
const claimAudit = read(claimAuditPath);
const pkgText = read(packagePath);
const pkg = pkgText ? JSON.parse(pkgText) : {};

const routeRequired = [
  "export async function GET",
  'import { prisma } from "@/lib/prisma"',
  "prisma.lawsuit.findMany",
  "prisma.claimIndex.findMany",
  "Read-only Admin Lawsuit/master data-quality audit",
  "only reads prisma.lawsuit and prisma.claimIndex",
  "missing-master-lawsuit-id",
  "malformed-master-lawsuit-id",
  "missing-lawsuit-matters",
  "lawsuit-matters-no-parseable-child-ids",
  "local-lawsuit-without-linked-claimindex-children",
  "claimindex-child-linked-to-missing-lawsuit",
  "lawsuit-matters-child-not-linked-in-claimindex",
  "claimindex-linked-child-not-in-lawsuit-matters",
  "invalid-amount-sought-mode",
  "custom-amount-mode-missing-custom-amount",
  "negative-lawsuit-amount",
  "missing-venue",
  "other-venue-missing-text",
  "missing-master-clio-shell-mapping",
  "partial-master-clio-shell-mapping",
  "invalid-lawsuit-final-status",
  "closed-lawsuit-without-close-reason",
  "lawsuit-close-reason-without-closed-status",
  "closed-lawsuit-children-not-closed",
];

for (const required of routeRequired) {
  mustContain(routePath, route, required);
}

const routeForbidden = [
  "export async function POST",
  "export async function PUT",
  "export async function PATCH",
  "export async function DELETE",
  ".create(",
  ".createMany(",
  ".update(",
  ".updateMany(",
  ".upsert(",
  ".delete(",
  ".deleteMany(",
  "$executeRaw",
  "$queryRaw",
  "clioFetch",
  "cleanup-confirm",
  "DEAGGREGATE AND DELETE",
  "confirmCleanup",
  "deaggregateAndDelete",
  "performDeaggregate",
  "deleteLocalLawsuit",
  "deleteClioShell",
  "restore-preview",
  "restore-confirm",
  "restoreBackup",
  "performRestore",
  "fetch(`/api/admin/backups/restore",
  "fetch('/api/admin/backups/restore",
  "generate-preview",
  "finalize-preview",
  "working-docx",
  "documents/print-queue",
  "sendMail",
  "createDraft",
];

for (const forbidden of routeForbidden) {
  mustNotContain(routePath, route, forbidden);
}

const pageRequired = [
  'data-barsh-admin-lawsuit-audit="read-only"',
  "/api/admin/lawsuits/audit",
  "Lawsuit / Master Data-Quality Audit",
  "Export Audit CSV",
  "ClaimIndex Audit",
  "does not edit",
  "restore",
  "deaggregate",
  "delete",
  "call Clio",
  "generate documents",
  "send email",
  "print",
  "queue",
  "write to the database",
  "data-barsh-admin-lawsuit-audit-check",
];

for (const required of pageRequired) {
  mustContain(pagePath, page, required);
}

const pageForbidden = [
  'method: "POST"',
  "method: 'POST'",
  "fetch(`/api/documents",
  "fetch('/api/documents",
  "fetch(`/api/admin/lawsuits/cleanup-confirm",
  "fetch('/api/admin/lawsuits/cleanup-confirm",
  "fetch(`/api/admin/backups/restore",
  "fetch('/api/admin/backups/restore",
  "DEAGGREGATE AND DELETE",
  "confirmCleanup",
  "cleanup-confirm",
  "deaggregateAndDelete",
  "performDeaggregate",
  "deleteLocalLawsuit",
  "deleteClioShell",
  "clioFetch",
  "sendMail",
  "createDraft",
  "localStorage.setItem",
  "prisma.",
];

for (const forbidden of pageForbidden) {
  mustNotContain(pagePath, page, forbidden);
}

mustContain(adminPath, admin, "Lawsuit / Master Audit");
mustContain(adminPath, admin, "/admin/lawsuits/audit");
mustContain(adminPath, admin, "Read-only restore-confidence audit for local Lawsuit/master metadata");

mustContain(claimAuditPath, claimAudit, "/admin/lawsuits/audit");
mustContain(claimAuditPath, claimAudit, "Lawsuit / Master Audit");

if (pkg.scripts?.["verify:admin-lawsuit-audit-safety"] !== "node scripts/verify-admin-lawsuit-audit-safety.mjs") {
  failures.push("package.json: missing verify:admin-lawsuit-audit-safety script");
}

console.log("RESULT: admin Lawsuit/master audit safety verifier");

if (failures.length) {
  console.log(`FAILURES=${failures.length}`);
  for (const failure of failures) console.log(`FAIL=${failure}`);
  process.exit(1);
}

console.log("FAILURES=0");
console.log("PASS: Admin Lawsuit/master audit is read-only, local-only, verifier-covered, and exposes no restore/Clio/document/email/print/write/deaggregate/delete controls.");
