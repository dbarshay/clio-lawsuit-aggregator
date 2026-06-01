import { NextRequest, NextResponse } from "next/server";
import {
  buildDocumentEmailBody,
  buildDocumentEmailSubject,
  type DocumentDeliveryContext,
  type DocumentDeliverySource,
} from "@/lib/documents/delivery";
import { buildGraphDraftPayloadPreview } from "@/lib/graph/draft";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeSource(value: unknown): DocumentDeliverySource {
  const source = clean(value);
  if (
    source === "direct_matter" ||
    source === "master_lawsuit" ||
    source === "settlement" ||
    source === "other"
  ) {
    return source;
  }
  return "other";
}

function normalizeRawSource(value: unknown): string {
  const source = clean(value);
  return source || "other";
}

function normalizeEmailList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  const single = clean(value);
  if (!single) return [];

  return single
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeContext(raw: Record<string, unknown>): DocumentDeliveryContext {
  return {
    source: normalizeSource(raw.source),
    documentKey: clean(raw.documentKey) || "document",
    documentLabel: clean(raw.documentLabel) || "Document",
    documentUrl: clean(raw.documentUrl) || undefined,
    pdfUrl: clean(raw.pdfUrl) || undefined,
    docxUrl: clean(raw.docxUrl) || undefined,
    subject: clean(raw.subject) || undefined,
    providerName: clean(raw.providerName) || undefined,
    patientName: clean(raw.patientName) || undefined,
    insurerName: clean(raw.insurerName) || undefined,
    indexNumber: clean(raw.indexNumber) || undefined,
    ourCaseNumber: clean(raw.ourCaseNumber) || undefined,
    suggestedRecipientName: clean(raw.suggestedRecipientName) || undefined,
    suggestedRecipientEmail: clean(raw.suggestedRecipientEmail) || undefined,
    suggestedCcEmail: clean(raw.suggestedCcEmail) || undefined,
    settledWithName: clean(raw.settledWithName) || undefined,
    settledWithEmail: clean(raw.settledWithEmail) || undefined,
    clioMaildropEmail: clean(raw.clioMaildropEmail) || undefined,
    clioMaildropLabel: clean(raw.clioMaildropLabel) || undefined,
    matterId: clean(raw.matterId) || undefined,
    masterLawsuitId: clean(raw.masterLawsuitId) || undefined,
    clioDocumentId: clean((raw as any).clioDocumentId) || undefined,
    clioDocumentVersionUuid: clean((raw as any).clioDocumentVersionUuid) || undefined,
    pdfFilename: clean((raw as any).pdfFilename) || undefined,
    filename: clean((raw as any).filename) || undefined,
  } as any;
}

export async function POST(req: NextRequest) {
  try {
    const body = cleanObject(await req.json().catch(() => ({})));
    const rawContext = cleanObject(body.context || body);
    const rawSource = normalizeRawSource((rawContext as any).source || body.source);
    const context = {
      ...normalizeContext(rawContext),
      source: rawSource as any,
    } as DocumentDeliveryContext & Record<string, any>;

    const to = normalizeEmailList(body.to || context.settledWithEmail || context.suggestedRecipientEmail);
    const cc = normalizeEmailList(body.cc || context.clioMaildropEmail || context.suggestedCcEmail);
    const bcc = normalizeEmailList(body.bcc);

    const subject = buildDocumentEmailSubject(context);
    const emailBody = buildDocumentEmailBody(context);

    const attachmentCandidates = [
      context.pdfUrl
        ? {
            type: "pdf",
            name: clean((context as any).pdfFilename) || clean((context as any).filename) || "document.pdf",
            contentType: "application/pdf",
            url: context.pdfUrl,
            filename: clean((context as any).pdfFilename) || clean((context as any).filename) || "document.pdf",
            clioDocumentId: clean((context as any).clioDocumentId),
            existingClioDocumentId: clean((context as any).existingClioDocumentId) || clean((context as any).clioDocumentId),
            documentId: clean((context as any).documentId) || clean((context as any).clioDocumentId),
            id: clean((context as any).id) || clean((context as any).clioDocumentId),
            clioDocumentVersionUuid: clean((context as any).clioDocumentVersionUuid),
            existingClioDocumentVersionUuid: clean((context as any).existingClioDocumentVersionUuid) || clean((context as any).clioDocumentVersionUuid),
            clioMatterId: clean((context as any).clioMatterId),
            clioUploadTargetMatterId: clean((context as any).clioUploadTargetMatterId) || clean((context as any).clioMatterId),
            clioDisplayNumber: clean((context as any).clioDisplayNumber) || clean((context as any).masterDisplayNumber),
            masterDisplayNumber: clean((context as any).masterDisplayNumber) || clean((context as any).clioDisplayNumber),
            source: rawSource,
            graphUploadRequired: rawSource === "settlement_finalized_pdf_delivery" || Boolean(clean((context as any).clioDocumentId) || clean((context as any).clioDocumentVersionUuid)),
            requiredForFinalGraphDraft: true,
          }
        : null,
      context.documentUrl && context.documentUrl !== context.pdfUrl
        ? {
            type: "document",
            name: clean((context as any).filename) || "document",
            url: context.documentUrl,
            filename: clean((context as any).filename) || clean((context as any).pdfFilename) || "document",
            clioDocumentId: clean((context as any).clioDocumentId),
            existingClioDocumentId: clean((context as any).existingClioDocumentId) || clean((context as any).clioDocumentId),
            documentId: clean((context as any).documentId) || clean((context as any).clioDocumentId),
            id: clean((context as any).id) || clean((context as any).clioDocumentId),
            clioDocumentVersionUuid: clean((context as any).clioDocumentVersionUuid),
            existingClioDocumentVersionUuid: clean((context as any).existingClioDocumentVersionUuid) || clean((context as any).clioDocumentVersionUuid),
            clioMatterId: clean((context as any).clioMatterId),
            clioUploadTargetMatterId: clean((context as any).clioUploadTargetMatterId) || clean((context as any).clioMatterId),
            clioDisplayNumber: clean((context as any).clioDisplayNumber) || clean((context as any).masterDisplayNumber),
            masterDisplayNumber: clean((context as any).masterDisplayNumber) || clean((context as any).clioDisplayNumber),
            source: rawSource,
            graphUploadRequired: rawSource === "settlement_finalized_pdf_delivery",
            requiredForFinalGraphDraft: false,
          }
        : null,
      context.docxUrl
        ? {
            type: "docx",
            url: context.docxUrl,
            requiredForFinalGraphDraft: false,
          }
        : null,
    ].filter(Boolean);

    const graphContext = context as any;

    const graphDraftPayloadPreview = buildGraphDraftPayloadPreview({
      subject,
      bodyText: emailBody,
      to: to as any[],
      cc: cc as any[],
      bcc: bcc as any[],
      attachments: attachmentCandidates as any[],
      matterContext: {
        source: rawSource,
        matterId: graphContext.matterId,
        matterDisplayNumber: graphContext.matterDisplayNumber || graphContext.clioDisplayNumber,
        masterLawsuitId: graphContext.masterLawsuitId,
        clioMatterId: graphContext.clioMatterId,
        clioDisplayNumber: graphContext.clioDisplayNumber,
        clioMaildropEmail: graphContext.clioMaildropEmail,
        clioMaildropLabel: graphContext.clioMaildropLabel,
      },
    });

    const attachmentPlan = attachmentCandidates as any[];
    const readyForGraphDraftCreate = Boolean(graphDraftPayloadPreview?.validation?.readyForGraphDraftCreate);
    const settlementFinalizedPdfDelivery = rawSource === "settlement_finalized_pdf_delivery";

    return NextResponse.json({
      ok: true,
      action: "document-delivery-draft-preview",
      source: rawSource,
      settlementFinalizedPdfDelivery,
      previewOnly: true,
      graphReady: true,
      createsOutlookDraft: false,
      sendsEmail: false,
      attachesDocument: false,
      clioRecordsChanged: false,
      databaseRecordsChanged: false,
      printQueueChanged: false,
      draft: {
        to,
        cc,
        bcc,
        subject,
        body: emailBody,
        attachments: attachmentPlan,
      },
      subject,
      body: emailBody,
      attachmentPlan,
      validation: {
        ...(graphDraftPayloadPreview?.validation || {}),
        readyForGraphDraftCreate,
        settlementFinalizedPdfDelivery,
        hasFinalizedSettlementPdfAttachment: settlementFinalizedPdfDelivery
          ? attachmentPlan.some((attachment: any) =>
              Boolean(
                attachment?.graphUploadRequired &&
                  (
                    clean((attachment as any).clioDocumentId) ||
                    clean((attachment as any).existingClioDocumentId) ||
                    clean((attachment as any).documentId) ||
                    clean((attachment as any).id) ||
                    clean((attachment as any).clioDocumentVersionUuid) ||
                    clean((attachment as any).downloadUrl) ||
                    clean((attachment as any).pdfUrl) ||
                    clean((attachment as any).url)
                  )
              )
            )
          : undefined,
      },
      graphDraftPayloadPreview,
      context,
      requirements: {
        settledWithEmailRequiredForTo: true,
        clioMaildropRequiredForCc: true,
        finalizedPdfRequiredForAttachment: true,
        microsoftGraphDraftBackendRequiredForRealAttachment: true,
      },
      note:
        "Preview only.  This route returns the Outlook/Microsoft Graph draft payload that Barsh Matters should create later.  It does not create a draft, send email, attach files, write to Clio, write to the database, or change the print queue.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "document-delivery-draft-preview",
        previewOnly: true,
        createsOutlookDraft: false,
        sendsEmail: false,
        attachesDocument: false,
        clioRecordsChanged: false,
        databaseRecordsChanged: false,
        printQueueChanged: false,
        error: error?.message || "Document delivery draft preview failed.",
      },
      { status: 500 }
    );
  }
}
