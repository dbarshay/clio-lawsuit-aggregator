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

const registry = read("lib/adminPermissions.ts");
const proxy = read("proxy.ts");
const auditPage = read("app/admin/audit-history/page.tsx");
const permissionsPage = read("app/admin/permissions/page.tsx");
const phase7a = read("scripts/verify-admin-users-phase7-activation-planning-readiness-safety.mjs");
const phase4Env = read("scripts/verify-admin-users-phase4-env-deployment-readiness-safety.mjs");
const pkg = JSON.parse(read("package.json"));

console.log("\nRESULT: admin users phase 7B first staged activation target planning readiness verifier");

assert(phase7a.includes("Phase 7A locks staged activation planning prerequisites"), "Phase 7A activation planning contract remains present");
assert(registry.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT") && registry.includes("configuredAdminPermissionsEnforcementEnabled") && registry.includes("trim()") && registry.includes("=== \"1\""), "enforcement remains exact-match BARSH_ADMIN_PERMISSIONS_ENFORCEMENT gated");
assert(proxy.includes("permissionDecision.enforcementEnabled && permissionDecision.blocked"), "proxy remains gated by enforcementEnabled and blocked decision");
assert(proxy.includes("blockedUrl.pathname") && proxy.includes("/admin/permissions"), "blocked page fallback remains /admin/permissions");

for (const path of ["/admin", "/admin/permissions", "/api/admin/permissions", "/api/admin/permissions/check"]) {
  assert(registry.includes(path), "never-block route remains registered: " + path);
}

assert(registry.includes("/admin/audit-history") && registry.includes("admin.auditHistory.view") && registry.includes("accessType") && registry.includes("page") && registry.includes("enforcementPlanned: false"), "recommended first staged page target remains mapped read-only and not planned active: /admin/audit-history");
assert(auditPage.includes("Read-only administrator view") && auditPage.includes("does not edit records") && auditPage.includes("does not enable permission enforcement"), "recommended first target page is explicitly read-only/non-enforcing");
assert(registry.includes("/api/admin/permissions/check") && registry.includes("GET") && registry.includes("enforcementPlanned: false"), "diagnostic permission-check API remains never-block/read-only candidate only");
assert(registry.includes("enforcementPlanned: false") && !registry.includes("enforcementPlanned: true"), "no route has enforcementPlanned true in Phase 7B");
assert(permissionsPage.includes("No enforcement is active now") && permissionsPage.includes("Set BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1 only in a later enforcement phase"), "permissions UI still discloses non-activation");
assert(phase4Env.includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT") && phase4Env.includes("package.json") && phase4Env.includes("runtime source does not activate enforcement"), "Phase 4 deployment/env activation guard remains present");

for (const file of ["lib/adminPermissions.ts", "proxy.ts", "app/api/auth/session/route.ts", "app/api/admin/permissions/route.ts", "app/api/admin/permissions/check/route.ts", "app/admin/permissions/page.tsx", "app/admin/audit-history/page.tsx"]) {
  const src = read(file);
  assert(!/process[.]env[.]BARSH_ADMIN_PERMISSIONS_ENFORCEMENT[ \t]*=/.test(src), "runtime source does not assign enforcement flag: " + file);
}

assert(pkg.scripts && pkg.scripts["verify:admin-users-phase7-first-target-planning-readiness-safety"] === "node scripts/verify-admin-users-phase7-first-target-planning-readiness-safety.mjs", "package script registered for Phase 7B verifier");

if (failures.length) {
  console.error("\nFAILURES:");
  for (const f of failures) console.error("-", f);
  process.exit(1);
}

console.log("\nPASS: Phase 7B locks first staged activation target planning as verifier-only. Recommended later first target is read-only /admin/audit-history, while all enforcement remains disabled and no enforcementPlanned route is activated.");
