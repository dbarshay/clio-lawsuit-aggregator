import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clioFetch } from "@/lib/clio";

export const runtime = "nodejs";

const PAID_SETTLEMENT_OPTION_ID = 12497555;
const CLOSE_REASON_FIELD_ID = 22145660;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safetyPreviewOnly() {
  return {
    dryRun: true,
    previewOnly: true,
    noClioRecordsChanged: true,
    noDatabaseRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
  };
}

function isMasterMatter(matter: any): boolean {
  return clean(matter?.description).toUpperCase().startsWith("MASTER LAWSUIT");
}

function customFieldId(cfv: any): number | null {
  const raw = cfv?.custom_field?.id ?? cfv?.custom_field_id ?? cfv?.custom_field;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function closeReasonValue(matter: any): string {
  const rows = Array.isArray(matter?.custom_field_values)
    ? matter.custom_field_values
    : [];

  const closeReason = rows.find((row: any) => customFieldId(row) === CLOSE_REASON_FIELD_ID);
  return clean(closeReason?.value);
}

function hasCloseReasonCFV(matter: any): boolean {
  const rows = Array.isArray(matter?.custom_field_values)
    ? matter.custom_field_values
    : [];

  return rows.some((row: any) => customFieldId(row) === CLOSE_REASON_FIELD_ID && row?.id);
}

async function readMatterLive(matterId: number) {
  const fields = [
    "id",
    "display_number",
    "description",
    "status",
    "custom_field_values{id,value,custom_field}",
  ].join(",");

  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Could not read matter ${matterId} from Clio: status ${res.status}; body ${text}`);
  }

  const matter = text ? JSON.parse(text)?.data : null;

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} was not returned by Clio.`);
  }

  return matter;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const masterLawsuitId = clean(body.masterLawsuitId);

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-close-preview",
          error: "Missing masterLawsuitId",
          safety: safetyPreviewOnly(),
        },
        { status: 400 }
      );
    }

    const indexedRows = await prisma.claimIndex.findMany({
      where: { master_lawsuit_id: masterLawsuitId },
      select: {
        matter_id: true,
        display_number: true,
      },
      orderBy: { display_number: "asc" },
    });

    const matterIds = Array.from(
      new Set(
        indexedRows
          .map((row) => Number(row.matter_id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    const results = [];

    for (const matterId of matterIds) {
      const matter = await readMatterLive(matterId);
      const master = isMasterMatter(matter);
      const status = clean(matter?.status);
      const closeReasonRaw = closeReasonValue(matter);
      const alreadyClosed = status.toLowerCase().includes("closed") || !!closeReasonRaw;
      const hasCloseReason = hasCloseReasonCFV(matter);

      const blockingErrors = [];
      if (master) blockingErrors.push("Master matter is excluded from settlement close.");
      if (!hasCloseReason) blockingErrors.push("Close Reason custom field value record is missing.");
      if (alreadyClosed) blockingErrors.push("Matter already has a closed status or final close reason.");

      results.push({
        matterId: Number(matter.id),
        displayNumber: clean(matter.display_number) || String(matter.id),
        status,
        isMasterMatter: master,
        existingCloseReasonValue: closeReasonRaw || null,
        closeReasonToWrite: "PAID (SETTLEMENT)",
        closeReasonOptionId: PAID_SETTLEMENT_OPTION_ID,
        canCloseIfConfirmed: blockingErrors.length === 0,
        blockingErrors,
      });
    }

    const closable = results.filter((row) => row.canCloseIfConfirmed);
    const blocked = results.filter((row) => !row.canCloseIfConfirmed);

    const ok = results.length > 0 && closable.length > 0;

    return NextResponse.json({
      ok,
      action: "settlement-close-preview",
      dryRun: true,
      masterLawsuitId,
      count: results.length,
      results,
      validation: {
        canCloseIfConfirmed: closable.length > 0,
        closableCount: closable.length,
        blockedCount: blocked.length,
        blockingErrors: blocked.flatMap((row) =>
          row.blockingErrors.map((msg) => `${row.displayNumber}: ${msg}`)
        ),
      },
      safety: safetyPreviewOnly(),
      note:
        "Preview only. This endpoint identifies child/bill matters eligible for PAID (SETTLEMENT) close after settlement, but does not write to Clio, the database, documents, or the print queue.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-close-preview",
        dryRun: true,
        error: err?.message || "Settlement close preview failed.",
        safety: safetyPreviewOnly(),
      },
      { status: 500 }
    );
  }
}
