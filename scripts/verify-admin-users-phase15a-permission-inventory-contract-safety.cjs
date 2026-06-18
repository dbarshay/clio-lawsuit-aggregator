const fs = require("fs");
const path = require("path");

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS: ${name}`);
}

console.log("RUN: Phase 15A permission inventory contract safety verifier");

const docPath = path.join(process.cwd(), "docs/implementation/admin-users-phase15a-permission-inventory-contract.md");
const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

assert("Phase 15A verifier package script registered", pkg.scripts && pkg.scripts["verify:admin-users-phase15a-permission-inventory-contract-safety"] === "node scripts/verify-admin-users-phase15a-permission-inventory-contract-safety.cjs");
assert("Phase 15A contract doc exists", Boolean(doc));

for (const marker of [
  "Phase 15A is an inventory and contract phase only.",
  "Phase 15A must not change runtime enforcement.",
  "admin-functions-only",
  "No password viewing.",
  "No impersonation.",
  "`admin.access`",
  "`matters.view`",
  "`matters.edit`",
  "`matters.payments.post`",
  "`matters.payments.void`",
  "`lawsuits.view`",
  "`lawsuits.create`",
  "`lawsuits.edit`",
  "`lawsuits.payments.post`",
  "`lawsuits.payments.void`",
  "`documents.view`",
  "`documents.generate`",
  "`documents.finalize`",
  "`settlements.view`",
  "`settlements.edit`",
  "`courtCalendar.view`",
  "`courtCalendar.edit`",
  "`printQueue.view`",
  "`printQueue.manage`",
  "`claimIndex.search`",
  "`claimIndex.rebuild`",
  "Jane Doe / read_only_admin",
  "/admin/*",
  "/api/admin/*",
  "/api/matters/*",
  "/api/lawsuits/*",
  "/api/documents/*",
  "/api/settlements/*",
  "/api/court-calendar/*",
  "/api/claim-index/*",
]) {
  assert(`contract marker present: ${marker}`, doc.includes(marker));
}

const proxyPath = path.join(process.cwd(), "proxy.ts");
const proxy = fs.existsSync(proxyPath) ? fs.readFileSync(proxyPath, "utf8") : "";
assert("proxy still exists for Phase 14 admin-function-only enforcement", Boolean(proxy));
assert("proxy matcher still scoped to admin surfaces", proxy.includes('"/admin/:path*"') && proxy.includes('"/api/admin/:path*"'));
assert("proxy still does not match regular matters route", !proxy.includes('"/matters/:path*"'));
assert("proxy still does not match regular lawsuits route", !proxy.includes('"/lawsuits/:path*"'));
assert("Phase 15A adds no runtime permission middleware file", !fs.existsSync(path.join(process.cwd(), "middleware.ts")));

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("CONTRACT: Phase 15A inventories future permission keys only.");
console.log("CONTRACT: Phase 15A does not broaden runtime enforcement beyond the locked admin-functions-only rule.");
console.log("PASS: Phase 15A permission inventory contract is safe.");
