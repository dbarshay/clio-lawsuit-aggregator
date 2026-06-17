#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function pass(name) {
  console.log(`PASS: ${name}`);
}
function fail(name, detail) {
  console.error(`FAIL: ${name}`);
  if (detail) console.error(detail);
  process.exitCode = 1;
}
function assert(name, condition, detail) {
  if (condition) pass(name);
  else fail(name, detail);
}
function includes(file, needle) {
  return read(file).includes(needle);
}
function matches(file, regex) {
  return regex.test(read(file));
}

console.log("RUN: Phase 12B auth identity planning safety verifier");
console.log("Verifier-only: no database writes, no source mutation, no enforcement changes.");

const adminAuth = read("lib/adminAuth.ts");
const login = read("app/api/auth/login/route.ts");
const session = read("app/api/auth/session/route.ts");
const authorize = read("app/api/admin/authorize/route.ts");
const perms = read("lib/adminPermissions.ts");
const planning = read("app/api/admin/users/planning/route.ts");
const usersPage = read("app/admin/users/page.tsx");
const schema = read("prisma/schema.prisma");

assert("generic cookie name remains barsh_admin_gate", adminAuth.includes('ADMIN_COOKIE_NAME = "barsh_admin_gate"'));
assert("current authorization is token-cookie equality only", adminAuth.includes("actualToken === expectedToken"));
assert("cookie currently stores configured session token only", adminAuth.includes("response.cookies.set(ADMIN_COOKIE_NAME, sessionToken"));
assert("login route remains password-only", login.includes("const password = cleanAdminAuthValue(body?.password)") && !/body\?.\(email|adminEmail|userEmail)/.test(login));
assert("login response remains generic Administrator identity", login.includes('displayName: "Administrator"') && login.includes('role: "admin"'));
assert("session route currently returns generic Administrator identity", session.includes('displayName: "Administrator"') && session.includes('permissionsMode: "default-admin-allow-all"'));
assert("session route currently grants all permissions to any authenticated generic admin session", session.includes("const permissions = authenticated ? allAdminPermissionKeys() : []"));
assert("session route does not yet resolve AdminUser.email from database", !/prisma\.adminUser|adminUser\.find/.test(session));
assert("authorize route also sets only generic admin gate cookie", authorize.includes("setAdminGateCookie(response)") && !/body\?.\(email|adminEmail|userEmail)/.test(authorize));
assert("never-block admin paths remain hardcoded", perms.includes('"/admin"') && perms.includes('"/admin/permissions"') && perms.includes('"/api/admin/permissions"') && perms.includes('"/api/admin/permissions/check"'));
assert("admin permission check endpoint remains never-block listed", perms.includes('{ pattern: "/api/admin/permissions/check"'));
assert("Admin Users planning endpoint reads db users but does not write", planning.includes("prisma.adminUser.findMany") && !/\.create\+|\.update\+|\.delete\+|\$transaction/.test(planning));
assert("Admin Users UI still requires explicit actor email fields", usersPage.includes("data-barsh-admin-users-create-actor-email") && usersPage.includes("data-barsh-admin-users-assign-actor-email") && usersPage.includes("data-barsh-admin-users-remove-actor-email") && usersPage.includes("data-barsh-admin-users-override-actor-email"));
assert("AdminUser schema exists", /model\o+AdminUser\s+\{/.test(schema));
assert("AdminRole schema exists", /model\s+AdminRole\s+\{/.test(schema));
assert("AdminUserRole schema exists", /model\s+AdminUserRole\s+\{/.test(schema));
assert("AdminUserPermissionOverride schema exists", /model\s+AdminUserPermissionOverride\s+\{/.test(schema));

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const owner = await prisma.adminUser.findUnique({
      where: { email: "dbarshay15@gmail.com" },
      include: { roles: { include: { role: { include: { permissions: true } } } }, permissionOverrides: true },
    });
    const jane = await prisma.adminUser.findUnique({
      where: { email: "jane.doe.limited@example.com" },
      include: { roles: { include: { role: { include: { permissions: true } } } }, permissionOverrides: true },
    });

    const ownerRoles = (owner?.roles || []).map((entry) => entry.role?.key).sort();
    const janeRoles = (jane?.roles || []).map((entry) => entry.role?.key).sort();

    assert("owner admin user exists", !!owner);
    assert("owner admin remains active", owner?.status === "active");
    assert("owner admin remains bootstrapSafe", owner?.bootstrapSafe === true);
    assert("owner admin retains owner_admin role", ownerRoles.includes("owner_admin"));
    assert("Jane Doe limited user exists", !!jane);
    assert("Jane Doe remains active test user", jane?.status === "active");
    assert("Jane Doe is not bootstrapSafe", jane?.bootstrapSafe === false);
    assert("Jane Doe has read_only_admin role", janeRoles.includes("read_only_admin"));
    assert("Jane Doe does not have owner_admin role", !janeRoles.includes("owner_admin"));

    console.log("CONTRACT: Phase 12 implementation must not enforce Jane Doe limitations until authenticated session identity includes AdminUser.email.");
    console.log("CONTRACT: Missing session email must preserve current owner-safe generic admin behavior until explicit owner identity login is proven.");
    console.log("CONTRACT: /admin, /admin/permissions, /api/admin/permissions, and /api/admin/permissions/check must remain owner/admin reachable.");
    console.log("CONTRACT: Phase 12C should add passive identity helpers/session diagnostics before any blocking behavior changes.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("FAIL: verifier crashed");
  console.error(error);
  process.exit(1);
}).finally(() => {
  if (process.exitCode) process.exit(process.exitCode);
});
