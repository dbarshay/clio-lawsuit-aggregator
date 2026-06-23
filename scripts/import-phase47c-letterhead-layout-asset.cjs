const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const LAYOUT_KEY = "letterhead-simple";
const LAYOUT_LABEL = "Letterhead Simple";
const LAYOUT_CATEGORY = "general";
const OWNER_EMAIL = process.env.BARSH_OWNER_ADMIN_EMAIL || "dbarshay15@gmail.com";

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
function loadLocalEnv() {
  for (const file of [".env", ".env.local", ".env.development", ".env.development.local", ".env.production", ".env.production.local", ".env.vercel.production"]) loadEnvFile(file, false);
}
function builtPostgresUrl({ user, password, host, database }) {
  if (!user || !password || !host || !database) return "";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(database)}?sslmode=require`;
}
function postgresConnectionCandidates() {
  return [
    process.env.PHASE47C_DATABASE_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    builtPostgresUrl({
      user: process.env.POSTGRES_PGUSER,
      password: process.env.POSTGRES_PGPASSWORD,
      host: process.env.POSTGRES_PGHOST_UNPOOLED || process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_PGDATABASE,
    }),
  ].map((v) => String(v || "").trim()).filter(Boolean);
}
function createPrismaClient() {
  const candidates = postgresConnectionCandidates();
  if (!candidates.length) throw new Error("Phase 47C import requires DATABASE_URL/POSTGRES_URL or Postgres env parts.");
  const pool = new Pool({ connectionString: candidates[0] });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool, connectionSource: candidates[0].includes("neon") ? "neon/postgres-url" : "postgres-url" };
}
function replacer(_key, value) {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  return value;
}
function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
async function verifyOwnerAdmin(prisma) {
  const owner = await prisma.adminUser.findUnique({ where: { email: OWNER_EMAIL }, include: { roles: { include: { role: true } } } }).catch(() => null);
  if (!owner) throw new Error(`Owner admin user not found for ${OWNER_EMAIL}. Layout asset import is owner-admin only.`);
  const hasOwnerRole = (owner.roles || []).some((entry) => entry.role?.key === "owner_admin" && entry.role?.status === "active");
  if (!hasOwnerRole) throw new Error(`Owner admin user ${OWNER_EMAIL} does not have active owner_admin role.`);
  return { email: owner.email, displayName: owner.displayName || "", ownerAdmin: true };
}
async function main() {
  loadLocalEnv();
  if (process.env.CONFIRM_PHASE47C_LAYOUT_IMPORT !== "YES") throw new Error("Set CONFIRM_PHASE47C_LAYOUT_IMPORT=YES to import the letterhead layout asset.");

  const docxPath = process.env.LETTERHEAD_DOCX_PATH || "";
  if (!fs.existsSync(docxPath)) throw new Error(`Letterhead DOCX file not found: ${docxPath}`);
  if (!docxPath.toLowerCase().endsWith(".docx")) throw new Error("Letterhead source must be a .docx file.");

  const backupDir = process.env.PHASE47C_BACKUP_DIR || path.join(process.env.HOME || ".", "Desktop", "barsh-template-db-import-backups", `phase47c-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-")}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const { prisma, pool, connectionSource } = createPrismaClient();
  try {
    const ownerProof = await verifyOwnerAdmin(prisma);
    const docxBuffer = fs.readFileSync(docxPath);
    const docxBase64 = docxBuffer.toString("base64");
    const docxHash = sha256(docxBuffer);

    const before = {
      templates: await prisma.documentTemplate.findMany({ orderBy: [{ category: "asc" }, { label: "asc" }, { key: "asc" }], include: { versions: { orderBy: { versionNumber: "asc" } }, mergeFields: { orderBy: { key: "asc" } } } }),
      counts: {
        documentTemplates: await prisma.documentTemplate.count(),
        documentTemplateVersions: await prisma.documentTemplateVersion.count(),
        documentTemplateMergeFields: await prisma.documentTemplateMergeField.count(),
      },
    };
    fs.writeFileSync(path.join(backupDir, "template-db-before-phase47c-letterhead-layout-import.json"), JSON.stringify(before, replacer, 2));
    fs.copyFileSync(docxPath, path.join(backupDir, "source-Letterhead-Simple.docx"));

    const existing = await prisma.documentTemplate.findUnique({ where: { key: LAYOUT_KEY }, include: { versions: true } });
    if (existing) throw new Error(`Layout asset key already exists and will not be overwritten by Phase 47C: ${LAYOUT_KEY}`);

    const stipulation = await prisma.documentTemplate.findUnique({ where: { key: "lawsuit-stipulation-of-settlement" } });
    if (!stipulation) throw new Error("Expected Phase 47B lawsuit-stipulation-of-settlement template to exist before importing layout asset.");

    const result = await prisma.$transaction(async (tx) => {
      const layout = await tx.documentTemplate.create({
        data: {
          key: LAYOUT_KEY,
          label: LAYOUT_LABEL,
          category: LAYOUT_CATEGORY,
          description: "Non-generation DOCX layout asset for BRL letterhead documents. Used as the base layout family for letterhead templates.",
          defaultFilenameSuffix: LAYOUT_LABEL,
          generationEndpoint: "",
          outputFormat: "docx",
          sourceOfTruth: "barsh-matters-local",
          enabled: false,
          editableInRepository: true,
          metadata: {
            importedBy: "phase47c-guarded-script",
            importedAt: new Date().toISOString(),
            repositorySource: "barsh-matters-layout-upload-db",
            repositoryStatus: "production-layout-asset-imported",
            templateKind: "layout_asset",
            nonGenerationAsset: true,
            selectableForNormalGeneration: false,
            docxOnlyTemplate: true,
            macAndWindowsCompatible: true,
            layoutFamily: "letterhead",
            layoutAssetKey: LAYOUT_KEY,
            pageOne: {
              rule: "full BRL letterhead header",
              dynamicDate: true,
              dateAlignment: "tabbed-once-right",
            },
            continuationPages: {
              appliesFromPage: 2,
              appliesToAllAdditionalPages: true,
              rule: "smaller BRL logo on left and page number on right",
            },
            closing: {
              text: "Very truly yours,",
              alignment: "same-tabbed-position-as-date",
              blankSpaceUnderClosing: true,
              signerField: "{{userName}}",
            },
            fieldMappingPerformed: false,
            sourceFilename: path.basename(docxPath),
            sourceSha256: docxHash,
            sourceByteLength: docxBuffer.byteLength,
            ownerAdminOnly: true,
          },
        },
      });

      const version = await tx.documentTemplateVersion.create({
        data: {
          templateId: layout.id,
          versionNumber: 1,
          status: "imported-as-layout-asset",
          bodyFormat: "docx-layout-asset",
          storageKind: "db-docx-base64",
          contentText: docxBase64,
          contentJson: {
            uploadedLayoutFile: {
              name: path.basename(docxPath),
              size: docxBuffer.byteLength,
              sha256: docxHash,
              storageKind: "db-docx-base64",
              actualFileStored: true,
              contentRead: true,
              importedAsLayoutAsset: true,
            },
          },
          mergeFieldSet: "layout-letterhead-simple-v1",
        },
      });

      await tx.documentTemplate.update({ where: { id: layout.id }, data: { currentVersionId: version.id } });

      return { layout, version };
    });

    const rollbackScript = `const { PrismaClient } = require("@prisma/client");\nconst { PrismaPg } = require("@prisma/adapter-pg");\nconst { Pool } = require("pg");\nconst connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;\nif (!connectionString) throw new Error("Missing DATABASE_URL/POSTGRES_URL");\nconst pool = new Pool({ connectionString });\nconst prisma = new PrismaClient({ adapter: new PrismaPg(pool) });\n(async()=>{ const key="${LAYOUT_KEY}"; const t=await prisma.documentTemplate.findUnique({where:{key}}); if(!t){ console.log("No layout asset found for rollback:", key); return; } await prisma.$transaction(async(tx)=>{ await tx.documentTemplateMergeField.deleteMany({where:{templateId:t.id}}); await tx.documentTemplateVersion.deleteMany({where:{templateId:t.id}}); await tx.documentTemplate.delete({where:{id:t.id}}); }); console.log("Rolled back layout asset:", key); })().finally(async()=>{ await prisma.$disconnect(); await pool.end(); });\n`;
    fs.writeFileSync(path.join(backupDir, "rollback-phase47c-letterhead-layout-asset.cjs"), rollbackScript);

    const after = {
      layout: await prisma.documentTemplate.findUnique({ where: { key: LAYOUT_KEY }, include: { versions: { orderBy: { versionNumber: "asc" } }, mergeFields: { orderBy: { key: "asc" } } } }),
      stipulation: await prisma.documentTemplate.findUnique({ where: { key: "lawsuit-stipulation-of-settlement" }, include: { versions: true, mergeFields: true } }),
      counts: {
        documentTemplates: await prisma.documentTemplate.count(),
        documentTemplateVersions: await prisma.documentTemplateVersion.count(),
        documentTemplateMergeFields: await prisma.documentTemplateMergeField.count(),
      },
    };

    const meta = after.layout?.metadata || {};
    const proof = {
      ok: Boolean(after.layout && after.layout.enabled === false && after.layout.versions?.[0]?.storageKind === "db-docx-base64" && meta.templateKind === "layout_asset" && meta.selectableForNormalGeneration === false && after.stipulation),
      action: "phase47c-import-letterhead-simple-layout-asset",
      connectionSource,
      ownerProof,
      layoutKey: LAYOUT_KEY,
      layoutLabel: LAYOUT_LABEL,
      layoutCategory: LAYOUT_CATEGORY,
      backupDir,
      docxPath,
      sourceSha256: docxHash,
      sourceByteLength: docxBuffer.byteLength,
      beforeCounts: before.counts,
      afterCounts: after.counts,
      created: { layoutId: result.layout.id, versionId: result.version.id, versionNumber: result.version.versionNumber },
      preserved: { stipulationTemplateStillExists: Boolean(after.stipulation), stipulationMergeFieldCount: after.stipulation?.mergeFields?.length || 0 },
      layoutRules: {
        layoutFamily: "letterhead",
        pageOneFullHeader: true,
        continuationHeaderForPage2AndAllAdditionalPages: true,
        dynamicDate: true,
        dateAlignment: "tabbed-once-right",
        closingText: "Very truly yours,",
        closingAlignment: "same-tabbed-position-as-date",
        signerField: "{{userName}}",
      },
      safety: {
        docxBasedLayoutAsset: true,
        macAndWindowsCompatible: true,
        nonGenerationAsset: true,
        selectableForNormalGeneration: false,
        fieldMappingPerformed: false,
        clioTouched: false,
        graphTouched: false,
        documentsFinalized: false,
        printQueueChanged: false,
        emailSent: false,
        ownerAdminOnly: true,
      },
    };
    fs.writeFileSync(path.join(backupDir, "phase47c-letterhead-layout-import-proof.json"), JSON.stringify(proof, replacer, 2));
    console.log(JSON.stringify(proof, replacer, 2));
    if (!proof.ok) throw new Error("Phase 47C letterhead layout import proof failed.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main().catch((err) => { console.error("FAIL:", err && err.stack ? err.stack : err); process.exit(1); });
