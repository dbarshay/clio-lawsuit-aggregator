#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function loadLocalEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const equalsIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnvFile(path.join(process.cwd(), ".env.local"));
loadLocalEnvFile(path.join(process.cwd(), ".env"));

const databaseUrl =
  process.env.POSTGRES_DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("No Postgres database URL found.");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["error"] });

const TYPE = "provider_client";

const MANUAL_OVERRIDES = new Map([
  ["BL PAIN MANAGEMENT, PLLC", "BL Pain Management, PLLC"],
  ["LR MEDICAL, PLLC", "LR Medical, PLLC"],
]);

function clean(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeReferenceText(value) {
  return clean(value).toLowerCase();
}

function normalizeProviderName(value) {
  const original = clean(value);
  if (!original) return "";

  if (MANUAL_OVERRIDES.has(original)) return MANUAL_OVERRIDES.get(original);

  let s = original
    .replace(/\bD\s*\/\s*B\s*\/\s*A\b/gi, "d/b/a")
    .replace(/\bDBA\b/gi, "d/b/a")
    .replace(/\bP\.?\s*C\.?\b/gi, "P.C.")
    .replace(/\bD\.?\s*C\.?\b/gi, "D.C.")
    .replace(/\bD\.?\s*O\.?\b/gi, "D.O.")
    .replace(/\bM\.?\s*D\.?\b/gi, "M.D.")
    .replace(/\bC\.?\s*A\.?\s*C\.?\b/gi, "C.A.C.")
    .replace(/\bL\.?\s*A\.?\s*C\.?\b/gi, "LAC")
    .replace(/\bL\.?\s*L\.?\s*C\.?\b/gi, "LLC")
    .replace(/\bL\.?\s*L\.?\s*P\.?\b/gi, "LLP")
    .replace(/\bP\.?\s*L\.?\s*L\.?\s*C\.?\b/gi, "PLLC")
    .replace(/\bINC\.?\b/gi, "Inc.")
    .replace(/\bCORP\.?\b/gi, "Corp.")
    .replace(/\bLTD\.?\b/gi, "Ltd.")
    .replace(/\bNYC\b/gi, "NYC")
    .replace(/\bNY\b/gi, "NY")
    .replace(/\bLI\b/gi, "LI");

  const preserveWords = new Set([
    "NY", "NYC", "LI", "MRI", "CT", "PT", "OT", "EMG", "NCV", "DME", "LAC",
    "LLC", "LLP", "PLLC"
  ]);
  const professionalWithPeriods = new Set(["P.C.", "D.C.", "D.O.", "M.D.", "C.A.C."]);
  const corporateWithPeriods = new Set(["Inc.", "Corp.", "Ltd."]);
  const smallWords = new Set(["and", "of", "the", "for", "in", "on", "at", "to", "an"]);

  const tokens = s.split(/(\s+|[-/&,.()])/);

  const out = tokens.map((token, index) => {
    if (!token || /^[\s\-\/&,.()]+$/.test(token)) return token;

    const upper = token.toUpperCase();
    const lower = token.toLowerCase();
    const next = tokens[index + 1] || "";
    const prev = tokens[index - 1] || "";

    if (token === "d/b/a") return "d/b/a";
    if (professionalWithPeriods.has(token)) return token;
    if (corporateWithPeriods.has(token)) return token;
    if (preserveWords.has(upper)) return upper;

    if (/^[A-Z]$/i.test(token) && (next === "." || prev === "&" || tokens[index - 2] === "&")) {
      return upper;
    }

    if (smallWords.has(lower)) {
      const hasWordBefore = tokens.slice(0, index).some((t) => /\w/.test(t));
      const hasWordAfter = tokens.slice(index + 1).some((t) => /\w/.test(t));
      if (hasWordBefore && hasWordAfter) return lower;
    }

    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  }).join("");

  return out
    .replace(/\b(P\.C|D\.C|D\.O|M\.D|C\.A\.C|Inc|Corp|Ltd)\.\./g, "$1.")
    .replace(/\bP\.C\b(?!\.)/g, "P.C.")
    .replace(/\bD\.C\b(?!\.)/g, "D.C.")
    .replace(/\bD\.O\b(?!\.)/g, "D.O.")
    .replace(/\bM\.D\b(?!\.)/g, "M.D.")
    .replace(/\bC\.A\.C\b(?!\.)/g, "C.A.C.")
    .replace(/\bInc\b(?!\.)/g, "Inc.")
    .replace(/\bCorp\b(?!\.)/g, "Corp.")
    .replace(/\bLtd\b(?!\.)/g, "Ltd.")
    .replace(/\b(P\.C|D\.C|D\.O|M\.D|C\.A\.C|Inc|Corp|Ltd)\.\s*,/g, "$1.,")
    .replace(/\bD\/B\/A\b/gi, "d/b/a")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const rows = await prisma.referenceEntity.findMany({
    where: { type: TYPE },
    select: {
      id: true,
      type: true,
      displayName: true,
      normalizedName: true,
      active: true,
      details: true,
      source: true,
    },
    orderBy: [{ displayName: "asc" }],
    take: 10000,
  });

  const proposed = rows.map((row) => ({
    ...row,
    proposedDisplayName: normalizeProviderName(row.displayName),
  }));

  const collisions = new Map();
  for (const row of proposed) {
    const key = normalizeReferenceText(row.proposedDisplayName);
    collisions.set(key, [...(collisions.get(key) || []), row]);
  }

  const duplicateProposals = [...collisions.values()].filter((items) => items.length > 1);
  if (duplicateProposals.length > 0) {
    console.log("RESULT: provider/client normalization blocked");
    console.log(`DUPLICATE_PROPOSALS=${duplicateProposals.length}`);
    for (const group of duplicateProposals) {
      console.log(group.map((row) => `${row.displayName}=>${row.proposedDisplayName}`).join(" | "));
    }
    process.exit(1);
  }

  const changed = proposed.filter((row) => row.displayName !== row.proposedDisplayName);

  let updated = 0;
  let aliasesCreatedOrUpdated = 0;

  for (const row of changed) {
    const originalDisplayName = row.displayName;
    const nextDisplayName = row.proposedDisplayName;

    await prisma.referenceEntity.update({
      where: { id: row.id },
      data: {
        displayName: nextDisplayName,
        details: {
          ...(row.details && typeof row.details === "object" ? row.details : {}),
          providerClientDisplayNameNormalizedAt: new Date().toISOString(),
          providerClientOriginalDisplayName: originalDisplayName,
          providerClientNormalizationSource: "normalize-provider-client-display-names",
        },
      },
    });

    for (const alias of new Set([originalDisplayName, nextDisplayName].map(clean).filter(Boolean))) {
      await prisma.referenceAlias.upsert({
        where: {
          entityId_normalizedAlias: {
            entityId: row.id,
            normalizedAlias: normalizeReferenceText(alias),
          },
        },
        create: {
          entityId: row.id,
          alias,
          normalizedAlias: normalizeReferenceText(alias),
        },
        update: {
          alias,
        },
      });
      aliasesCreatedOrUpdated++;
    }

    updated++;
  }

  const total = await prisma.referenceEntity.count({ where: { type: TYPE } });
  const active = await prisma.referenceEntity.count({ where: { type: TYPE, active: true } });

  console.log("RESULT: normalized provider/client display names");
  console.log(`TYPE=${TYPE}`);
  console.log(`TOTAL=${total}`);
  console.log(`ACTIVE=${active}`);
  console.log(`UPDATED=${updated}`);
  console.log(`ALIASES_CREATED_OR_UPDATED=${aliasesCreatedOrUpdated}`);
  console.log(`DUPLICATE_PROPOSALS=0`);
  console.log("WRITES_REFERENCE_ENTITY=true");
  console.log("WRITES_REFERENCE_ALIAS=true");
  console.log("WRITES_CLIO=false");
}

main()
  .catch((error) => {
    console.error("FAIL: normalize provider/client display names failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
