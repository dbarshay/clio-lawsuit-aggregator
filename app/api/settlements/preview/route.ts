import { NextRequest, NextResponse } from "next/server";
import {
  buildSettlementPreview,
  type SettlementPreviewInput,
} from "@/lib/settlementPreview";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const masterLawsuitId = clean(body.masterLawsuitId);
    const input: SettlementPreviewInput = {
      grossSettlementAmount: Number(body.grossSettlementAmount),
      settledWith: clean(body.settledWith),
      settlementDate: clean(body.settlementDate),
      paymentExpectedDate: clean(body.paymentExpectedDate),
      allocationMode: body.allocationMode,
      principalFeePercent: Number(body.principalFeePercent ?? 0),
      interestAmount: Number(body.interestAmount ?? 0),
      interestFeePercent: Number(body.interestFeePercent ?? 0),
      notes: clean(body.notes),
    };

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-preview",
          dryRun: true,
          error: "Missing masterLawsuitId",
          safety: {
            noClioRecordsChanged: true,
            noDatabaseRecordsChanged: true,
            noDocumentsGenerated: true,
            noPrintQueueRecordsChanged: true,
            noPersistentFilesCreated: true,
          },
        },
        { status: 400 }
      );
    }

    const packet = await loadPacket(req, masterLawsuitId);
    const preview = buildSettlementPreview({
      masterLawsuitId,
      packet,
      input,
    });

    return NextResponse.json(preview, { status: preview.ok ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-preview",
        dryRun: true,
        error: err?.message || "Settlement preview failed.",
        safety: {
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noDocumentsGenerated: true,
          noPrintQueueRecordsChanged: true,
          noPersistentFilesCreated: true,
        },
        note:
          "Preview failure only. No Clio records, database records, documents, or print queue records were changed.",
      },
      { status: 500 }
    );
  }
}
