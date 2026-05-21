import { graphApiBase } from "@/lib/graph/client";
import { getGraphAuthConfig } from "@/lib/graph/config";
import { requestMicrosoftGraphAppToken } from "@/lib/graph/token";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safeGraphFilename(value: unknown): string {
  const raw = clean(value) || `barsh-matters-working-${Date.now()}.docx`;
  const withExtension = raw.toLowerCase().endsWith(".docx") ? raw : `${raw}.docx`;

  return withExtension
    .replace(/[\/\\:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

async function graphRawFetch(url: string, init: RequestInit = {}) {
  const tokenResult = await requestMicrosoftGraphAppToken();

  if (!tokenResult.ok || !tokenResult.token?.accessToken) {
    throw new Error(tokenResult.error || "Could not acquire Microsoft Graph token.");
  }

  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${tokenResult.token.accessToken}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

async function readGraphJson(res: Response): Promise<any> {
  const text = await res.text().catch(() => "");

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text.slice(0, 700) };
  }
}

export async function uploadWorkingDocxToGraph(params: {
  docxBuffer: Buffer;
  filename: string;
  folder?: string;
}) {
  if (!Buffer.isBuffer(params.docxBuffer) || params.docxBuffer.byteLength <= 0) {
    throw new Error("Cannot upload an empty DOCX working document.");
  }

  const config = getGraphAuthConfig();
  const mailboxUserId = clean(config.mailboxUserId);

  if (!mailboxUserId) {
    throw new Error("Missing MICROSOFT_GRAPH_MAILBOX_USER_ID for working document upload.");
  }

  const safeFilename = safeGraphFilename(params.filename);
  const folder = clean(params.folder) || "BarshMattersWorkingDocs";
  const uploadUrl =
    `${graphApiBase()}/users/${encodeURIComponent(mailboxUserId)}` +
    `/drive/root:/${encodeURIComponent(folder)}/${encodeURIComponent(safeFilename)}:/content`;

  const uploadRes = await graphRawFetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": DOCX_CONTENT_TYPE,
    },
    body: params.docxBuffer,
  });

  const uploadJson = await readGraphJson(uploadRes);

  if (!uploadRes.ok) {
    throw new Error(
      `Microsoft Graph working DOCX upload failed: ${uploadRes.status} ${uploadRes.statusText} ${
        uploadJson?.error?.message || uploadJson?.error || JSON.stringify(uploadJson)
      }`
    );
  }

  const driveItemId = clean(uploadJson?.id);
  const webUrl = clean(uploadJson?.webUrl);
  const name = clean(uploadJson?.name) || safeFilename;

  if (!driveItemId) {
    throw new Error("Microsoft Graph working DOCX upload did not return a drive item id.");
  }

  const downloadUrl =
    `${graphApiBase()}/users/${encodeURIComponent(mailboxUserId)}` +
    `/drive/items/${encodeURIComponent(driveItemId)}/content`;

  return {
    ok: true,
    mailboxUserId,
    driveItemId,
    name,
    webUrl,
    downloadUrl,
    size: Number(uploadJson?.size || params.docxBuffer.byteLength),
    contentType: DOCX_CONTENT_TYPE,
    msWordEditUrl: webUrl ? `ms-word:ofe|u|${webUrl}` : "",
    graphSource: "users-drive-working-docx",
  };
}
