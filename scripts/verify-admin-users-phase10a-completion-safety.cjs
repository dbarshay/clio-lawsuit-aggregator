const fs = require("fs");

const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
function assert(condition, message) { if (!condition) failures.push(message); }

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
const phase10a = read("scripts/verify-admin-users-phase10a-first-target-enforcement-planning-readiness-safety.cjs");
const phase9d = read("scripts/verify-admin-users-phase9d-completion-safety.cjs");
const phase9dHarness = read("scripts/smoke-admin-users-phase9d-authenticated-no-lockout.cjs");
const registry = read("lib/adminPermissions.ts");

console.log("RESULT: admin users Phase 10A completion safety verifier");

for (const name of [
  "verify:admin-users-phase10a-first-target-enforcement-planning-readiness-safety",
  "verify:admin-users-phase10a-completion-safety",
  "verify:admin-users-phase9d-completion-safety",
  "verify:admin-users-phase9d-authenticated-no-lockout-smoke-harness-safety",
  "smoke:admin-users-phase9d-authenticated-no-lockout"
]) {
  assert(Boolean(scripts[name]), `script registered: ${name}`);
}

assert(phase10a.includes("PHASE_10A_FIRST_TARGET=/admin/audit-history :: admin.auditHistory.view"), "Phase 10A declares the single first target");
assert(phase10a.includes("verifier-only; enforcement disabled; no route changed to enforcement-planned"), "Phase 10A declares verifier-only non-activation boundary");
assert(phase10a.includes("owner_admin/bootstrap preservation"), "Phase 10A includes owner_admin/bootstrap preconditions");
assert(phase9d.includes("PHASE_9D_COMPLETE=opt_in_authenticated_no_lockout_smoke_harness_registered_safety_verified"), "Phase 9D completion remains available");
assert(phase9dHarness.includes('request("/api/auth/session", { auth: true })'), "Phase 9D harness retains authenticated session-cookie proof");
assert(registry.includes('enforcementPlanned: false') && !registry.includes('enforcementPlanned: true'), "registry remains unchanged with enforcementPlanned false after Phase 10A");

for (const [name, value] of Object.entries(scripts)) {
  const text = String(value);
  assert(!text.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1"), `${name} does not persistently activate enforcement`);
  if (name.startsWith("verify:")) assert(!text.includes("smoke:admin-users-phase9d-authenticated-no-lockout"), `${name} does not auto-run Phase 9D smoke`);
}

console.log("PHASE_10A_COMPLETE=guarded_first_target_enforcement_planning_readiness_locked");
console.log("PHASE_10A_CURRENT_STATE=enforcement_disabled_no_enforcementPlanned_true_no_auto_smoke");
console.log("PHASE_10A_NEXT=guarded source-change phase for only /admin/audit-history enforcement-planned readiness, still no BARSH_ADMIN_PERMISSIONS_ENFORCEMENT activation");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 10A is complete without activation, without enforcementPlanned=true, and without automatic smoke execution.");
