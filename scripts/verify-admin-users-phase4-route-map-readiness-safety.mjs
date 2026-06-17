import fs from "fs";

let failures = 0;
function pass(message) {
  console.log("PASS:", message);
}
function fail(message) {
  failures += 1;
  console.log("FAIL:", message);
}

const registryFile = "lib/adminPermissions.ts";
const packageFile = "package.json";
const registry = fs.readFileSync(registryFile, "utf8");
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));

const requiredRoutes = [
  "/api/admin/users/create",
  "/api/admin/users/assign-role",
  "/api/admin/users/remove-role",
  "/api/admin/users/permission-override",
];

if (registry.includes('key: "admin.users.manage"')) pass("admin.users.manage permission is defined");
else fail("admin.users.manage permission is defined");

for (const route of requiredRoutes) {
  if (registry.includes(`pattern: "${route}"`) && registry.includes('permission: "admin.users.manage"') && registry.includes('method: "POST"') && registry.includes("enforcementPlanned: false")) {
    pass(`${route} is mapped to admin.users.manage as POST with enforcementPlanned false`);
  } else {
    fail(`${route} is mapped to admin.users.manage as POST with enforcementPlanned false`);
  }
}

for (const forbidden of ["BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1", "process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT =", "enforcementPlanned: true"]) {
  if (registry.includes(forbidden)) fail(`registry must not activate enforcement; found ${forbidden}`);
  else pass(`registry does not activate enforcement via ${forbidden}`);
}

for (const required of ["ADMIN_PERMISSION_NEVER_BLOCK_PATTERNS", '"/admin"', '"/admin/permissions"', '"/api/admin/permissions"', '"/api/admin/permissions/check"', "isAdminPermissionNeverBlockPath"]) {
  if (registry.includes(required)) pass(`lockout safety fragment present: ${required}`);
  else fail(`lockout safety fragment present: ${required}`);
}

if (pkg.scripts?.["verify:admin-users-phase4-route-map-readiness-safety"] === "node scripts/verify-admin-users-phase4-route-map-readiness-safety.mjs") {
  pass("package script registered");
} else {
  fail("package script registered");
}

console.log("\nRESULT: admin users phase 4 route-map readiness safety verifier");
console.log(`FAILURES=${failures}`);
if (failures) process.exit(1);
console.log("PASS: Phase 4 maps guarded admin user write routes for readiness only, keeps enforcement non-activating, and preserves never-block lockout safety.");
