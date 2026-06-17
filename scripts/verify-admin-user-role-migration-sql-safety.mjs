import fs from "node:fs";

const path = "prisma/migrations/20260617130000_add_admin_user_role_tables/migration.sql";
const sql = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const failures = [];

if (!sql) failures.push("admin user/role migration SQL missing");

for (const required of [
  'CREATE TABLE "AdminUser"',
  'CREATE TABLE "AdminRole"',
  'CREATE TABLE "AdminRolePermission"',
  'CREATE TABLE "AdminUserRole"',
  'CREATE TABLE "AdminUserPermissionOverride"',
  'CREATE UNIQUE INDEX "AdminUser_email_key"',
  'CREATE UNIQUE INDEX "AdminRole_key_key"',
  'CREATE UNIQUE INDEX "AdminRolePermission_roleId_permissionKey_key"',
  'CREATE UNIQUE INDEX "AdminUserRole_userId_roleId_key"',
  'CREATE UNIQUE INDEX "AdminUserPermissionOverride_userId_permissionKey_key"',
  'ADD CONSTRAINT "AdminRolePermission_roleId_fkey"',
  'ADD CONSTRAINT "AdminUserRole_userId_fkey"',
  'ADD CONSTRAINT "AdminUserRole_roleId_fkey"',
  'ADD CONSTRAINT "AdminUserPermissionOverride_userId_fkey"',
  'ON DELETE CASCADE',
  'ON UPDATE CASCADE',
]) {
  if (!sql.includes(required)) failures.push("migration SQL missing required fragment: " + required);
}

const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
for (const [index, statement] of statements.entries()) {
  const compact = statement.replace(/\s+/g, " ").trim();
  if (/^(DROP|TRUNCATE|DELETE\s+FROM|UPDATE)\b/i.test(compact)) failures.push(`destructive/data-changing SQL statement ${index + 1}: ${compact}`);
  if (/^ALTER\s+TABLE\b.*\bDROP\b/i.test(compact)) failures.push(`destructive ALTER TABLE statement ${index + 1}: ${compact}`);
}

console.log("RESULT: admin user/role migration SQL safety verifier");
if (failures.length) {
  console.log("FAILURES=" + failures.length);
  for (const failure of failures) console.log("FAIL=" + failure);
  process.exit(1);
}
console.log("FAILURES=0");
console.log("PASS: admin user/role migration SQL is additive and contains expected tables, indexes, and foreign keys.");
