import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const APPLY_FLAG = "--apply-admin-users-phase-v4d-card-grant-smoke";
const OWNER_EMAIL = "dbarshay15@gmail.com";
const TEST_EMAIL = "jane.doe.limited@example.com";
const ADMINISTRATOR_ROLE_KEY = "administrator";
const GRANT_KEYS = [
  "admin.card.auditHistory",
  "admin.card.documentTemplates",
  "admin.card.referenceData"
];

function loadEnvFiles() {
  const envFiles = [".env", ".env.local", ".env.development.local", ".env.production.local"];
  const loaded = [];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
    loaded.push(file);
  }
  console.log("PHASE_V4D_ENV_FILES_LOADED=" + (loaded.length ? loaded.join(",") : "none"));
}

function createPrisma() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL is required for Phase V4D.");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}

function roleKeys(user) {
  return (user?.roles || []).map((entry) => entry.role?.key).filter(Boolean).sort();
}

function adminCardGrantKeys(user) {
  return (user?.permissionOverrides || [])
    .filter((entry) => GRANT_KEYS.includes(entry.permissionKey) && entry.action === "allow")
    .map((entry) => entry.permissionKey)
    .sort();
}

async function main() {
  loadEnvFiles();
  const apply = process.argv.includes(APPLY_FLAG);
  const { prisma, pool } = createPrisma();

  try {
    console.log("RUN: Admin Users Phase V4D card-grant DB smoke");
    console.log("MODE=" + (apply ? "apply" : "preview"));

    const [owner, testUser, administratorRole] = await Promise.all([
      prisma.adminUser.findUnique({ where: { email: OWNER_EMAIL }, include: { roles: { include: { role: true } } } }),
      prisma.adminUser.findUnique({ where: { email: TEST_EMAIL }, include: { roles: { include: { role: true } }, permissionOverrides: true } }),
      prisma.adminRole.findUnique({ where: { key: ADMINISTRATOR_ROLE_KEY } })
    ]);

    const ownerRoleKeys = roleKeys(owner);
    if (!owner || !ownerRoleKeys.includes("owner_admin")) throw new Error("Owner must exist and have owner_admin role.");
    if (!administratorRole || administratorRole.status !== "active") throw new Error("administrator role must exist and be active.");
    if (!testUser) throw new Error(`Test user ${TEST_EMAIL} must exist before Phase V4D.`);
    if (testUser.status !== "active") throw new Error(`Test user ${TEST_EMAIL} must be active before Phase V4D.`);
    if (testUser.bootstrapSafe) throw new Error("Refusing to use a bootstrapSafe owner as the V4D test user.");

    const beforeRoleKeys = roleKeys(testUser);
    const beforeGrantKeys = adminCardGrantKeys(testUser);

    const preview = {
      ok: true,
      phase: "admin-users-phase-v4d-card-grant-smoke",
      mode: apply ? "apply" : "preview",
      runtimeEnforcementChanged: false,
      sessionBehaviorChanged: false,
      ownerEmail: OWNER_EMAIL,
      testEmail: TEST_EMAIL,
      administratorRoleActive: administratorRole.status === "active",
      before: {
        roleKeys: beforeRoleKeys,
        adminCardGrantKeys: beforeGrantKeys
      },
      planned: {
        ensureAdministratorRole: true,
        grantPermissionKeys: GRANT_KEYS
      },
      safety: {
        createsUsers: false,
        deletesUsers: false,
        deletesRoles: false,
        changesOwner: false,
        changesPermissionEnforcement: false,
        changesTwoFactor: false,
        changesPasswords: false,
        changesSessions: false,
        changesClio: false,
        changesDocuments: false,
        changesPrintQueue: false
      }
    };

    console.log("PHASE_V4D_PREVIEW=" + JSON.stringify(preview, null, 2));

    if (!apply) {
      console.log("PREVIEW_ONLY=true");
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.adminUserRole.upsert({
        where: {
          userId_roleId: {
            userId: testUser.id,
            roleId: administratorRole.id
          }
        },
        update: {},
        create: {
          userId: testUser.id,
          roleId: administratorRole.id
        }
      });

      for (const permissionKey of GRANT_KEYS) {
        await tx.adminUserPermissionOverride.upsert({
          where: {
            userId_permissionKey: {
              userId: testUser.id,
              permissionKey
            }
          },
          update: {
            action: "allow",
            reason: "Phase V4D smoke test selected Administrator Admin-card grant.",
            updatedAt: new Date()
          },
          create: {
            userId: testUser.id,
            permissionKey,
            action: "allow",
            reason: "Phase V4D smoke test selected Administrator Admin-card grant."
          }
        });
      }

      const refreshed = await tx.adminUser.findUnique({
        where: { email: TEST_EMAIL },
        include: { roles: { include: { role: true } }, permissionOverrides: true }
      });

      const refreshedRoleKeys = roleKeys(refreshed);
      const refreshedGrantKeys = adminCardGrantKeys(refreshed);

      if (!refreshedRoleKeys.includes("administrator")) throw new Error("Smoke failed: administrator role was not present after apply.");
      for (const key of GRANT_KEYS) {
        if (!refreshedGrantKeys.includes(key)) throw new Error(`Smoke failed: ${key} was not present after apply.`);
      }

      return {
        roleKeys: refreshedRoleKeys,
        adminCardGrantKeys: refreshedGrantKeys
      };
    });

    const applyProof = {
      ok: true,
      phase: "admin-users-phase-v4d-card-grant-smoke",
      mode: "apply",
      runtimeEnforcementChanged: false,
      sessionBehaviorChanged: false,
      databaseMutated: true,
      testEmail: TEST_EMAIL,
      after: result
    };

    console.log("PHASE_V4D_APPLY_RESULT=" + JSON.stringify(applyProof, null, 2));
    console.log("PASS: Phase V4D Administrator role/card-grant smoke succeeded.");
  } finally {
    await prisma.$disconnect();
    if (pool && typeof pool.end === "function") await pool.end();
  }
}

main().catch((error) => {
  console.error("FAIL: Admin Users Phase V4D card-grant smoke failed.");
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
