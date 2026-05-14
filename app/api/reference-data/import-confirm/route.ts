import { NextRequest, NextResponse } from "next/server";
import { createMatterAuditLogEntry } from "@/lib/auditLog";
import { prisma } from "@/lib/prisma";
import {
  buildReferenceImportPreview,
  mergeImportDetails,
  safetyConfirmedImport,
} from "@/lib/referenceImport";
import { cleanReferenceText, normalizeReferenceText } from "@/lib/referenceData";

export const runtime = "nodejs";

function actorFromBody(body: any) {
  return {
    actorName: cleanReferenceText(body?.actorName) || "Barsh Matters User",
    actorEmail: cleanReferenceText(body?.actorEmail) || null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body?.confirm !== true) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-import-confirm",
          error: "Confirmed import requires confirm: true.",
          safety: {
            ...safetyConfirmedImport(),
            databaseRecordsChanged: false,
            noDatabaseRecordsChanged: true,
          },
        },
        { status: 400 }
      );
    }

    const preview = await buildReferenceImportPreview({
      type: body?.type,
      csvText: String(body?.csvText ?? ""),
      columnMappings: body?.columnMappings || {},
    });

    if (preview.summary.invalidRows > 0 || preview.summary.duplicateOrConflictRows > 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-import-confirm",
          error: "Import blocked.  Resolve invalid or duplicate/conflict rows before confirming import.",
          preview,
          safety: {
            ...safetyConfirmedImport(),
            databaseRecordsChanged: false,
            noDatabaseRecordsChanged: true,
          },
        },
        { status: 400 }
      );
    }

    const importableRows = preview.rowPreviews.filter(
      (row) => row.classification === "create" || row.classification === "update"
    );

    const actor = actorFromBody(body);
    const result = {
      created: 0,
      updated: 0,
      aliasesCreated: 0,
      aliasesSkippedExisting: 0,
      rowsImported: importableRows.length,
      importedRows: [] as Array<{
        rowNumber: number;
        action: "create" | "update";
        entityId: string;
        displayName: string;
        aliasesCreated: number;
        aliasesSkippedExisting: number;
      }>,
    };

    for (const row of importableRows) {
      const data = {
        type: preview.type,
        displayName: row.displayName,
        normalizedName: row.normalizedName,
        active: row.proposed.active ?? true,
        notes: cleanReferenceText(row.proposed.notes) || null,
        source: cleanReferenceText(row.proposed.source) || "barsh-matters-import",
      };

      const entity =
        row.classification === "create"
          ? await prisma.referenceEntity.create({
              data: {
                ...data,
                details: mergeImportDetails(null, row.proposed.detailsVisible, row.proposed.detailsHidden),
              },
              include: { aliases: true },
            })
          : await prisma.referenceEntity.update({
              where: { id: row.existingEntity?.id },
              data: {
                displayName: data.displayName,
                normalizedName: data.normalizedName,
                active: data.active,
                notes: data.notes,
                source: data.source,
                details: mergeImportDetails(
                  row.existingEntity?.details,
                  row.proposed.detailsVisible,
                  row.proposed.detailsHidden
                ),
              },
              include: { aliases: true },
            });

      if (row.classification === "create") {
        result.created += 1;
      } else {
        result.updated += 1;
      }

      let aliasesCreatedForRow = 0;
      let aliasesSkippedForRow = 0;
      const existingAliasSet = new Set(entity.aliases.map((alias) => alias.normalizedAlias));

      for (const alias of row.proposed.aliases) {
        const normalizedAlias = normalizeReferenceText(alias);
        if (!normalizedAlias || existingAliasSet.has(normalizedAlias)) {
          aliasesSkippedForRow += 1;
          continue;
        }

        try {
          await prisma.referenceAlias.create({
            data: {
              entityId: entity.id,
              alias,
              normalizedAlias,
            },
          });
          existingAliasSet.add(normalizedAlias);
          aliasesCreatedForRow += 1;
        } catch (err: any) {
          if (err?.code === "P2002") {
            aliasesSkippedForRow += 1;
          } else {
            throw err;
          }
        }
      }

      result.aliasesCreated += aliasesCreatedForRow;
      result.aliasesSkippedExisting += aliasesSkippedForRow;
      result.importedRows.push({
        rowNumber: row.rowNumber,
        action: row.classification as "create" | "update",
        entityId: entity.id,
        displayName: entity.displayName,
        aliasesCreated: aliasesCreatedForRow,
        aliasesSkippedExisting: aliasesSkippedForRow,
      });
    }

    await createMatterAuditLogEntry({
      action: "reference_data_csv_import_confirmed",
      summary: `Imported ${result.rowsImported} ${preview.typeLabel} reference-data row${result.rowsImported === 1 ? "" : "s"}`,
      entityType: "reference_entity",
      fieldName: "csv_import",
      priorValue: null,
      newValue: result,
      details: {
        localReferenceData: true,
        clioData: false,
        type: preview.type,
        typeLabel: preview.typeLabel,
        summary: preview.summary,
        mappingSummary: preview.mappingSummary,
      },
      sourcePage: "admin-reference-data",
      workflow: "reference-data",
      actorName: actor.actorName,
      actorEmail: actor.actorEmail,
    });

    return NextResponse.json({
      ok: true,
      action: "reference-import-confirm",
      type: preview.type,
      typeLabel: preview.typeLabel,
      summary: result,
      previewSummary: preview.summary,
      safety: safetyConfirmedImport(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "reference-import-confirm",
        error: err?.message || "Unknown reference import confirm error.",
        safety: {
          ...safetyConfirmedImport(),
          databaseRecordsChanged: false,
          noDatabaseRecordsChanged: true,
        },
      },
      { status: 500 }
    );
  }
}
