import { NextRequest, NextResponse } from "next/server";
import { createMatterAuditLogEntry } from "@/lib/auditLog";
import { prisma } from "@/lib/prisma";
import {
  cleanReferenceText,
  normalizeReferenceEntityType,
  normalizeReferenceText,
} from "@/lib/referenceData";

export const runtime = "nodejs";

function safetyCleanupConfirm(databaseRecordsChanged = true) {
  return {
    localBarshMattersReferenceData: true,
    previewOnly: false,
    databaseRecordsChanged,
    noDatabaseRecordsChanged: !databaseRecordsChanged,
    clioData: false,
    noClioRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    hardDeleteSupported: false,
    hardDeletePerformed: false,
    deactivateOnly: true,
    aliasesDeleted: false,
  };
}

function actorFromBody(body: any) {
  return {
    actorName: cleanReferenceText(body?.actorName) || "Barsh Matters User",
    actorEmail: cleanReferenceText(body?.actorEmail) || null,
  };
}

function safeLimit(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(250, Math.floor(n)));
}

async function findEligibleRows(input: { type: unknown; q: unknown; limit: unknown }) {
  const type = normalizeReferenceEntityType(input.type || "individual");
  const query = cleanReferenceText(input.q);
  const normalizedQuery = normalizeReferenceText(query);
  const limit = safeLimit(input.limit);

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

  const rows = await prisma.referenceEntity.findMany({
    where,
    include: { aliases: { orderBy: { alias: "asc" } } },
    orderBy: [{ updatedAt: "desc" }, { displayName: "asc" }],
    take: limit,
  });

  return { type, query, limit, rows };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body?.confirm !== true) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-import-cleanup-confirm",
          error: "Confirmed cleanup requires confirm: true.",
          safety: safetyCleanupConfirm(false),
        },
        { status: 400 }
      );
    }

    const { type, query, limit, rows } = await findEligibleRows({
      type: body?.type,
      q: body?.q,
      limit: body?.limit,
    });

    if (!rows.length) {
      return NextResponse.json({
        ok: true,
        action: "reference-import-cleanup-confirm",
        type,
        query,
        summary: {
          matchedEligibleRows: 0,
          deactivated: 0,
          skipped: 0,
          deactivatedRows: [],
        },
        safety: safetyCleanupConfirm(false),
      });
    }

    const actor = actorFromBody(body);
    const deactivatedRows: Array<{
      id: string;
      displayName: string;
      aliasCount: number;
      source: string;
    }> = [];

    for (const row of rows) {
      const updated = await prisma.referenceEntity.update({
        where: { id: row.id },
        data: { active: false },
        include: { aliases: true },
      });

      deactivatedRows.push({
        id: updated.id,
        displayName: updated.displayName,
        aliasCount: updated.aliases.length,
        source: updated.source,
      });
    }

    const summary = {
      matchedEligibleRows: rows.length,
      deactivated: deactivatedRows.length,
      skipped: 0,
      deactivatedRows,
    };

    await createMatterAuditLogEntry({
      action: "reference_import_cleanup_confirmed",
      summary: `Deactivated ${summary.deactivated} imported ${type} reference record${summary.deactivated === 1 ? "" : "s"}`,
      entityType: "reference_entity",
      fieldName: "active",
      priorValue: { active: true, source: "barsh-matters-import", type, query, limit },
      newValue: summary,
      details: {
        localReferenceData: true,
        clioData: false,
        type,
        query,
        deactivateOnly: true,
        hardDeletePerformed: false,
        aliasesDeleted: false,
      },
      sourcePage: "admin-reference-data",
      workflow: "reference-data",
      actorName: actor.actorName,
      actorEmail: actor.actorEmail,
    });

    return NextResponse.json({
      ok: true,
      action: "reference-import-cleanup-confirm",
      type,
      query,
      summary,
      safety: safetyCleanupConfirm(true),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "reference-import-cleanup-confirm",
        error: err?.message || "Unknown reference import cleanup confirm error.",
        safety: safetyCleanupConfirm(false),
      },
      { status: 500 }
    );
  }
}
