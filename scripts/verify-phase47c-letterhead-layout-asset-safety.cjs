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
function loadLocalEnv() {
  for (const file of [".env", ".env.local", ".env.development", ".env.development.local", ".env.production", ".env.production.local", ".env.vercel.production"]) loadEnvFile(file, false);
}
function builtPostgresUrl({ user, password, host, database }) {
  if (!user || !password || !host || !database) return "";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(database)}?sslmode=require`;
}
function postgresConnectionCandidates() {
  return [process.env.PHASE47C_DATABASE_URL, process.env.DATABASE_URL, process.env.POSTGRES_PRISMA_URL, process.env.POSTGRES_URL, builtPostgresUrl({ user: process.env.POSTGRES_PGUSER, password: process.env.POSTGRES_PGPASSWORD, host: process.env.POSTGRES_PGHOST_UNPOOLED || process.env.POSTGRES_HOST, database: process.env.POSTGRES_PGDATABASE })].map((v) => String(v || "").trim()).filter(Boolean);
}
function createPrismaClient() {
  const candidates = postgresConnectionCandidates();
  if (!candidates.length) throw new Error("Phase 47C verifier requires DATABASE_URL/POSTGRES_URL or Postgres env parts.");
  const pool = new Pool({ connectionString: candidates[0] });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool };
}

const docPath = "docs/template-generation-refactor/phase47c-letterhead-layout-asset.md";
const importScriptPath = "scripts/import-phase47c-letterhead-layout-asset.cjs";
const pkgPath = "package.json";
for (const p of [docPath, importScriptPath, pkgPath]) exists(p) ? pass(`required file exists: ${p}`) : fail(`missing required file: ${p}`);

const doc = exists(docPath) ? read(docPath) : "";
const importScript = exists(importScriptPath) ? read(importScriptPath) : "";
const pkg = exists(pkgPath) ? JSON.parse(read(pkgPath)) : { scripts: {} };

for (const token of ["letterhead-simple", "Letterhead Simple", "layout asset", "non-generation", "DOCX-based", "Mac and Windows", "page 2 and all additional pages", "dynamic date", "tabbed once to the right", "Very truly yours,", "{{userName}}"]) contains(`doc contains ${token}`, doc, token);
contains("import script requires explicit confirmation", importScript, "CONFIRM_PHASE47C_LAYOUT_IMPORT");
contains("import script stores db docx base64", importScript, 'storageKind: "db-docx-base64"');
contains("import script disables normal selection", importScript, "selectableForNormalGeneration: false");
contains("import script uses enabled false", importScript, "enabled: false");
contains("import script validates owner_admin", importScript, "owner_admin");
contains("import script writes rollback script", importScript, "rollback-phase47c-letterhead-layout-asset.cjs");
contains("import script preserves stipulation check", importScript, "lawsuit-stipulation-of-settlement");

for (const token of ["uploadBufferToClioMatterDocuments(", "CONFIRM_LIVE_TERMINAL_FINALIZE=YES", "confirmUpload: true", "documentPrintQueueItem.create(", "sendMail"]) {
  notContains(`doc no external/finalization marker ${token}`, doc, token);
  notContains(`import script no external/finalization marker ${token}`, importScript, token);
}

if (pkg.scripts?.["import:phase47c-letterhead-layout-asset"] === "node scripts/import-phase47c-letterhead-layout-asset.cjs") pass("package import script registered"); else fail("package import script missing");
if (pkg.scripts?.["verify:phase47c-letterhead-layout-asset-safety"] === "node scripts/verify-phase47c-letterhead-layout-asset-safety.cjs") pass("package verifier script registered"); else fail("package verifier script missing");

(async () => {
  loadLocalEnv();
  const { prisma, pool } = createPrismaClient();
  try {
    const layout = await prisma.documentTemplate.findUnique({ where: { key: "letterhead-simple" }, include: { versions: { orderBy: { versionNumber: "asc" } }, mergeFields: true } });
    if (!layout) fail("DB letterhead layout asset exists");
    else {
      pass("DB letterhead layout asset exists");
      layout.label === "Letterhead Simple" ? pass("DB layout label correct") : fail("DB layout label incorrect");
      layout.enabled === false ? pass("DB layout enabled false / non-generation") : fail("DB layout should be enabled false");
      layout.outputFormat === "docx" ? pass("DB layout outputFormat docx") : fail(`DB outputFormat incorrect: ${layout.outputFormat}`);
      layout.currentVersionId ? pass("DB layout currentVersionId set") : fail("DB layout currentVersionId missing");
      const metadata = layout.metadata && typeof layout.metadata === "object" && !Array.isArray(layout.metadata) ? layout.metadata : {};
      metadata.templateKind === "layout_asset" ? pass("DB metadata templateKind layout_asset") : fail("DB metadata templateKind missing");
      metadata.nonGenerationAsset === true ? pass("DB metadata nonGenerationAsset true") : fail("DB metadata nonGenerationAsset missing");
      metadata.selectableForNormalGeneration === false ? pass("DB metadata selectableForNormalGeneration false") : fail("DB metadata selectableForNormalGeneration not false");
      metadata.layoutFamily === "letterhead" ? pass("DB metadata layoutFamily letterhead") : fail("DB metadata layoutFamily missing");
      metadata.continuationPages?.appliesToAllAdditionalPages === true ? pass("DB metadata continuation applies to all additional pages") : fail("DB metadata continuation all pages missing");
      metadata.pageOne?.dynamicDate === true ? pass("DB metadata dynamic date true") : fail("DB metadata dynamic date missing");
      metadata.pageOne?.dateAlignment === "tabbed-once-right" ? pass("DB metadata date tabbed once right") : fail("DB metadata date alignment missing");
      metadata.closing?.text === "Very truly yours," ? pass("DB metadata closing text correct") : fail("DB metadata closing text missing");
      metadata.closing?.alignment === "same-tabbed-position-as-date" ? pass("DB metadata closing aligned with date") : fail("DB metadata closing alignment missing");
      metadata.closing?.signerField === "{{userName}}" ? pass("DB metadata signer field userName") : fail("DB metadata signer field missing");
      const version = layout.versions?.[0];
      version?.storageKind === "db-docx-base64" ? pass("DB layout version storageKind db-docx-base64") : fail("DB layout version storageKind not db-docx-base64");
      version?.contentText && version.contentText.length > 1000 ? pass("DB layout version has stored DOCX base64") : fail("DB layout version missing stored DOCX base64");
    }
    const stipulation = await prisma.documentTemplate.findUnique({ where: { key: "lawsuit-stipulation-of-settlement" }, include: { versions: true, mergeFields: true } });
    stipulation ? pass("Existing lawsuit stipulation template preserved") : fail("Existing lawsuit stipulation template missing");
    (stipulation?.mergeFields?.length || 0) === 19 ? pass("Existing lawsuit stipulation merge fields preserved") : fail("Existing lawsuit stipulation merge field count changed");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
  if (failed) { console.error("FAIL: Phase 47C letterhead layout asset verifier failed"); process.exit(1); }
  console.log("PASS: Phase 47C letterhead layout asset verifier passed");
})().catch((err) => { console.error("FAIL:", err && err.stack ? err.stack : err); process.exit(1); });
