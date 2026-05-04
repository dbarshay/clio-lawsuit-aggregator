import { NextRequest, NextResponse } from "next/server";
import {
  previewSettlementWritebackToClio,
  writeSettlementToClioMatter,
} from "@/lib/settlementClioWriteback";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const masterLawsuitId = clean(body.masterLawsuitId);
    const confirmWrite = body.confirmWrite === true;
    const rows = asArray(body.rows);

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback",
          error: "Missing masterLawsuitId",
          safety: safetyNoWrite(),
        },
        { status: 400 }
      );
    }

    if (!confirmWrite) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback",
          masterLawsuitId,
          error: "Settlement writeback requires confirmWrite: true.",
          safety: safetyNoWrite(),
        },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback",
          masterLawsuitId,
          error: "No settlement rows provided for writeback.",
          safety: safetyNoWrite(),
        },
        { status: 400 }
      );
    }

    const requests = rows.map((row) => {
      const request = row?.clioWritebackPreview || row;

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

    const readinessOk =
      readinessResults.length > 0 &&
      missingRequiredFieldResults.length === 0 &&
      masterMatterBlockedResults.length === 0 &&
      readinessResults.every((result: any) => result.ok);

    if (!readinessOk) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback",
          masterLawsuitId,
          error: "Settlement writeback blocked by readiness validation.",
          readiness: {
            ok: readinessOk,
            count: readinessResults.length,
            results: readinessResults,
            validation: {
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
            },
          },
          safety: safetyNoWrite(),
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

    return NextResponse.json({
      ok: true,
      action: "settlement-writeback",
      masterLawsuitId,
      count: writeResults.length,
      readiness: {
        ok: true,
        count: readinessResults.length,
        results: readinessResults,
        validation: {
          canWriteIfConfirmed: true,
          missingRequiredFieldCount: 0,
          masterMatterBlockedCount: 0,
          blockingErrors: [],
        },
      },
      results: writeResults,
      safety: {
        clioRecordsChanged: true,
        databaseClaimIndexRefreshed: true,
        noDocumentsGenerated: true,
        noPrintQueueRecordsChanged: true,
        noPersistentFilesCreated: true,
        explicitConfirmWriteRequired: true,
        childBillMattersOnly: true,
      },
      note:
        "Settlement fields were written to child/bill matters only after confirmWrite: true and readiness validation.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-writeback",
        error: err?.message || "Settlement writeback failed.",
        safety: {
          clioRecordsMayHaveChanged: true,
          noDocumentsGenerated: true,
          noPrintQueueRecordsChanged: true,
          noPersistentFilesCreated: true,
        },
      },
      { status: 500 }
    );
  }
}
