import { clioFetch } from "@/lib/clio";

type ClioPutHeader = {
  name?: string;
  value?: string;
};

type ClioUploadResult = {
  documentId: number;
  documentName: string;
  documentVersionUuid: string;
  fullyUploaded: boolean;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function headersFromClioPutHeaders(putHeaders: ClioPutHeader[]): Headers {
  const headers = new Headers();

  for (const header of putHeaders || []) {
    const name = clean(header?.name);
    const value = clean(header?.value);

    if (!name || !value) continue;

    headers.set(name, value);
  }

  return headers;
}

async function readClioJson(res: Response, fallback: string): Promise<any> {
  const text = await res.text();
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(
      `${fallback}: ${res.status} ${res.statusText}${json ? ` ${JSON.stringify(json)}` : text ? ` ${text}` : ""}`
    );
  }

  return json;
}

export async function uploadBufferToClioMatterDocuments(params: {
  matterId: number;
  filename: string;
  buffer: Buffer;
  contentType: string;
}): Promise<ClioUploadResult> {
  const matterId = Number(params.matterId);
  const filename = clean(params.filename);
  const contentType = clean(params.contentType) || "application/octet-stream";
  const buffer = Buffer.isBuffer(params.buffer)
    ? params.buffer
    : Buffer.from(params.buffer);

  if (!Number.isFinite(matterId) || matterId <= 0) {
    throw new Error("Missing valid Clio matter ID for document upload.");
  }

  if (!filename) {
    throw new Error("Missing filename for Clio document upload.");
  }

  if (!buffer.length) {
    throw new Error(`Generated document buffer is empty for ${filename}.`);
  }

  const createRes = await clioFetch(
    "/api/v4/documents.json?fields=id,name,latest_document_version{uuid,put_url,put_headers}",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          name: filename,
          parent: {
            id: matterId,
            type: "Matter",
          },
        },
      }),
    }
  );

  const createJson = await readClioJson(
    createRes,
    `Clio document create failed for ${filename}`
  );

  const documentId = Number(createJson?.data?.id);
  const documentName = clean(createJson?.data?.name || filename);
  const latestVersion = createJson?.data?.latest_document_version || {};
  const uuid = clean(latestVersion?.uuid);
  const putUrl = clean(latestVersion?.put_url);
  const putHeaders = Array.isArray(latestVersion?.put_headers)
    ? latestVersion.put_headers
    : [];

  if (!documentId || !uuid || !putUrl) {
    throw new Error(
      `Clio document create response was missing required upload fields for ${filename}: ${JSON.stringify(createJson)}`
    );
  }

  const uploadHeaders = headersFromClioPutHeaders(putHeaders);

  if (!uploadHeaders.has("Content-Type")) {
    uploadHeaders.set("Content-Type", contentType);
  }

  if (!uploadHeaders.has("Content-Length")) {
    uploadHeaders.set("Content-Length", String(buffer.byteLength));
  }

  const uploadRes = await fetch(putUrl, {
    method: "PUT",
    headers: uploadHeaders,
    body: buffer as unknown as BodyInit,
  });

  if (!uploadRes.ok) {
    const uploadText = await uploadRes.text().catch(() => "");
    throw new Error(
      `Signed Clio document upload failed for ${filename}: ${uploadRes.status} ${uploadRes.statusText}${uploadText ? ` ${uploadText}` : ""}`
    );
  }

  const finalizeRes = await clioFetch(
    `/api/v4/documents/${documentId}.json?fields=id,name,latest_document_version{fully_uploaded}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          uuid,
          fully_uploaded: "true",
        },
      }),
    }
  );

  const finalizeJson = await readClioJson(
    finalizeRes,
    `Clio document finalize failed for ${filename}`
  );

  const fullyUploaded = Boolean(
    finalizeJson?.data?.latest_document_version?.fully_uploaded
  );

  if (!fullyUploaded) {
    throw new Error(
      `Clio did not confirm fully_uploaded=true for ${filename}: ${JSON.stringify(finalizeJson)}`
    );
  }

  return {
    documentId,
    documentName,
    documentVersionUuid: uuid,
    fullyUploaded,
  };
}
