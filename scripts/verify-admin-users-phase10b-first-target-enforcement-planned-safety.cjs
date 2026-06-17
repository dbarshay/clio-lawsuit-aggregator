const fs = require("fs");

const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
function assert(condition, message) { if (!condition) failures.push(message); }

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
const registry = read("lib/adminPermissions.ts");
const proxy = read("proxy.ts");
const sessionRoute = read("app/api/auth/session/route.ts");
const permissionsPage = read("app/admin/permissions/page.tsx");
const auditPage = read("app/admin/audit-history/page.tsx");
const usersPage = read("app/admin/users/page.tsx");
const phase10a = read("scripts/verify-admin-users-phase10a-completion-safety.cjs");
const phase9dHarness = read("scripts/smoke-admin-users-phase9d-authenticated-no-lockout.cjs");
const writeContracts = read("lib/adminUsersWriteContracts.ts");
const planning = read("lib/adminUsersPlanning.ts");

console.log("RESULT: admin users Phase 10B first-target enforcementPlanned safety verifier");

assert(scripts["verify:admin-users-phase10a-completion-safety"], "Phase 10A completion verifier remains registered");
assert(phase10a.includes("guarded_first_target_enforcement_planning_readiness_locked"), "Phase 10A readiness lock remains available");
assert(scripts["smoke:admin-users-phase9d-authenticated-no-lockout"], "Phase 9D opt-in authenticated smoke remains registered");
assert(phase9dHarness.includes('request("/api/auth/session", { auth: true })'), "Phase 9D harness retains authenticated session-cookie proof");

const trueMatches = [...registry.matchAll(/enforcementPlanned:\s*true/g)];
assert(trueMatches.length === 1, "exactly one route has enforcementPlanned true");
if (trueMatches.length === 1) {
  const truePos = trueMatches[0].index || 0;
  const routeStart = registry.lastIndexOf("pattern:", truePos);
  const routeEndRaw = registry.indexOf("pattern:", truePos + 1);
  const routeBlock = registry.slice(routeStart, routeEndRaw > 0 ? routeEndRaw : registry.length);
  assert(routeBlock.includes('pattern: "/admin/audit-history"'), "the only enforcementPlanned true route is /admin/audit-history");
  assert(routeBlock.includes('permission: "admin.auditHistory.view"'), "the only enforcementPlanned true route uses admin.auditHistory.view");
}

for (const route of ["/admin", "/admin/permissions", "/api/admin/permissions", "/api/admin/permissions/check"]) {
  const marker = `"${route}"`;
  assert(registry.includes(marker), `never-block route remains registered: ${route}`);
}
assert(registry.includes('if (pattern === "/admin") return cleanPath === "/admin"'), "/admin never-block matching remains exact-only");
assert(registry.includes("Never-block safety route remains allowed to prevent administrator lockout."), "never-block diagnostic remains preserved");

assert(registry.includes('return String(process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT ?? "").trim() === "1"'), "enforcement remains exact-match env gated");
assert(proxy.includes("isAdminRequestAuthorized(req)") && proxy.includes("adminPermissionEnforcementDecision"), "proxy still checks permission decisions only inside authenticated admin flow");
assert(proxy.includes("/admin/permissions"), "blocked fallback remains permissions diagnostics page");
assert(sessionRoute.includes("permissionsEnforced") && sessionRoute.includes("authenticated"), "/api/auth/session remains rollback/auth diagnostic path");
assert(permissionsPage.includes("Set BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1 only in a later enforcement phase"), "permissions UI still discloses later enforcement activation only");
assert(auditPage.includes('data-barsh-admin-audit-history="true"') && auditPage.includes('data-barsh-admin-users-audit-history-focus="read-only"'), "audit-history remains read-only first target");
assert(usersPage.includes("admin.auditHistory.view"), "users UI still exposes audit-history permission key");

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
}

console.log("PHASE_10B_FIRST_TARGET=/admin/audit-history :: admin.auditHistory.view");
console.log("PHASE_10B_CHANGE=only first target is enforcementPlanned true");
console.log("PHASE_10B_CURRENT_STATE=BARSH_ADMIN_PERMISSIONS_ENFORCEMENT disabled; no enforcement activation");
console.log("PHASE_10B_BOUNDARY=blocked behavior still cannot occur until env enforcement flag is separately enabled later");
console.log("PHASE_10B_NEXT=manual opt-in authenticated/no-lockout smoke with enforcement disabled, then separate guarded activation-readiness phase");
console.log("PHASE_10B_SOLE_USER_PRECONDITION=current sole configured user must retain full effective access before any activation");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 10B safely sets only /admin/audit-history enforcementPlanned true while enforcement remains disabled.");
