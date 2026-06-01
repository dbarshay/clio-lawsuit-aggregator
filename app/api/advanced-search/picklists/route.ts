import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FINAL_STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "Pending", label: "Pending" },
  { value: "Closed", label: "Closed" },
];

const FALLBACK_STATUS_STAGE_OPTIONS = [
  { value: "READY FOR ARBITRATION/LITIGATION", label: "READY FOR ARBITRATION/LITIGATION" },
  { value: "READY FOR ARBITRATION LITIGATION", label: "READY FOR ARBITRATION LITIGATION" },
];

function text(v: any) {
  return String(v ?? "").trim();
}

function referenceOptionValue(entity: any): string {
  return text(entity?.displayName || entity?.label || entity?.value || entity?.name);
}

function normalizeReferenceOptionRows(rows: any[]) {
  const options: Array<{ value: string; label: string; id?: string; referenceType?: string }> = [];

  for (const row of rows) {
    const label = referenceOptionValue(row);
    if (!label) continue;

    options.push({
      id: text(row?.id) || undefined,
      value: label,
      label,
      referenceType: text(row?.type) || undefined,
    });
  }

  return options;
}

async function fetchLocalReferenceOptions(type: string, fieldName: string) {
  try {
    const rows = await prisma.referenceEntity.findMany({
      where: {
        type,
        active: true,
      },
      select: {
        id: true,
        type: true,
        displayName: true,
        normalizedName: true,
        active: true,
      },
      orderBy: [
        { displayName: "asc" },
        { id: "asc" },
      ],
      take: 10000,
    });

    const options = normalizeReferenceOptionRows(rows);

    return {
      ok: true,
      fieldId: null,
      fieldName,
      referenceType: type,
      source: "local-reference-data",
      options,
      rawOptionCount: rows.length,
      usedFallback: options.length === 0,
      error: options.length === 0 ? `No active ${type} reference-data options found.` : null,
    };
  } catch (err: any) {
    return {
      ok: false,
      fieldId: null,
      fieldName,
      referenceType: type,
      source: "local-reference-data",
      options: [],
      rawOptionCount: 0,
      usedFallback: true,
      error: err?.message || String(err),
    };
  }
}

function fallbackMatterStages() {
  return {
    ok: true,
    fieldId: null,
    fieldName: "Matter Stage",
    source: "local-fallback",
    options: FALLBACK_STATUS_STAGE_OPTIONS,
    rawOptionCount: FALLBACK_STATUS_STAGE_OPTIONS.length,
    usedFallback: true,
    error: "Matter stage reference table is not implemented yet; local fallback used.",
  };
}

export async function GET() {
  const [denial, closeReason, serviceType] = await Promise.all([
    fetchLocalReferenceOptions("denial_reason", "Denial Reasons"),
    fetchLocalReferenceOptions("closed_reason", "Closed Reasons / Final Statuses"),
    fetchLocalReferenceOptions("service_type", "Service Types"),
  ]);

  const matterStages = fallbackMatterStages();

  return NextResponse.json({
    ok: true,
    action: "advanced-search-picklists",
    source: "barsh-matters-local-reference-data",
    clioRead: false,
    clioWrite: false,
    denialReason: denial,
    status: matterStages,
    closeReason: {
      ...closeReason,
      sourceFieldId: null,
      sourceFieldName: "Local Closed Reason Reference Data",
    },
    finalStatus: {
      ok: true,
      fieldId: null,
      fieldName: "Matter Status",
      source: "local-static",
      options: FINAL_STATUS_OPTIONS,
      rawOptionCount: FINAL_STATUS_OPTIONS.length,
      usedFallback: false,
      error: null,
    },
    serviceType,
    safety: {
      readOnly: true,
      localReferenceDataOnly: true,
      noClioReadPerformed: true,
      noClioRecordsChanged: true,
      noDatabaseRecordsChanged: true,
    },
  });
}
