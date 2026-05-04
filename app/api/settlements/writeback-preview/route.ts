import { NextRequest, NextResponse } from "next/server";
import { previewSettlementWritebackToClio } from "@/lib/settlementClioWriteback";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const masterLawsuitId = clean(body.masterLawsuitId);
    const rows = asArray(body.rows);

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback-preview",
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

    if (rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-writeback-preview",
          dryRun: true,
          masterLawsuitId,
          error: "No settlement rows provided for writeback preview.",
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

    const results = [];

    for (const row of rows) {
      const request = row?.clioWritebackPreview || row;

      const result = await previewSettlementWritebackToClio({
        request: {
          matterId: Number(request.matterId),
          displayNumber: clean(request.displayNumber),
          fields: request.fields || {},
        },
      });

      results.push(result);
    }

    const missingRequiredFieldResults = results.filter(
      (result: any) => Array.isArray(result.missingRequiredFields) && result.missingRequiredFields.length > 0
    );

    const masterMatterBlockedResults = results.filter((result: any) => result.isMasterMatter);

    const ok =
      results.length > 0 &&
      missingRequiredFieldResults.length === 0 &&
      masterMatterBlockedResults.length === 0 &&
      results.every((result: any) => result.ok);

    return NextResponse.json(
      {
        ok,
        action: "settlement-writeback-preview",
        dryRun: true,
        masterLawsuitId,
        count: results.length,
        results,
        validation: {
          canWriteIfConfirmed: ok,
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
        safety: {
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noDocumentsGenerated: true,
          noPrintQueueRecordsChanged: true,
          noPersistentFilesCreated: true,
        },
        note:
          "Dry run only. This endpoint validates planned settlement Clio writeback payloads but does not write to Clio or the database.",
      },
      { status: ok ? 200 : 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-writeback-preview",
        dryRun: true,
        error: err?.message || "Settlement writeback preview failed.",
        safety: {
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noDocumentsGenerated: true,
          noPrintQueueRecordsChanged: true,
          noPersistentFilesCreated: true,
        },
      },
      { status: 500 }
    );
  }
}
