import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function compact<T>(values: T[]): T[] {
  return values.filter(Boolean);
}

function aliasTexts(entity: any): string[] {
  const aliases = Array.isArray(entity?.aliases) ? entity.aliases : [];
  return aliases
    .map((alias: any) => clean(alias?.alias || alias?.displayName || alias?.name || alias?.value))
    .filter(Boolean);
}

function detailObject(entity: any): Record<string, unknown> {
  const details = entity?.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    return details as Record<string, unknown>;
  }
  return {};
}

function infoDetailsObject(entity: any): Record<string, unknown> {
  const fallback = detailObject(entity);
  const info = entity?.providerClientInfo;
  if (!info) return fallback;

  const hidden: Record<string, unknown> = {
    ...(fallback._hiddenImportFields && typeof fallback._hiddenImportFields === "object" && !Array.isArray(fallback._hiddenImportFields)
      ? (fallback._hiddenImportFields as Record<string, unknown>)
      : {}),
    hidden_owner: info.owner || undefined,
    hidden_group_name: info.providerGroup || undefined,
    hidden_retainer_principal_nf_percent: info.retainerNFPrincipal || undefined,
    hidden_retainer_interest_percent: info.retainerNFInterest || undefined,
    hidden_retainer_wc_principal_percent: info.retainerWCPrincipal || undefined,
    hidden_retainer_wc_interest_percent: info.retainerWCInterest || undefined,
    hidden_retainer_liens_principal_percent: info.retainerLiensPrincipal || undefined,
    hidden_retainer_liens_interest_percent: info.retainerLiensInterest || undefined,
    hidden_pull_costs: info.pullCosts || undefined,
    hidden_remit: info.remit || undefined,
  };

  Object.keys(hidden).forEach((key) => hidden[key] === undefined && delete hidden[key]);

  return {
    ...fallback,
    address: info.address || fallback.address,
    notes: info.notes || fallback.notes,
    _hiddenImportFields: hidden,
  };
}

function primaryName(entity: any): string {
  return clean(
    entity?.displayName ||
      entity?.name ||
      entity?.referenceName ||
      entity?.reference_name ||
      detailObject(entity).provider_name ||
      detailObject(entity).client_name ||
      detailObject(entity).reference_name
  );
}

function pickDetail(details: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = clean(details[key]);
    if (value) return value;
  }
  return "";
}

function clientSummary(entity: any) {
  const details = infoDetailsObject(entity);
  const name = primaryName(entity);
  return {
    id: String(entity?.id ?? ""),
    type: clean(entity?.type),
    displayName: name,
    normalizedName: clean(entity?.normalizedName || entity?.normalizedDisplayName || entity?.normalized_name),
    isActive: entity?.active !== false,
    source: clean(entity?.source || entity?.importSource || details.source),
    aliases: aliasTexts(entity),
    detailKeys: Object.keys(details).sort(),
    address: compact([
      pickDetail(details, ["address", "street", "hidden_street", "address_line_1", "addressLine1"]),
      pickDetail(details, ["address2", "suite", "hidden_suite", "address_line_2", "addressLine2"]),
      compact([
        pickDetail(details, ["city", "hidden_city"]),
        pickDetail(details, ["state", "hidden_state"]),
        pickDetail(details, ["zip", "zipcode", "hidden_zipcode", "postal_code"]),
      ]).join(", "),
    ]).join(" • "),
    phone: pickDetail(details, ["phone", "hidden_phone", "telephone"]),
    fax: pickDetail(details, ["fax", "hidden_fax"]),
    email: pickDetail(details, ["email", "hidden_email", "billing_email", "remittance_email"]),
    website: pickDetail(details, ["website", "hidden_website"]),
    createdAt: entity?.createdAt ?? null,
    updatedAt: entity?.updatedAt ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const q = lower(url.searchParams.get("q"));
    const activeParam = lower(url.searchParams.get("active") || "active");
    const includeInactive = activeParam === "all" || activeParam === "inactive";
    const inactiveOnly = activeParam === "inactive";
    const take = Math.min(Math.max(Number(url.searchParams.get("take") || 250), 1), 1000);

    const entities = await (prisma as any).referenceEntity.findMany({
      where: {
        type: "provider_client",
        ...(includeInactive
          ? inactiveOnly
            ? { active: false }
            : {}
          : { active: true }),
      },
      include: {
        aliases: {
          orderBy: { alias: "asc" },
        },
      },
      orderBy: [{ displayName: "asc" }],
      take,
    });

    const infoRows = entities.length
      ? await (prisma as any).providerClientInfo.findMany({
          where: { referenceEntityId: { in: entities.map((entity: any) => clean(entity.id)).filter(Boolean) } },
        })
      : [];
    const infoByReferenceEntityId = new Map(infoRows.map((info: any) => [clean(info.referenceEntityId), info]));

    const rows = entities.map((entity: any) => clientSummary({ ...entity, providerClientInfo: infoByReferenceEntityId.get(clean(entity.id)) })).filter((row: any) => {
      if (!q) return true;
      const haystack = [
        row.displayName,
        row.normalizedName,
        row.source,
        row.email,
        row.phone,
        row.address,
        ...(row.aliases || []),
        ...(row.detailKeys || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    return json({
      action: "admin-clients-list",
      sourceOfTruth: "Local Barsh Matters ProviderClientInfo plus ReferenceEntity/ReferenceAlias provider_client records",
      safety:
        "Read-only Admin Clients list. This route reads local reference data only. It does not call Clio, write payments, generate documents, send email, print, or queue anything.",
      count: rows.length,
      rows,
    });
  } catch (error: any) {
    return json(
      {
        action: "admin-clients-list",
        error: error?.message || "Admin Clients list failed.",
      },
      { status: 500 }
    );
  }
}
