import fs from "fs";

const failures = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
const assert = (cond, msg) => {
  if (cond) console.log("PASS:", msg);
  else {
    console.log("FAIL:", msg);
    failures.push(msg);
  }
};

const pkg = JSON.parse(read("package.json"));
const registry = read("lib/adminPermissions.ts");
const proxy = read("proxy.ts");
const phase7a = read("scripts/verify-admin-users-phase7-activation-planning-readiness-safety.mjs");
const phase7b = read("scripts/verify-admin-users-phase7-first-target-planning-readiness-safety.mjs");
const phase7c = read("scripts/verify-admin-users-phase7-no-lockout-smoke-plan-readiness-safety.mjs");
const phase6 = read("scripts/verify-admin-users-phase6-completion-safety.mjs");
const phase5 = read("scripts/verify-admin-users-phase5-simulation-completion-safety.mjs");
const phase4Env = read("scripts/verify-admin-users-phase4-env-deployment-readiness-safety.mjs");
const auditPage = read("app/admin/audit-history/page.tsx");
const permissionsPage = read("app/admin/permissions/page.tsx");
const sessionRoute = read("app/api/auth/session/route.ts");
const permissionsApi = read("app/api/admin/permissions/route.ts");
const permissionCheck = read("app/api/admin/permissions/check/route.ts");

console.log("\nRESULT: admin users phase 7 completion safety verifier");

for (const [script, file] of [
  ["verify:admin-users-phase7-activation-planning-readiness-safety", "node scripts/verify-admin-users-phase7-activation-planning-readiness-safety.mjs"],
  ["verify:admin-users-phase7-first-target-planning-readiness-safety", "node scripts/verify-admin-users-phase7-first-target-planning-readiness-safety.mjs"],
  ["verify:admin-users-phase7-no-lockout-smoke-plan-readiness-safety", "node scripts/verify-admin-users-phase7-no-lockout-smoke-plan-readiness-safety.mjs"],
]) {
  assert(pkg.scripts && pkg.scripts[script] === file, "Phase 7 script registered: " + script);
}

assert(phase7a.includes("Phase 7A locks staged activation planning prerequisites"), "Phase 7A staged activation planning verifier remains intact");
assert(phase7b.includes("Recommended later first target is read-only /admin/audit-history"), "Phase 7B first-target planning verifier remains intact");
assert(phase7c.includes("future testing must use ephemeral env"), "Phase 7C no-lockout smoke plan verifier remains intact");
assert(phase6.includes("Phase 6 is complete"), "Phase 6 completion verifier remains available");
assert(phase5.includes("Phase 5D confirms Phase 5 enforcement simulation"), "Phase 5 simulation completion verifier remains available");
assert(phase4Env.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT") && phase4Env.includes("package.json") && phase4Env.includes("runtime source does not activate enforcement"), "Phase 4 env/deployment guard remains available");

assert(registry.includes("return String(process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT ?? \"\").trim() === \"1\""), "enforcement remains exact-match env gated");
assert(registry.includes("BARSH_ADMIN_PERMISSION_OVERRIDES_JSON") && registry.includes("parsed?.allow") && registry.includes("parsed?.block"), "override JSON allow/block planning contract remains available");
assert(registry.includes("enforcementPlanned: false") && !registry.includes("enforcementPlanned: true"), "no route has enforcementPlanned true after Phase 7");
assert(proxy.includes("permissionDecision.enforcementEnabled && permissionDecision.blocked"), "proxy future enforcement remains flag-gated");
assert(proxy.includes("blockedUrl.pathname = \"/admin/permissions\""), "blocked page fallback remains never-block permissions page");

for (const path of ["/admin", "/admin/permissions", "/api/admin/permissions", "/api/admin/permissions/check"]) {
  assert(registry.includes(path), "never-block route remains present after Phase 7: " + path);
}

assert(registry.includes("/admin/audit-history") && registry.includes("admin.auditHistory.view"), "Phase 7 first later target remains /admin/audit-history / admin.auditHistory.view");
assert(auditPage.includes("Read-only administrator view") && auditPage.includes("does not enable permission enforcement"), "first later target remains read-only/non-enforcing");
assert(permissionsPage.includes("No enforcement is active now") && permissionsPage.includes("Set BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1 only in a later enforcement phase"), "permissions page still discloses non-activation");
assert(sessionRoute.includes("permissionsEnforced: configuredAdminPermissionsEnforcementEnabled()"), "session diagnostics still expose enforcement status for rollback proof");
assert(permissionsApi.includes("routeDryRun: adminRoutePermissionDryRunDecisions()"), "permissions API still exposes route dry-run diagnostics");
assert(permissionCheck.includes("Read-only permission decision check. This endpoint does not enforce blocking."), "permission-check endpoint remains read-only diagnostic");

for (const file of [
  "lib/adminPermissions.ts",
  "proxy.ts",
  "app/api/auth/session/route.ts",
  "app/api/admin/permissions/route.ts",
  "app/api/admin/permissions/check/route.ts",
  "app/admin/permissions/page.tsx",
  "app/admin/audit-history/page.tsx",
]) {
  const src = read(file);
  assert(!/process[.]env[.]BARSH_ADMIN_PERMISSIONS_ENFORCEMENT[ \t]*=/.test(src), "runtime source does not assign enforcement flag: " + file);
}

assert(pkg.scripts && pkg.scripts["verify:admin-users-phase7-completion-safety"] === "node scripts/verify-admin-users-phase7-completion-safety.mjs", "package script registered for Phase 7D completion verifier");

if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error("-", f);
  process.exit(1);
}

console.log("\nPASS: Phase 7 is complete: staged activation planning, first-target planning, and no-lockout future smoke planning are locked while enforcement remains disabled and non-activating.");
