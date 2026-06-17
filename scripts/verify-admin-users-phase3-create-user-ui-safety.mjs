import fs from "node:fs";

const failures = [];

function pass(label) {
  console.log(`PASS: ${label}`);
}

function fail(label) {
  failures.push(label);
  console.log(`FAIL: ${label}`);
}

function requireIncludes(file, text, label) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes(text)) pass(label);
  else fail(label);
}

function requireNotIncludes(file, text, label) {
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes(text)) pass(label);
  else fail(label);
}

const pageFile = "app/admin/users/page.tsx";
const routeFile = "app/api/admin/users/create/route.ts";
const packageFile = "package.json";

if (!fs.existsSync(pageFile)) {
  fail("admin users page exists");
} else {
  pass("admin users page exists");
  requireIncludes(pageFile, 'data-barsh-admin-users-planning-page="phase3-guarded"', "page is marked as Phase 3 guarded, not Phase 2 read-only");
  requireIncludes(pageFile, 'data-barsh-admin-users-create-user-control="phase3-guarded"', "create admin user guarded UI panel present");
  requireIncludes(pageFile, 'fetch("/api/admin/users/create"', "UI calls locked create-admin-user route");
  requireIncludes(pageFile, 'Preview the request before applying. Apply remains disabled until a matching preview succeeds.', "UI displays preview/apply contract result");
  requireIncludes(pageFile, 'Apply Create Admin User', "apply button present");
  requireIncludes(pageFile, 'Preview Create Admin User', "preview button present");
  requireIncludes(pageFile, 'previewReady', "apply button gated by successful matching preview");
  requireIncludes(pageFile, 'actorEmail', "owner_admin actor email submitted");
  requireIncludes(pageFile, 'value="active"', "active status option present");
  requireIncludes(pageFile, 'value="inactive"', "inactive status option present");
  requireIncludes(pageFile, 'Enforcement Disabled', "enforcement-disabled notice remains visible");
  requireIncludes(pageFile, 'does not assign roles', "UI discloses no role assignment");
  requireIncludes(pageFile, 'does not assign roles, create permission overrides, enable enforcement', "UI discloses no broader permission/enforcement writes");
  requireNotIncludes(pageFile, 'enable production enforcement', "UI does not imply enforcement enablement");
  requireNotIncludes(pageFile, 'No button in this section creates users', "stale Phase 2 no-create language removed");
}

if (!fs.existsSync(routeFile)) {
  fail("locked create route still exists");
} else {
  pass("locked create route still exists");
  requireIncludes(routeFile, 'isAdminRequestAuthorized(req)', "route still requires authenticated session");
  requireIncludes(routeFile, 'key: "owner_admin"', "route still requires owner_admin actor");
  requireIncludes(routeFile, 'if (!apply)', "route still defaults to preview");
  requireIncludes(routeFile, 'tx.adminUser.create', "route still creates only AdminUser row on apply");
  requireIncludes(routeFile, 'createMatterAuditLogEntry', "route still audit logs apply");
  requireIncludes(routeFile, 'enforcementChanged: false', "route still reports no enforcement change");
  requireNotIncludes(routeFile, 'adminUserRole.create', "route still does not assign roles");
  requireNotIncludes(routeFile, 'adminUserPermissionOverride.create', "route still does not create overrides");
  requireNotIncludes(routeFile, 'BARSH_ADMIN_PERMISSIONS_ENFORCEMENT', "route still does not enable enforcement");
}

const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf8"));
if (packageJson.scripts?.["verify:admin-users-phase3-create-user-ui-safety"] === "node scripts/verify-admin-users-phase3-create-user-ui-safety.mjs") {
  pass("package UI verifier script registered");
} else {
  fail("package UI verifier script registered");
}
if (packageJson.scripts?.["verify:admin-users-phase3-create-user-route-safety"] === "node scripts/verify-admin-users-phase3-create-user-route-safety.mjs") {
  pass("route verifier remains registered");
} else {
  fail("route verifier remains registered");
}

console.log("\nRESULT: admin users phase 3 create user UI safety verifier");
console.log(`FAILURES=${failures.length}`);
if (failures.length) {
  process.exitCode = 1;
} else {
  console.log("PASS: /admin/users exposes only the guarded create-admin-user preview/apply UI and does not add role, override, or enforcement controls.");
}
