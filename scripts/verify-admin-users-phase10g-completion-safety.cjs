const fs = require("fs");

const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
function assert(condition, message) { if (!condition) failures.push(message); }

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
const phase10g = read("scripts/verify-admin-users-phase10g-activation-rollback-package-safety.cjs");
const runbook = read("docs/admin-users-permissions/phase10g-activation-rollback-runbook.md");
const registry = read("lib/adminPermissions.ts");

console.log("RESULT: admin users Phase 10G completion safety verifier");

for (const name of [
  "verify:admin-users-phase10g-activation-rollback-package-safety",
  "verify:admin-users-phase10g-completion-safety",
  "verify:admin-users-phase10f-ephemeral-activation-simulation-safety",
  "verify:admin-users-phase10e-activation-readiness-guardrails-safety"
]) {
  assert(Boolean(scripts[name]), `script registered: ${name}`);
}

assert(phase10g.includes("PHASE_10G_PACKAGE=activation_and_rollback_runbook_locked"), "Phase 10G package marker exists");
assert(runbook.includes("Immediate rollback rule"), "runbook includes rollback rule");
assert(runbook.includes("Mandatory post-activation smoke"), "runbook includes post-activation smoke");
assert(runbook.includes("Do not proceed if"), "runbook includes stop conditions");

const plannedMatches = [...registry.matchAll(/enforcementPlanned:\s*true/g)];
assert(plannedMatches.length === 1, "exactly one planned target remains");

for (const [name, value] of Object.entries(scripts)) {
  const text = String(value);
  if (name.startsWith("verify:")) assert(!text.includes("smoke:admin-users-phase10f-ephemeral-activation-simulation"), `${name} does not auto-run Phase 10F smoke`);
}

console.log("PHASE_10G_COMPLETE=activation_rollback_package_locked_no_activation");
console.log("PHASE_10G_CURRENT_STATE=ready_for_separate_explicit_activation_phase_only");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 10G is complete without persistent activation.");
