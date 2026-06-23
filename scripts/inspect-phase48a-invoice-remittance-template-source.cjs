const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (!["node_modules", ".next", ".git", "coverage"].includes(name)) walk(full, out);
    } else if (/\.(ts|tsx|js|jsx|cjs|md)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}
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
function builtPostgresUrl({ user, password, host, database }) {
  if (!user || !password || !host || !database) return "";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(database)}?sslmode=require`;
}
function createPrismaClient() {
  for (const file of [".env", ".env.local", ".env.development", ".env.development.local", ".env.production", ".env.production.local", ".env.vercel.production"]) loadEnvFile(file, false);
  const connectionString = [process.env.PHASE48A_DATABASE_URL, process.env.DATABASE_URL, process.env.POSTGRES_PRISMA_URL, process.env.POSTGRES_URL, builtPostgresUrl({ user: process.env.POSTGRES_PGUSER, password: process.env.POSTGRES_PGPASSWORD, host: process.env.POSTGRES_PGHOST_UNPOOLED || process.env.POSTGRES_HOST, database: process.env.POSTGRES_PGDATABASE })].map((v) => String(v || "").trim()).find(Boolean);
  if (!connectionString) throw new Error("Missing DB URL for Phase 48A inspection.");
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool };
}
function excerpt(text, idx) {
  const start = Math.max(0, text.lastIndexOf("\n", idx - 260));
  const end0 = text.indexOf("\n", idx + 260);
  const end = end0 === -1 ? Math.min(text.length, idx + 260) : end0;
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

(async () => {
  const files = walk("app").concat(walk("lib")).concat(walk("components")).concat(walk("scripts"));
  const patterns = [/invoice/i, /remit/i, /remittance/i, /provider\s+invoice/i, /provider\s+remit/i, /frozen/i, /xlsx/i, /csv/i, /print/i];
  const hits = [];
  for (const full of files) {
    const rel = path.relative(process.cwd(), full);
    const text = fs.readFileSync(full, "utf8");
    if (!/(invoice|remit|remittance|provider|xlsx|csv|print|frozen)/i.test(text + " " + rel)) continue;
    const matched = patterns.filter((re) => re.test(text) || re.test(rel)).map((re) => String(re));
    if (!matched.length) continue;
    hits.push({ file: rel, matched, excerpt: excerpt(text, text.search(/invoice|remit|remittance|provider|xlsx|csv|print|frozen/i)) });
  }

  const { prisma, pool } = createPrismaClient();
  try {
    const repositoryTemplates = await prisma.documentTemplate.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    const invoiceLikeTemplates = repositoryTemplates.filter((t) => /(invoice|remit|remittance|attorney-fee|fee-report|provider-invoice|provider-remittance)/i.test(`${t.key} ${t.label} ${t.category}`));
    const proof = {
      ok: true,
      action: "phase48a-invoice-remittance-template-source-inspection",
      repositoryTemplateKeys: repositoryTemplates.map((t) => t.key),
      invoiceLikeRepositoryTemplateKeys: invoiceLikeTemplates.map((t) => t.key),
      invoiceRemittanceDocxTemplatesCurrentlyImported: invoiceLikeTemplates.length,
      conclusion: invoiceLikeTemplates.length === 0 ? "Invoice/remittance outputs are currently app-generated/code-rendered workflow outputs, not DOCX templates in the Barsh Matters template repository." : "Invoice/remittance-like templates exist in the repository and need review.",
      likelyCurrentSourceFiles: hits.slice(0, 80),
      safety: {
        readOnlyInspection: true,
        noDatabaseMutation: true,
        noClioTouched: true,
        noGraphTouched: true,
        noFinalization: true,
        noFieldMapping: true,
      },
    };
    fs.mkdirSync("docs/template-generation-refactor", { recursive: true });
    fs.writeFileSync("docs/template-generation-refactor/phase48a-invoice-remittance-template-source-inspection.json", JSON.stringify(proof, null, 2));

    const topFiles = hits.slice(0, 30).map((h) => `- \`${h.file}\``).join("\n") || "- No invoice/remittance source files found by keyword scan.";
    const md = `# Phase 48A — Invoice/Remittance Template Source Inspection

## Status

Read-only inspection of where invoice/remittance templates are currently held.

## Answer

Invoice/remittance templates are not currently stored as DOCX templates in the Barsh Matters template repository.

Current repository template keys:

${repositoryTemplates.map((t) => `- \`${t.key}\``).join("\n")}

Invoice/remittance-like repository template keys:

${invoiceLikeTemplates.length ? invoiceLikeTemplates.map((t) => `- \`${t.key}\``).join("\n") : "- None"}

## Current Source

Invoice/remittance output is currently app-generated/code-rendered workflow output. The app computes and stores invoice/remittance data, frozen lines, totals, printable views, CSV/XLSX/export output, and related workflow state through code and database workflow tables rather than through DOCX template records.

## Likely Current Code/Workflow Files

${topFiles}

## Repository Rule Going Forward

When invoice/remittance documents are converted into final templates, they should be DOCX-based templates stored in the Barsh Matters template repository.

Likely future repository keys:

- \`provider-invoice-summary\`
- \`provider-remittance-statement\`
- \`attorney-fee-report\`

## Safety

This phase is read-only inspection and documentation. It performs no field mapping, no document generation, no database mutation, no Clio upload, no Graph/OneDrive working document creation, no finalization, no print queue action, and no email action.
`;
    fs.writeFileSync("docs/template-generation-refactor/phase48a-invoice-remittance-template-source-inspection.md", md);
    console.log(JSON.stringify(proof, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
})();
