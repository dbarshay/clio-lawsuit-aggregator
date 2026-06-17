import fs from "node:fs";

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const failures = [];

for (const model of ["AdminUser", "AdminRole", "AdminRolePermission", "AdminUserRole", "AdminUserPermissionOverride"]) {
  if (!schema.includes(`model ${model} {`)) failures.push(`missing Prisma model ${model}`);
}

for (const required of [
  "email         String   @unique",
  "bootstrapSafe Boolean  @default(false)",
  "key         String   @unique",
  "permissionKey String",
  "action        String",
  "@@unique([roleId, permissionKey])",
  "@@unique([userId, roleId])",
  "@@unique([userId, permissionKey])",
  "onDelete: Cascade",
]) {
  if (!schema.includes(required)) failures.push(`schema missing required admin user/role foundation fragment: ${required}`);
}

const forbiddenRuntimeWiring = [
  "AdminUserPermissionOverride.find",
  "adminUserPermissionOverride.find",
  "adminRolePermission.find",
];

for (const file of ["lib/adminPermissions.ts", "app/api/auth/session/route.ts", "proxy.ts"]) {
  if (!fs.existsSync(file)) continue;
  const body = fs.readFileSync(file, "utf8");
  for (const forbidden of forbiddenRuntimeWiring) {
    if (body.includes(forbidden)) failures.push(`${file} should not read persisted admin permission tables yet: ${forbidden}`);
  }
}

console.log("RESULT: admin user/role Prisma schema foundation safety verifier");
if (failures.length) {
  console.log("FAILURES=" + failures.length);
  for (const failure of failures) console.log("FAIL=" + failure);
  process.exit(1);
}
console.log("FAILURES=0");
console.log("PASS: admin user/role Prisma schema foundation exists without runtime enforcement wiring.");
