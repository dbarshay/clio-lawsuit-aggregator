import { NextRequest, NextResponse } from "next/server";
import { uploadBufferToClioMatterDocuments } from "@/lib/clioDocumentUpload";

export const runtime = "nodejs";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type PlannedDocument = {
  key: string;
  label: string;
  filename: string;
  sourceEndpoint: string;
  wouldGenerate: boolean;
  wouldUploadToClio: boolean;
  availableNow: boolean;
  status: string;
  note?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => clean(item)).filter(Boolean);
}

async function loadFinalizePreview(req: NextRequest, masterLawsuitId: string) {
  const previewUrl = new URL("/api/documents/finalize-preview", req.nextUrl.origin);
  previewUrl.searchParams.set("masterLawsuitId", masterLawsuitId);

  const previewRes = await fetch(previewUrl, {
    method: "GET",
    cache: "no-store",
  });

  const previewJson = await previewRes.json().catch(() => null);

  if (!previewRes.ok || !previewJson) {
    throw new Error(
      previewJson?.error || "Could not load finalization preview before upload."
    );
  }

  return previewJson;
}

function getMasterMatterId(preview: any): number {
  const raw = preview?.clioUploadTarget?.matterId;
  const matterId = Number(raw);

  if (!Number.isFinite(matterId) || matterId <= 0) {
    throw new Error("Finalize upload is blocked because the master matter ID is missing.");
  }

  return matterId;
}

async function generateDocumentBuffer(req: NextRequest, document: PlannedDocument) {
  const sourceUrl = new URL(document.sourceEndpoint, req.nextUrl.origin);

  const docRes = await fetch(sourceUrl, {
    method: "GET",
    cache: "no-store",
  });

  const contentType = docRes.headers.get("Content-Type") || "";

  if (!docRes.ok) {
    const text = await docRes.text().catch(() => "");
    throw new Error(
      `Document generation failed for ${document.label}: ${docRes.status} ${docRes.statusText}${text ? ` ${text}` : ""}`
    );
  }

  if (!contentType.includes(DOCX_CONTENT_TYPE)) {
    const text = await docRes.text().catch(() => "");
    throw new Error(
      `Document generation for ${document.label} did not return a .docx response. Content-Type was ${contentType || "missing"}.${text ? ` Body: ${text}` : ""}`
    );
  }

  const arrayBuffer = await docRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new Error(`Document generation returned an empty buffer for ${document.label}.`);
  }

  return buffer;
}

export async function POST(req: NextRequest) {
  const uploaded: any[] = [];
  const skipped: any[] = [];

  try {
    const body = await req.json().catch(() => ({}));

    const masterLawsuitId = clean(body?.masterLawsuitId);
    const confirmUpload = body?.confirmUpload === true;
    const requestedKeys = asStringArray(body?.documentKeys);

    if (!masterLawsuitId) {
      return NextResponse.json(
        { ok: false, error: "Missing masterLawsuitId" },
        { status: 400 }
      );
    }

    if (!confirmUpload) {
      return NextResponse.json(
        {
          ok: false,
          action: "finalize-upload",
          error:
            "Upload not performed. This endpoint requires confirmUpload: true.",
          safety: {
            noUploadPerformed: true,
            noDatabaseRecordsChanged: true,
            noOneDriveOrSharePointFoldersCreated: true,
          },
        },
        { status: 400 }
      );
    }

    const preview = await loadFinalizePreview(req, masterLawsuitId);
    const validation = preview?.validation || {};

    if (!validation.canGenerate) {
      return NextResponse.json(
        {
          ok: false,
          action: "finalize-upload",
          error: "Finalize upload blocked because packet validation is not generation-ready.",
          validation,
          safety: {
            noUploadPerformed: true,
            noDatabaseRecordsChanged: true,
            noOneDriveOrSharePointFoldersCreated: true,
          },
        },
        { status: 422 }
      );
    }

    const matterId = getMasterMatterId(preview);
    const plannedDocuments: PlannedDocument[] = Array.isArray(preview?.plannedDocuments)
      ? preview.plannedDocuments
      : [];

    const documentsToUpload = plannedDocuments.filter((document) => {
      if (!document?.wouldGenerate || !document?.wouldUploadToClio) return false;
      if (!requestedKeys.length) return true;
      return requestedKeys.includes(document.key);
    });

    for (const document of plannedDocuments) {
      if (documentsToUpload.includes(document)) continue;
      skipped.push({
        key: document.key,
        label: document.label,
        filename: document.filename,
        reason: requestedKeys.length
          ? "not-requested"
          : document.wouldUploadToClio
            ? "not-selected"
            : "not-uploadable",
      });
    }

    if (!documentsToUpload.length) {
      return NextResponse.json(
        {
          ok: false,
          action: "finalize-upload",
          error: "No final documents were selected for upload.",
          requestedKeys,
          skipped,
          safety: {
            noUploadPerformed: true,
            noDatabaseRecordsChanged: true,
            noOneDriveOrSharePointFoldersCreated: true,
          },
        },
        { status: 400 }
      );
    }

    for (const document of documentsToUpload) {
      const buffer = await generateDocumentBuffer(req, document);

      const result = await uploadBufferToClioMatterDocuments({
        matterId,
        filename: document.filename,
        buffer,
        contentType: DOCX_CONTENT_TYPE,
      });

      uploaded.push({
        key: document.key,
        label: document.label,
        filename: document.filename,
        byteLength: buffer.byteLength,
        clioDocumentId: result.documentId,
        clioDocumentName: result.documentName,
        clioDocumentVersionUuid: result.documentVersionUuid,
        fullyUploaded: result.fullyUploaded,
      });
    }

    return NextResponse.json({
      ok: true,
      action: "finalize-upload",
      masterLawsuitId,
      finalizedAt: new Date().toISOString(),
      clioUploadTarget: preview.clioUploadTarget,
      uploaded,
      skipped,
      safety: {
        explicitUploadAction: true,
        previewAndDownloadRemainNonPersistent: true,
        noDatabaseRecordsChanged: true,
        noOneDriveOrSharePointFoldersCreated: true,
        uploadedOnlyToMasterMatterDocumentsTab: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "finalize-upload",
        error: err?.message || "Finalize upload failed.",
        uploaded,
        skipped,
        safety: {
          explicitUploadAction: true,
          noDatabaseRecordsChanged: true,
          noOneDriveOrSharePointFoldersCreated: true,
          warning:
            uploaded.length > 0
              ? "One or more documents may already have been uploaded before the failure."
              : "No upload was confirmed before the failure.",
        },
      },
      { status: 500 }
    );
  }
}
