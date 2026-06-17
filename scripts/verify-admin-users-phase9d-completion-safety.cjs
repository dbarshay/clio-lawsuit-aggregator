const fs = require("fs");

const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
function assert(condition, message) { if (!condition) failures.push(message); }

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
const phase9d = read("scripts/verify-admin-users-phase9d-authenticated-no-lockout-smoke-harness-safety.cjs");
const phase9c = read("scripts/verify-admin-users-phase9c-opt-in-authenticated-no-lockout-smoke-readiness-safety.cjs");
const phase9b = read("scripts/verify-admin-users-phase9b-authenticated-no-lockout-smoke-readiness-safety.cjs");
const registry = read("lib/adminPermissions.ts");

console.log("RESULT: admin users Phase 9D completion safety verifier");

for (const name of [
  "verify:admin-users-phase9d-authenticated-no-lockout-smoke-harness-safety",
  "verify:admin-users-phase9d-completion-safety",
  "smoke:admin-users-phase9d-authenticated-no-lockout",
  "verify:admin-users-phase9c-opt-in-authenticated-no-lockout-smoke-readiness-safety",
  "verify:admin-users-phase9b-authenticated-no-lockout-smoke-readiness-safety",
  "verify:admin-users-phase9-auth-session-planning-safety"
]) {
  assert(Boolean(scripts[name]), `script registered: ${name}`);
}

assert(phase9d.includes("opt-in only") && phase9d.includes("normal verifiers do not execute it"), "Phase 9D safety verifier locks opt-in-only boundary");
assert(phase9c.includes("without activating enforcement"), "Phase 9C readiness remains non-activating");
assert(phase9b.includes("without activating enforcement"), "Phase 9B readiness remains non-activating");

const plannedMatches = [...registry.matchAll(/enforcementPlanned:\s*true/g)];
assert(plannedMatches.length <= 1, "registry has at most one enforcementPlanned true target after Phase 9D/10B");
if (plannedMatches.length === 1) {
  const pos = plannedMatches[0].index || 0;
  const start = registry.lastIndexOf("pattern:", pos);
  const endRaw = registry.indexOf("pattern:", pos + 1);
  const block = registry.slice(start, endRaw > 0 ? endRaw : registry.length);
  assert(block.includes('pattern: "/admin/audit-history"') && block.includes('permission: "admin.auditHistory.view"'), "the only enforcementPlanned true target is /admin/audit-history :: admin.auditHistory.view");
}

for (const [name, value] of Object.entries(scripts)) {
  const text = String(value);
  assert(!text.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1"), `${name} does not persistently activate enforcement`);
  if (name.startsWith("verify:")) {
    assert(!text.includes("smoke:admin-users-phase9d-authenticated-no-lockout"), `${name} does not execute Phase 9D smoke automatically`);
  }
}

console.log("PHASE_9D_COMPLETE=opt_in_authenticated_no_lockout_smoke_harness_registered_safety_verified");
console.log("PHASE_9D_CURRENT_STATE=enforcement_disabled_and_at_most_one_first_target_planned");
console.log("PHASE_9D_NEXT=manual opt-in smoke execution with authenticated cookie before any enforcement activation");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 9D is complete without activation and remains compatible with at most one planned first target.");
