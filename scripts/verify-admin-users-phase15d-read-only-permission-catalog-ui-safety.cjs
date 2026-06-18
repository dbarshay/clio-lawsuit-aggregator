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

console.log("RUN: Phase 15D read-only permission catalog UI safety verifier");

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
const pagePath = path.join(process.cwd(), "app/admin/permissions/page.tsx");
const docPath = path.join(process.cwd(), "docs/implementation/admin-users-phase15d-read-only-permission-catalog-ui.md");
const page = fs.existsSync(pagePath) ? fs.readFileSync(pagePath, "utf8") : "";
const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
const proxy = fs.readFileSync(path.join(process.cwd(), "proxy.ts"), "utf8");

assert("Phase 15D package script registered", pkg.scripts && pkg.scripts["verify:admin-users-phase15d-read-only-permission-catalog-ui-safety"] === "node scripts/verify-admin-users-phase15d-read-only-permission-catalog-ui-safety.cjs");
assert("permissions page exists", Boolean(page));
assert("Phase 15D contract doc exists", Boolean(doc));

for (const marker of [
  "/api/admin/permissions/catalog",
  "data-barsh-admin-permissions-static-catalog",
  "data-barsh-admin-permissions-catalog-runtime-flag",
  "data-barsh-admin-permissions-catalog-group",
  "data-barsh-admin-permissions-catalog-key",
  "Static Permission Catalog",
  "Runtime Enforcement Changed",
  "admin-functions-only",
  "runtimeEnforcementChanged",
  "enforcementStatus",
  "riskLevel",
  "routeScopes",
  "functionScopes",
]) {
  assert(`page marker present: ${marker}`, page.includes(marker));
}

assert("page keeps read-only data marker", page.includes('data-barsh-admin-permissions-page="read-only"'));
assert("page uses GET fetches only", page.includes('fetch("/api/admin/permissions"') && page.includes('fetch("/api/admin/permissions/catalog"') && !page.includes('method: "POST"') && !page.includes("method: 'POST'"));
assert("page does not expose password hash", !page.toLowerCase().includes("passwordhash") && !page.toLowerCase().includes("temporarypassword"));
assert("page does not impersonate", !page.toLowerCase().includes("impersonat"));
assert("page does not toggle enforcement env", !page.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1"));

assert("doc says Phase 15D must not broaden runtime enforcement", doc.includes("Phase 15D must not broaden runtime enforcement."));
assert("doc says no password viewing", doc.includes("No password viewing."));
assert("doc says no impersonation", doc.includes("No impersonation."));
assert("doc says no new non-admin route is blocked", doc.includes("No new non-admin route is blocked in Phase 15D."));
assert("doc says UI is read-only", doc.includes("The UI is read-only"));

assert("proxy remains admin-only matcher", proxy.includes('"/admin/:path*"') && proxy.includes('"/api/admin/:path*"'));
assert("proxy still avoids matters matcher", !proxy.includes('"/matters/:path*"'));
assert("proxy still avoids lawsuits matcher", !proxy.includes('"/lawsuits/:path*"'));
assert("no middleware.ts added", !fs.existsSync(path.join(process.cwd(), "middleware.ts")));

if (process.exitCode) process.exit(process.exitCode);

console.log("CONTRACT: Phase 15D adds read-only catalog UI only.");
console.log("CONTRACT: Phase 15D does not broaden runtime enforcement beyond admin-functions-only.");
console.log("PASS: Phase 15D read-only permission catalog UI is safe.");
