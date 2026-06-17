const fs = require("fs");

const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
const registry = read("lib/adminPermissions.ts");
const proxy = read("proxy.ts");
const sessionRoute = read("app/api/auth/session/route.ts");
const permissionsPage = read("app/admin/permissions/page.tsx");
const auditPage = read("app/admin/audit-history/page.tsx");
const usersPage = read("app/admin/users/page.tsx");
const writeContracts = read("lib/adminUsersWriteContracts.ts");
const planning = read("lib/adminUsersPlanning.ts");
const phase9dSafety = read("scripts/verify-admin-users-phase9d-authenticated-no-lockout-smoke-harness-safety.cjs");
const phase9dCompletion = read("scripts/verify-admin-users-phase9d-completion-safety.cjs");
const phase9c = read("scripts/verify-admin-users-phase9c-opt-in-authenticated-no-lockout-smoke-readiness-safety.cjs");

console.log("RESULT: admin users Phase 10A guarded first-target enforcement-planning readiness safety verifier");

assert(scripts["verify:admin-users-phase9d-authenticated-no-lockout-smoke-harness-safety"] === "node scripts/verify-admin-users-phase9d-authenticated-no-lockout-smoke-harness-safety.cjs", "Phase 9D smoke harness safety verifier remains registered");
assert(scripts["smoke:admin-users-phase9d-authenticated-no-lockout"] === "node scripts/smoke-admin-users-phase9d-authenticated-no-lockout.cjs", "Phase 9D opt-in authenticated smoke remains registered");
assert(phase9dSafety.includes("harness sends auth cookie to primary session authentication proof"), "Phase 9D strict authenticated session-cookie proof is locked");
assert(phase9dCompletion.includes("manual opt-in smoke execution with authenticated cookie"), "Phase 9D completion still requires manual authenticated smoke before first-target planning");
assert(phase9c.includes("no first-target enforcement planning change yet"), "Phase 9C boundary remains no first-target planning change");

assert(registry.includes('pattern: "/admin/audit-history"') && registry.includes('permission: "admin.auditHistory.view"'), "first target remains /admin/audit-history mapped to admin.auditHistory.view");
assert(registry.includes('enforcementPlanned: false') && !registry.includes('enforcementPlanned: true'), "Phase 10A remains verifier-only: all mapped routes are still enforcementPlanned false");
assert(registry.includes('return String(process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT ?? "").trim() === "1"'), "enforcement remains exact-match environment-gated");

for (const route of ["/admin", "/admin/permissions", "/api/admin/permissions", "/api/admin/permissions/check"]) {
  assert(registry.includes(`"${route}"`), `never-block route remains registered before any first-target planning change: ${route}`);
}
assert(registry.includes('if (pattern === "/admin") return cleanPath === "/admin"'), "/admin never-block matching remains exact-only");
assert(registry.includes("Never-block safety route remains allowed to prevent administrator lockout."), "never-block diagnostic remains preserved");

assert(sessionRoute.includes("permissionsEnforced") && sessionRoute.includes("authenticated"), "/api/auth/session remains rollback/auth diagnostic path");
assert(proxy.includes("isAdminRequestAuthorized(req)") && proxy.includes("adminPermissionEnforcementDecision"), "proxy still gates permission decisions behind authenticated admin requests");
assert(proxy.includes("/admin/permissions"), "blocked-page fallback remains the never-block permissions diagnostics page");

assert(auditPage.includes('data-barsh-admin-audit-history="true"') && auditPage.includes('data-barsh-admin-users-audit-history-focus="read-only"'), "audit-history remains read-only first-target candidate");
assert(usersPage.includes("admin.auditHistory.view"), "users UI still exposes first-target permission key");
assert(permissionsPage.includes("No enforcement is active now") && permissionsPage.includes("Set BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1 only in a later enforcement phase"), "permissions UI still discloses non-activation");

assert(writeContracts.includes("owner_admin effective permission required"), "owner_admin effective-permission precondition remains documented");
assert(writeContracts.includes("bootstrap owner_admin must remain active") || writeContracts.includes("preserve at least one active bootstrapSafe owner_admin user"), "bootstrap owner_admin preservation precondition remains documented");
assert(planning.includes('key: "owner_admin"') && planning.includes("lockoutSafe: true"), "owner_admin remains lockout-safe bootstrap role");

for (const [name, value] of Object.entries(scripts)) {
  const text = String(value);
  assert(!text.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1"), `${name} does not persistently activate enforcement`);
  if (name.startsWith("verify:")) {
    assert(!text.includes("smoke:admin-users-phase9d-authenticated-no-lockout"), `${name} does not automatically execute Phase 9D smoke`);
    assert(!text.includes("smoke:admin-users-phase8-ephemeral-audit-history"), `${name} does not automatically execute Phase 8 smoke`);
  }
}

for (const file of [
  "lib/adminPermissions.ts",
  "proxy.ts",
  "app/api/auth/session/route.ts",
  "app/api/admin/permissions/route.ts",
  "app/api/admin/permissions/check/route.ts",
  "app/admin/audit-history/page.tsx",
  "app/admin/permissions/page.tsx",
  "app/admin/users/page.tsx",
  "package.json"
]) {
  const src = read(file);
  assert(!/process[.]env[.]BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\s*=/.test(src), `source does not assign process.env enforcement flag: ${file}`);
  assert(!/^\s*BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\s*=\s*1\s*$/m.test(src), `source does not contain standalone BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1 activation line: ${file}`);
  assert(!/enforcementPlanned\s*[:=]\s*true/.test(src), `source does not set enforcementPlanned true: ${file}`);
}

console.log("PHASE_10A_DECISION=first-target enforcement planning must be separate from enforcement activation");
console.log("PHASE_10A_FIRST_TARGET=/admin/audit-history :: admin.auditHistory.view");
console.log("PHASE_10A_REQUIRED_PRECONDITIONS=Phase 9D authenticated smoke proof, never-block routes, rollback session diagnostics, owner_admin/bootstrap preservation");
console.log("PHASE_10A_CURRENT_STATE=verifier-only; enforcement disabled; no route changed to enforcement-planned");
console.log("PHASE_10A_NEXT=separate guarded source-change phase may set only /admin/audit-history to first-target enforcement planning while still keeping BARSH_ADMIN_PERMISSIONS_ENFORCEMENT disabled");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 10A locks guarded first-target enforcement-planning readiness without activating enforcement or changing enforcement planning flags.");
