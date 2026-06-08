import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function loadLocalEnvFiles() {
  for (const filename of [".env", ".env.local", ".env.development.local"]) {
    const filePath = resolve(process.cwd(), filename);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;

      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadLocalEnvFiles();

const databaseUrl =
  process.env.POSTGRES_DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("No Postgres database URL found.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ["error"],
});

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function findDetailValue(details: unknown, keys: string[]): string {
  const root = asObject(details);
  const hidden = asObject(root._hiddenImportFields);
  const entries = [...Object.entries(root), ...Object.entries(hidden)];

  const compact = (value: unknown) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const wanted = keys.map(compact);

  for (const key of wanted) {
    const exact = entries.find(([entryKey]) => compact(entryKey) === key);
    if (exact) return clean(exact[1]);
  }

  for (const key of wanted) {
    const fuzzy = entries.find(([entryKey]) => compact(entryKey).includes(key));
    if (fuzzy) return clean(fuzzy[1]);
  }

  return "";
}

function addressFromDetails(details: unknown): string {
  const direct = findDetailValue(details, ["address", "full_address", "mailing_address"]);
  if (direct) return direct.replace(/\s*•\s*/g, "\n").replace(/,\s*(\d{5}(?:-\d{4})?)\s*$/gm, " $1");

  const street = findDetailValue(details, ["hidden_street", "street", "address_line_1", "address1"]);
  const street2 = findDetailValue(details, ["hidden_suite", "suite", "address_line_2", "address2"]);
  const city = findDetailValue(details, ["hidden_city", "city"]);
  const state = findDetailValue(details, ["hidden_state", "state"]);
  const zip = findDetailValue(details, ["hidden_zipcode", "hidden_zip", "zip", "zipcode", "postal_code"]);
  const cityState = [city, state].filter(Boolean).join(", ");
  const cityStateZip = cityState && zip ? `${cityState} ${zip}` : cityState || zip;

  return [street, street2, cityStateZip].filter(Boolean).join("\n");
}

function dataFromReferenceEntity(entity: { id: string; displayName: string | null; details: unknown }) {
  const details = asObject(entity.details);

  return {
    referenceEntityId: entity.id,
    displayNameSnapshot: clean(entity.displayName) || null,
    address: addressFromDetails(details) || null,
    owner: findDetailValue(details, ["hidden_owner", "owner", "Owner", "assigned_owner", "account_owner", "client_owner"]) || null,
    providerGroup: findDetailValue(details, ["hidden_group_name", "group_name", "provider_group", "Provider Group", "Group Name"]) || null,
    retainerNFPrincipal:
      findDetailValue(details, [
        "hidden_retainer_principal_nf_percent",
        "retainer_nf_principal_percent",
        "Retainer NF Principal",
        "Retainer Principal NF",
        "NF Principal",
        "Principal Fee Percent",
        "Principal Fee %",
      ]) || null,
    retainerNFInterest:
      findDetailValue(details, [
        "hidden_retainer_interest_percent",
        "hidden_retainer_nf_interest_percent",
        "retainer_nf_interest_percent",
        "Retainer NF Interest",
        "Retainer Interest",
        "NF Interest",
        "Interest Fee Percent",
        "Interest Fee %",
      ]) || null,
    retainerWCPrincipal:
      findDetailValue(details, ["hidden_retainer_wc_principal_percent", "retainer_wc_principal_percent", "Retainer WC Principal", "WC Principal"]) || null,
    retainerWCInterest:
      findDetailValue(details, ["hidden_retainer_wc_interest_percent", "retainer_wc_interest_percent", "Retainer WC Interest", "WC Interest"]) || null,
    retainerLiensPrincipal:
      findDetailValue(details, [
        "hidden_retainer_liens_principal_percent",
        "hidden_retainer_lien_principal_percent",
        "retainer_liens_principal_percent",
        "retainer_lien_principal_percent",
        "Retainer Liens Principal",
        "Retainer Lien Principal",
        "Liens Principal",
        "Lien Principal",
      ]) || null,
    retainerLiensInterest:
      findDetailValue(details, [
        "hidden_retainer_liens_interest_percent",
        "hidden_retainer_lien_interest_percent",
        "retainer_liens_interest_percent",
        "retainer_lien_interest_percent",
        "Retainer Liens Interest",
        "Retainer Lien Interest",
        "Liens Interest",
        "Lien Interest",
      ]) || null,
    pullCosts: findDetailValue(details, ["hidden_pull_costs", "pull_costs", "Pull Costs", "Pull Cost"]) || null,
    remit: findDetailValue(details, ["hidden_remit", "remit", "Remit", "remit_type", "remit_account"]) || null,
    notes: findDetailValue(details, ["notes", "note", "comments", "comment", "remarks", "remark", "memo", "internal_notes", "hidden_notes"]) || null,
    source: "backfill-reference-entity-details",
  };
}

async function main() {
  const rows = await prisma.referenceEntity.findMany({
    where: { type: "provider_client" },
    select: {
      id: true,
      displayName: true,
      details: true,
    },
  });

  let upserted = 0;

  for (const row of rows) {
    const data = dataFromReferenceEntity(row);
    await prisma.providerClientInfo.upsert({
      where: { referenceEntityId: row.id },
      create: data,
      update: data,
    });
    upserted += 1;
  }

  console.log(`PROVIDER_CLIENT_INFO_BACKFILL_COUNT=${upserted}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
