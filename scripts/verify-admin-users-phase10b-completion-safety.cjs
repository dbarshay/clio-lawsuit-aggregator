const fs = require("fs");

const failures = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
function assert(condition, message) { if (!condition) failures.push(message); }

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
const phase10b = read("scripts/verify-admin-users-phase10b-first-target-enforcement-planned-safety.cjs");
const registry = read("lib/adminPermissions.ts");
const phase9dHarness = read("scripts/smoke-admin-users-phase9d-authenticated-no-lockout.cjs");

console.log("RESULT: admin users Phase 10B completion safety verifier");

for (const name of [
  "verify:admin-users-phase10b-first-target-enforcement-planned-safety",
  "verify:admin-users-phase10b-completion-safety",
  "verify:admin-users-phase10a-completion-safety",
  "smoke:admin-users-phase9d-authenticated-no-lockout"
]) {
  assert(Boolean(scripts[name]), `script registered: ${name}`);
}

assert(phase10b.includes("PHASE_10B_CHANGE=only first target is enforcementPlanned true"), "Phase 10B verifier records single-target planning change");
assert(phase10b.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT disabled"), "Phase 10B verifier records no activation");
assert(phase9dHarness.includes('request("/api/auth/session", { auth: true })'), "Phase 9D smoke remains strict-auth capable");

const trueMatches = [...registry.matchAll(/enforcementPlanned:\s*true/g)];
assert(trueMatches.length === 1, "exactly one enforcementPlanned true remains after Phase 10B");

for (const [name, value] of Object.entries(scripts)) {
  const text = String(value);
  assert(!text.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1"), `${name} does not persistently activate enforcement`);
  if (name.startsWith("verify:")) assert(!text.includes("smoke:admin-users-phase9d-authenticated-no-lockout"), `${name} does not auto-run Phase 9D smoke`);
}

console.log("PHASE_10B_COMPLETE=first_target_enforcement_planned_only_no_activation");
console.log("PHASE_10B_CURRENT_STATE=one_planned_target_enforcement_env_disabled_no_auto_smoke");
console.log("PHASE_10B_NEXT=run authenticated/no-lockout smoke with enforcement disabled, then guarded activation-readiness planning");

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: Phase 10B is complete: first target is enforcement-planned, enforcement remains disabled, no smoke auto-executes.");
