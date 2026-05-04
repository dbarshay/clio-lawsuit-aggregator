import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
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
  const n = money(value);
  return n.toLocaleString("en-US", {
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
  return `${base || "Bill Schedule"}.docx`;
}

function paragraph(text: unknown, options?: { bold?: boolean; size?: number }) {
  return new Paragraph({
    children: [
      new TextRun({
        text: clean(text),
        bold: Boolean(options?.bold),
        size: options?.size ?? 22,
      }),
    ],
    spacing: { after: 120 },
  });
}

function labelValue(label: string, value: unknown) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: clean(value) || "—", size: 22 }),
    ],
    spacing: { after: 80 },
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
            size: options?.size ?? 16,
          }),
        ],
      }),
    ],
    margins: {
      top: 70,
      bottom: 70,
      left: 70,
      right: 70,
    },
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

function detailCell(label: string, value: unknown) {
  const cleanValue = clean(value);

  return new TableCell({
    columnSpan: 6,
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: "FAFAFA" },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 16 }),
          new TextRun({ text: cleanValue || "—", size: 16 }),
        ],
      }),
    ],
    margins: {
      top: 60,
      bottom: 60,
      left: 80,
      right: 80,
    },
  });
}

function makeBillScheduleTable(childMatters: any[], totals: any) {
  const header = new TableRow({
    tableHeader: true,
    children: [
      tableCell("Matter", { bold: true, width: 13, shade: "E5E7EB", size: 17 }),
      tableCell("Patient", { bold: true, width: 18, shade: "E5E7EB", size: 17 }),
      tableCell("DOS", { bold: true, width: 17, shade: "E5E7EB", size: 17 }),
      tableCell("Claim Amount", { bold: true, width: 17, shade: "E5E7EB", size: 17 }),
      tableCell("Payment Voluntary", { bold: true, width: 18, shade: "E5E7EB", size: 17 }),
      tableCell("Balance Presuit", { bold: true, width: 17, shade: "E5E7EB", size: 17 }),
    ],
  });

  const bodyRows = childMatters.flatMap((matter: any) => [
    new TableRow({
      children: [
        tableCell(matter.displayNumber || matter.matterId || ""),
        tableCell(matter.patientName || ""),
        tableCell(formatDos(matter.dosStart, matter.dosEnd)),
        tableCell(formatMoney(matter.claimAmount), { align: AlignmentType.RIGHT }),
        tableCell(formatMoney(matter.paymentVoluntary), { align: AlignmentType.RIGHT }),
        tableCell(formatMoney(matter.balancePresuit), { align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        detailCell(
          "Provider / Denial Reason",
          `${clean(matter.providerName) || "—"} | ${clean(matter.denialReason) || "—"}`
        ),
      ],
    }),
  ]);

  const totalRow = new TableRow({
    children: [
      tableCell("TOTALS", { bold: true, shade: "F3F4F6" }),
      tableCell(`Bill Count: ${totals.billCount ?? childMatters.length}`, {
        bold: true,
        shade: "F3F4F6",
      }),
      tableCell(""),
      tableCell(formatMoney(totals.claimAmountTotal), {
        bold: true,
        align: AlignmentType.RIGHT,
        shade: "F3F4F6",
      }),
      tableCell(formatMoney(totals.paymentVoluntaryTotal), {
        bold: true,
        align: AlignmentType.RIGHT,
        shade: "F3F4F6",
      }),
      tableCell(formatMoney(totals.balancePresuitTotal), {
        bold: true,
        align: AlignmentType.RIGHT,
        shade: "F3F4F6",
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [header, ...bodyRows, totalRow],
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
    const validation = packet.validation || {};

    if (!validation.canGenerate) {
      return NextResponse.json(
        {
          ok: false,
          error: "Document packet is not generation-ready.",
          validation,
        },
        { status: 422 }
      );
    }

    const metadata = packet.metadata || {};
    const masterMatter = packet.masterMatter || {};
    const childMatters = Array.isArray(packet.childMatters)
      ? packet.childMatters
      : [];
    const totals = packet.totals || {};

    const provider = metadata.provider?.value || "";
    const patient = metadata.patient?.value || "";
    const insurer = metadata.insurer?.value || "";
    const claimNumber = metadata.claimNumber?.value || "";
    const venue = metadata.venue?.value || "";
    const indexAaaNumber = metadata.indexAaaNumber?.value || "";
    const amountSought = metadata.amountSought?.amount ?? packet.lawsuit?.amountSought ?? 0;
    const amountSoughtMode = metadata.amountSought?.mode || packet.lawsuit?.amountSoughtMode || "";

    const masterDisplay = masterMatter.displayNumber || masterLawsuitId;

    const summaryRows: Array<[string, unknown]> = [
      ["Master Lawsuit ID", masterLawsuitId],
      ["Master Matter", masterDisplay],
      ["Amount Sought", `${formatMoney(amountSought)} (${formatAmountMode(amountSoughtMode)})`],
    ];

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
              },
              margin: {
                top: 540,
                right: 360,
                bottom: 540,
                left: 360,
              },
            },
          },
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "BILL SCHEDULE", bold: true, size: 34 })],
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

            paragraph("Summary", { bold: true, size: 24 }),
            ...summaryRows.map(([label, value]) => summaryLine(label, value)),

            new Paragraph({ text: "", spacing: { after: 150 } }),

            paragraph("Child Bill Matters", { bold: true, size: 24 }),
            makeBillScheduleTable(childMatters, totals),

            new Paragraph({ text: "", spacing: { after: 80 } }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const body = new Uint8Array(buffer);

    const filename = safeDocxFilename(
      `${masterDisplay} - ${provider || "Provider"} aao ${patient || "Patient"} v ${insurer || "Insurer"} - Claim ${claimNumber || "No Claim"} - Bill Schedule`
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
        error: err?.message || "Bill Schedule generation failed.",
      },
      { status: 500 }
    );
  }
}
