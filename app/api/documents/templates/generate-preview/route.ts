import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function xmlUnescape(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function safeFilename(value: string) {
  return clean(value)
    .replace(/\.docx$/i, "")
    .replace(/[\/\\:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "generated-template";
}

function buildTokenValues(req: NextRequest) {
  const query = req.nextUrl.searchParams;
  const signatureName = clean(query.get("signer.signatureName")) || clean(query.get("signatureName")) || "Test Signer";
  const email = clean(query.get("signer.email")) || clean(query.get("email")) || "test.signer@brlfirm.com";
  const extension = clean(query.get("signer.extension")) || clean(query.get("extension")) || "000";
  const fax = clean(query.get("signer.fax")) || clean(query.get("fax")) || "(516) 706-5055";

  return {
    "{{signer.signatureName}}": signatureName,
    "{{signer.email}}": email,
    "{{signer.extension}}": extension,
    "{{signer.fax}}": fax,
  };
}

function docxTextPartName(name: string) {
  return (
    name === "word/document.xml" ||
    /^word\/header\d+\.xml$/.test(name) ||
    /^word\/footer\d+\.xml$/.test(name)
  );
}

function replaceTokenAcrossTextNodes(xml: string, token: string, value: string) {
  let nextXml = xml;
  let count = 0;

  while (true) {
    const nodes: Array<{ start: number; end: number; open: string; close: string; raw: string; text: string }> = [];
    const regex = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(nextXml)) !== null) {
      nodes.push({
        start: match.index,
        end: match.index + match[0].length,
        open: match[1],
        raw: match[2],
        close: match[3],
        text: xmlUnescape(match[2]),
      });
    }

    const fullText = nodes.map((node) => node.text).join("");
    const tokenStart = fullText.indexOf(token);
    if (tokenStart < 0) break;

    const tokenEnd = tokenStart + token.length;
    let cursor = 0;
    let firstNodeIndex = -1;
    let lastNodeIndex = -1;
    let firstOffset = 0;
    let lastOffset = 0;

    for (let i = 0; i < nodes.length; i += 1) {
      const nodeStart = cursor;
      const nodeEnd = cursor + nodes[i].text.length;

      if (firstNodeIndex < 0 && tokenStart >= nodeStart && tokenStart <= nodeEnd) {
        firstNodeIndex = i;
        firstOffset = tokenStart - nodeStart;
      }

      if (firstNodeIndex >= 0 && tokenEnd >= nodeStart && tokenEnd <= nodeEnd) {
        lastNodeIndex = i;
        lastOffset = tokenEnd - nodeStart;
        break;
      }

      cursor = nodeEnd;
    }

    if (firstNodeIndex < 0 || lastNodeIndex < 0) break;

    const changed = nodes.map((node, index) => {
      if (index < firstNodeIndex || index > lastNodeIndex) return node.text;
      if (firstNodeIndex === lastNodeIndex) {
        return node.text.slice(0, firstOffset) + value + node.text.slice(lastOffset);
      }
      if (index === firstNodeIndex) return node.text.slice(0, firstOffset) + value;
      if (index === lastNodeIndex) return node.text.slice(lastOffset);
      return "";
    });

    let rebuilt = "";
    let priorEnd = 0;

    nodes.forEach((node, index) => {
      rebuilt += nextXml.slice(priorEnd, node.start);
      rebuilt += node.open + xmlEscape(changed[index]) + node.close;
      priorEnd = node.end;
    });

    rebuilt += nextXml.slice(priorEnd);
    nextXml = rebuilt;
    count += 1;
  }

  return { xml: nextXml, count };
}

async function replaceTokensInDocx(buffer: Buffer, tokenValues: Record<string, string>) {
  const zip = await JSZip.loadAsync(buffer);
  const replacements = Object.entries(tokenValues).map(([token, value]) => ({ token, value, count: 0 }));

  const partNames = Object.keys(zip.files).filter(docxTextPartName);

  for (const partName of partNames) {
    const file = zip.file(partName);
    if (!file) continue;

    let xml = await file.async("string");

    for (const replacement of replacements) {
      const result = replaceTokenAcrossTextNodes(xml, replacement.token, replacement.value);
      xml = result.xml;
      replacement.count += result.count;
    }

    zip.file(partName, xml);
  }

  const generated = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return { buffer: Buffer.from(generated), replacements };
}

export async function GET(req: NextRequest) {
  try {
    const key = clean(req.nextUrl.searchParams.get("key"));

    if (!key) {
      return NextResponse.json(
        { ok: false, action: "document-template-generate-preview", error: "Missing template key." },
        { status: 400 }
      );
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { key },
      include: {
        versions: {
          orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { ok: false, action: "document-template-generate-preview", error: "Template not found." },
        { status: 404 }
      );
    }

    const metadata = template.metadata && typeof template.metadata === "object" && !Array.isArray(template.metadata)
      ? template.metadata as Record<string, any>
      : {};

    const currentVersion =
      template.versions.find((version) => clean(version.id) === clean(template.currentVersionId)) ||
      template.versions[0] ||
      null;

    if (!template.enabled || metadata.deleted === true || metadata.archived === true || metadata.productionTemplateReady !== true) {
      return NextResponse.json(
        {
          ok: false,
          action: "document-template-generate-preview",
          error: "Template is not production-ready.",
          template: {
            key: template.key,
            enabled: template.enabled,
            productionTemplateReady: metadata.productionTemplateReady === true,
            archived: metadata.archived === true,
            deleted: metadata.deleted === true,
          },
        },
        { status: 409 }
      );
    }

    if (!currentVersion || currentVersion.storageKind !== "db-docx-base64" || !currentVersion.contentText) {
      return NextResponse.json(
        {
          ok: false,
          action: "document-template-generate-preview",
          error: "Template does not have a stored DB DOCX current version.",
        },
        { status: 409 }
      );
    }

    const sourceBuffer = Buffer.from(currentVersion.contentText, "base64");
    const tokenValues = buildTokenValues(req);
    const generated = await replaceTokensInDocx(sourceBuffer, tokenValues);
    const filename = `${safeFilename(template.label || template.key)} - Generated Preview.docx`;

    return new NextResponse(generated.buffer, {
      status: 200,
      headers: {
        "Content-Type": DOCX_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "'")}"`,
        "X-Barsh-Matters-Action": "document-template-generate-preview",
        "X-Barsh-Matters-Template-Key": template.key,
        "X-Barsh-Matters-Template-Version": String(currentVersion.versionNumber),
        "X-Barsh-Matters-Replacements": encodeURIComponent(JSON.stringify(generated.replacements)),
        "X-Barsh-Matters-Safety": encodeURIComponent(JSON.stringify({
          localFirst: true,
          templateRepositoryWrites: false,
          clioWrites: false,
          documentsGeneratedToDatabase: false,
          graphWrites: false,
          printQueued: false,
          emailsSent: false,
          draftsCreated: false,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "document-template-generate-preview",
        error: error?.message || "Template generation preview failed.",
      },
      { status: 500 }
    );
  }
}
