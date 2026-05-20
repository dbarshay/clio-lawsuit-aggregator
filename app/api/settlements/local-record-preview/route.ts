import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function numberOrZero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = clean(value).replace(/[$,%\s,]/g, "");
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cents(value: unknown): number {
  return Math.round((Number.isFinite(numberOrZero(value)) ? numberOrZero(value) : 0) * 100) / 100;
}

function moneyEqual(a: unknown, b: unknown): boolean {
  return Math.round(cents(a) * 100) === Math.round(cents(b) * 100);
}

function sumRows(rows: any[], field: string): number {
  return Math.round(
    rows.reduce((sum, row) => sum + cents(row?.[field]), 0) * 100
  ) / 100;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const settlementRecordPayload = body?.settlementRecordPayload || body?.payload || null;

    const blockingErrors: string[] = [];
    const warnings: string[] = [];

    if (!settlementRecordPayload || typeof settlementRecordPayload !== "object") {
      blockingErrors.push("Missing settlementRecordPayload.");
    }

    const masterLawsuitId = clean(settlementRecordPayload?.masterLawsuitId);
    const payloadKind = clean(settlementRecordPayload?.payloadKind);
    const recordIntent = clean(settlementRecordPayload?.recordIntent);
    const settlementTerms = settlementRecordPayload?.settlementTerms || {};
    const settlementTotals = settlementRecordPayload?.settlementTotals || {};
    const settlementRows = Array.isArray(settlementRecordPayload?.settlementRows)
      ? settlementRecordPayload.settlementRows
      : [];

    if (!masterLawsuitId) blockingErrors.push("Missing masterLawsuitId.");
    if (payloadKind !== "local-settlement-record-preview") {
      blockingErrors.push("Invalid payloadKind for local settlement record preview.");
    }
    if (recordIntent !== "future-barsh-matters-local-settlement-record") {
      blockingErrors.push("Invalid recordIntent for local settlement record preview.");
    }
    if (settlementRecordPayload?.previewOnly !== true) {
      blockingErrors.push("Payload must be previewOnly.");
    }
    if (settlementRecordPayload?.databaseRecordsChanged !== false) {
      blockingErrors.push("Payload must confirm databaseRecordsChanged is false.");
    }
    if (!settlementRows.length) {
      blockingErrors.push("Settlement payload has no rows.");
    }

    const rowAllocatedSettlementTotal = sumRows(settlementRows, "allocatedSettlement");
    const rowInterestAmountTotal = sumRows(settlementRows, "interestAmount");
    const rowPrincipalFeeTotal = sumRows(settlementRows, "principalFee");
    const rowInterestFeeTotal = sumRows(settlementRows, "interestFee");
    const rowTotalFee = sumRows(settlementRows, "totalFee");
    const rowProviderPrincipalNetTotal = sumRows(settlementRows, "providerPrincipalNet");
    const rowProviderInterestNetTotal = sumRows(settlementRows, "providerInterestNet");
    const rowProviderNetTotal = sumRows(settlementRows, "providerNet");

    if (!moneyEqual(rowAllocatedSettlementTotal, settlementTotals?.allocatedSettlementTotal)) {
      blockingErrors.push("Allocated settlement row total does not match payload total.");
    }
    if (!moneyEqual(rowInterestAmountTotal, settlementTotals?.interestAmountTotal)) {
      blockingErrors.push("Interest row total does not match payload total.");
    }
    if (!moneyEqual(rowPrincipalFeeTotal, settlementTotals?.principalFeeTotal)) {
      blockingErrors.push("Principal fee row total does not match payload total.");
    }
    if (!moneyEqual(rowInterestFeeTotal, settlementTotals?.interestFeeTotal)) {
      blockingErrors.push("Interest fee row total does not match payload total.");
    }
    if (!moneyEqual(rowTotalFee, settlementTotals?.totalFee)) {
      blockingErrors.push("Total fee row total does not match payload total.");
    }
    if (!moneyEqual(rowProviderPrincipalNetTotal, settlementTotals?.providerPrincipalNetTotal)) {
      blockingErrors.push("Provider principal net row total does not match payload total.");
    }
    if (!moneyEqual(rowProviderInterestNetTotal, settlementTotals?.providerInterestNetTotal)) {
      blockingErrors.push("Provider interest net row total does not match payload total.");
    }
    if (!moneyEqual(rowProviderNetTotal, settlementTotals?.providerNetTotal)) {
      blockingErrors.push("Provider net row total does not match payload total.");
    }

    const duplicateMatterIds = settlementRows
      .map((row: any) => Number(row?.matterId || 0))
      .filter((matterId: number, index: number, all: number[]) => matterId > 0 && all.indexOf(matterId) !== index);

    if (duplicateMatterIds.length) {
      warnings.push(`Duplicate matter IDs detected in preview payload: ${Array.from(new Set(duplicateMatterIds)).join(", ")}.`);
    }

    const wouldSaveRecord = {
      previewOnly: true,
      databaseRecordsChanged: false,
      targetModel: "LocalSettlementRecord",
      targetRowModel: "LocalSettlementRow",
      masterLawsuitId,
      recordValues: {
        masterLawsuitId,
        status: "recorded",
        source: "barsh-matters-local",
        payloadKind,
        recordIntent,
        settledWith: clean(settlementTerms?.settledWith),
        settlementDate: clean(settlementTerms?.settlementDate),
        paymentExpectedDate: clean(settlementTerms?.paymentExpectedDate),
        notes: clean(settlementTerms?.notes),
        allocationMode: clean(settlementTerms?.allocationMode),
        grossSettlementAmount: cents(settlementTerms?.grossSettlementAmount),
        interestAmountTotal: cents(settlementTotals?.interestAmountTotal),
        principalFeePercent: cents(settlementTerms?.principalFeePercent),
        interestFeePercent: cents(settlementTerms?.interestFeePercent),
        allocatedSettlementTotal: cents(settlementTotals?.allocatedSettlementTotal),
        principalFeeTotal: cents(settlementTotals?.principalFeeTotal),
        interestFeeTotal: cents(settlementTotals?.interestFeeTotal),
        totalFee: cents(settlementTotals?.totalFee),
        providerPrincipalNetTotal: cents(settlementTotals?.providerPrincipalNetTotal),
        providerInterestNetTotal: cents(settlementTotals?.providerInterestNetTotal),
        providerNetTotal: cents(settlementTotals?.providerNetTotal),
        rowCount: settlementRows.length,
      },
      rowValues: settlementRows.map((row: any) => ({
        masterLawsuitId,
        matterId: Number(row?.matterId || 0),
        displayNumber: row?.displayNumber || null,
        provider: row?.provider || null,
        patient: row?.patient || null,
        insurer: row?.insurer || null,
        claimNumber: row?.claimNumber || null,
        billNumber: row?.billNumber || null,
        dosStart: row?.dosStart || null,
        dosEnd: row?.dosEnd || null,
        denialReason: row?.denialReason || null,
        claimAmount: cents(row?.claimAmount),
        principalBasis: cents(row?.principalBasis),
        allocatedSettlement: cents(row?.allocatedSettlement),
        interestAmount: cents(row?.interestAmount),
        principalFee: cents(row?.principalFee),
        interestFee: cents(row?.interestFee),
        totalFee: cents(row?.totalFee),
        providerPrincipalNet: cents(row?.providerPrincipalNet),
        providerInterestNet: cents(row?.providerInterestNet),
        providerNet: cents(row?.providerNet),
        settlementStatus: clean(row?.settlementStatus) || "preview_only_not_recorded",
      })),
    };

    return NextResponse.json(
      {
        ok: blockingErrors.length === 0,
        action: "local-settlement-record-preview",
        previewOnly: true,
        localFirst: true,
        sourceOfTruth: "barsh-matters-local",
        wouldSaveRecord,
        validation: {
          readyForLocalSettlementRecordSavePreview: blockingErrors.length === 0,
          blockingErrors,
          warnings,
        },
        safety: {
          previewOnly: true,
          clioRecordsChanged: false,
          databaseRecordsChanged: false,
          documentsGenerated: false,
          printQueueChanged: false,
          mattersClosed: false,
          settlementWritebackPerformed: false,
        },
        note:
          "Preview only.  This validates the local settlement record payload and returns what would be saved to Barsh Matters local settlement tables.  It does not write the database, write Clio, generate documents, print, queue, or close matters.",
      },
      { status: blockingErrors.length === 0 ? 200 : 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "local-settlement-record-preview",
        previewOnly: true,
        localFirst: true,
        error: error?.message || "Local settlement record preview failed.",
        safety: {
          previewOnly: true,
          clioRecordsChanged: false,
          databaseRecordsChanged: false,
          documentsGenerated: false,
          printQueueChanged: false,
          mattersClosed: false,
          settlementWritebackPerformed: false,
        },
      },
      { status: 500 }
    );
  }
}
