import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safeFilename(value: unknown): string {
  const raw = clean(value) || "document";
  return raw.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180) || "document";
}

function pdfText(value: unknown): string { return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); } function decodeDocumentBytes(bytes: ArrayBuffer): string { return new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/\r\n/g, "\n").replace(/\r/g, "\n"); } function decodeQuotedPrintable(value: string): string {
  return value
    .replace(/=\r?\n/g, "")
    .replace(/=([A-Fa-f0-9]{2})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeMimePayload(payload: string, transferEncoding: string): string {
  const encoding = transferEncoding.toLowerCase();
  try {
    if (encoding.includes("base64")) return Buffer.from(payload.replace(/\s+/g, ""), "base64").toString("utf8");
    if (encoding.includes("quoted-printable")) return decodeQuotedPrintable(payload);
  } catch {
    return payload;
  }
  return payload;
}

function stripHtmlForPdf(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function unfoldHeaderLines(headerText: string): string[] {
  const headers: string[] = [];
  let current = "";
  for (const line of headerText.split("\n")) {
    if (/^\s/.test(line) && current) current += " " + line.trim();
    else {
      if (current) headers.push(current);
      current = line.trim();
    }
  }
  if (current) headers.push(current);
  return headers;
}

function headerValue(headers: string[], name: string): string {
  const prefix = name.toLowerCase() + ":";
  const found = headers.find((line) => line.toLowerCase().startsWith(prefix));
  return found ? found.slice(found.indexOf(":") + 1).trim() : "";
}

function extractBestEmlBody(normalized: string): string {
  const topSplit = normalized.indexOf("\n\n");
  const wholeBody = topSplit >= 0 ? normalized.slice(topSplit + 2) : normalized;
  const parts = normalized.split(/\n--[^\n]+/g);
  let htmlCandidate = "";

  for (const part of parts) {
    const split = part.indexOf("\n\n");
    if (split < 0) continue;

    const partHeaders = unfoldHeaderLines(part.slice(0, split));
    const partBody = part.slice(split + 2).trim();
    const contentType = headerValue(partHeaders, "Content-Type").toLowerCase();
    const transfer = headerValue(partHeaders, "Content-Transfer-Encoding");

    if (contentType.includes("text/plain")) return decodeMimePayload(partBody, transfer);
    if (!htmlCandidate && contentType.includes("text/html")) htmlCandidate = stripHtmlForPdf(decodeMimePayload(partBody, transfer));
  }

  return htmlCandidate || stripHtmlForPdf(wholeBody);
}

function emailLinesForPdf(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const splitIndex = normalized.indexOf("\n\n");
  const headerText = splitIndex >= 0 ? normalized.slice(0, splitIndex) : normalized;
  const headers = unfoldHeaderLines(headerText);

  const selectedHeaders = ["From", "To", "Cc", "Bcc", "Subject", "Date"]
    .map((name) => {
      const value = headerValue(headers, name);
      return value ? `${name}: ${value}` : "";
    })
    .filter(Boolean);

  const decodedBody = extractBestEmlBody(normalized);
  const bodyLines = decodedBody
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^Content-(Type|Transfer-Encoding|Disposition|ID|Description):/i.test(line) && !/^--_/.test(line))
    .slice(0, 220);

  return ["Email Message", "", ...selectedHeaders, "", "Body", "", ...(bodyLines.length ? bodyLines : ["No readable body text found in the EML file."])];
}

function wrapPdfText(line: string, width = 92): string[] { const output: string[] = []; let rest = line || " "; while (rest.length > width) { let cut = rest.lastIndexOf(" ", width); if (cut < 24) cut = width; output.push(rest.slice(0, cut)); rest = rest.slice(cut).trimStart(); } output.push(rest || " "); return output; } function buildEmailPdf(linesInput: string[], title: string): Uint8Array { const lines = [title, ""].concat(linesInput).flatMap((line) => wrapPdfText(line)); const pages: string[][] = []; for (let i = 0; i < lines.length; i += 46) pages.push(lines.slice(i, i + 46)); if (pages.length === 0) pages.push([title]); const objects: string[] = []; objects.push("<< /Type /Catalog /Pages 2 0 R >>"); const pageIds = pages.map((_, index) => 3 + index * 2); objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`); pages.forEach((pageLines, index) => { const pageId = 3 + index * 2; const contentId = pageId + 1; objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> >> >> /Contents ${contentId} 0 R >>`); const commands = ["BT", "/F1 9 Tf", "50 750 Td"]; pageLines.forEach((line, lineIndex) => { if (lineIndex > 0) commands.push("0 -14 Td"); commands.push(`(${pdfText(line)}) Tj`); }); commands.push("ET"); const stream = commands.join("\n"); objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`); }); let pdf = "%PDF-1.4\n"; const offsets = [0]; objects.forEach((obj, index) => { offsets.push(Buffer.byteLength(pdf, "utf8")); pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`; }); const xrefOffset = Buffer.byteLength(pdf, "utf8"); pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`; for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`; pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`; return new Uint8Array(Buffer.from(pdf, "utf8")); } 

async function getDocumentMetadata(documentId: string) {
  const fields = "id,name,latest_document_version{id,uuid,filename,size,content_type,fully_uploaded}";
  const res = await clioFetch(
    `/api/v4/documents/${encodeURIComponent(documentId)}.json?fields=${encodeURIComponent(fields)}`
  );

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      `Clio document metadata lookup failed: ${res.status} ${res.statusText} ${JSON.stringify(json).slice(0, 700)}`
    );
  }

  const data = json?.data || {};
  const version = data?.latest_document_version || {};

  return {
    documentId: clean(data?.id || documentId),
    documentName: clean(data?.name),
    filename: safeFilename(version?.filename || data?.name),
    contentType: clean(version?.content_type) || "application/octet-stream",
    versionUuid: clean(version?.uuid),
    fullyUploaded: Boolean(version?.fully_uploaded),
  };
}

export async function GET(req: NextRequest) {
  try {
    const documentId = clean(req.nextUrl.searchParams.get("documentId"));
    const mode = clean(req.nextUrl.searchParams.get("mode")) || "download";
    const requestedFilename = safeFilename(req.nextUrl.searchParams.get("filename"));

    if (!documentId) {
      return NextResponse.json(
        {
          ok: false,
          action: "clio-document-open",
          error: "Missing documentId.",
          safety: {
            readOnly: true,
            noClioRecordsChanged: true,
            noDatabaseRecordsChanged: true,
            noDocumentUploadsPerformed: true,
          },
        },
        { status: 400 }
      );
    }

    const metadata = await getDocumentMetadata(documentId);

    if (mode === "json") {
      return NextResponse.json({
        ok: true,
        action: "clio-document-open",
        documentId,
        filename: metadata.filename,
        requestedFilename,
        contentType: metadata.contentType,
        versionUuid: metadata.versionUuid,
        fullyUploaded: metadata.fullyUploaded,
        downloadPath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}`,
        inlinePath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}&mode=inline`,
        editPath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}&mode=edit`,
        safety: {
          readOnly: true,
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noDocumentUploadsPerformed: true,
        },
      });
    }

    const downloadRes = await clioFetch(`/api/v4/documents/${encodeURIComponent(documentId)}/download`);

    if (!downloadRes.ok) {
      const text = await downloadRes.text().catch(() => "");
      throw new Error(
        `Clio document download failed: ${downloadRes.status} ${downloadRes.statusText}${text ? ` ${text.slice(0, 700)}` : ""}`
      );
    }

    const contentType = downloadRes.headers.get("content-type") || metadata.contentType || "application/octet-stream";

    if (mode === "email-pdf") {
      const bytes = await downloadRes.arrayBuffer();
      const rawEmail = decodeDocumentBytes(bytes);
      const pdfFilename = safeFilename(metadata.filename.replace(/\.eml$/i, ".pdf"));
      const pdfBytes = buildEmailPdf(emailLinesForPdf(rawEmail), pdfFilename);
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${pdfFilename}"`,
          "Cache-Control": "no-store",
          "X-Barsh-Matters-Source": "clio-eml-rendered-pdf",
          "X-Barsh-Matters-Clio-Document-Id": documentId,
          ...(metadata.versionUuid ? { "X-Barsh-Matters-Clio-Version-Uuid": metadata.versionUuid } : {}),
        },
      });
    }

    const inlineMode = mode === "inline" || mode === "edit";
    const contentDisposition = inlineMode
      ? `inline; filename="${metadata.filename}"`
      : `attachment; filename="${metadata.filename}"`;

    return new NextResponse(downloadRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
        "X-Barsh-Matters-Source": "clio-document-download",
        "X-Barsh-Matters-Clio-Document-Id": documentId,
        ...(metadata.versionUuid ? { "X-Barsh-Matters-Clio-Version-Uuid": metadata.versionUuid } : {}),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "clio-document-open",
        error: err?.message || "Could not open Clio document.",
        safety: {
          readOnly: true,
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noDocumentUploadsPerformed: true,
        },
      },
      { status: 500 }
    );
  }
}
