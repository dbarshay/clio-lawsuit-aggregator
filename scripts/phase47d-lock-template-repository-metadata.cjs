const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

function loadEnvFile(envPath, override = false) {
  if (!envPath || !fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const eq = line.indexOf("=");
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (!key) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (override || !process.env[key]) process.env[key] = value;
  }
}
for (const file of [".env", ".env.local", ".env.development", ".env.development.local", ".env.production", ".env.production.local", ".env.vercel.production"]) loadEnvFile(file, false);

function builtPostgresUrl({ user, password, host, database }) {
  if (!user || !password || !host || !database) return "";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(database)}?sslmode=require`;
}
const connectionString = [
  process.env.PHASE47D_DATABASE_URL,
  process.env.DATABASE_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL,
  builtPostgresUrl({
    user: process.env.POSTGRES_PGUSER,
    password: process.env.POSTGRES_PGPASSWORD,
    host: process.env.POSTGRES_PGHOST_UNPOOLED || process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_PGDATABASE,
  }),
].map((v) => String(v || "").trim()).find(Boolean);

if (!connectionString) throw new Error("Missing DATABASE_URL/POSTGRES_URL for Phase 47D metadata lock.");
if (process.env.CONFIRM_PHASE47D_REPOSITORY_METADATA_LOCK !== "YES") throw new Error("Set CONFIRM_PHASE47D_REPOSITORY_METADATA_LOCK=YES.");

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function replacer(_key, value) {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

(async () => {
  const backupDir = process.env.PHASE47D_BACKUP_DIR || path.join(process.env.HOME || ".", "Desktop", "barsh-template-db-import-backups", `phase47d-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-")}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const before = await prisma.documentTemplate.findMany({
    where: { key: { in: ["lawsuit-stipulation-of-settlement", "letterhead-simple"] } },
    include: { versions: { orderBy: { versionNumber: "asc" } }, mergeFields: { orderBy: { key: "asc" } } },
    orderBy: { key: "asc" },
  });
  fs.writeFileSync(path.join(backupDir, "phase47d-before-template-repository-metadata-lock.json"), JSON.stringify(before, replacer, 2));

  const stip = await prisma.documentTemplate.findUnique({ where: { key: "lawsuit-stipulation-of-settlement" } });
  const letterhead = await prisma.documentTemplate.findUnique({ where: { key: "letterhead-simple" } });
  if (!stip) throw new Error("Missing lawsuit-stipulation-of-settlement template.");
  if (!letterhead) throw new Error("Missing letterhead-simple layout asset.");

  const stipMetadata = stip.metadata && typeof stip.metadata === "object" && !Array.isArray(stip.metadata) ? stip.metadata : {};
  const letterheadMetadata = letterhead.metadata && typeof letterhead.metadata === "object" && !Array.isArray(letterhead.metadata) ? letterhead.metadata : {};

  await prisma.$transaction([
    prisma.documentTemplate.update({
      where: { key: "lawsuit-stipulation-of-settlement" },
      data: {
        metadata: {
          ...stipMetadata,
          repositorySource: "barsh-matters-template-repository",
          templateKind: "generation_template",
          selectableForNormalGeneration: true,
          layoutFamily: "letterhead",
          layoutAssetKey: "letterhead-simple",
          productionTemplateReady: false,
          finalProductionDocument: false,
          finalTemplateReady: false,
          notFinalYet: true,
          requiresLayoutAdaptation: true,
          requiresFieldMapping: true,
          fieldMappingPerformed: false,
          repositoryResolutionLockedAt: new Date().toISOString(),
        },
      },
    }),
    prisma.documentTemplate.update({
      where: { key: "letterhead-simple" },
      data: {
        metadata: {
          ...letterheadMetadata,
          repositorySource: "barsh-matters-template-repository",
          templateKind: "layout_asset",
          nonGenerationAsset: true,
          selectableForNormalGeneration: false,
          finalTemplateReady: true,
          repositoryResolutionLockedAt: new Date().toISOString(),
        },
      },
    }),
  ]);

  const after = await prisma.documentTemplate.findMany({
    where: { key: { in: ["lawsuit-stipulation-of-settlement", "letterhead-simple"] } },
    include: { versions: { orderBy: { versionNumber: "asc" } }, mergeFields: { orderBy: { key: "asc" } } },
    orderBy: { key: "asc" },
  });
  fs.writeFileSync(path.join(backupDir, "phase47d-after-template-repository-metadata-lock.json"), JSON.stringify(after, replacer, 2));

  const proof = {
    ok: true,
    action: "phase47d-template-repository-resolution-metadata-lock",
    backupDir,
    keys: after.map((entry) => entry.key),
    stipulationStatus: {
      notFinalYet: after.find((entry) => entry.key === "lawsuit-stipulation-of-settlement")?.metadata?.notFinalYet === true,
      finalTemplateReady: after.find((entry) => entry.key === "lawsuit-stipulation-of-settlement")?.metadata?.finalTemplateReady === false,
      requiresLayoutAdaptation: after.find((entry) => entry.key === "lawsuit-stipulation-of-settlement")?.metadata?.requiresLayoutAdaptation === true,
      requiresFieldMapping: after.find((entry) => entry.key === "lawsuit-stipulation-of-settlement")?.metadata?.requiresFieldMapping === true,
      layoutAssetKey: after.find((entry) => entry.key === "lawsuit-stipulation-of-settlement")?.metadata?.layoutAssetKey,
    },
    letterheadStatus: {
      nonGenerationAsset: after.find((entry) => entry.key === "letterhead-simple")?.metadata?.nonGenerationAsset === true,
      selectableForNormalGeneration: after.find((entry) => entry.key === "letterhead-simple")?.metadata?.selectableForNormalGeneration === false,
    },
    safety: {
      clioTouched: false,
      graphTouched: false,
      documentsFinalized: false,
      fieldMappingPerformed: false,
      codeRegistryFallbackUsed: false,
    },
  };
  fs.writeFileSync(path.join(backupDir, "phase47d-template-repository-resolution-proof.json"), JSON.stringify(proof, replacer, 2));
  console.log(JSON.stringify(proof, replacer, 2));
})().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
