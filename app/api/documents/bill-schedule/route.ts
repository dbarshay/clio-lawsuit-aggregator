import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
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
  }
) {
  return new TableCell({
    width: options?.width
      ? { size: options.width, type: WidthType.PERCENTAGE }
      : undefined,
    children: [
      new Paragraph({
        alignment: options?.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text: clean(text),
            bold: Boolean(options?.bold),
            size: 18,
          }),
        ],
      }),
    ],
    margins: {
      top: 80,
      bottom: 80,
      left: 80,
      right: 80,
    },
  });
}

function makeInfoTable(rows: Array<[string, unknown]>) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            tableCell(label, { bold: true, width: 28 }),
            tableCell(clean(value) || "—", { width: 72 }),
          ],
        })
    ),
  });
}

function makeBillScheduleTable(childMatters: any[], totals: any) {
  const header = new TableRow({
    tableHeader: true,
    children: [
      tableCell("Matter", { bold: true, width: 8 }),
      tableCell("Bill No.", { bold: true, width: 7 }),
      tableCell("Patient", { bold: true, width: 11 }),
      tableCell("Provider", { bold: true, width: 14 }),
      tableCell("DOS", { bold: true, width: 9 }),
      tableCell("Claim Amount", { bold: true, width: 9 }),
      tableCell("Payment Voluntary", { bold: true, width: 10 }),
      tableCell("Balance Presuit", { bold: true, width: 9 }),
      tableCell("Denial Reason", { bold: true, width: 14 }),
      tableCell("Index / AAA", { bold: true, width: 5 }),
      tableCell("Status", { bold: true, width: 4 }),
    ],
  });

  const bodyRows = childMatters.map(
    (matter: any) =>
      new TableRow({
        children: [
          tableCell(matter.displayNumber || matter.matterId || ""),
          tableCell(matter.billNumber || ""),
          tableCell(matter.patientName || ""),
          tableCell(matter.providerName || ""),
          tableCell(formatDos(matter.dosStart, matter.dosEnd)),
          tableCell(formatMoney(matter.claimAmount), { align: AlignmentType.RIGHT }),
          tableCell(formatMoney(matter.paymentVoluntary), { align: AlignmentType.RIGHT }),
          tableCell(formatMoney(matter.balancePresuit), { align: AlignmentType.RIGHT }),
          tableCell(matter.denialReason || ""),
          tableCell(matter.indexAaaNumber || ""),
          tableCell(matter.status || ""),
        ],
      })
  );

  const totalRow = new TableRow({
    children: [
      tableCell("TOTALS", { bold: true }),
      tableCell(""),
      tableCell(""),
      tableCell(""),
      tableCell(""),
      tableCell(formatMoney(totals.claimAmountTotal), {
        bold: true,
        align: AlignmentType.RIGHT,
      }),
      tableCell(formatMoney(totals.paymentVoluntaryTotal), {
        bold: true,
        align: AlignmentType.RIGHT,
      }),
      tableCell(formatMoney(totals.balancePresuitTotal), {
        bold: true,
        align: AlignmentType.RIGHT,
      }),
      tableCell(`Bill Count: ${totals.billCount ?? childMatters.length}`, { bold: true }),
      tableCell(""),
      tableCell(""),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
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

    const infoRows: Array<[string, unknown]> = [
      ["Master Lawsuit ID", masterLawsuitId],
      ["Master Matter", masterDisplay],
      ["Venue", venue],
      ["Index / AAA Number", indexAaaNumber],
      ["Provider", provider],
      ["Patient", patient],
      ["Insurer", insurer],
      ["Claim Number", claimNumber],
      ["Amount Sought", `${formatMoney(amountSought)} (${amountSoughtMode || "unspecified"})`],
      ["Generated At", new Date().toLocaleString("en-US")],
    ];

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
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Bill Schedule", bold: true, size: 36 })],
              spacing: { after: 240 },
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${provider || "Provider"} a/a/o ${patient || "Patient"} v. ${insurer || "Insurer"}`,
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 260 },
            }),

            paragraph("Lawsuit Information", { bold: true, size: 26 }),
            makeInfoTable(infoRows),

            new Paragraph({ text: "", spacing: { after: 180 } }),

            paragraph("Child Bill Matters", { bold: true, size: 26 }),
            makeBillScheduleTable(childMatters, totals),

            new Paragraph({ text: "", spacing: { after: 180 } }),

            labelValue("Total Claim Amount", formatMoney(totals.claimAmountTotal)),
            labelValue("Total Payment Voluntary", formatMoney(totals.paymentVoluntaryTotal)),
            labelValue("Total Balance Presuit", formatMoney(totals.balancePresuitTotal)),
            labelValue("Bill Count", totals.billCount ?? childMatters.length),
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
