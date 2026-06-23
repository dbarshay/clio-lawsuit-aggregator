const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

let failed = false;
const root = process.cwd();
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const contains = (label, text, token) => text.includes(token) ? pass(label) : fail(`${label} missing token: ${token}`);
const notContains = (label, text, token) => !text.includes(token) ? pass(label) : fail(`${label} contains forbidden token: ${token}`);

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
function createPrismaClient() {
  const connectionString = [process.env.PHASE47D_DATABASE_URL, process.env.DATABASE_URL, process.env.POSTGRES_PRISMA_URL, process.env.POSTGRES_URL, builtPostgresUrl({ user: process.env.POSTGRES_PGUSER, password: process.env.POSTGRES_PGPASSWORD, host: process.env.POSTGRES_PGHOST_UNPOOLED || process.env.POSTGRES_HOST, database: process.env.POSTGRES_PGDATABASE })].map((v) => String(v || "").trim()).find(Boolean);
  if (!connectionString) throw new Error("Missing DB URL for Phase 47D verifier.");
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool };
}

const resolverPath = "lib/documents/template-repository-resolver.ts";
const docPath = "docs/template-generation-refactor/phase47d-template-repository-resolution-layer.md";
const lockPath = "scripts/phase47d-lock-template-repository-metadata.cjs";
const pkgPath = "package.json";

for (const p of [resolverPath, docPath, lockPath, pkgPath]) exists(p) ? pass(`required file exists: ${p}`) : fail(`missing required file: ${p}`);

const resolver = exists(resolverPath) ? read(resolverPath) : "";
const doc = exists(docPath) ? read(docPath) : "";
const lock = exists(lockPath) ? read(lockPath) : "";
const pkg = exists(pkgPath) ? JSON.parse(read(pkgPath)) : { scripts: {} };

for (const token of [
  "resolveGenerationTemplateFromRepository",
  "resolveLayoutAssetFromRepository",
  "listSelectableGenerationTemplatesFromRepository",
  "resolveGenerationTemplateWithLayoutFromRepository",
  "db-docx-base64",
  "layout_asset",
  "selectableForNormalGeneration",
  "codeRegistryFallbackUsed: false",
]) contains(`resolver contains ${token}`, resolver, token);

for (const token of [
  "template repository resolution layer",
  "final templates live in the Barsh Matters template repository",
  "Stipulation of Settlement is not final yet",
  "letterhead-simple",
  "lawsuit-stipulation-of-settlement",
  "no field mapping",
  "code-registry fallback remains hidden",
]) contains(`doc contains ${token}`, doc, token);

contains("lock script marks stipulation not final", lock, "notFinalYet: true");
contains("lock script marks stipulation requires field mapping", lock, "requiresFieldMapping: true");
contains("lock script connects stipulation to letterhead", lock, 'layoutAssetKey: "letterhead-simple"');
contains("lock script keeps field mapping false", lock, "fieldMappingPerformed: false");

for (const token of ["uploadBufferToClioMatterDocuments(", "CONFIRM_LIVE_TERMINAL_FINALIZE=YES", "confirmUpload: true", "documentPrintQueueItem.create(", "sendMail"]) {
  notContains(`resolver no external/finalization marker ${token}`, resolver, token);
  notContains(`doc no external/finalization marker ${token}`, doc, token);
  notContains(`lock no external/finalization marker ${token}`, lock, token);
}

if (pkg.scripts?.["phase47d:lock-template-repository-metadata"] === "node scripts/phase47d-lock-template-repository-metadata.cjs") pass("package metadata lock script registered"); else fail("package metadata lock script missing");
if (pkg.scripts?.["verify:phase47d-template-repository-resolution-safety"] === "node scripts/verify-phase47d-template-repository-resolution-safety.cjs") pass("package verifier script registered"); else fail("package verifier script missing");

(async () => {
  const { prisma, pool } = createPrismaClient();
  try {
    const stip = await prisma.documentTemplate.findUnique({ where: { key: "lawsuit-stipulation-of-settlement" }, include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 }, mergeFields: true } });
    const letterhead = await prisma.documentTemplate.findUnique({ where: { key: "letterhead-simple" }, include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } } });
    if (!stip) fail("DB stipulation template exists"); else {
      pass("DB stipulation template exists");
      const meta = stip.metadata && typeof stip.metadata === "object" && !Array.isArray(stip.metadata) ? stip.metadata : {};
      meta.repositorySource === "barsh-matters-template-repository" ? pass("DB stipulation repository source locked") : fail("DB stipulation repository source missing");
      meta.templateKind === "generation_template" ? pass("DB stipulation templateKind generation_template") : fail("DB stipulation templateKind missing");
      meta.layoutAssetKey === "letterhead-simple" ? pass("DB stipulation layoutAssetKey letterhead-simple") : fail("DB stipulation layoutAssetKey missing");
      meta.notFinalYet === true ? pass("DB stipulation not final yet") : fail("DB stipulation notFinalYet missing");
      meta.finalTemplateReady === false ? pass("DB stipulation finalTemplateReady false") : fail("DB stipulation finalTemplateReady not false");
      meta.requiresLayoutAdaptation === true ? pass("DB stipulation requires layout adaptation") : fail("DB stipulation layout adaptation missing");
      meta.requiresFieldMapping === true ? pass("DB stipulation requires field mapping") : fail("DB stipulation field mapping missing");
      meta.fieldMappingPerformed === false ? pass("DB stipulation field mapping not performed") : fail("DB stipulation field mapping flag not false");
      stip.versions?.[0]?.storageKind === "db-docx-base64" ? pass("DB stipulation resolves DOCX repository version") : fail("DB stipulation missing db-docx-base64 version");
      (stip.mergeFields?.length || 0) === 19 ? pass("DB stipulation legacy fields preserved") : fail("DB stipulation legacy fields changed");
    }
    if (!letterhead) fail("DB letterhead layout asset exists"); else {
      pass("DB letterhead layout asset exists");
      const meta = letterhead.metadata && typeof letterhead.metadata === "object" && !Array.isArray(letterhead.metadata) ? letterhead.metadata : {};
      meta.repositorySource === "barsh-matters-template-repository" ? pass("DB letterhead repository source locked") : fail("DB letterhead repository source missing");
      meta.templateKind === "layout_asset" ? pass("DB letterhead templateKind layout_asset") : fail("DB letterhead templateKind missing");
      meta.nonGenerationAsset === true ? pass("DB letterhead nonGenerationAsset true") : fail("DB letterhead nonGenerationAsset missing");
      meta.selectableForNormalGeneration === false ? pass("DB letterhead not selectable") : fail("DB letterhead selectable flag incorrect");
      letterhead.versions?.[0]?.storageKind === "db-docx-base64" ? pass("DB letterhead resolves DOCX repository version") : fail("DB letterhead missing db-docx-base64 version");
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  if (failed) {
    console.error("FAIL: Phase 47D template repository resolution verifier failed");
    process.exit(1);
  }
  console.log("PASS: Phase 47D template repository resolution verifier passed");
})().catch((err) => {
  console.error("FAIL:", err && err.stack ? err.stack : err);
  process.exit(1);
});
