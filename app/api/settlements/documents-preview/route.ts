import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function money(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function safeFilePart(value: unknown): string {
  return clean(value)
    .replace(/[\/\\:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function todayPathPart() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isMasterRow(row: any): boolean {
  return clean(row?.description).toUpperCase().startsWith("MASTER LAWSUIT");
}

function safetySettlementDocumentsPreview() {
  return {
    action: "settlement-documents-preview",
    dryRun: true,
    previewOnly: true,
    readOnly: true,
    noClioRecordsChanged: true,
    noDatabaseRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    noPersistentFilesCreated: true,
  };
}

function uniqueClean(values: unknown[]): string[] {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function firstOrMultiple(values: unknown[], fallback = "") {
  const unique = uniqueClean(values);
  if (unique.length === 0) return fallback;
  if (unique.length === 1) return unique[0];
  return "MULTIPLE";
}

export async function GET(req: NextRequest) {
  try {
    const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-documents-preview",
          dryRun: true,
          error: "Missing masterLawsuitId",
          safety: safetySettlementDocumentsPreview(),
        },
        { status: 400 }
      );
    }

    const rows = await prisma.claimIndex.findMany({
      where: { master_lawsuit_id: masterLawsuitId },
      orderBy: [
        { display_number: "asc" },
        { matter_id: "asc" },
      ],
    });

    const decoratedRows = rows.map((row: any) => ({
      ...row,
      isMasterMatter: isMasterRow(row),
    }));

    const masterRows = decoratedRows.filter((row: any) => row.isMasterMatter);
    const childRows = decoratedRows.filter((row: any) => !row.isMasterMatter);

    const warnings: string[] = [];
    const blockingErrors: string[] = [];

    if (decoratedRows.length === 0) {
      blockingErrors.push("No ClaimIndex rows found for MASTER_LAWSUIT_ID.");
    }

    if (masterRows.length === 0) {
      warnings.push("No master matter row found in ClaimIndex for this settlement document preview.");
    }

    if (masterRows.length > 1) {
      warnings.push("Multiple master matter rows found in ClaimIndex for this MASTER_LAWSUIT_ID.");
    }

    if (childRows.length === 0) {
      blockingErrors.push("No child/bill matters found for settlement document preview.");
    }

    const currentValuesUrl = new URL("/api/settlements/current-values", req.nextUrl.origin);
    currentValuesUrl.searchParams.set("masterLawsuitId", masterLawsuitId);

    const currentValuesRes = await fetch(currentValuesUrl, {
      method: "GET",
      cache: "no-store",
    });

    const currentValuesJson = await currentValuesRes.json().catch(() => null);

    if (!currentValuesRes.ok || !currentValuesJson?.ok) {
      warnings.push(
        currentValuesJson?.error ||
          "Current Clio settlement values readback did not return a successful result."
      );
    }

    const currentRows = Array.isArray(currentValuesJson?.rows) ? currentValuesJson.rows : [];
    const totals = currentValuesJson?.totals || {};

    if (currentRows.length === 0) {
      warnings.push("No current Clio settlement value rows were returned for child/bill matters.");
    }

    const master = masterRows[0] || null;
    const provider = firstOrMultiple(
      childRows.map((row: any) => row.client_name || row.provider_name),
      clean(master?.client_name || master?.provider_name) || "Provider"
    );
    const patient = firstOrMultiple(
      childRows.map((row: any) => row.patient_name),
      clean(master?.patient_name) || "Patient"
    );
    const insurer = firstOrMultiple(
      childRows.map((row: any) => row.insurer_name),
      clean(master?.insurer_name) || "Insurer"
    );
    const claimNumber = firstOrMultiple(
      childRows.map((row: any) => row.claim_number_raw || row.claim_number_normalized),
      clean(master?.claim_number_raw || master?.claim_number_normalized) || "No Claim"
    );

    const masterDisplayNumber = clean(master?.display_number) || masterLawsuitId;
    const baseName = `${safeFilePart(masterDisplayNumber)} - ${safeFilePart(provider)} aao ${safeFilePart(patient)} v ${safeFilePart(insurer)} - Claim ${safeFilePart(claimNumber)}`;
    const folderPath = `Settlements/${todayPathPart()}/${masterLawsuitId} - ${safeFilePart(masterDisplayNumber)}`;

    const plannedDocuments = [
      {
        key: "settlement-summary",
        label: "Settlement Summary",
        filename: `${baseName} - Settlement Summary.docx`,
        status: blockingErrors.length === 0 ? "ready-route-only-docx" : "blocked",
        availableNow: true,
        generationEndpoint: "/api/settlements/settlement-summary",
        routeOnly: true,
        noUploadToClio: true,
        noDatabaseRecordCreated: true,
        noPrintQueueRecordCreated: true,
      },
      {
        key: "provider-remittance-breakdown",
        label: "Provider Remittance Breakdown",
        filename: `${baseName} - Provider Remittance Breakdown.docx`,
        status: blockingErrors.length === 0 ? "ready-route-only-docx" : "blocked",
        availableNow: true,
        generationEndpoint: "/api/settlements/provider-remittance-breakdown",
        routeOnly: true,
        noUploadToClio: true,
        noDatabaseRecordCreated: true,
        noPrintQueueRecordCreated: true,
      },
      {
        key: "attorney-fee-breakdown",
        label: "Attorney Fee Breakdown",
        filename: `${baseName} - Attorney Fee Breakdown.docx`,
        status: blockingErrors.length === 0 ? "ready-preview-only" : "blocked",
        availableNow: false,
        generationEndpointPlanned: "/api/settlements/attorney-fee-breakdown",
      },
    ];

    return NextResponse.json({
      ok: blockingErrors.length === 0,
      action: "settlement-documents-preview",
      dryRun: true,
      masterLawsuitId,
      folderPath,
      plannedDocuments,
      settlementSummary: {
        masterDisplayNumber,
        provider,
        patient,
        insurer,
        claimNumber,
        childMatterCount: childRows.length,
        currentValueRowCount: currentRows.length,
        settledAmountTotal: money(totals.settledAmountTotal),
        allocatedSettlementTotal: money(totals.allocatedSettlementTotal),
        interestAmountTotal: money(totals.interestAmountTotal),
        principalFeeTotal: money(totals.principalFeeTotal),
        interestFeeTotal: money(totals.interestFeeTotal),
        totalFeeTotal: money(totals.totalFeeTotal),
        providerNetTotal: money(totals.providerNetTotal),
        providerPrincipalNetTotal: money(totals.providerPrincipalNetTotal),
        providerInterestNetTotal: money(totals.providerInterestNetTotal),
      },
      rows: currentRows,
      validation: {
        canPreviewSettlementDocuments: blockingErrors.length === 0,
        warnings,
        blockingErrors,
      },
      safety: safetySettlementDocumentsPreview(),
      note:
        "Dry run only. This previews planned settlement documents and current Clio settlement values. No documents were generated, no Clio records were changed, no database records were changed, and no print queue records were changed.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-documents-preview",
        dryRun: true,
        error: err?.message || "Settlement documents preview failed.",
        safety: safetySettlementDocumentsPreview(),
      },
      { status: 500 }
    );
  }
}
