import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const failures = [];
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";

const registry = read("lib/adminPermissions.ts");
const usersPage = read("app/admin/users/page.tsx");
const usersApi = read("app/api/admin/users/planning/route.ts");
const writeContracts = read("lib/adminUsersWriteContracts.ts");
const pkg = JSON.parse(read("package.json"));

for (const requiredFile of [
  "lib/adminUsersPlanning.ts",
  "lib/adminUsersWriteContracts.ts",
  "app/admin/users/page.tsx",
  "app/api/admin/users/planning/route.ts",
  "scripts/preview-admin-user-role-seed.mjs",
  "scripts/apply-admin-user-role-seed.mjs",
  "scripts/verify-admin-users-effective-permissions-readonly-safety.mjs",
  "scripts/verify-admin-users-write-contract-preview-safety.mjs",
]) {
  if (!fs.existsSync(requiredFile)) failures.push("missing Phase 2 file: " + requiredFile);
}

for (const required of [
  '"/admin"',
  '"/admin/permissions"',
  '"/api/admin/permissions"',
  '"/api/admin/permissions/check"',
]) {
  if (!registry.includes(required)) failures.push("missing never-block safety route fragment: " + required);
}

for (const required of [
  'data-barsh-admin-users-enforcement-banner="disabled"',
  'data-barsh-admin-users-effective-permissions="read-only"',
  'data-barsh-admin-users-write-controls-preview="read-only"',
  "Future Write Controls Preview",
  "Enforcement Disabled:",
]) {
  if (!usersPage.includes(required)) failures.push("users page missing Phase 2 completion fragment: " + required);
}

for (const required of [
  "db-preview-plus-planning",
  "databasePreview",
  "effectivePermissionKeys",
  "effectivePermissionCount",
  "role: { include: { permissions: true } }",
]) {
  if (!usersApi.includes(required)) failures.push("users planning API missing Phase 2 completion fragment: " + required);
}

for (const required of [
  "preview-only-no-active-routes",
  "activeWriteRoutes: false",
  "writesDatabase: false",
  "enablesEnforcement: false",
  "never-block routes must remain hardcoded",
]) {
  if (!writeContracts.includes(required)) failures.push("write contracts missing safe preview fragment: " + required);
}

for (const forbidden of [
  "BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1",
  "process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT =",
  "export async function POST",
  "export async function PATCH",
  "export async function PUT",
  "export async function DELETE",
]) {
  for (const [label, body] of [["usersPage", usersPage], ["usersApi", usersApi], ["writeContracts", writeContracts]]) {
    if (body.includes(forbidden)) failures.push(`${label} contains forbidden Phase 2 fragment: ${forbidden}`);
  }
}

const activeUsersApiRoutes = fs.existsSync("app/api/admin/users")
  ? fs.readdirSync("app/api/admin/users", { recursive: true }).map(String)
  : [];
const forbiddenActiveRouteParts = ["create-preview", "assign-role-preview", "remove-role-preview", "permission-override-preview", "enforcement-preview"];
for (const part of forbiddenActiveRouteParts) {
  if (activeUsersApiRoutes.some((entry) => entry.includes(part))) failures.push("planned write route should not exist yet: " + part);
}

for (const requiredScript of [
  "verify:admin-users-effective-permissions-readonly-safety",
  "verify:admin-users-write-contract-preview-safety",
  "verify:admin-users-write-controls-preview-safety",
  "verify:admin-user-role-seed-apply-guard-safety",
]) {
  if (!pkg.scripts?.[requiredScript]) failures.push("package.json missing Phase 2 script: " + requiredScript);
}

const sql = `
DO $$
DECLARE
  role_count integer;
  user_count integer;
  owner_perm_count integer;
  operations_perm_count integer;
  billing_perm_count integer;
  readonly_perm_count integer;
  owner_user_role_count integer;
  override_count integer;
BEGIN
  SELECT COUNT(*) INTO role_count FROM "AdminRole" WHERE "key" IN ('owner_admin','operations_admin','billing_admin','read_only_admin');
  IF role_count <> 4 THEN RAISE EXCEPTION 'Expected 4 seeded admin roles, got %', role_count; END IF;

  SELECT COUNT(*) INTO user_count FROM "AdminUser" WHERE "email" = 'dbarshay15@gmail.com' AND "bootstrapSafe" = true AND "status" = 'active';
  IF user_count <> 1 THEN RAISE EXCEPTION 'Expected 1 active bootstrap admin user, got %', user_count; END IF;

  SELECT COUNT(*) INTO owner_perm_count FROM "AdminRolePermission" rp JOIN "AdminRole" r ON r."id" = rp."roleId" WHERE r."key" = 'owner_admin';
  IF owner_perm_count <> 24 THEN RAISE EXCEPTION 'owner_admin expected 24 permissions, got %', owner_perm_count; END IF;

  SELECT COUNT(*) INTO operations_perm_count FROM "AdminRolePermission" rp JOIN "AdminRole" r ON r."id" = rp."roleId" WHERE r."key" = 'operations_admin';
  IF operations_perm_count <> 23 THEN RAISE EXCEPTION 'operations_admin expected 23 permissions, got %', operations_perm_count; END IF;

  SELECT COUNT(*) INTO billing_perm_count FROM "AdminRolePermission" rp JOIN "AdminRole" r ON r."id" = rp."roleId" WHERE r."key" = 'billing_admin';
  IF billing_perm_count <> 7 THEN RAISE EXCEPTION 'billing_admin expected 7 permissions, got %', billing_perm_count; END IF;

  SELECT COUNT(*) INTO readonly_perm_count FROM "AdminRolePermission" rp JOIN "AdminRole" r ON r."id" = rp."roleId" WHERE r."key" = 'read_only_admin';
  IF readonly_perm_count <> 14 THEN RAISE EXCEPTION 'read_only_admin expected 14 permissions, got %', readonly_perm_count; END IF;

  SELECT COUNT(*) INTO owner_user_role_count FROM "AdminUserRole" ur JOIN "AdminUser" u ON u."id" = ur."userId" JOIN "AdminRole" r ON r."id" = ur."roleId" WHERE u."email" = 'dbarshay15@gmail.com' AND r."key" = 'owner_admin';
  IF owner_user_role_count <> 1 THEN RAISE EXCEPTION 'bootstrap user missing owner_admin role assignment'; END IF;

  SELECT COUNT(*) INTO override_count FROM "AdminUserPermissionOverride";
  IF override_count <> 0 THEN RAISE EXCEPTION 'Expected 0 permission overrides in Phase 2, got %', override_count; END IF;
END $$;
`;

const sqlPath = path.join(os.tmpdir(), `barsh-phase2-completion-${Date.now()}.sql`);
fs.writeFileSync(sqlPath, sql);
const result = spawnSync("npx", ["prisma", "db", "execute", "--file", sqlPath], { encoding: "utf8" });
fs.rmSync(sqlPath, { force: true });

if (result.status !== 0) {
  failures.push("seeded admin DB assertion failed: " + (result.stderr || result.stdout || "").slice(0, 1000));
}

console.log("RESULT: admin users/auth/permissions Phase 2 completion safety verifier");
if (failures.length) {
  console.log("FAILURES=" + failures.length);
  for (const failure of failures) console.log("FAIL=" + failure);
  process.exit(1);
}
console.log("FAILURES=0");
console.log("PASS: Phase 2 admin users/auth/permissions foundation is complete, seeded, read-only-visible, lockout-safe, and enforcement remains disabled.");
