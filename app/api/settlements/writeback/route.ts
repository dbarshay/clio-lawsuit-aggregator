import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  previewSettlementWritebackToClio,
  writeSettlementToClioMatter,
} from "@/lib/settlementClioWriteback";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function jsonSafe(value: unknown): any {
  if (value == null) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function safetyNoWrite() {
  return {
    noClioRecordsChanged: true,
    noDatabaseRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    noPersistentFilesCreated: true,
  };
}

function rowWriteback(row: any) {
  return row?.clioWritebackPreview || row || {};
}

function childMatterIdsFromRows(rows: any[]) {
  return rows
    .map((row) => Number(rowWriteback(row).matterId))
    .filter((matterId) => Number.isFinite(matterId) && matterId > 0);
}

function firstSettlementFields(rows: any[]) {
  const first = rowWriteback(rows[0] || {});
  return first?.fields || {};
}

async function recordSettlementWritebackAudit(params: {
  masterLawsuitId: string;
  status: string;
  rows: any[];
  readinessSnapshot?: any;
  writeResults?: any;
  safetySnapshot?: any;
  error?: string;
  noWritePerformed: boolean;
}) {
  try {
    const fields = firstSettlementFields(params.rows);

    const record = await prisma.settlementWriteback.create({
      data: {
        masterLawsuitId: params.masterLawsuitId,
        status: params.status,
        grossSettlement: num(fields.SETTLED_AMOUNT),
        settledWith: clean(fields.SETTLED_WITH_NAME || fields.SETTLED_WITH) || null,
        settlementDate: null,
        allocationMode: null,
        childMatterIds: jsonSafe(childMatterIdsFromRows(params.rows)),
        previewSnapshot: jsonSafe({
          rows: params.rows,
        }),
        readinessSnapshot: jsonSafe(params.readinessSnapshot),
        writeResults: jsonSafe(params.writeResults),
        safetySnapshot: jsonSafe(params.safetySnapshot),
        error: params.error || null,
        noWritePerformed: params.noWritePerformed,
        finalizedAt: new Date(),
      },
    });

    return {
      ok: true,
      id: record.id,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Could not record settlement writeback audit history.",
    };
  }
}

export async function POST(req: NextRequest) {
  let masterLawsuitId = "";
  let rows: any[] = [];

  try {
    const body = await req.json().catch(() => ({}));

    masterLawsuitId = clean(body.masterLawsuitId);
    const confirmWrite = body.confirmWrite === true;
    rows = asArray(body.rows);

    if (!masterLawsuitId) {
      const responseBody = {
        ok: false,
        action: "settlement-writeback",
        error: "Missing masterLawsuitId",
        safety: safetyNoWrite(),
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    if (!confirmWrite) {
      const safety = safetyNoWrite();
      const auditRecord = await recordSettlementWritebackAudit({
        masterLawsuitId,
        status: "blocked-missing-confirm-write",
        rows,
        safetySnapshot: safety,
        error: "Settlement writeback requires confirmWrite: true.",
        noWritePerformed: true,
      });

      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback",
          masterLawsuitId,
          error: "Settlement writeback requires confirmWrite: true.",
          auditRecord,
          safety,
        },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      const safety = safetyNoWrite();
      const auditRecord = await recordSettlementWritebackAudit({
        masterLawsuitId,
        status: "blocked-no-rows",
        rows,
        safetySnapshot: safety,
        error: "No settlement rows provided for writeback.",
        noWritePerformed: true,
      });

      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback",
          masterLawsuitId,
          error: "No settlement rows provided for writeback.",
          auditRecord,
          safety,
        },
        { status: 400 }
      );
    }

    const requests = rows.map((row) => {
      const request = rowWriteback(row);

      return {
        matterId: Number(request.matterId),
        displayNumber: clean(request.displayNumber),
        fields: request.fields || {},
      };
    });

    const readinessResults = [];

    for (const request of requests) {
      readinessResults.push(
        await previewSettlementWritebackToClio({
          request,
        })
      );
    }

    const missingRequiredFieldResults = readinessResults.filter(
      (result: any) =>
        Array.isArray(result.missingRequiredFields) &&
        result.missingRequiredFields.length > 0
    );

    const masterMatterBlockedResults = readinessResults.filter(
      (result: any) => result.isMasterMatter
    );

    const readinessValidation = {
      canWriteIfConfirmed: false,
      missingRequiredFieldCount: missingRequiredFieldResults.length,
      masterMatterBlockedCount: masterMatterBlockedResults.length,
      blockingErrors: [
        ...missingRequiredFieldResults.map(
          (result: any) =>
            `Matter ${result.displayNumber || result.matterId} is missing required settlement custom field value record(s).`
        ),
        ...masterMatterBlockedResults.map(
          (result: any) =>
            `Matter ${result.displayNumber || result.matterId} is a master matter and cannot receive settlement financial writeback.`
        ),
      ],
    };

    const readinessOk =
      readinessResults.length > 0 &&
      missingRequiredFieldResults.length === 0 &&
      masterMatterBlockedResults.length === 0 &&
      readinessResults.every((result: any) => result.ok);

    const readinessSnapshot = {
      ok: readinessOk,
      count: readinessResults.length,
      results: readinessResults,
      validation: {
        ...readinessValidation,
        canWriteIfConfirmed: readinessOk,
      },
    };

    if (!readinessOk) {
      const safety = safetyNoWrite();
      const auditRecord = await recordSettlementWritebackAudit({
        masterLawsuitId,
        status: "blocked-readiness-validation",
        rows,
        readinessSnapshot,
        safetySnapshot: safety,
        error: "Settlement writeback blocked by readiness validation.",
        noWritePerformed: true,
      });

      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback",
          masterLawsuitId,
          error: "Settlement writeback blocked by readiness validation.",
          readiness: readinessSnapshot,
          auditRecord,
          safety,
        },
        { status: 400 }
      );
    }

    const writeResults = [];

    for (const request of requests) {
      writeResults.push(
        await writeSettlementToClioMatter({
          request,
          confirmWrite: true,
        })
      );
    }

    const safety = {
      clioRecordsChanged: true,
      databaseClaimIndexRefreshed: true,
      noDocumentsGenerated: true,
      noPrintQueueRecordsChanged: true,
      noPersistentFilesCreated: true,
      explicitConfirmWriteRequired: true,
      childBillMattersOnly: true,
    };

    const auditRecord = await recordSettlementWritebackAudit({
      masterLawsuitId,
      status: "written-to-clio",
      rows,
      readinessSnapshot,
      writeResults,
      safetySnapshot: safety,
      noWritePerformed: false,
    });

    return NextResponse.json({
      ok: true,
      action: "settlement-writeback",
      masterLawsuitId,
      count: writeResults.length,
      readiness: readinessSnapshot,
      results: writeResults,
      auditRecord,
      safety,
      note:
        "Settlement fields were written to child/bill matters only after confirmWrite: true and readiness validation.",
    });
  } catch (err: any) {
    const error = err?.message || "Settlement writeback failed.";
    const safety = {
      clioRecordsMayHaveChanged: true,
      noDocumentsGenerated: true,
      noPrintQueueRecordsChanged: true,
      noPersistentFilesCreated: true,
    };

    const auditRecord = masterLawsuitId
      ? await recordSettlementWritebackAudit({
          masterLawsuitId,
          status: "error",
          rows,
          safetySnapshot: safety,
          error,
          noWritePerformed: true,
        })
      : null;

    return NextResponse.json(
      {
        ok: false,
        action: "settlement-writeback",
        masterLawsuitId,
        error,
        auditRecord,
        safety,
      },
      { status: 500 }
    );
  }
}
