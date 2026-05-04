import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function positiveInt(value: unknown, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(n)));
}

function numberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toJsonSafe(value: unknown): any {
  if (value == null) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

const PRINT_QUEUE_STATUS_TRANSITIONS: Record<string, {
  status: string;
  printDecision: string | null;
  setPrintedAt: boolean;
}> = {
  queued: {
    status: "queued",
    printDecision: null,
    setPrintedAt: false,
  },
  printed: {
    status: "printed",
    printDecision: "printed",
    setPrintedAt: true,
  },
  hold: {
    status: "hold",
    printDecision: "hold",
    setPrintedAt: false,
  },
  skipped: {
    status: "skipped",
    printDecision: "skipped",
    setPrintedAt: false,
  },
};

function allowedPrintQueueStatus(value: unknown): string {
  const status = clean(value).toLowerCase();

  if (!PRINT_QUEUE_STATUS_TRANSITIONS[status]) {
    return "";
  }

  return status;
}

function uniqueQueueKeyFor(candidate: any): string {
  const masterLawsuitId = clean(candidate?.masterLawsuitId);
  const masterMatterId = clean(candidate?.masterMatterId);
  const clioDocumentId = clean(candidate?.clioDocumentId);
  const clioDocumentVersionUuid = clean(candidate?.clioDocumentVersionUuid);
  const filename = clean(candidate?.filename).toLowerCase();
  const documentKey = clean(candidate?.key).toLowerCase();

  return [
    masterLawsuitId,
    masterMatterId,
    clioDocumentId || "no-document-id",
    clioDocumentVersionUuid || "no-version-uuid",
    filename,
    documentKey,
  ].join("|");
}

async function loadVerifiedPrintCandidates(req: NextRequest, masterLawsuitId: string) {
  const previewUrl = new URL("/api/documents/print-queue-preview", req.nextUrl.origin);
  previewUrl.searchParams.set("masterLawsuitId", masterLawsuitId);
  previewUrl.searchParams.set("limit", "100");

  const previewRes = await fetch(previewUrl, {
    method: "GET",
    cache: "no-store",
  });

  const previewJson = await previewRes.json().catch(() => null);

  if (!previewRes.ok || !previewJson?.ok) {
    throw new Error(
      previewJson?.error || "Could not load verified print queue preview."
    );
  }

  const candidates = Array.isArray(previewJson?.candidateDocuments)
    ? previewJson.candidateDocuments
    : [];

  return {
    preview: previewJson,
    candidates: candidates.filter(
      (candidate: any) => candidate?.currentClioExistenceVerified === true
    ),
  };
}

export async function GET(req: NextRequest) {
  try {
    const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));
    const status = clean(req.nextUrl.searchParams.get("status"));
    const limit = positiveInt(req.nextUrl.searchParams.get("limit"), 50, 200);

    const rows = await prisma.documentPrintQueueItem.findMany({
      where: {
        ...(masterLawsuitId ? { masterLawsuitId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { queuedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      action: "print-queue-list",
      generatedAt: new Date().toISOString(),
      masterLawsuitId: masterLawsuitId || null,
      status: status || null,
      count: rows.length,
      rows,
      safety: {
        readOnly: true,
        noClioRecordsChanged: true,
        noDatabaseRecordsChanged: true,
        noOneDriveOrSharePointFoldersCreated: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "print-queue-list",
        error: err?.message || "Could not load print queue.",
        safety: {
          readOnly: true,
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noOneDriveOrSharePointFoldersCreated: true,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const masterLawsuitId = clean(body?.masterLawsuitId);
    const confirmAdd = body?.confirmAdd === true;
    const requestedUniqueQueueKeys = Array.isArray(body?.uniqueQueueKeys)
      ? body.uniqueQueueKeys.map((value: unknown) => clean(value)).filter(Boolean)
      : [];

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "print-queue-add",
          error: "Missing masterLawsuitId.",
          safety: {
            noPrintQueueRecordsCreated: true,
            noClioRecordsChanged: true,
            noOneDriveOrSharePointFoldersCreated: true,
          },
        },
        { status: 400 }
      );
    }

    if (!confirmAdd) {
      return NextResponse.json(
        {
          ok: false,
          action: "print-queue-add",
          error: "Print queue records were not created.  This endpoint requires confirmAdd: true.",
          safety: {
            explicitActionRequired: true,
            noPrintQueueRecordsCreated: true,
            noClioRecordsChanged: true,
            noOneDriveOrSharePointFoldersCreated: true,
          },
        },
        { status: 400 }
      );
    }

    const { preview, candidates } = await loadVerifiedPrintCandidates(
      req,
      masterLawsuitId
    );

    const selectedCandidates = candidates
      .map((candidate: any) => ({
        ...candidate,
        uniqueQueueKey: uniqueQueueKeyFor(candidate),
      }))
      .filter((candidate: any) => {
        if (!requestedUniqueQueueKeys.length) return true;
        return requestedUniqueQueueKeys.includes(candidate.uniqueQueueKey);
      });

    if (!selectedCandidates.length) {
      return NextResponse.json(
        {
          ok: false,
          action: "print-queue-add",
          masterLawsuitId,
          error: "No currently Clio-verified print candidates were available to add.",
          previewSummary: {
            candidateDocumentCount: preview?.candidateDocumentCount ?? null,
            currentClioExistenceVerified:
              preview?.verification?.currentClioExistenceVerified === true,
          },
          safety: {
            explicitActionRequired: true,
            noPrintQueueRecordsCreated: true,
            noClioRecordsChanged: true,
            noOneDriveOrSharePointFoldersCreated: true,
          },
        },
        { status: 400 }
      );
    }

    const created: any[] = [];
    const existing: any[] = [];

    for (const candidate of selectedCandidates) {
      const uniqueQueueKey = candidate.uniqueQueueKey;
      const prior = await prisma.documentPrintQueueItem.findUnique({
        where: { uniqueQueueKey },
      });

      if (prior) {
        existing.push(prior);
        continue;
      }

      const finalizationId = numberOrNull(candidate.finalizationId);
      const masterMatterId = numberOrNull(candidate.masterMatterId);

      if (!masterMatterId) {
        throw new Error(
          `Cannot add ${candidate.filename || candidate.key || "document"} to print queue because the master matter ID is missing.`
        );
      }

      const record = await prisma.documentPrintQueueItem.create({
        data: {
          uniqueQueueKey,
          masterLawsuitId,
          masterMatterId,
          masterDisplayNumber: clean(candidate.masterDisplayNumber) || null,
          finalizationId,
          documentKey: clean(candidate.key) || clean(candidate.filename),
          documentLabel: clean(candidate.label) || null,
          filename: clean(candidate.filename),
          clioDocumentId: clean(candidate.clioDocumentId) || null,
          clioDocumentName: clean(candidate.clioDocumentName) || null,
          clioDocumentVersionUuid:
            clean(candidate.clioDocumentVersionUuid) || null,
          status: "queued",
          documentSnapshot: toJsonSafe(candidate),
          sourceFinalizationSnapshot: toJsonSafe({
            finalizationId,
            masterLawsuitId,
            masterMatterId,
            masterDisplayNumber: candidate.masterDisplayNumber,
            finalizedAt: candidate.finalizedAt,
          }),
        },
      });

      created.push(record);
    }

    return NextResponse.json({
      ok: true,
      action: "print-queue-add",
      masterLawsuitId,
      createdCount: created.length,
      existingCount: existing.length,
      requestedCandidateCount: selectedCandidates.length,
      created,
      existing,
      safety: {
        explicitActionConfirmed: true,
        printQueueRecordsCreated: created.length,
        duplicateQueueRecordsSkipped: existing.length,
        onlyClioVerifiedCandidatesAccepted: true,
        noClioRecordsChanged: true,
        noDocumentUploadsPerformed: true,
        noOneDriveOrSharePointFoldersCreated: true,
        clioDocumentsTabRemainsSourceOfTruth: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "print-queue-add",
        error: err?.message || "Could not add documents to print queue.",
        safety: {
          noClioRecordsChanged: true,
          noDocumentUploadsPerformed: true,
          noOneDriveOrSharePointFoldersCreated: true,
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = numberOrNull(body?.id);
    const nextStatus = allowedPrintQueueStatus(body?.status);
    const notes = clean(body?.notes);
    const confirmStatusUpdate = body?.confirmStatusUpdate === true;

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          action: "print-queue-status-update",
          error: "Missing print queue item id.",
          safety: {
            noPrintQueueRecordsChanged: true,
            noClioRecordsChanged: true,
            noDocumentUploadsPerformed: true,
            noOneDriveOrSharePointFoldersCreated: true,
            noDocumentContentsChanged: true,
          },
        },
        { status: 400 }
      );
    }

    if (!nextStatus) {
      return NextResponse.json(
        {
          ok: false,
          action: "print-queue-status-update",
          error: "Invalid status.  Allowed statuses are queued, printed, hold, and skipped.",
          allowedStatuses: Object.keys(PRINT_QUEUE_STATUS_TRANSITIONS),
          safety: {
            noPrintQueueRecordsChanged: true,
            noClioRecordsChanged: true,
            noDocumentUploadsPerformed: true,
            noOneDriveOrSharePointFoldersCreated: true,
            noDocumentContentsChanged: true,
          },
        },
        { status: 400 }
      );
    }

    if (!confirmStatusUpdate) {
      return NextResponse.json(
        {
          ok: false,
          action: "print-queue-status-update",
          error: "Print queue status was not updated.  This endpoint requires confirmStatusUpdate: true.",
          safety: {
            explicitActionRequired: true,
            noPrintQueueRecordsChanged: true,
            noClioRecordsChanged: true,
            noDocumentUploadsPerformed: true,
            noOneDriveOrSharePointFoldersCreated: true,
            noDocumentContentsChanged: true,
          },
        },
        { status: 400 }
      );
    }

    const existing = await prisma.documentPrintQueueItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          action: "print-queue-status-update",
          error: `No print queue item exists with id ${id}.`,
          safety: {
            noPrintQueueRecordsChanged: true,
            noClioRecordsChanged: true,
            noDocumentUploadsPerformed: true,
            noOneDriveOrSharePointFoldersCreated: true,
            noDocumentContentsChanged: true,
          },
        },
        { status: 404 }
      );
    }

    const transition = PRINT_QUEUE_STATUS_TRANSITIONS[nextStatus];

    const updated = await prisma.documentPrintQueueItem.update({
      where: { id },
      data: {
        status: transition.status,
        printDecision: transition.printDecision,
        printedAt: transition.setPrintedAt
          ? existing.printedAt ?? new Date()
          : nextStatus === "queued"
            ? null
            : existing.printedAt,
        notes: notes || existing.notes,
      },
    });

    return NextResponse.json({
      ok: true,
      action: "print-queue-status-update",
      id,
      previousStatus: existing.status,
      status: updated.status,
      printDecision: updated.printDecision,
      printedAt: updated.printedAt,
      notes: updated.notes,
      row: updated,
      safety: {
        explicitActionConfirmed: true,
        onlyLocalPrintQueueRecordChanged: true,
        noClioRecordsChanged: true,
        noDocumentUploadsPerformed: true,
        noOneDriveOrSharePointFoldersCreated: true,
        noDocumentContentsChanged: true,
        clioDocumentsTabRemainsSourceOfTruth: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "print-queue-status-update",
        error: err?.message || "Could not update print queue status.",
        safety: {
          noClioRecordsChanged: true,
          noDocumentUploadsPerformed: true,
          noOneDriveOrSharePointFoldersCreated: true,
          noDocumentContentsChanged: true,
        },
      },
      { status: 500 }
    );
  }
}

