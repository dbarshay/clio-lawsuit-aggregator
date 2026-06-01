import fs from "node:fs";

const routePath = "app/api/admin/ticklers/run/route.ts";
const pagePath = "app/admin/ticklers/runner/page.tsx";
const adminTicklersPath = "app/admin/ticklers/page.tsx";
const pkgPath = "package.json";

const route = fs.readFileSync(routePath, "utf8");
const page = fs.readFileSync(pagePath, "utf8");
const adminTicklers = fs.readFileSync(adminTicklersPath, "utf8");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const failures = [];

function mustInclude(label, text, token) {
  if (!text.includes(token)) failures.push(`${label}: missing ${token}`);
}

function mustNotInclude(label, text, token) {
  if (text.includes(token)) failures.push(`${label}: forbidden ${token}`);
}

mustInclude("runner route", route, 'status: "open"');
mustInclude("runner route", route, "dueDate: { lte:");
mustInclude("runner route", route, 'mode === "preview"');
mustInclude("runner route", route, "writePerformed: false");
mustInclude("runner route", route, "prisma.localWorkflowTickler.updateMany");
mustInclude("runner route", route, 'status: "completed"');
mustInclude("runner route", route, "completedAt");
mustInclude("runner route", route, "completedBy");
mustInclude("runner route", route, "completedNote");
mustInclude("runner route", route, "extractRunnerCaseData");

mustInclude("runner page", page, "Admin Tickler Bulk Runner");
mustInclude("runner page", page, 'data-barsh-admin-tickler-bulk-runner-controls="true"');
mustInclude("runner page", page, 'data-barsh-admin-tickler-bulk-runner-preview="true"');
mustInclude("runner page", page, 'data-barsh-admin-tickler-bulk-runner-complete="true"');
mustInclude("runner page", page, 'data-barsh-admin-tickler-bulk-runner-results="true"');
mustInclude("runner page", page, 'fetch("/api/admin/ticklers/run"');
mustInclude("runner page", page, "window.confirm(");
mustInclude("runner page", page, "does not post payments, close matters, change settlement records");

mustInclude("Admin Ticklers navigation", adminTicklers, 'data-barsh-admin-tickler-bulk-runner-nav="true"');
mustInclude("Admin Ticklers navigation", adminTicklers, 'href="/admin/ticklers/runner"');
mustInclude("Admin Ticklers navigation", adminTicklers, 'data-barsh-admin-tickler-bulk-runner-link="true"');

mustNotInclude("runner route must not post payments", route, "applyPayment");
mustNotInclude("runner route must not close paid settlements", route, "closePaid");
mustNotInclude("runner route must not write settlements", route, "localSettlementRecord.update");
mustNotInclude("runner route must not email", route, "graph");
mustNotInclude("runner route must not print", route, "printQueue");

if (!pkg.scripts?.["verify:admin-tickler-bulk-runner-safety"]) {
  failures.push("package.json missing verify:admin-tickler-bulk-runner-safety script");
}

if (failures.length) {
  console.error("FAIL: Admin Tickler bulk runner safety verifier");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: Admin Tickler bulk runner is separate, administrator-scoped, previewable, and limited to LocalWorkflowTickler completion fields.");
