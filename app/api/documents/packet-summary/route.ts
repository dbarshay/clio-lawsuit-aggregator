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

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

function formatAmountMode(value: unknown): string {
  const mode = clean(value);

  if (mode === "balance_presuit") return "Balance Presuit";
  if (mode === "claim_amount") return "Claim Amount";
  if (mode === "custom") return "Custom Amount";

  return mode || "Unspecified";
}

function formatDate(value: unknown): string {
  const raw = clean(value);
  if (!raw) return "";
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return raw;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function formatDos(start: unknown, end: unknown): string {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e && s !== e) return `${s} - ${e}`;
  return s || e || "";
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
  return `${base || "Packet Summary"}.docx`;
}

function sectionHeading(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 180, after: 100 },
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
            size: options?.size ?? 18,
          }),
        ],
      }),
    ],
    margins: {
      top: 80,
      bottom: 80,
      left: 90,
      right: 90,
    },
  });
}

function makeTotalsTable(totals: any) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          tableCell("Bill Count", { bold: true, shade: "E5E7EB", width: 20 }),
          tableCell("Claim Amount Total", { bold: true, shade: "E5E7EB", width: 20 }),
          tableCell("Payment Voluntary Total", { bold: true, shade: "E5E7EB", width: 20 }),
          tableCell("Balance Presuit Total", { bold: true, shade: "E5E7EB", width: 20 }),
          tableCell("Balance Amount Total", { bold: true, shade: "E5E7EB", width: 20 }),
        ],
      }),
      new TableRow({
        children: [
          tableCell(num(totals.billCount)),
          tableCell(formatMoney(totals.claimAmountTotal), { align: AlignmentType.RIGHT }),
          tableCell(formatMoney(totals.paymentVoluntaryTotal), { align: AlignmentType.RIGHT }),
          tableCell(formatMoney(totals.balancePresuitTotal), { align: AlignmentType.RIGHT }),
          tableCell(formatMoney(totals.balanceAmountTotal), { align: AlignmentType.RIGHT }),
        ],
      }),
    ],
  });
}

function makeChildMatterTable(childMatters: any[]) {
  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        tableCell("Matter", { bold: true, shade: "E5E7EB", width: 12 }),
        tableCell("Patient", { bold: true, shade: "E5E7EB", width: 16 }),
        tableCell("Provider", { bold: true, shade: "E5E7EB", width: 20 }),
        tableCell("DOS", { bold: true, shade: "E5E7EB", width: 14 }),
        tableCell("Claim Amount", { bold: true, shade: "E5E7EB", width: 13 }),
        tableCell("Balance Presuit", { bold: true, shade: "E5E7EB", width: 13 }),
        tableCell("Denial Reason", { bold: true, shade: "E5E7EB", width: 12 }),
      ],
    }),
  ];

  for (const child of childMatters) {
    rows.push(
      new TableRow({
        children: [
          tableCell(child.displayNumber || child.matterId || ""),
          tableCell(child.patientName || ""),
          tableCell(child.providerName || ""),
          tableCell(formatDos(child.dosStart, child.dosEnd)),
          tableCell(formatMoney(child.claimAmount), { align: AlignmentType.RIGHT }),
          tableCell(formatMoney(child.balancePresuit), { align: AlignmentType.RIGHT }),
          tableCell(child.denialReason || ""),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows,
  });
}

async function loadPacket(req: NextRequest, masterLawsuitId: string) {
  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
  packetUrl.searchParams.set("masterLawsuitId", masterLawsuitId);

  const packetRes = await fetch(packetUrl, {
    method: "GET",
    cache: "no-store",
  });

  const packetJson = await packetRes.json();

  if (!packetRes.ok || !packetJson?.packet) {
    throw new Error(packetJson?.error || "Could not load document packet.");
  }

  return packetJson.packet;
}

export async function GET(req: NextRequest) {
  try {
    const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

    if (!masterLawsuitId) {
      return NextResponse.json(
        { ok: false, error: "Missing masterLawsuitId" },
        { status: 400 }
      );
    }

    const packet = await loadPacket(req, masterLawsuitId);
    const metadata = packet.metadata || {};
    const masterMatter = packet.masterMatter || {};
    const childMatters = Array.isArray(packet.childMatters)
      ? packet.childMatters
      : [];
    const totals = packet.totals || {};
    const validation = packet.validation || {};

    const provider = metadata.provider?.value || "";
    const patient = metadata.patient?.value || "";
    const insurer = metadata.insurer?.value || "";
    const claimNumber = metadata.claimNumber?.value || "";
    const venue = metadata.venue?.value || "";
    const indexAaaNumber = metadata.indexAaaNumber?.value || "";
    const amountSought = metadata.amountSought?.amount ?? packet.lawsuit?.amountSought ?? 0;
    const amountSoughtMode = metadata.amountSought?.mode || packet.lawsuit?.amountSoughtMode || "";
    const masterDisplay = masterMatter.displayNumber || masterLawsuitId;

    const warnings = Array.isArray(validation.warnings) ? validation.warnings : [];
    const blockingErrors = Array.isArray(validation.blockingErrors)
      ? validation.blockingErrors
      : [];

    const children = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "DOCUMENT PACKET SUMMARY", bold: true, size: 34 })],
        spacing: { after: 120 },
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${provider || "Provider"} a/a/o ${patient || "Patient"} v. ${insurer || "Insurer"}`,
            bold: true,
            size: 22,
          }),
        ],
        spacing: { after: 80 },
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${venue || "Venue"} | Index / AAA No.: ${indexAaaNumber || "—"} | Claim No.: ${claimNumber || "—"}`,
            size: 18,
          }),
        ],
        spacing: { after: 220 },
      }),

      sectionHeading("Lawsuit"),
      summaryLine("Master Lawsuit ID", packet.masterLawsuitId || masterLawsuitId),
      summaryLine("Master Matter", masterDisplay),
      summaryLine("Venue", venue),
      summaryLine("Index / AAA Number", indexAaaNumber),
      summaryLine("Amount Sought", `${formatMoney(amountSought)} (${formatAmountMode(amountSoughtMode)})`),

      sectionHeading("Caption / Claim Metadata"),
      summaryLine("Provider", provider),
      summaryLine("Patient", patient),
      summaryLine("Insurer", insurer),
      summaryLine("Claim Number", claimNumber),

      sectionHeading("Totals"),
      makeTotalsTable(totals),

      sectionHeading("Child Bill Matters"),
      makeChildMatterTable(childMatters),
    ];

    if (warnings.length > 0) {
      children.push(sectionHeading("Warnings"));
      for (const warning of warnings) {
        children.push(bulletLine(warning));
      }
    }

    if (blockingErrors.length > 0) {
      children.push(sectionHeading("Blocking Errors"));
      for (const error of blockingErrors) {
        children.push(bulletLine(error));
      }
    }

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

    const filename = safeDocxFilename(
      `${masterDisplay} - ${provider || "Provider"} aao ${patient || "Patient"} v ${insurer || "Insurer"} - Claim ${claimNumber || "No Claim"} - Packet Summary`
    );

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
        error: err?.message || "Packet Summary generation failed.",
      },
      { status: 500 }
    );
  }
}
