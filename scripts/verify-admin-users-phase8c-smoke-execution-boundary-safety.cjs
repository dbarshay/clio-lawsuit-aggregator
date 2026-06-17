#!/usr/bin/env node
const fs = require("fs");

let failures = 0;
function read(file) { try { return fs.readFileSync(file, "utf8"); } catch { return ""; } }
function pass(message) { console.log("PASS: " + message); }
function fail(message) { failures += 1; console.error("FAIL: " + message); }
function assert(condition, message) { condition ? pass(message) : fail(message); }

console.log("");
console.log("RESULT: admin users phase 8C smoke execution boundary safety verifier");

const registry = read("lib/adminPermissions.ts");
const harness = read("scripts/smoke-admin-users-phase8-ephemeral-audit-history.cjs");
const safety = read("scripts/verify-admin-users-phase8-ephemeral-smoke-harness-safety.cjs");
const pkg = JSON.parse(read("package.json") || "{}");
const scripts = pkg.scripts || {};

assert(scripts["smoke:admin-users-phase8-ephemeral-audit-history"] === "node scripts/smoke-admin-users-phase8-ephemeral-audit-history.cjs", "opt-in Phase 8B smoke harness remains registered");
assert(scripts["verify:admin-users-phase8c-smoke-execution-boundary-safety"] === "node scripts/verify-admin-users-phase8c-smoke-execution-boundary-safety.cjs", "Phase 8C boundary verifier is registered");
assert(!Object.entries(scripts).some(([key, value]) => key.startsWith("verify:") && String(value).includes("smoke-admin-users-phase8-ephemeral-audit-history")), "normal verifier scripts still do not execute the opt-in smoke harness");
assert(!Object.values(scripts).some((value) => String(value).includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1")), "package scripts do not persistently activate enforcement");

assert(registry.includes("/admin/audit-history") && registry.includes("admin.auditHistory.view"), "first staged target remains mapped to admin.auditHistory.view");
assert(registry.includes("/admin/audit-history") && registry.includes("enforcementPlanned: false"), "/admin/audit-history remains enforcementPlanned=false before activation");
assert(!registry.includes("enforcementPlanned: true"), "no route has enforcementPlanned=true in Phase 8C");

assert(harness.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT: \"1\""), "smoke harness uses enforcement only in child process env");
assert(harness.includes("BARSH_ADMIN_PERMISSION_OVERRIDES_JSON: BLOCK_OVERRIDE"), "smoke harness uses override JSON only in child process env");
assert(harness.includes("admin.auditHistory.view"), "smoke harness targets audit-history permission");
assert(harness.includes("/admin/audit-history"), "smoke harness targets audit-history route");
assert(harness.includes("/api/auth/session"), "smoke harness includes rollback/session diagnostic");
assert(harness.includes("child.kill(\"SIGTERM\")") && harness.includes("child.kill(\"SIGKILL\")"), "smoke harness contains child-process cleanup");

assert(safety.includes("normal verifier scripts do not execute the ephemeral smoke harness"), "Phase 8B safety verifier preserves opt-in-only execution boundary");
assert(safety.includes("runtime source does not set enforcementPlanned=true"), "Phase 8B safety verifier guards against runtime activation");

for (const file of [".env", ".env.local", ".env.production", ".env.development", ".vercel/project.json"]) {
  const text = read(file);
  if (!text) { pass(file + " absent or unreadable for persistent activation scan"); continue; }
  assert(!/BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\s*=\s*1/.test(text), file + " does not set BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1");
  assert(!/BARSH_ADMIN_PERMISSION_OVERRIDES_JSON\s*=/.test(text), file + " does not persist BARSH_ADMIN_PERMISSION_OVERRIDES_JSON");
  assert(!/enforcementPlanned\s*[:=]\s*true/.test(text), file + " does not persist enforcementPlanned=true");
}

console.log("");
console.log("PHASE_8C_BOUNDARY=OPT_IN_SMOKE_CANNOT_PROVE_BLOCKED_PAGE_UNTIL_FIRST_TARGET_ENFORCEMENT_PLANNED_TRUE");
console.log("PHASE_8C_CURRENT_TARGET=/admin/audit-history");
console.log("PHASE_8C_CURRENT_PERMISSION=admin.auditHistory.view");
console.log("PHASE_8C_CURRENT_STATE=enforcementPlanned_false_and_enforcement_disabled");
console.log("PHASE_8C_NEXT=before any later activation, add an authenticated/no-lockout smoke path or a deliberate first-target enforcementPlanned change in a guarded phase");

if (failures) { console.error(""); console.error("FAILURES=" + failures); console.error("RESULT: admin users phase 8C smoke execution boundary safety verifier FAILED"); process.exit(1); }
console.log("");
console.log("FAILURES=0");
console.log("PASS: Phase 8C locks the smoke execution boundary without activating enforcement or setting enforcementPlanned=true.");
