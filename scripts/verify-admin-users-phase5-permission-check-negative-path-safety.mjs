import fs from "node:fs";

let failures = 0;
function pass(message) {
  console.log("PASS:", message);
}
function fail(message) {
  failures += 1;
  console.log("FAIL:", message);
}
function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}
function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

const checkRouteFile = "app/api/admin/permissions/check/route.ts";
const registryFile = "lib/adminpermissions.ts";
const proxyFile = "proxy.ts";
const packageFile = "package.json";
const phase5bVerifierFile = "scripts/verify-admin-users-phase5-enforcement-simulation-negative-path-safety.mjs";
const envDeploymentVerifierFile = "scripts/verify-admin-users-phase4-env-deployment-readiness-safety.mjs";

const checkRoute = read(checkRouteFile);
const registry = read(registryFile);
const proxy = read(proxyFile);
const phase5bVerifier = read(phase5bVerifierFile);
const pkg = JSON.parse(read(packageFile) || "{}");

assert(checkRoute.includes("safePath"), "permission-check endpoint sanitizes path input");
assert(checkRoute.includes("safeMethod"), "permission-check endpoint sanitizes method input");
assert(checkRoute.includes("adminPermissionEnforcementDecision(pathname, method)"), "permission-check endpoint uses central enforcement decision helper");
assert(checkRoute.includes("Read-only permission decision check. This endpoint does not enforce blocking."), "permission-check endpoint remains explicitly read-only");
assert(checkRoute.includes("admin-permission-check"), "permission-check endpoint emits read-only audit/action diagnostic");
assert(checkRoute.includes("admin-permission-check-blocked"), "permission-check endpoint has diagnostic blocked branch");
assert(checkRoute.includes("decision.enforcementEnabled && decision.blocked"), "permission-check endpoint blocked branch remains gated by enforcement decision");
assert(checkRoute.includes("Permission check target is blocked by current admin permission overrides."), "permission-check endpoint exposes blocked diagnostic message only when simulated/enabled decision blocks");

assert(registry.includes("adminPermissionEnforcementDecision"), "registry still exposes central enforcement decision helper");
assert(registry.includes("Never-block safety route remains allowed to prevent administrator lockout."), "registry preserves never-block decision reason");
assert(registry.includes("Enforcement disabled; route would be blocked if enforcement were enabled."), "registry preserves dry-run blocked reason");
assert(registry.includes("No permission mapping matched; default allow until explicit mapping is added."), "registry preserves unmatched default-allow reason");

for (const route of ["/admin/permissions", "/api/admin/permissions", "/api/admin/permissions/check"]) {
  assert(registry.includes(`"${route}"`), `${route} remains present for lockout safety`);
}

for (const route of ["/api/admin/users/create", "/api/admin/users/assign-role", "/api/admin/users/remove-role", "/api/admin/users/permission-override"]) {
  const idx = registry.indexOf(`pattern: "${route}"`);
  const window = idx >= 0 ? registry.slice(idx, idx + 260) : "";
  assert(window.includes('permission: "admin.users.manage"') && window.includes('method: "POST"') && window.includes("enforcementPlanned: false"), `${route} remains mapped to admin.users.manage POST with enforcementPlanned false`);
}

assert(phase5bVerifier.includes('process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT = "1"'), "Phase 5B verifier keeps temporary process-env simulation only inside verifier");
assert(phase5bVerifier.includes("verifier restores BARSH_ADMIN_PERMISSIONS_ENFORCEMENT after simulation"), "Phase 5B verifier restores enforcement flag after simulation");
assert(phase5bVerifier.includes("temporary simulation blocks all four guarded admin users manage write routes"), "Phase 5B verifier proves guarded write negative paths");
assert(phase5bVerifier.includes("never-block permission check API remains allowed during simulated enforcement"), "Phase 5B verifier proves permission-check never-block safety during simulated enforcement");

assert(proxy.includes("permissionDecision.enforcementEnabled && permissionDecision.blocked"), "proxy remains future-gated by enforcementEnabled and blocked");
assert(proxy.includes('blockedUrl.pathname = "/admin/permissions"'), "blocked admin pages still redirect to never-block permissions page");
assert(read(envDeploymentVerifierFile).includes("/BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\\s*=\\s*1/"), "Phase 4 env/deployment verifier remains activation guard");

const runtimeSources = [registryFile, proxyFile, "app/api/auth/session/route.ts", "app/api/admin/permissions/route.ts", checkRouteFile, packageFile].map((file) => `${file}\n${read(file)}`).join("\n");
for (const forbidden of ["process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT =", "enforcementPlanned: true"]) {
  assert(!runtimeSources.includes(forbidden), `runtime/config sources do not contain activation fragment: ${forbidden}`);
}

assert(pkg.scripts?.["verify:admin-users-phase5-enforcement-simulation-negative-path-safety"] === "node scripts/verify-admin-users-phase5-enforcement-simulation-negative-path-safety.mjs", "Phase 5B verifier script remains registered");
assert(pkg.scripts?.["verify:admin-users-phase5-permission-check-negative-path-safety"] === "node scripts/verify-admin-users-phase5-permission-check-negative-path-safety.mjs", "Phase 5C verifier script is registered");

console.log("\nRESULT: admin users phase 5 permission-check negative-path safety verifier");
console.log(`FAILURES=${failures}`);
if (failures) process.exit(1);
console.log("PASS: Phase 5C locks the permission-check diagnostic endpoint contract for negative-path testing while preserving read-only behavior, never-block safety, and non-activating enforcement.");
