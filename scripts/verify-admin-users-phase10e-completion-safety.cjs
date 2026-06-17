const fs = require("fs");

const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
function assert(condition, message) { if (!condition) failures.push(message); }

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
const phase10e = read("scripts/verify-admin-users-phase10e-activation-readiness-guardrails-safety.cjs");
const registry = read("lib/adminPermissions.ts");

console.log("RESULT: admin users Phase 10E completion safety verifier");

for (const name of [
  "verify:admin-users-phase10e-activation-readiness-guardrails-safety",
  "verify:admin-users-phase10e-completion-safety",
  "verify:admin-users-phase10b-first-target-enforcement-planned-safety",
  "verify:admin-users-phase10b-completion-safety",
  "smoke:admin-users-phase9d-authenticated-no-lockout"
]) {
  assert(Boolean(scripts[name]), `script registered: ${name}`);
}

assert(phase10e.includes("PHASE_10E_REQUIRED_LIVE_PROOF=sole DB user must be dbarshay15@gmail.com"), "Phase 10E records sole-user DB proof requirement");
assert(phase10e.includes("PHASE_10E_REQUIRED_SMOKE=authenticated/no-lockout smoke must pass after any later activation attempt"), "Phase 10E records required post-activation smoke");
assert(phase10e.includes("do not persist BARSH_ADMIN_PERMISSIONS_ENFORCEMENT yet"), "Phase 10E preserves non-activation boundary");

const plannedMatches = [...registry.matchAll(/enforcementPlanned:\s*true/g)];
assert(plannedMatches.length === 1, "exactly one planned target remains");

for (const [name, value] of Object.entries(scripts)) {
  const text = String(value);
  assert(!text.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1"), `${name} does not persistently activate enforcement`);
  if (name.startsWith("verify:")) assert(!text.includes("smoke:admin-users-phase9d-authenticated-no-lockout"), `${name} does not auto-run Phase 9D smoke`);
}

console.log("PHASE_10E_COMPLETE=activation_readiness_guardrails_locked_no_activation");
console.log("PHASE_10E_CURRENT_STATE=sole_user_full_access_proven_externally_first_target_planned_env_disabled");
console.log("PHASE_10E_NEXT=guarded ephemeral activation simulation only");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 10E is complete without activation and without automatic smoke execution.");
