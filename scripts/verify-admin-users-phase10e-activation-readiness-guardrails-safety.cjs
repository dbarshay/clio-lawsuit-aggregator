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
const usersPage = read("app/admin/users/page.tsx");
const planningApi = read("app/api/admin/users/planning/route.ts");
const phase10b = read("scripts/verify-admin-users-phase10b-first-target-enforcement-planned-safety.cjs");
const phase9dHarness = read("scripts/smoke-admin-users-phase9d-authenticated-no-lockout.cjs");
const phase9dSafety = read("scripts/verify-admin-users-phase9d-authenticated-no-lockout-smoke-harness-safety.cjs");

console.log("RESULT: admin users Phase 10E activation-readiness guardrails safety verifier");

assert(scripts["verify:admin-users-phase10b-first-target-enforcement-planned-safety"], "Phase 10B first-target verifier remains registered");
assert(scripts["verify:admin-users-phase10b-completion-safety"], "Phase 10B completion verifier remains registered");
assert(scripts["smoke:admin-users-phase9d-authenticated-no-lockout"], "Phase 9D authenticated/no-lockout smoke remains registered");
assert(phase10b.includes("PHASE_10B_SOLE_USER_PRECONDITION=current sole configured user must retain full effective access before any activation"), "Phase 10B records sole-user full-access activation precondition");
assert(phase9dHarness.includes('request("/api/auth/session", { auth: true })'), "Phase 9D smoke uses authenticated session-cookie proof");
assert(phase9dSafety.includes("allows at most one planned first target"), "Phase 9D verifier remains compatible with single planned target");

const plannedMatches = [...registry.matchAll(/enforcementPlanned:\s*true/g)];
assert(plannedMatches.length === 1, "exactly one enforcementPlanned true target exists");
if (plannedMatches.length === 1) {
  const pos = plannedMatches[0].index || 0;
  const start = registry.lastIndexOf("pattern:", pos);
  const endRaw = registry.indexOf("pattern:", pos + 1);
  const block = registry.slice(start, endRaw > 0 ? endRaw : registry.length);
  assert(block.includes('pattern: "/admin/audit-history"') && block.includes('permission: "admin.auditHistory.view"'), "the only planned target is /admin/audit-history :: admin.auditHistory.view");
}

for (const route of ["/admin", "/admin/permissions", "/api/admin/permissions", "/api/admin/permissions/check"]) {
  assert(registry.includes(`"${route}"`), `never-block route remains registered: ${route}`);
}
assert(registry.includes('if (pattern === "/admin") return cleanPath === "/admin"'), "/admin never-block matching remains exact-only");
assert(registry.includes("Never-block safety route remains allowed to prevent administrator lockout."), "never-block diagnostic remains preserved");

assert(registry.includes('return String(process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT ?? "").trim() === "1"'), "enforcement remains exact-match env-gated");
assert(proxy.includes("isAdminRequestAuthorized(req)") && proxy.includes("adminPermissionEnforcementDecision"), "proxy only applies permission decision after admin auth");
assert(proxy.includes("/admin/permissions"), "blocked fallback remains never-block permissions diagnostics page");
assert(sessionRoute.includes("permissionsEnforced") && sessionRoute.includes("authenticated"), "/api/auth/session remains rollback/auth diagnostic path");
assert(permissionsPage.includes("Set BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1 only in a later enforcement phase"), "permissions UI still describes activation as later phase");
assert(usersPage.includes("effectivePermissionCount") && usersPage.includes("owner_admin"), "admin users UI still exposes effective permissions and owner_admin state");
assert(planningApi.includes("databasePreview") && planningApi.includes("effectivePermissionKeys") && planningApi.includes("userPermissionOverrideCount"), "planning API exposes DB-backed effective permission proof data");

for (const [name, value] of Object.entries(scripts)) {
  const text = String(value);
  assert(!text.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1"), `${name} does not persistently activate enforcement`);
  if (name.startsWith("verify:")) {
    assert(!text.includes("smoke:admin-users-phase9d-authenticated-no-lockout"), `${name} does not automatically run Phase 9D smoke`);
    assert(!text.includes("smoke:admin-users-phase8-ephemeral-audit-history"), `${name} does not automatically run Phase 8 smoke`);
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

console.log("PHASE_10E_ACTIVATION_READINESS=guardrails_locked_no_activation");
console.log("PHASE_10E_REQUIRED_LIVE_PROOF=sole DB user must be dbarshay15@gmail.com, active, bootstrapSafe, owner_admin, full effective permissions, no block overrides");
console.log("PHASE_10E_REQUIRED_SMOKE=authenticated/no-lockout smoke must pass after any later activation attempt");
console.log("PHASE_10E_CURRENT_STATE=one planned target only; enforcement env disabled; no automatic smoke execution");
console.log("PHASE_10E_NEXT=separate guarded ephemeral activation simulation; do not persist BARSH_ADMIN_PERMISSIONS_ENFORCEMENT yet");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 10E locks activation-readiness guardrails without enabling enforcement.");
