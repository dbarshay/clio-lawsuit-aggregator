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
    const limitRaw = Number(req.nextUrl.searchParams.get("limit") || 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(50, Math.floor(limitRaw)))
      : 10;

    if (!masterLawsuitId) {
      return NextResponse.json(
        { ok: false, error: "Missing masterLawsuitId" },
        { status: 400 }
      );
    }

    const rows = await prisma.documentFinalization.findMany({
      where: { masterLawsuitId },
      orderBy: { finalizedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      action: "finalization-history",
      masterLawsuitId,
      count: rows.length,
      rows: rows.map((row) => ({
        id: row.id,
        masterLawsuitId: row.masterLawsuitId,
        masterMatterId: row.masterMatterId,
        masterDisplayNumber: row.masterDisplayNumber,
        status: row.status,
        requestedKeys: toJsonSafe(row.requestedKeys),
        uploaded: toJsonSafe(row.uploaded),
        skipped: toJsonSafe(row.skipped),
        clioUploadTarget: toJsonSafe(row.clioUploadTarget),
        validationSnapshot: toJsonSafe(row.validationSnapshot),
        packetSummarySnapshot: toJsonSafe(row.packetSummarySnapshot),
        allowDuplicateUploads: row.allowDuplicateUploads,
        noUploadPerformed: row.noUploadPerformed,
        error: row.error,
        finalizedAt: row.finalizedAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      safety: {
        readOnly: true,
        localAuditHistoryOnly: true,
        clioDocumentsTabRemainsSourceOfTruth: true,
        noClioRecordsChanged: true,
        noDatabaseRecordsChanged: true,
        noOneDriveOrSharePointFoldersCreated: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "finalization-history",
        error: err?.message || "Could not load document finalization history.",
        safety: {
          readOnly: true,
          localAuditHistoryOnly: true,
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noOneDriveOrSharePointFoldersCreated: true,
        },
      },
      { status: 500 }
    );
  }
}
