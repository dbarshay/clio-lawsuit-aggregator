import fs from "node:fs";

const script = fs.readFileSync("scripts/preview-admin-user-role-seed.mjs", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const failures = [];

for (const required of [
  "admin-user-role-seed-preview",
  "preview-only",
  "local-source-registry",
  "writesDatabase: false",
  "createsUsers: false",
  "createsRoles: false",
  "changesEnforcement: false",
  "permissionRegistryCount",
  "planningSourceHasOwnerAdmin",
  "rolesWouldInsertIfDatabaseEmpty",
  "usersWouldInsertIfDatabaseEmpty",
  "would-insert-if-missing",
  "Preview only. This script does not connect to the database",
]) {
  if (!script.includes(required)) failures.push("seed preview script missing required fragment: " + required);
}

for (const forbidden of ["prisma.", "new PrismaClient", ".$disconnect", ".create(", ".update(", ".delete(", ".upsert(", ".createMany(", ".updateMany(", ".deleteMany(", "migrate deploy", "BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1"]) {
  if (script.includes(forbidden)) failures.push("seed preview script must not write/enforce; found forbidden fragment: " + forbidden);
}

if (pkg.scripts?.["preview:admin-user-role-seed"] !== "node scripts/preview-admin-user-role-seed.mjs") failures.push("package.json missing preview:admin-user-role-seed node script");
if (pkg.scripts?.["verify:admin-user-role-seed-preview-safety"] !== "node scripts/verify-admin-user-role-seed-preview-safety.mjs") failures.push("package.json missing verify:admin-user-role-seed-preview-safety script");

console.log("RESULT: admin user/role seed preview safety verifier");
if (failures.length) {
  console.log("FAILURES=" + failures.length);
  for (const failure of failures) console.log("FAIL=" + failure);
  process.exit(1);
}
console.log("FAILURES=0");
console.log("PASS: admin user/role seed preview is read-only and does not write users, roles, permissions, or enforcement.");
