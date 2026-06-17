const fs = require("fs");

const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
function assert(condition, message) { if (!condition) failures.push(message); }

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
const registry = read("lib/adminPermissions.ts");
const proxy = read("proxy.ts");
const sessionRoute = read("app/api/auth/session/route.ts");
const runbook = read("docs/admin-users-permissions/phase10g-activation-rollback-runbook.md");
const phase10e = read("scripts/verify-admin-users-phase10e-activation-readiness-guardrails-safety.cjs");
const phase10f = read("scripts/verify-admin-users-phase10f-ephemeral-activation-simulation-safety.cjs");
const phase10b = read("scripts/verify-admin-users-phase10b-first-target-enforcement-planned-safety.cjs");
const phase9dHarness = read("scripts/smoke-admin-users-phase9d-authenticated-no-lockout.cjs");
const phase10fHarness = read("scripts/smoke-admin-users-phase10f-ephemeral-activation-simulation.cjs");

console.log("RESULT: admin users Phase 10G activation/rollback package safety verifier");

for (const name of [
  "verify:admin-users-phase10g-activation-rollback-package-safety",
  "verify:admin-users-phase10e-activation-readiness-guardrails-safety",
  "verify:admin-users-phase10f-ephemeral-activation-simulation-safety",
  "verify:admin-users-phase10b-first-target-enforcement-planned-safety",
  "smoke:admin-users-phase10f-ephemeral-activation-simulation",
  "smoke:admin-users-phase9d-authenticated-no-lockout"
]) {
  assert(Boolean(scripts[name]), `script registered: ${name}`);
}

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
assert(registry.includes("Never-block safety route remains allowed to prevent administrator lockout."), "never-block diagnostic remains preserved");
assert(proxy.includes("isAdminRequestAuthorized(req)") && proxy.includes("adminPermissionEnforcementDecision"), "proxy remains auth-gated before permission decision");
assert(proxy.includes("/admin/permissions"), "blocked fallback remains permissions diagnostics");
assert(sessionRoute.includes("permissionsEnforced") && sessionRoute.includes("authenticated"), "session route remains rollback/auth diagnostic path");

assert(phase10b.includes("PHASE_10B_SOLE_USER_PRECONDITION=current sole configured user must retain full effective access before any activation"), "Phase 10B sole-user precondition remains locked");
assert(phase10e.includes("PHASE_10E_REQUIRED_LIVE_PROOF=sole DB user must be dbarshay15@gmail.com"), "Phase 10E live proof requirement remains locked");
assert(phase10f.includes("PHASE_10F_BOUNDARY=activation simulation is child-process-only and opt-in"), "Phase 10F remains child-process-only simulation");
assert(phase9dHarness.includes('request("/api/auth/session", { auth: true })'), "Phase 9D smoke retains authenticated session proof");
assert(phase10fHarness.includes('BARSH_ADMIN_PERMISSIONS_ENFORCEMENT: "1"'), "Phase 10F harness contains child-process-only activation simulation");
assert(phase10fHarness.includes("sole owner_admin must reach /admin/audit-history"), "Phase 10F harness preserves sole-user access requirement");

for (const fragment of [
  "Current locked state",
  "Required proofs before any persistent activation",
  "Persistent activation rule",
  "Immediate rollback rule",
  "Mandatory post-activation smoke",
  "Do not proceed if",
  "dbarshay15@gmail.com",
  "/admin/audit-history",
  "admin.auditHistory.view",
  "/api/auth/session",
  "/admin/permissions"
]) {
  assert(runbook.includes(fragment), `runbook contains required fragment: ${fragment}`);
}

for (const [name, value] of Object.entries(scripts)) {
  const text = String(value);
  if (name.startsWith("verify:")) {
    assert(!text.includes("smoke:admin-users-phase10f-ephemeral-activation-simulation"), `${name} does not auto-run Phase 10F smoke`);
    assert(!text.includes("smoke:admin-users-phase9d-authenticated-no-lockout"), `${name} does not auto-run Phase 9D smoke`);
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
  assert(!/^\s*BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\s*=\s*1\s*$/m.test(src), `source does not contain standalone enforcement env activation line: ${file}`);
}

console.log("PHASE_10G_PACKAGE=activation_and_rollback_runbook_locked");
console.log("PHASE_10G_CURRENT_STATE=first_target_planned_ephemeral_activation_passed_persistent_enforcement_disabled");
console.log("PHASE_10G_NEXT=final persistent activation only in a separate explicit phase with immediate smoke and rollback readiness");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 10G activation/rollback package is locked without persistent activation.");
