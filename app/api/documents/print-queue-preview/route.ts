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

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function positiveInt(value: unknown, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(n)));
}

function buildCandidateDocuments(row: any) {
  const uploaded = asArray(toJsonSafe(row.uploaded));

  return uploaded
    .filter((doc) => clean(doc?.filename))
    .map((doc) => ({
      key: clean(doc.key),
      label: clean(doc.label),
      filename: clean(doc.filename),
      byteLength: Number.isFinite(Number(doc.byteLength))
        ? Number(doc.byteLength)
        : null,
      clioDocumentId: clean(doc.clioDocumentId),
      clioDocumentName: clean(doc.clioDocumentName),
      clioDocumentVersionUuid: clean(doc.clioDocumentVersionUuid),
      fullyUploaded: doc.fullyUploaded === true,
      printCandidateReason:
        "Document appears in local DocumentFinalization uploaded[] audit data.",
      currentClioExistenceVerified: false,
    }));
}

export async function GET(req: NextRequest) {
  try {
    const limit = positiveInt(req.nextUrl.searchParams.get("limit"), 25, 100);
    const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

    const rows = await prisma.documentFinalization.findMany({
      where: {
        ...(masterLawsuitId ? { masterLawsuitId } : {}),
        status: "uploaded-to-clio",
        noUploadPerformed: false,
      },
      orderBy: { finalizedAt: "desc" },
      take: limit,
    });

    const finalizations = rows
      .map((row) => {
        const uploadedDocuments = buildCandidateDocuments(row);

        return {
          finalizationId: row.id,
          masterLawsuitId: row.masterLawsuitId,
          masterMatterId: row.masterMatterId,
          masterDisplayNumber: row.masterDisplayNumber,
          status: row.status,
          finalizedAt: row.finalizedAt.toISOString(),
          requestedKeys: toJsonSafe(row.requestedKeys),
          uploadedDocumentCount: uploadedDocuments.length,
          uploadedDocuments,
          skipped: toJsonSafe(row.skipped),
          clioUploadTarget: toJsonSafe(row.clioUploadTarget),
          packetSummarySnapshot: toJsonSafe(row.packetSummarySnapshot),
          validationSnapshot: toJsonSafe(row.validationSnapshot),
          localAuditOnly: true,
          currentClioExistenceVerified: false,
        };
      })
      .filter((row) => row.uploadedDocumentCount > 0);

    const candidateDocuments = finalizations.flatMap((row) =>
      row.uploadedDocuments.map((doc: any) => ({
        finalizationId: row.finalizationId,
        masterLawsuitId: row.masterLawsuitId,
        masterMatterId: row.masterMatterId,
        masterDisplayNumber: row.masterDisplayNumber,
        finalizedAt: row.finalizedAt,
        ...doc,
      }))
    );

    return NextResponse.json({
      ok: true,
      action: "print-queue-preview",
      generatedAt: new Date().toISOString(),
      masterLawsuitId: masterLawsuitId || null,
      finalizationCount: finalizations.length,
      candidateDocumentCount: candidateDocuments.length,
      finalizations,
      candidateDocuments,
      safety: {
        readOnly: true,
        previewOnly: true,
        localAuditHistoryOnly: true,
        currentClioExistenceVerified: false,
        clioDocumentsTabRemainsSourceOfTruth: true,
        noClioRecordsChanged: true,
        noDatabaseRecordsChanged: true,
        noPrintQueueRecordsCreated: true,
        noOneDriveOrSharePointFoldersCreated: true,
      },
      note:
        "This endpoint proposes print candidates from local DocumentFinalization audit records only.  It does not verify that the documents currently exist in Clio and must not be treated as the final source of truth.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "print-queue-preview",
        error: err?.message || "Could not load print queue preview.",
        safety: {
          readOnly: true,
          previewOnly: true,
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noPrintQueueRecordsCreated: true,
          noOneDriveOrSharePointFoldersCreated: true,
        },
      },
      { status: 500 }
    );
  }
}
