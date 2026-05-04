import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function money(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function formatMoney(value: unknown): string {
  return money(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function safeFilePart(value: unknown, maxLength = 120): string {
  return clean(value)
    .replace(/[\/\\:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function safeDocxFilename(baseName: unknown): string {
  const base = safeFilePart(baseName, 150).replace(/\.+$/g, "");
  if (!base) return "Provider Remittance Breakdown.docx";
  if (base.toLowerCase().endsWith(".docx")) return base;
  return `${base}.docx`;
}

function formatGeneratedAt(): string {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function providerRemittanceGenerationSafety() {
  return {
    action: "provider-remittance-breakdown-docx",
    generatedDocxResponseOnly: true,
    routeOnly: true,
    noClioRecordsChanged: true,
    noDatabaseRecordsChanged: true,
    noDocumentUploadPerformed: true,
    noPrintQueueRecordsChanged: true,
    noPersistentFilesCreated: true,
  };
}

function titleParagraph(text: string) {
  return new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, size: 32 })],
    spacing: { after: 180 },
  });
}

function subtitleParagraph(text: unknown) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: clean(text), size: 20 })],
    spacing: { after: 120 },
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 200, after: 100 },
  });
}

function summaryLine(label: string, value: unknown) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 21 }),
      new TextRun({ text: clean(value) || "—", size: 21 }),
    ],
    spacing: { after: 70 },
  });
}

function bulletLine(value: unknown) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text: clean(value) || "—", size: 20 })],
    spacing: { after: 60 },
  });
}

function tableCell(
  text: unknown,
  options?: {
    bold?: boolean;
    width?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
    shade?: string;
  }
) {
  return new TableCell({
    width: options?.width
      ? { size: options.width, type: WidthType.PERCENTAGE }
      : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: options?.shade ? { fill: options.shade } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    },
    children: [
      new Paragraph({
        alignment: options?.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text: clean(text) || "—",
            bold: Boolean(options?.bold),
            size: options?.size ?? 17,
          }),
        ],
      }),
    ],
    margins: {
      top: 70,
      bottom: 70,
      left: 80,
      right: 80,
    },
  });
}

function makeProviderTotalsTable(summary: any) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          tableCell("Provider Principal Net", { bold: true, shade: "E5E7EB", width: 25 }),
          tableCell("Provider Interest Net", { bold: true, shade: "E5E7EB", width: 25 }),
          tableCell("Provider Net Total", { bold: true, shade: "E5E7EB", width: 25 }),
          tableCell("Bill Count", { bold: true, shade: "E5E7EB", width: 25 }),
        ],
      }),
      new TableRow({
        children: [
          tableCell(formatMoney(summary?.providerPrincipalNetTotal), {
            align: AlignmentType.RIGHT,
            width: 25,
          }),
          tableCell(formatMoney(summary?.providerInterestNetTotal), {
            align: AlignmentType.RIGHT,
            width: 25,
          }),
          tableCell(formatMoney(summary?.providerNetTotal), {
            align: AlignmentType.RIGHT,
            width: 25,
          }),
          tableCell(summary?.childMatterCount, {
            align: AlignmentType.RIGHT,
            width: 25,
          }),
        ],
      }),
    ],
  });
}

function makeRemittanceTable(rows: any[]) {
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        tableCell("Matter", { bold: true, shade: "E5E7EB", width: 13 }),
        tableCell("Bill #", { bold: true, shade: "E5E7EB", width: 12 }),
        tableCell("Claim Amount", { bold: true, shade: "E5E7EB", width: 13 }),
        tableCell("Allocated Settlement", { bold: true, shade: "E5E7EB", width: 16 }),
        tableCell("Provider Principal Net", { bold: true, shade: "E5E7EB", width: 17 }),
        tableCell("Provider Interest Net", { bold: true, shade: "E5E7EB", width: 16 }),
        tableCell("Provider Net", { bold: true, shade: "E5E7EB", width: 13 }),
      ],
    }),
  ];

  for (const row of rows) {
    tableRows.push(
      new TableRow({
        children: [
          tableCell(row?.displayNumber || row?.matterId, { width: 13 }),
          tableCell(row?.billNumber, { width: 12 }),
          tableCell(formatMoney(row?.claimAmount), {
            align: AlignmentType.RIGHT,
            width: 13,
          }),
          tableCell(formatMoney(row?.allocatedSettlement), {
            align: AlignmentType.RIGHT,
            width: 16,
          }),
          tableCell(formatMoney(row?.providerPrincipalNet), {
            align: AlignmentType.RIGHT,
            width: 17,
          }),
          tableCell(formatMoney(row?.providerInterestNet), {
            align: AlignmentType.RIGHT,
            width: 16,
          }),
          tableCell(formatMoney(row?.providerNet), {
            align: AlignmentType.RIGHT,
            width: 13,
          }),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: tableRows,
  });
}

export async function GET(req: NextRequest) {
  try {
    const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "provider-remittance-breakdown-docx",
          error: "Missing masterLawsuitId",
          safety: providerRemittanceGenerationSafety(),
        },
        { status: 400 }
      );
    }

    const previewUrl = new URL("/api/settlements/documents-preview", req.nextUrl.origin);
    previewUrl.searchParams.set("masterLawsuitId", masterLawsuitId);

    const previewRes = await fetch(previewUrl, {
      method: "GET",
      cache: "no-store",
    });

    const preview = await previewRes.json().catch(() => null);

    if (!previewRes.ok || !preview?.ok) {
      return NextResponse.json(
        {
          ok: false,
          action: "provider-remittance-breakdown-docx",
          error:
            preview?.error ||
            "Settlement documents preview is not generation-ready.",
          validation: preview?.validation || null,
          safety: providerRemittanceGenerationSafety(),
        },
        { status: previewRes.ok ? 400 : previewRes.status }
      );
    }

    const plannedDocuments = Array.isArray(preview?.plannedDocuments)
      ? preview.plannedDocuments
      : [];
    const plannedDocument = plannedDocuments.find(
      (document: any) => clean(document?.key) === "provider-remittance-breakdown"
    );

    const summary = preview?.settlementSummary || {};
    const rows = Array.isArray(preview?.rows) ? preview.rows : [];
    const warnings = Array.isArray(preview?.validation?.warnings)
      ? preview.validation.warnings
      : [];
    const blockingErrors = Array.isArray(preview?.validation?.blockingErrors)
      ? preview.validation.blockingErrors
      : [];

    if (blockingErrors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "provider-remittance-breakdown-docx",
          error: "Provider Remittance Breakdown generation is blocked.",
          validation: preview.validation,
          safety: providerRemittanceGenerationSafety(),
        },
        { status: 400 }
      );
    }

    const children: any[] = [
      titleParagraph("Provider Remittance Breakdown"),
      subtitleParagraph(`MASTER_LAWSUIT_ID: ${masterLawsuitId}`),
      subtitleParagraph(`Generated: ${formatGeneratedAt()}`),

      sectionHeading("Matter / Claim"),
      summaryLine("Master Matter", summary.masterDisplayNumber),
      summaryLine("Provider", summary.provider),
      summaryLine("Patient", summary.patient),
      summaryLine("Insurer", summary.insurer),
      summaryLine("Claim Number", summary.claimNumber),
      summaryLine("Child/Bill Matter Count", summary.childMatterCount),

      sectionHeading("Provider Remittance Totals"),
      makeProviderTotalsTable(summary),

      sectionHeading("Bill-Level Provider Remittance"),
      makeRemittanceTable(rows),
    ];

    if (warnings.length > 0) {
      children.push(sectionHeading("Warnings"));
      for (const warning of warnings) {
        children.push(bulletLine(warning));
      }
    }

    children.push(sectionHeading("Safety Note"));
    children.push(
      bulletLine(
        "This route returns a generated DOCX response only. It does not upload documents to Clio, create database records, create persistent files, or change the print queue."
      )
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 540,
                bottom: 720,
                left: 540,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const body = new Uint8Array(buffer);

    const fallbackName = `${summary.masterDisplayNumber || masterLawsuitId} - ${summary.provider || "Provider"} aao ${summary.patient || "Patient"} v ${summary.insurer || "Insurer"} - Claim ${summary.claimNumber || "No Claim"} - Provider Remittance Breakdown`;
    const filename = safeDocxFilename(plannedDocument?.filename || fallbackName);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "provider-remittance-breakdown-docx",
        error: err?.message || "Provider Remittance Breakdown generation failed.",
        safety: providerRemittanceGenerationSafety(),
      },
      { status: 500 }
    );
  }
}
