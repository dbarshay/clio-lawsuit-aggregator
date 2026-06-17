#!/usr/bin/env node
const fs = require("fs");

let failures = 0;
function read(file) { try { return fs.readFileSync(file, "utf8"); } catch { return ""; } }
function pass(message) { console.log("PASS: " + message); }
function fail(message) { failures += 1; console.error("FAIL: " + message); }
function assert(condition, message) { condition ? pass(message) : fail(message); }

console.log("");
console.log("RESULT: admin users phase 8 completion safety verifier");

const pkg = JSON.parse(read("package.json") || "{}");
const scripts = pkg.scripts || {};
const registry = read("lib/adminPermissions.ts");
const harness = read("scripts/smoke-admin-users-phase8-ephemeral-audit-history.cjs");
const phase8A = read("scripts/verify-admin-users-phase8-ephemeral-smoke-harness-readiness-safety.cjs");
const phase8B = read("scripts/verify-admin-users-phase8-ephemeral-smoke-harness-safety.cjs");
const phase8C = read("scripts/verify-admin-users-phase8c-smoke-execution-boundary-safety.cjs");

const requiredScripts = {
  "verify:admin-users-phase8-ephemeral-smoke-harness-readiness-safety": "node scripts/verify-admin-users-phase8-ephemeral-smoke-harness-readiness-safety.cjs",
  "smoke:admin-users-phase8-ephemeral-audit-history": "node scripts/smoke-admin-users-phase8-ephemeral-audit-history.cjs",
  "verify:admin-users-phase8-ephemeral-smoke-harness-safety": "node scripts/verify-admin-users-phase8-ephemeral-smoke-harness-safety.cjs",
  "verify:admin-users-phase8c-smoke-execution-boundary-safety": "node scripts/verify-admin-users-phase8c-smoke-execution-boundary-safety.cjs",
  "verify:admin-users-phase8-completion-safety": "node scripts/verify-admin-users-phase8-completion-safety.cjs"
};
for (const [key, expected] of Object.entries(requiredScripts)) assert(scripts[key] === expected, "Phase 8 script registered: " + key);

assert(phase8A.includes("PHASE_8A_DECISION=EXECUTABLE_EPHEMERAL_HARNESS_RECOMMENDED"), "Phase 8A readiness verifier remains intact");
assert(phase8B.includes("opt-in executable ephemeral smoke harness") && phase8B.includes("normal verifier scripts do not execute"), "Phase 8B opt-in harness safety verifier remains intact");
assert(phase8C.includes("PHASE_8C_BOUNDARY=OPT_IN_SMOKE_CANNOT_PROVE_BLOCKED_PAGE_UNTIL_FIRST_TARGET_ENFORCEMENT_PLANNED_TRUE"), "Phase 8C smoke execution boundary verifier remains intact");

assert(harness.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT: \"1\""), "opt-in harness sets enforcement only in child-process env object");
assert(harness.includes("BARSH_ADMIN_PERMISSION_OVERRIDES_JSON: BLOCK_OVERRIDE"), "opt-in harness sets override only in child-process env object");
assert(harness.includes("child.kill(\"SIGTERM\")") && harness.includes("child.kill(\"SIGKILL\")"), "opt-in harness retains child process cleanup");
assert(harness.includes("/api/auth/session") && harness.includes("rollback proof"), "opt-in harness retains rollback/session proof language");
assert(harness.includes("/admin/audit-history") && harness.includes("admin.auditHistory.view"), "opt-in harness targets planned audit-history permission route");

assert(registry.includes("/admin/audit-history") && registry.includes("admin.auditHistory.view"), "first target mapping remains /admin/audit-history / admin.auditHistory.view");
assert(registry.includes("/admin/audit-history") && registry.includes("enforcementPlanned: false"), "first target remains enforcementPlanned=false after Phase 8");
assert(!registry.includes("enforcementPlanned: true"), "no route has enforcementPlanned=true after Phase 8");

assert(!Object.entries(scripts).some(([key, value]) => key.startsWith("verify:") && String(value).includes("smoke-admin-users-phase8-ephemeral-audit-history")), "normal verify scripts still do not run opt-in smoke harness");
assert(!Object.values(scripts).some((value) => String(value).includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1")), "package scripts do not persistently activate permissions enforcement");

for (const file of [".env", ".env.local", ".env.production", ".env.development", ".vercel/project.json"]) {
  const text = read(file);
  if (!text) { pass(file + " absent or unreadable for persistent activation scan"); continue; }
  assert(!/BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\s*=\s*1/.test(text), file + " does not set BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1");
  assert(!/BARSH_ADMIN_PERMISSION_OVERRIDES_JSON\s*=/.test(text), file + " does not persist BARSH_ADMIN_PERMISSION_OVERRIDES_JSON");
  assert(!/enforcementPlanned\s*[:=]\s*true/.test(text), file + " does not persist enforcementPlanned=true");
}

console.log("");
console.log("PHASE_8_COMPLETE=non_activating_ephemeral_smoke_harness_planning_locked");
console.log("PHASE_8_LOCKED_COMPONENTS=8A_readiness,8B_opt_in_harness,8C_execution_boundary");
console.log("PHASE_8_CURRENT_TARGET=/admin/audit-history");
console.log("PHASE_8_CURRENT_PERMISSION=admin.auditHistory.view");
console.log("PHASE_8_CURRENT_STATE=enforcement_disabled_and_enforcementPlanned_false");
console.log("PHASE_8_NEXT=authenticated_no_lockout_smoke_or_guarded_first_target_enforcementPlanned_phase_before_any_activation");

if (failures) { console.error(""); console.error("FAILURES=" + failures); console.error("RESULT: admin users phase 8 completion safety verifier FAILED"); process.exit(1); }
console.log("");
console.log("FAILURES=0");
console.log("PASS: Phase 8 is complete without persistent activation, without enforcementPlanned=true, and with opt-in smoke boundaries locked.");
