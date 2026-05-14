import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  cleanReferenceText,
  normalizeReferenceEntityType,
  normalizeReferenceText,
  referenceTypeOptions,
} from "@/lib/referenceData";

export const runtime = "nodejs";

function safetyCleanupPreview() {
  return {
    localBarshMattersReferenceData: true,
    previewOnly: true,
    databaseRecordsChanged: false,
    noDatabaseRecordsChanged: true,
    clioData: false,
    noClioRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    hardDeleteSupported: false,
    hardDeletePerformed: false,
    deactivateOnly: true,
    confirmedCleanupSupported: false,
  };
}

function safeLimit(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(250, Math.floor(n)));
}

function asObject(value: unknown): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return {};
}

function isImportedReferenceSource(source: unknown) {
  const cleaned = cleanReferenceText(source);
  return cleaned === "barsh-matters-import";
}

export async function GET(req: NextRequest) {
  try {
    const rawType = cleanReferenceText(req.nextUrl.searchParams.get("type") || "individual");
    const type = normalizeReferenceEntityType(rawType);
    const query = cleanReferenceText(req.nextUrl.searchParams.get("q"));
    const normalizedQuery = normalizeReferenceText(query);
    const limit = safeLimit(req.nextUrl.searchParams.get("limit"));

    const where: any = {
      type,
      active: true,
      source: "barsh-matters-import",
    };

    if (normalizedQuery) {
      where.OR = [
        { normalizedName: { contains: normalizedQuery, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
        {
          aliases: {
            some: {
              normalizedAlias: { contains: normalizedQuery, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const entities = await prisma.referenceEntity.findMany({
      where,
      include: { aliases: { orderBy: { alias: "asc" } } },
      orderBy: [{ updatedAt: "desc" }, { displayName: "asc" }],
      take: limit,
    });

    const rows = entities.map((entity) => {
      const details = asObject(entity.details);
      const hidden = asObject(details._hiddenImportFields);

      return {
        id: entity.id,
        type: entity.type,
        displayName: entity.displayName,
        normalizedName: entity.normalizedName,
        active: entity.active,
        source: entity.source,
        notes: entity.notes,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        aliasCount: entity.aliases.length,
        aliases: entity.aliases.map((alias) => ({
          id: alias.id,
          alias: alias.alias,
          normalizedAlias: alias.normalizedAlias,
        })),
        visibleDetailKeys: Object.keys(details).filter((key) => key !== "_hiddenImportFields"),
        hiddenInternalDetailKeys: Object.keys(hidden),
        eligibleForDeactivate: entity.active && isImportedReferenceSource(entity.source),
        blockedReasons:
          entity.active && isImportedReferenceSource(entity.source)
            ? []
            : [
                !entity.active ? "Already inactive." : "",
                !isImportedReferenceSource(entity.source) ? "Source is not barsh-matters-import." : "",
              ].filter(Boolean),
      };
    });

    return NextResponse.json({
      ok: true,
      action: "reference-import-cleanup-preview",
      type,
      typeOptions: referenceTypeOptions(),
      query,
      count: rows.length,
      eligibleCount: rows.filter((row) => row.eligibleForDeactivate).length,
      rows,
      safety: safetyCleanupPreview(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "reference-import-cleanup-preview",
        error: err?.message || "Unknown reference import cleanup preview error.",
        safety: safetyCleanupPreview(),
      },
      { status: 500 }
    );
  }
}
