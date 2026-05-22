import { NextRequest, NextResponse } from "next/server";
import { assertGraphDraftEnvironmentReady, graphApiBase, graphFetchJson, graphMailboxMessagesUrl } from "@/lib/graph/client";
import { clioFetch } from "@/lib/clio";
import { requestMicrosoftGraphAppToken } from "@/lib/graph/token";
import { buildGraphDraftPayloadPreview, normalizeGraphRecipients } from "@/lib/graph/draft";
import { persistGraphDraftMetadata } from "@/lib/graph/emailPersistence";
import { resolveMaildropForGraphDraftMatterId } from "@/lib/graph/maildropForDraft";

export const dynamic = "force-dynamic";

const REQUIRED_CONFIRMATION = "create-graph-draft";

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function objectValue(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function safeAttachmentName(value: unknown): string {
  const raw = clean(value) || "document.pdf";
  return raw.replace(/[\\/:*?"<>|#%{}~&]+/g, "_").slice(0, 180) || "document.pdf";
}

async function downloadAttachmentBytesFromPlan(attachment: any): Promise<{
  name: string;
  contentType: string;
  contentBytes: string;
  byteLength: number;
  source: string;
}> {
  const name = safeAttachmentName(attachment?.name || attachment?.filename || "document.pdf");
  const contentType = clean(attachment?.contentType) || "application/pdf";
  const clioDocumentId = clean(attachment?.clioDocumentId);

  if (clioDocumentId) {
    const downloadRes = await clioFetch(`/api/v4/documents/${encodeURIComponent(clioDocumentId)}/download`);

    if (!downloadRes.ok) {
      const text = await downloadRes.text().catch(() => "");
      throw new Error(
        `Could not download finalized Clio document ${clioDocumentId} for attachment: ${downloadRes.status} ${downloadRes.statusText}${text ? ` ${text.slice(0, 500)}` : ""}`
      );
    }

    const buffer = Buffer.from(await downloadRes.arrayBuffer());

    if (!buffer.byteLength) {
      throw new Error(`Finalized Clio document ${clioDocumentId} downloaded as an empty file.`);
    }

    return {
      name,
      contentType: downloadRes.headers.get("content-type") || contentType,
      contentBytes: buffer.toString("base64"),
      byteLength: buffer.byteLength,
      source: "clio-document-download",
    };
  }

  throw new Error(`Attachment ${name} does not include a supported finalized-document source.`);
}

async function addFileAttachmentToGraphDraft(params: {
  mailboxUserId: string;
  messageId: string;
  attachment: {
    name: string;
    contentType: string;
    contentBytes: string;
  };
}) {
  const tokenResult = await requestMicrosoftGraphAppToken();

  if (!tokenResult.ok || !tokenResult.token?.accessToken) {
    throw new Error(tokenResult.error || "Microsoft Graph token request failed before attachment upload.");
  }

  const url =
    `${graphApiBase()}/users/${encodeURIComponent(params.mailboxUserId)}` +
    `/messages/${encodeURIComponent(params.messageId)}/attachments`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenResult.token.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: params.attachment.name,
      contentType: params.attachment.contentType,
      contentBytes: params.attachment.contentBytes,
    }),
    cache: "no-store",
  });

  const text = await response.text();
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new Error(
      json?.error?.message ||
        text ||
        `Microsoft Graph attachment upload failed: ${response.status} ${response.statusText}`
    );
  }

  return {
    ok: true,
    status: response.status,
    statusText: response.statusText,
    json,
  };
}

export async function POST(req: NextRequest) {
  const confirm = req.nextUrl.searchParams.get("confirm") || "";

  let body: Record<string, any> = {};
  try {
    body = objectValue(await req.json().catch(() => ({})));
  } catch {
    body = {};
  }

  let context = objectValue(body.context);
  const draft = objectValue(body.draft);

  const resolvedMaildrop =
    !clean(context.clioMaildropEmail) && body?.matterId
      ? await resolveMaildropForGraphDraftMatterId(body.matterId)
      : null;

  if (resolvedMaildrop?.clioMaildropEmail) {
    context = {
      ...context,
      clioMaildropEmail: resolvedMaildrop.clioMaildropEmail,
      clioMaildropLabel: resolvedMaildrop.clioMaildropLabel,
    };
  }

  let to = normalizeGraphRecipients(body.to || draft.to || context.to || context.suggestedToEmail);
  let cc = normalizeGraphRecipients(
    body.cc ||
      draft.cc ||
      (context.clioMaildropEmail
        ? [{ name: context.clioMaildropLabel || "MailDrop", email: context.clioMaildropEmail }]
        : context.suggestedCcEmail)
  );
  let bcc = normalizeGraphRecipients(body.bcc || draft.bcc);

  if (resolvedMaildrop?.clioMaildropEmail) {
    const resolvedMaildropCc = normalizeGraphRecipients([
      {
        name: resolvedMaildrop.clioMaildropLabel,
        email: resolvedMaildrop.clioMaildropEmail,
      },
    ]);

    const existingCcEmails = new Set(
      cc
        .map((recipient) => clean(recipient.email).toLowerCase())
        .filter(Boolean)
    );
    const missingMaildropCc = resolvedMaildropCc.filter((recipient) => {
      const email = clean(recipient.email).toLowerCase();
      return email && !existingCcEmails.has(email);
    });

    if (missingMaildropCc.length > 0) {
      cc = [...cc, ...missingMaildropCc];
    }
  }

  const resolvedMatterId = context.matterId || body.matterId || null;
  const resolvedMatterDisplayNumber =
    clean(context.matterDisplayNumber || context.clioDisplayNumber) ||
    (resolvedMatterId && /^\d+$/.test(String(resolvedMatterId)) ? `BRL${String(resolvedMatterId)}` : "");

  const preview =
    body.graphDraftPayloadPreview && typeof body.graphDraftPayloadPreview === "object"
      ? body.graphDraftPayloadPreview
      : buildGraphDraftPayloadPreview({
          subject: clean(body.subject || draft.subject || context.subject) || "Document",
          bodyText: clean(body.bodyText || body.body || draft.body || context.body) || "Please see the attached document.",
          to,
          cc,
          bcc,
          attachments: Array.isArray(body.attachments)
            ? body.attachments
            : Array.isArray(draft.attachments)
              ? draft.attachments
              : [],
          matterContext: {
            source: clean(context.source),
            matterId: resolvedMatterId,
            matterDisplayNumber: resolvedMatterDisplayNumber,
            masterLawsuitId: clean(context.masterLawsuitId),
            clioMatterId: context.clioMatterId,
            clioDisplayNumber: clean(context.clioDisplayNumber),
            clioMaildropEmail: clean(context.clioMaildropEmail),
            clioMaildropLabel: clean(context.clioMaildropLabel),
          },
        });

  const responseBase = {
    action: "graph-create-draft",
    readOnly: false,
    failClosed: true,
    graphCallsMade: false,
    createsOutlookDraft: false,
    sendsEmail: false,
    readsMailbox: false,
    syncsMailbox: false,
    attachesDocument: false,
    attachmentUploadDeferred: true,
    clioRecordsChanged: false,
    databaseRecordsChanged: false,
    crossPlatformRuntime: true,
    localOutlookAutomationRequired: false,
  };

  if (confirm !== REQUIRED_CONFIRMATION) {
    return NextResponse.json(
      {
        ...responseBase,
        previewOnly: true,
        blocked: true,
        requiredConfirmation: REQUIRED_CONFIRMATION,
        payload: preview,
        note:
          "Fail-closed Graph draft creation route.  Add ?confirm=create-graph-draft to explicitly create an Outlook draft after Graph environment configuration and payload validation.",
      },
      { status: 400 }
    );
  }

  const env = assertGraphDraftEnvironmentReady();
  if (!env.ok) {
    return NextResponse.json(
      {
        ...responseBase,
        previewOnly: false,
        blocked: true,
        payload: preview,
        readiness: env.readiness,
        error: env.error,
      },
      { status: 400 }
    );
  }

  if (!preview?.validation?.readyForGraphDraftCreate) {
    return NextResponse.json(
      {
        ...responseBase,
        previewOnly: false,
        blocked: true,
        payload: preview,
        error:
          "Graph draft payload is not ready.  The draft must have a To recipient, Clio MailDrop in Cc, and no MailDrop in Bcc.",
      },
      { status: 400 }
    );
  }

  const attachmentPlan = Array.isArray(preview.attachmentPlan) ? preview.attachmentPlan : [];
  const requiresAttachmentUpload = attachmentPlan.some((attachment: any) => Boolean(attachment?.graphUploadRequired));
  const allowMetadataOnlyDraft = clean(body.allowMetadataOnlyDraft) === "true";

  const graphPayload = preview.graphMessagePayload;
  const graphResult = await graphFetchJson({
    url: graphMailboxMessagesUrl(env.mailboxUserId),
    method: "POST",
    body: graphPayload,
  });

  if (!graphResult.ok) {
    return NextResponse.json(
      {
        ...responseBase,
        previewOnly: false,
        graphCallsMade: true,
        createsOutlookDraft: false,
        payload: preview,
        result: {
          ok: graphResult.ok,
          status: graphResult.status,
          statusText: graphResult.statusText,
          error: graphResult.error,
        },
      },
      { status: 502 }
    );
  }

  const draftMetadata = {
    graphMessageId: clean(graphResult.json?.id),
    internetMessageId: clean(graphResult.json?.internetMessageId),
    conversationId: clean(graphResult.json?.conversationId),
    subject: clean(graphResult.json?.subject),
    webLink: clean(graphResult.json?.webLink),
    createdDateTime: clean(graphResult.json?.createdDateTime),
    lastModifiedDateTime: clean(graphResult.json?.lastModifiedDateTime),
  };

  const attachmentUploads: any[] = [];
  const attachmentErrors: any[] = [];

  if (requiresAttachmentUpload && !allowMetadataOnlyDraft && draftMetadata.graphMessageId) {
    for (const attachment of attachmentPlan.filter((item: any) => Boolean(item?.graphUploadRequired))) {
      try {
        const file = await downloadAttachmentBytesFromPlan(attachment);
        const upload = await addFileAttachmentToGraphDraft({
          mailboxUserId: env.mailboxUserId,
          messageId: draftMetadata.graphMessageId,
          attachment: {
            name: file.name,
            contentType: file.contentType,
            contentBytes: file.contentBytes,
          },
        });

        attachmentUploads.push({
          ok: true,
          name: file.name,
          contentType: file.contentType,
          byteLength: file.byteLength,
          source: file.source,
          graphAttachmentId: clean(upload?.json?.id),
        });
      } catch (error: any) {
        attachmentErrors.push({
          ok: false,
          name: clean(attachment?.name),
          clioDocumentId: clean(attachment?.clioDocumentId),
          error: error?.message || "Attachment upload failed.",
        });
      }
    }
  }

  if (attachmentErrors.length > 0) {
    return NextResponse.json(
      {
        ...responseBase,
        previewOnly: false,
        graphCallsMade: true,
        createsOutlookDraft: true,
        attachesDocument: attachmentUploads.length > 0,
        attachmentUploadDeferred: false,
        attachmentUploads,
        attachmentErrors,
        payload: preview,
        draft: draftMetadata,
        error: "Outlook draft was created, but one or more finalized PDF attachments could not be uploaded.",
      },
      { status: 502 }
    );
  }

  const persisted = await persistGraphDraftMetadata({
    mailboxUserId: env.mailboxUserId,
    graphDraft: draftMetadata,
    payload: preview,
    context: {
      source: clean(context.source),
      matterId: resolvedMatterId,
      matterDisplayNumber: resolvedMatterDisplayNumber,
      masterLawsuitId: clean(context.masterLawsuitId),
      clioMatterId: context.clioMatterId,
      clioDisplayNumber: clean(context.clioDisplayNumber),
      clioMaildropEmail: clean(context.clioMaildropEmail),
      clioMaildropLabel: clean(context.clioMaildropLabel),
    },
  });

  return NextResponse.json({
    ...responseBase,
    previewOnly: false,
    graphCallsMade: true,
    createsOutlookDraft: true,
    databaseRecordsChanged: true,
    maildropResolutionAttempted: Boolean(body?.matterId),
    maildropResolvedForPayload: Boolean(resolvedMaildrop?.clioMaildropEmail),
    maildropResolutionSource: resolvedMaildrop?.source || null,
    payload: preview,
    draft: draftMetadata,
    persisted,
    note: attachmentUploads.length > 0
      ? "Outlook draft created through Microsoft Graph, finalized PDF attachment uploaded, and draft metadata persisted locally."
      : "Outlook draft created through Microsoft Graph and draft metadata persisted locally.  No finalized PDF attachment was uploaded.",
  });
}
