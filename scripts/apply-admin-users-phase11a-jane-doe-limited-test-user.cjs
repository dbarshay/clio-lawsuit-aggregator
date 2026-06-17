const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile(envPath, override = false) {
  if (!envPath || !fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (key && (override || process.env[key] === undefined || process.env[key] === "")) process.env[key] = value;
  }
}

function loadLocalEnv() {
  loadEnvFile(path.join(process.cwd(), ".env.local"), false);
  loadEnvFile(process.env.PHASE11A_ENV_FILE, true);
}

function withSsl(url) {
  if (!url) return null;
  return /sslmode=/.test(url) ? url : url + (url.includes("?") ? "&" : "?") + "sslmode=require";
}

function builtPostgresUrl({ user, password, host, database }) {
  if (!user || !password || !host || !database) return null;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(database)}?sslmode=require`;
}

function postgresConnectionCandidates() {
  return [
    process.env.PHASE11A_DATABASE_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    builtPostgresUrl({ user: process.env.POSTGRES_PGUSER, password: process.env.POSTGRES_PGPASSWORD, host: process.env.POSTGRES_PGHOST_UNPOOLED, database: process.env.POSTGRES_PGDATABASE }),
    builtPostgresUrl({ user: process.env.POSTGRES_PGUSER, password: process.env.POSTGRES_PGPASSWORD, host: process.env.POSTGRES_PGHOST, database: process.env.POSTGRES_PGDATABASE }),
    builtPostgresUrl({ user: process.env.POSTGRES_USER, password: process.env.POSTGRES_PASSWORD, host: process.env.POSTGRES_HOST, database: process.env.POSTGRES_DATABASE }),
    withSsl(process.env.POSTGRES_URL_NO_SSL)
  ].filter(Boolean);
}

loadLocalEnv();

function createPrismaClient() {
  if (process.env.PRISMA_ACCELERATE_URL) {
    return new PrismaClient({ accelerateUrl: process.env.PRISMA_ACCELERATE_URL });
  }
  const candidates = postgresConnectionCandidates();
  if (!candidates.length) throw new Error("Phase 11A DB proof requires a usable DATABASE_URL/POSTGRES_URL or POSTGRES env parts.");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { Pool } = require("pg");
  return new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: candidates[0] })) });
}

const prisma = createPrismaClient();

const APPLY_FLAG = "--apply-admin-users-phase11a-jane-doe-limited-test-user";
const OWNER_EMAIL = "dbarshay15@gmail.com";
const TEST_EMAIL = "jane.doe.limited@example.com";
const TEST_DISPLAY_NAME = "Jane Doe";
const LIMITED_PERMISSION = "admin.auditHistory.view";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
}

function fileEvidence() {
  const login = read("app/api/auth/login/route.ts");
  const session = read("app/api/auth/session/route.ts");
  const create = read("app/api/admin/users/create/route.ts");
  const registry = read("lib/adminPermissions.ts");
  assert(login.includes('role: "admin"') || login.includes("role: 'admin'"), "login route should still show generic admin session role");
  assert(session.includes('permissionsMode: "default-admin-allow-all"'), "session route should still expose default-admin-allow-all mode");
  assert(session.includes("allAdminPermissionKeys()"), "session route should still grant generic all permission keys to authenticated sessions");
  assert(create.includes("bootstrapSafe: false"), "create route should default created users to bootstrapSafe false");
  assert(create.includes("rolesAssigned: []"), "create route should disclose no roles assigned by create-user route");
  assert(create.includes("permissionOverridesCreated: []"), "create route should disclose no overrides created by create-user route");
  assert(registry.includes(`key: "${LIMITED_PERMISSION}"`), `permission registry should include ${LIMITED_PERMISSION}`);
  return {
    realLimitedLoginSupported: false,
    reason: "Current login/session path remains generic authenticated admin and is not wired to select an AdminUser row by email for browser enforcement.",
    loginRouteGenericAdminRole: true,
    sessionMode: "default-admin-allow-all",
    dbBackedSimulationSupported: true
  };
}

async function ownerState(tx) {
  return tx.adminUser.findUnique({
    where: { email: OWNER_EMAIL },
    include: {
      roles: { include: { role: { include: { permissions: true } } } },
      permissionOverrides: true
    }
  });
}

function effectivePermissionKeys(user) {
  const roleKeys = [];
  for (const entry of user.roles || []) {
    if (entry.role?.status === "active") {
      for (const permission of entry.role.permissions || []) roleKeys.push(permission.permissionKey);
    }
  }
  const blocks = new Set((user.permissionOverrides || []).filter(o => o.action === "block").map(o => o.permissionKey));
  const allows = (user.permissionOverrides || []).filter(o => o.action === "allow").map(o => o.permissionKey);
  return Array.from(new Set([...roleKeys.filter(k => !blocks.has(k)), ...allows])).sort();
}

async function main() {
  const applying = process.argv.includes(APPLY_FLAG);
  const identityEvidence = fileEvidence();

  const beforeOwner = await ownerState(prisma);
  assert(beforeOwner, "owner admin user must exist before Phase 11A");
  assert(beforeOwner.status === "active", "owner admin must remain active before Phase 11A");
  assert(beforeOwner.bootstrapSafe === true, "owner admin must remain bootstrapSafe before Phase 11A");
  assert((beforeOwner.roles || []).some(entry => entry.role?.key === "owner_admin" && entry.role?.status === "active"), "owner admin must retain active owner_admin role before Phase 11A");

  const allKnownPermissions = new Set();
  for (const role of await prisma.adminRole.findMany({ include: { permissions: true } })) {
    for (const p of role.permissions || []) allKnownPermissions.add(p.permissionKey);
  }
  assert(allKnownPermissions.has(LIMITED_PERMISSION), `${LIMITED_PERMISSION} must exist in seeded role permission data before limited override proof`);

  const existing = await prisma.adminUser.findUnique({
    where: { email: TEST_EMAIL },
    include: { roles: { include: { role: true } }, permissionOverrides: true }
  });

  const preview = {
    phase: "11A",
    action: applying ? "apply" : "preview",
    testUser: {
      email: TEST_EMAIL,
      displayName: TEST_DISPLAY_NAME,
      desiredStatus: "active",
      desiredBootstrapSafe: false,
      ownerAdmin: false,
      limitedPermissionAllow: LIMITED_PERMISSION
    },
    identityEvidence,
    existingBefore: existing ? {
      email: existing.email,
      displayName: existing.displayName,
      status: existing.status,
      bootstrapSafe: existing.bootstrapSafe,
      roles: existing.roles.map(entry => entry.role?.key).filter(Boolean).sort(),
      overrides: existing.permissionOverrides.map(o => ({ permissionKey: o.permissionKey, action: o.action })).sort((a,b) => a.permissionKey.localeCompare(b.permissionKey))
    } : null,
    safety: {
      ownerEmail: OWNER_EMAIL,
      ownerActiveBefore: beforeOwner.status === "active",
      ownerBootstrapSafeBefore: beforeOwner.bootstrapSafe === true,
      ownerAdminRoleBefore: (beforeOwner.roles || []).some(entry => entry.role?.key === "owner_admin" && entry.role?.status === "active"),
      realLimitedLoginSmoke: "not attempted because current session identity is generic admin, not Jane Doe-specific",
      noNeverBlockPermissionBlocked: true
    }
  };

  if (!applying) {
    console.log(JSON.stringify(preview, null, 2));
    console.log("RESULT: Phase 11A preview only. Re-run with " + APPLY_FLAG + " to create/update Jane Doe.");
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.adminUser.upsert({
      where: { email: TEST_EMAIL },
      create: {
        email: TEST_EMAIL,
        displayName: TEST_DISPLAY_NAME,
        status: "active",
        bootstrapSafe: false,
        notes: "Phase 11A DB-backed limited test user. Not a real browser-login identity until auth/session supports per-user identity."
      },
      update: {
        displayName: TEST_DISPLAY_NAME,
        status: "active",
        bootstrapSafe: false,
        notes: "Phase 11A DB-backed limited test user. Not a real browser-login identity until auth/session supports per-user identity."
      }
    });

    const ownerRole = await tx.adminRole.findUnique({ where: { key: "owner_admin" } });
    if (ownerRole) {
      const unsafeOwnerAssignment = await tx.adminUserRole.findFirst({ where: { userId: user.id, roleId: ownerRole.id } });
      assert(!unsafeOwnerAssignment, "Jane Doe must not have owner_admin role");
    }

    await tx.adminUserPermissionOverride.upsert({
      where: { userId_permissionKey: { userId: user.id, permissionKey: LIMITED_PERMISSION } },
      create: {
        userId: user.id,
        permissionKey: LIMITED_PERMISSION,
        action: "allow",
        reason: "Phase 11A limited DB-backed simulation user: allow audit history view only."
      },
      update: {
        action: "allow",
        reason: "Phase 11A limited DB-backed simulation user: allow audit history view only."
      }
    });

    const refreshedUser = await tx.adminUser.findUnique({
      where: { email: TEST_EMAIL },
      include: { roles: { include: { role: { include: { permissions: true } } } }, permissionOverrides: true }
    });

    const refreshedOwner = await ownerState(tx);
    assert(refreshedOwner.status === "active", "owner admin must remain active after Phase 11A");
    assert(refreshedOwner.bootstrapSafe === true, "owner admin must remain bootstrapSafe after Phase 11A");
    assert((refreshedOwner.roles || []).some(entry => entry.role?.key === "owner_admin" && entry.role?.status === "active"), "owner admin must retain active owner_admin role after Phase 11A");
    assert(refreshedUser.email === TEST_EMAIL, "Jane Doe test user must exist after Phase 11A");
    assert(refreshedUser.displayName === TEST_DISPLAY_NAME, "Jane Doe displayName must be set");
    assert(refreshedUser.status === "active", "Jane Doe must be active for DB-backed simulation");
    assert(refreshedUser.bootstrapSafe === false, "Jane Doe must not be bootstrapSafe");
    assert(!(refreshedUser.roles || []).some(entry => entry.role?.key === "owner_admin"), "Jane Doe must not be owner_admin");
    const janeEffective = effectivePermissionKeys(refreshedUser);
    assert(janeEffective.includes(LIMITED_PERMISSION), "Jane Doe effective permissions should include the limited allow override");
    assert(!janeEffective.includes("admin.users.manage"), "Jane Doe must not have admin.users.manage");
    assert(!janeEffective.includes("admin.permissions.view") || janeEffective.length <= 2, "Jane Doe should remain minimal/limited, not broad admin");

    return {
      createdOrUpdated: {
        email: refreshedUser.email,
        displayName: refreshedUser.displayName,
        status: refreshedUser.status,
        bootstrapSafe: refreshedUser.bootstrapSafe,
        roles: refreshedUser.roles.map(entry => entry.role?.key).filter(Boolean).sort(),
        permissionOverrides: refreshedUser.permissionOverrides.map(o => ({ permissionKey: o.permissionKey, action: o.action })).sort((a,b) => a.permissionKey.localeCompare(b.permissionKey)),
        effectivePermissions: janeEffective
      },
      ownerPreserved: {
        email: refreshedOwner.email,
        status: refreshedOwner.status,
        bootstrapSafe: refreshedOwner.bootstrapSafe,
        hasOwnerAdminRole: (refreshedOwner.roles || []).some(entry => entry.role?.key === "owner_admin" && entry.role?.status === "active"),
        effectivePermissionCount: effectivePermissionKeys(refreshedOwner).length
      },
      identityEvidence
    };
  });

  console.log(JSON.stringify({ ...preview, result }, null, 2));
  console.log("PASS: Phase 11A created/updated Jane Doe as DB-backed limited non-admin simulation user; owner_admin access preserved; real limited browser login not claimed.");
}

main().catch(err => {
  console.error("FAIL:", err.message || err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
