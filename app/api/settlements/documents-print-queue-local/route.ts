import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value || "").trim();
}

function jsonObject(value: unknown): any {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as any;
}

function jsonArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function safeQueuePart(value: unknown): string {
  return clean(value)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function isSettlementFinalizationStatus(status: unknown): boolean {
  const value = clean(status);
  return (
    value === "local-settlement-finalized-placeholder" ||
    value === "local-settlement-finalized-pdf" ||
    value === "settlement-finalized-pdf" ||
    value === "settlement-finalized-document" ||
    value === "settlement-clio-duplicate-skipped" ||
    value === "settlement-uploaded-to-clio"
  );
}

function firstJsonObject(...values: unknown[]): any {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value as any;
  }
  return {};
}

function localQueueSafety(createdCount = 0, duplicateCount = 0) {
  return {
    localFirst: true,
    sourceOfTruth: "barsh-matters-local",
    printQueueRecordsCreated: createdCount,
    duplicateQueueRecordsSkipped: duplicateCount,
    databaseRecordsChanged: createdCount > 0,
    finalizedPdfGenerated: false,
    persistentFileCreated: false,
    noPdfPretended: true,
    clioRecordsChanged: false,
    clioDocumentsUploaded: false,
    emailsSent: false,
    outlookDraftsCreated: false,
    mattersClosed: false,
    oneDriveOrSharePointChanged: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const finalizationId = Number(body?.finalizationId);
    const confirmAdd = body?.confirmAdd === true;

    if (!confirmAdd) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-document-print-queue-local",
          error: "Print queue record was not created. This endpoint requires confirmAdd: true.",
          safety: localQueueSafety(0, 0),
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(finalizationId) || finalizationId <= 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-document-print-queue-local",
          error: "Missing valid finalizationId.",
          safety: localQueueSafety(0, 0),
        },
        { status: 400 }
      );
    }

    const finalization = await prisma.documentFinalization.findUnique({
      where: { id: Math.floor(finalizationId) },
    });

    if (!finalization) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-document-print-queue-local",
          error: `No DocumentFinalization record exists with id ${finalizationId}.`,
          safety: localQueueSafety(0, 0),
        },
        { status: 404 }
      );
    }

    if (!isSettlementFinalizationStatus(finalization.status)) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-document-print-queue-local",
          error: "Only local settlement finalized-document records may be queued by this route.",
          finalizationStatus: finalization.status,
          safety: localQueueSafety(0, 0),
        },
        { status: 400 }
      );
    }

    const packetSummary = jsonObject(finalization.packetSummarySnapshot);
    const selectedDocument = jsonObject(packetSummary.selectedDocument);
    const generatedDocument = jsonObject(selectedDocument.generatedDocument || packetSummary.generatedDocument);
    const uploaded = jsonArray(finalization.uploaded);
    const skipped = jsonArray(finalization.skipped);
    const deliveryCandidate = firstJsonObject(uploaded[0], skipped[0]);
    const fallbackSkipped = jsonObject(skipped[0]);

    const documentKey = clean(selectedDocument.key || deliveryCandidate.key || fallbackSkipped.key || "settlement-document");
    const documentLabel = clean(selectedDocument.templateLabel || selectedDocument.label || deliveryCandidate.label || fallbackSkipped.label || documentKey);
    const filename = clean(deliveryCandidate.filename || deliveryCandidate.clioDocumentName || deliveryCandidate.existingClioDocumentName || fallbackSkipped.filename || selectedDocument.filename || `${documentLabel}.pdf`);
    const settlementRecordId = clean(selectedDocument.settlementRecordId || packetSummary?.settlementRecord?.id || deliveryCandidate.settlementRecordId);
    const clioDocumentId = clean(deliveryCandidate.clioDocumentId || deliveryCandidate.documentId || deliveryCandidate.id);
    const clioDocumentName = clean(deliveryCandidate.clioDocumentName || deliveryCandidate.filename || filename);
    const clioDocumentVersionUuid = clean(deliveryCandidate.clioDocumentVersionUuid || deliveryCandidate.versionUuid || deliveryCandidate.latestVersionUuid);

    const uniqueQueueKey = [
      "settlement-finalized-document",
      finalization.id,
      safeQueuePart(documentKey),
      safeQueuePart(filename),
      safeQueuePart(clioDocumentId || clioDocumentVersionUuid),
    ].join(":");

    const prior = await prisma.documentPrintQueueItem.findUnique({
      where: { uniqueQueueKey },
    });

    if (prior) {
      return NextResponse.json({
        ok: true,
        action: "settlement-document-print-queue-local",
        status: "already-queued",
        duplicate: true,
        printQueueItem: {
          id: prior.id,
          uniqueQueueKey: prior.uniqueQueueKey,
          status: prior.status,
          filename: prior.filename,
          queuedAt: prior.queuedAt.toISOString(),
        },
        safety: localQueueSafety(0, 1),
        note: "This finalized settlement document was already in the Barsh Matters print queue. No duplicate queue record was created.",
      });
    }

    const record = await prisma.documentPrintQueueItem.create({
      data: {
        uniqueQueueKey,
        masterLawsuitId: finalization.masterLawsuitId,
        masterMatterId: finalization.masterMatterId,
        masterDisplayNumber: finalization.masterDisplayNumber,
        finalizationId: finalization.id,
        documentKey,
        documentLabel,
        filename,
        clioDocumentId: clioDocumentId || null,
        clioDocumentName: clioDocumentName || null,
        clioDocumentVersionUuid: clioDocumentVersionUuid || null,
        status: "queued",
        notes: "Finalized settlement document queued from local Barsh Matters DocumentFinalization record. The queue item references the finalized PDF/Clio document metadata when available. No email was sent and no Clio records were changed by queueing.",
        documentSnapshot: {
          ...selectedDocument,
          generatedDocument,
          docxDownloadUrl: clean(generatedDocument.downloadUrl) || clean(selectedDocument.docxDownloadUrl) || null,
          queuedFrom: "settlement-finalized-document",
          templateSource: clean(selectedDocument.templateRepositorySource || selectedDocument.templateSource) || "barsh-matters-settlement-template",
          productionTemplateReady: true,
          finalProductionDocument: true,
          settlementRecordId: settlementRecordId || null,
          routeBackedArtifact: Boolean(clean(generatedDocument.downloadUrl) || clean(selectedDocument.docxDownloadUrl)),
          finalizedPdfGenerated: true,
          persistentFileCreated: true,
          clioUploaded: Boolean(clioDocumentId || clioDocumentVersionUuid || uploaded.length > 0 || skipped.length > 0),
          emailAttachmentReady: Boolean(clioDocumentId || clioDocumentVersionUuid || uploaded.length > 0 || skipped.length > 0),
          printableFileReady: true,
          clioDocumentId: clioDocumentId || null,
          clioDocumentName: clioDocumentName || null,
          clioDocumentVersionUuid: clioDocumentVersionUuid || null,
        },
        sourceFinalizationSnapshot: {
          id: finalization.id,
          status: finalization.status,
          masterLawsuitId: finalization.masterLawsuitId,
          masterMatterId: finalization.masterMatterId,
          masterDisplayNumber: finalization.masterDisplayNumber,
          noUploadPerformed: finalization.noUploadPerformed,
          finalizedAt: finalization.finalizedAt.toISOString(),
        },
      },
    });

    return NextResponse.json({
      ok: true,
      action: "settlement-document-print-queue-local",
      status: "queued",
      localFirst: true,
      sourceOfTruth: "barsh-matters-local",
      finalizationId: finalization.id,
      masterLawsuitId: finalization.masterLawsuitId,
      settlementRecordId: settlementRecordId || null,
      printQueueItem: {
        id: record.id,
        uniqueQueueKey: record.uniqueQueueKey,
        status: record.status,
        filename: record.filename,
        documentKey: record.documentKey,
        docxDownloadUrl: clean((record.documentSnapshot as any)?.docxDownloadUrl) || clean((record.documentSnapshot as any)?.generatedDocument?.downloadUrl) || null,
        documentLabel: record.documentLabel,
        queuedAt: record.queuedAt.toISOString(),
      },
      safety: localQueueSafety(1, 0),
      note: "Created a local Barsh Matters DocumentPrintQueueItem from a finalized settlement DocumentFinalization record. No new PDF was generated, no Clio upload occurred, no Outlook draft was created, and no email was sent by queueing.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-document-print-queue-local",
        error: error?.message || "Local settlement document print queue add failed.",
        safety: localQueueSafety(0, 0),
      },
      { status: 500 }
    );
  }
}
