import fs from "node:fs";

const contract = fs.readFileSync("lib/adminUsersWriteContracts.ts", "utf8");
const page = fs.readFileSync("app/admin/users/page.tsx", "utf8");
const registry = fs.readFileSync("lib/adminPermissions.ts", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const failures = [];

for (const required of [
  "preview-only-no-active-routes",
  "admin-users-write-contract-preview",
  "activeWriteRoutes: false",
  "writesDatabase: false",
  "enablesEnforcement: false",
  "/api/admin/users/create-preview",
  "/api/admin/users/assign-role-preview",
  "/api/admin/users/remove-role-preview",
  "/api/admin/users/permission-override-preview",
  "/api/admin/users/enforcement-preview",
  "preserve at least one active bootstrapSafe owner_admin user",
  "never permit blocking /admin/permissions",
  "never-block routes must remain hardcoded",
]) {
  if (!contract.includes(required)) failures.push("write contract preview missing required fragment: " + required);
}

for (const forbidden of [
  "export async function POST",
  "export async function PATCH",
  "export async function PUT",
  "export async function DELETE",
  "prisma.adminUser.create",
  "prisma.adminUser.update",
  "prisma.adminUser.delete",
  "prisma.adminUserRole.create",
  "prisma.adminUserRole.delete",
  "process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT =",
  "BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1",
]) {
  if (contract.includes(forbidden) || page.includes(forbidden)) failures.push("write contract preview must not activate writes/enforcement: " + forbidden);
}

for (const forbiddenRoute of [
  'pattern: "/api/admin/users/create-preview"',
  'pattern: "/api/admin/users/assign-role-preview"',
  'pattern: "/api/admin/users/remove-role-preview"',
  'pattern: "/api/admin/users/permission-override-preview"',
  'pattern: "/api/admin/users/enforcement-preview"',
]) {
  if (registry.includes(forbiddenRoute)) failures.push("planned write preview route should not be active permission-mapped yet: " + forbiddenRoute);
}

if (pkg.scripts?.["verify:admin-users-write-contract-preview-safety"] !== "node scripts/verify-admin-users-write-contract-preview-safety.mjs") failures.push("package.json missing verify:admin-users-write-contract-preview-safety script");

console.log("RESULT: admin users write contract preview safety verifier");
if (failures.length) {
  console.log("FAILURES=" + failures.length);
  for (const failure of failures) console.log("FAIL=" + failure);
  process.exit(1);
}
console.log("FAILURES=0");
console.log("PASS: admin user/role write API contracts are documented as preview-only with no active write routes or enforcement.");
