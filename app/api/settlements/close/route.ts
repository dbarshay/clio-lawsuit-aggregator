import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clioFetch } from "@/lib/clio";
import { ingestMattersFromClioBatch } from "@/lib/ingestMattersFromClioBatch";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

export const runtime = "nodejs";

const PAID_SETTLEMENT_CLOSE_REASON = "PAID (SETTLEMENT)";
const PAID_SETTLEMENT_OPTION_ID = 12497555;
const CLOSE_REASON_FIELD_ID = 22145660;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safetyClosePaidSettlements() {
  return {
    actionLabel: "Close Paid Settlements",
    explicitPaymentConfirmationRequired: true,
    confirmPaidRequired: true,
    confirmClosePaidSettlementsRequired: true,
    writesClioCloseReason: true,
    writesClioMatterStatus: true,
    refreshesClaimIndexAfterWrite: true,
    childBillMattersOnly: true,
    masterMattersExcluded: true,
    alreadyClosedFinalStatusBlocked: true,
    settlementAgreementAloneIsNotEnough: true,
    settlementFinancialWritebackAloneIsNotEnough: true,
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

function closeReasonCFV(matter: any): any | null {
  const rows = Array.isArray(matter?.custom_field_values)
    ? matter.custom_field_values
    : [];

  return rows.find((row: any) => customFieldId(row) === CLOSE_REASON_FIELD_ID && row?.id) || null;
}

function closeReasonValue(matter: any): string {
  const rows = Array.isArray(matter?.custom_field_values)
    ? matter.custom_field_values
    : [];

  const closeReason = rows.find((row: any) => customFieldId(row) === CLOSE_REASON_FIELD_ID);
  return clean(closeReason?.value);
}

async function readMatterLive(matterId: number) {
  const fields = [
    "id",
    "display_number",
    "description",
    "status",
    "client",
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

async function patchMatterClosedAsPaidSettlement(matterId: number, closeReasonCustomFieldValueId: number) {
  const res = await clioFetch(`/api/v4/matters/${matterId}.json`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        status: "closed",
        custom_field_values: [
          {
            id: closeReasonCustomFieldValueId,
            value: PAID_SETTLEMENT_OPTION_ID,
          },
        ],
      },
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Could not close matter ${matterId}: status ${res.status}; body ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function refreshMatterIntoClaimIndexAfterWrite(matterId: number) {
  let ingestResults: any = null;
  let ingestWarning: string | null = null;
  let ingestFallbackResult: any = null;

  try {
    ingestResults = await ingestMattersFromClioBatch([matterId]);
  } catch (err: any) {
    ingestWarning = err?.message || "Batch ClaimIndex re-ingest failed after Close Paid Settlements write.";

    const freshAfterWrite = await readMatterLive(matterId);
    await upsertClaimIndexFromMatter(freshAfterWrite);

    ingestFallbackResult = {
      matterId,
      ok: true,
      source: "single-matter-fallback-fresh-after-close-paid-settlements-write",
    };
  }

  return {
    ingestResults,
    ingestWarning,
    ingestFallbackResult,
  };
}

function evaluateMatterForClosePaidSettlements(matter: any) {
  const master = isMasterMatter(matter);
  const status = clean(matter?.status);
  const existingCloseReasonValue = closeReasonValue(matter);
  const alreadyClosed = status.toLowerCase().includes("closed") || !!existingCloseReasonValue;
  const closeReasonRecord = closeReasonCFV(matter);

  const blockingErrors: string[] = [];

  if (master) blockingErrors.push("Master matter is excluded from Close Paid Settlements.");
  if (!closeReasonRecord?.id) blockingErrors.push("Close Reason custom field value record is missing.");
  if (alreadyClosed) blockingErrors.push("Matter already has a closed status or final close reason.");

  return {
    matterId: Number(matter.id),
    displayNumber: clean(matter.display_number) || String(matter.id),
    status,
    isMasterMatter: master,
    existingCloseReasonValue: existingCloseReasonValue || null,
    closeReasonToWrite: PAID_SETTLEMENT_CLOSE_REASON,
    closeReasonOptionId: PAID_SETTLEMENT_OPTION_ID,
    closeReasonCustomFieldValueId: closeReasonRecord?.id ? Number(closeReasonRecord.id) : null,
    canCloseIfPaidConfirmed: blockingErrors.length === 0,
    blockingErrors,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const masterLawsuitId = clean(body.masterLawsuitId);
    const confirmPaid = body.confirmPaid === true;
    const confirmClosePaidSettlements = body.confirmClosePaidSettlements === true;

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "close-paid-settlements",
          status: "blocked-missing-master-lawsuit-id",
          error: "Missing masterLawsuitId",
          safety: safetyClosePaidSettlements(),
        },
        { status: 400 }
      );
    }

    if (!confirmPaid || !confirmClosePaidSettlements) {
      return NextResponse.json(
        {
          ok: false,
          action: "close-paid-settlements",
          status: "blocked-missing-payment-confirmation",
          error:
            "Close Paid Settlements requires confirmPaid: true and confirmClosePaidSettlements: true. Settlement agreement or settlement financial writeback alone is not enough to close a matter.",
          safety: safetyClosePaidSettlements(),
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

    const evaluations = [];

    for (const matterId of matterIds) {
      const matter = await readMatterLive(matterId);
      evaluations.push(evaluateMatterForClosePaidSettlements(matter));
    }

    const eligible = evaluations.filter((row) => row.canCloseIfPaidConfirmed);
    const blocked = evaluations.filter((row) => !row.canCloseIfPaidConfirmed);

    if (evaluations.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "close-paid-settlements",
          status: "blocked-no-rows",
          masterLawsuitId,
          error: "No matters found for masterLawsuitId.",
          count: 0,
          closedCount: 0,
          blockedCount: 0,
          results: [],
          safety: safetyClosePaidSettlements(),
        },
        { status: 404 }
      );
    }

    if (eligible.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "close-paid-settlements",
          status: "blocked-no-eligible-paid-settlements",
          masterLawsuitId,
          error: "No child/bill matters are eligible for Close Paid Settlements.",
          count: evaluations.length,
          closedCount: 0,
          blockedCount: blocked.length,
          results: evaluations,
          validation: {
            canClosePaidSettlementsIfConfirmed: false,
            eligibleMatterIds: [],
            blockedMatterIds: blocked.map((row) => row.matterId),
            blockingErrors: blocked.flatMap((row) =>
              row.blockingErrors.map((msg) => `${row.displayNumber}: ${msg}`)
            ),
          },
          safety: safetyClosePaidSettlements(),
        },
        { status: 409 }
      );
    }

    const closedResults = [];

    for (const row of eligible) {
      if (!row.closeReasonCustomFieldValueId) {
        throw new Error(`Eligible matter ${row.matterId} unexpectedly lacks Close Reason CFV ID.`);
      }

      const updated = await patchMatterClosedAsPaidSettlement(
        row.matterId,
        row.closeReasonCustomFieldValueId
      );

      const refresh = await refreshMatterIntoClaimIndexAfterWrite(row.matterId);

      closedResults.push({
        ...row,
        wroteCloseReason: PAID_SETTLEMENT_CLOSE_REASON,
        wroteCloseReasonOptionId: PAID_SETTLEMENT_OPTION_ID,
        wroteStatus: "closed",
        updated,
        refresh,
      });
    }

    return NextResponse.json({
      ok: true,
      action: "close-paid-settlements",
      status: "closed-paid-settlements-written-to-clio",
      masterLawsuitId,
      count: evaluations.length,
      closedCount: closedResults.length,
      blockedCount: blocked.length,
      closedResults,
      blockedResults: blocked,
      validation: {
        canClosePaidSettlementsIfConfirmed: true,
        eligibleMatterIds: eligible.map((row) => row.matterId),
        blockedMatterIds: blocked.map((row) => row.matterId),
        blockingErrors: blocked.flatMap((row) =>
          row.blockingErrors.map((msg) => `${row.displayNumber}: ${msg}`)
        ),
      },
      safety: safetyClosePaidSettlements(),
      note:
        "Close Paid Settlements completed only for live-preview-eligible child/bill matters after explicit payment confirmation.  Master matters and already closed/final-status matters were not written.  No documents were generated, and no print queue records were changed.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "close-paid-settlements",
        status: "close-paid-settlements-error",
        error: err?.message || "Close Paid Settlements failed.",
        safety: safetyClosePaidSettlements(),
      },
      { status: 500 }
    );
  }
}
