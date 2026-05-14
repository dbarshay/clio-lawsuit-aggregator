import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  cleanReferenceText,
  normalizeReferenceEntityType,
  referenceTypeOptions,
} from "@/lib/referenceData";

export const runtime = "nodejs";

function safetyImportHistory() {
  return {
    localBarshMattersReferenceData: true,
    readOnly: true,
    databaseRecordsChanged: false,
    noDatabaseRecordsChanged: true,
    clioData: false,
    noClioRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    hardDeleteSupported: false,
  };
}

function safeLimit(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 25;
  return Math.max(1, Math.min(100, Math.floor(n)));
}

function asObject(value: unknown): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return {};
}

function summarizeAuditRow(row: any) {
  const details = asObject(row.details);
  const newValue = asObject(row.newValue);
  const summary = asObject(newValue);

  return {
    id: row.id,
    createdAt: row.createdAt,
    action: row.action,
    summaryText: row.summary,
    actorName: row.actorName,
    actorEmail: row.actorEmail,
    sourcePage: row.sourcePage,
    workflow: row.workflow,
    type: cleanReferenceText(details.type),
    typeLabel: cleanReferenceText(details.typeLabel),
    imported: {
      rowsImported: Number(summary.rowsImported || 0),
      created: Number(summary.created || 0),
      updated: Number(summary.updated || 0),
      aliasesCreated: Number(summary.aliasesCreated || 0),
      aliasesSkippedExisting: Number(summary.aliasesSkippedExisting || 0),
    },
    previewSummary: asObject(details.summary),
    mappingSummary: asObject(details.mappingSummary),
    importedRows: Array.isArray(summary.importedRows) ? summary.importedRows : [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const rawType = cleanReferenceText(req.nextUrl.searchParams.get("type"));
    const type = rawType && rawType !== "all" ? normalizeReferenceEntityType(rawType) : "";
    const limit = safeLimit(req.nextUrl.searchParams.get("limit"));

    const where: any = {
      action: "reference_data_csv_import_confirmed",
      workflow: "reference-data",
    };

    if (type) {
      where.details = {
        path: ["type"],
        equals: type,
      };
    }

    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      action: "reference-import-history",
      type: type || "all",
      typeOptions: referenceTypeOptions(),
      count: rows.length,
      imports: rows.map(summarizeAuditRow),
      safety: safetyImportHistory(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "reference-import-history",
        error: err?.message || "Unknown reference import history error.",
        safety: safetyImportHistory(),
      },
      { status: 500 }
    );
  }
}
