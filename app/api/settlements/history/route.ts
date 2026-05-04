import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function toJsonSafe(value: unknown): any {
  if (value == null) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));
    const limitRaw = Number(req.nextUrl.searchParams.get("limit") || 20);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
      : 20;

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-history",
          error: "Missing masterLawsuitId",
          safety: {
            readOnly: true,
            localAuditHistoryOnly: true,
            noClioRecordsChanged: true,
            noDatabaseRecordsChanged: true,
            noDocumentsGenerated: true,
            noPrintQueueRecordsChanged: true,
          },
        },
        { status: 400 }
      );
    }

    const rows = await prisma.settlementWriteback.findMany({
      where: { masterLawsuitId },
      orderBy: { finalizedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      action: "settlement-history",
      masterLawsuitId,
      count: rows.length,
      rows: rows.map((row) => ({
        id: row.id,
        masterLawsuitId: row.masterLawsuitId,
        status: row.status,
        grossSettlement: row.grossSettlement,
        settledWith: row.settledWith,
        settlementDate: row.settlementDate,
        allocationMode: row.allocationMode,
        childMatterIds: toJsonSafe(row.childMatterIds),
        previewSnapshot: toJsonSafe(row.previewSnapshot),
        readinessSnapshot: toJsonSafe(row.readinessSnapshot),
        writeResults: toJsonSafe(row.writeResults),
        safetySnapshot: toJsonSafe(row.safetySnapshot),
        error: row.error,
        noWritePerformed: row.noWritePerformed,
        finalizedAt: row.finalizedAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      safety: {
        readOnly: true,
        localAuditHistoryOnly: true,
        noClioRecordsChanged: true,
        noDatabaseRecordsChanged: true,
        noDocumentsGenerated: true,
        noPrintQueueRecordsChanged: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-history",
        error: err?.message || "Could not load settlement history.",
        safety: {
          readOnly: true,
          localAuditHistoryOnly: true,
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noDocumentsGenerated: true,
          noPrintQueueRecordsChanged: true,
        },
      },
      { status: 500 }
    );
  }
}
