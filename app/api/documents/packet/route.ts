import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestMattersFromClioBatch } from "@/lib/ingestMattersFromClioBatch";
import { indexMatterInternal } from "@/lib/indexMatterInternal";

function clean(value: unknown): string {
  return String(value || "").trim();
}

function upper(value: unknown): string {
  return clean(value).toUpperCase();
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(value: unknown): number {
  return Math.round(num(value) * 100) / 100;
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function isMasterRow(row: any): boolean {
  return upper(row.description).startsWith("MASTER LAWSUIT");
}

function isMultiplePlaceholder(value: unknown): boolean {
  const v = upper(value);
  return !v || v === "MULTIPLE" || v === "MULTIPLE PATIENT" || v === "MULTIPLE PATIENTS" || v === "MULTIPLE PROVIDERS";
}

function deriveField(masterValue: unknown, childValues: unknown[], label: string, warnings: string[]) {
  const master = clean(masterValue);
  const childUnique = uniqueStrings(childValues);

  if (childUnique.length > 1) {
    warnings.push(`${label}: multiple child values detected.`);
  }

  if (master && !isMultiplePlaceholder(master)) {
    if (childUnique.length > 0 && !childUnique.includes(master)) {
      warnings.push(`${label}: master value differs from child value(s).`);
    }

    return {
      value: master,
      source: "master",
      values: childUnique,
    };
  }

  if (childUnique.length === 0) {
    warnings.push(`${label}: missing on master and children.`);
    return {
      value: "",
      source: "missing",
      values: [],
    };
  }

  if (childUnique.length === 1) {
    return {
      value: childUnique[0],
      source: "children",
      values: childUnique,
    };
  }

  return {
    value: `MULTIPLE ${label.toUpperCase()}`,
    source: "children-multiple",
    values: childUnique,
  };
}

async function forceRefreshOnlyThisLawsuit(masterLawsuitId: string) {
  const seedRows = await prisma.claimIndex.findMany({
    where: { master_lawsuit_id: masterLawsuitId },
    select: { matter_id: true },
  });

  const matterIds = Array.from(
    new Set(
      seedRows
        .map((row) => Number(row.matter_id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );

  const refreshedMatterIds: number[] = [];
  const errors: any[] = [];
  const batchSize = 25;

  for (let i = 0; i < matterIds.length; i += batchSize) {
    const batch = matterIds.slice(i, i + batchSize);

    try {
      const results = await ingestMattersFromClioBatch(batch);

      for (const result of results as any[]) {
        if (result.ok) refreshedMatterIds.push(result.matterId);
        else errors.push(result);
      }
    } catch {
      for (const id of batch) {
        const result = await indexMatterInternal(id, { force: true });
        if (result.ok) refreshedMatterIds.push(id);
        else errors.push(result);
      }
    }
  }

  return {
    seedCount: seedRows.length,
    refreshedMatterIds,
    errors,
  };
}

export async function GET(req: NextRequest) {
  const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

  if (!masterLawsuitId) {
    return NextResponse.json(
      { ok: false, error: "Missing masterLawsuitId" },
      { status: 400 }
    );
  }

  const lawsuit = await prisma.lawsuit.findUnique({
    where: { masterLawsuitId },
    select: {
      id: true,
      masterLawsuitId: true,
      claimNumber: true,
      lawsuitMatters: true,
      sharedFolderPath: true,
      venue: true,
      venueSelection: true,
      venueOther: true,
      indexAaaNumber: true,
      lawsuitNotes: true,
      lawsuitOptions: true,
      amountSoughtMode: true,
      amountSought: true,
      customAmountSought: true,
      amountSoughtBreakdown: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const refresh = await forceRefreshOnlyThisLawsuit(masterLawsuitId);

  const rawRows = await prisma.claimIndex.findMany({
    where: { master_lawsuit_id: masterLawsuitId },
    orderBy: [
      { display_number: "asc" },
      { matter_id: "asc" },
    ],
  });

  const rows = rawRows
    .map((row: any) => ({
      ...row,
      isMaster: isMasterRow(row),
      is_master: isMasterRow(row),
    }))
    .sort((a: any, b: any) => {
      if (a.isMaster && !b.isMaster) return -1;
      if (!a.isMaster && b.isMaster) return 1;
      return clean(a.display_number).localeCompare(clean(b.display_number));
    });

  const masterRows = rows.filter((row: any) => row.isMaster);
  const childRows = rows.filter((row: any) => !row.isMaster);

  const warnings: string[] = [];
  const blockingErrors: string[] = [];

  if (rows.length === 0) blockingErrors.push("No ClaimIndex rows found for MASTER_LAWSUIT_ID.");
  if (masterRows.length === 0) blockingErrors.push("No master matter found for MASTER_LAWSUIT_ID.");
  if (masterRows.length > 1) blockingErrors.push("Multiple master matters found for MASTER_LAWSUIT_ID.");
  if (childRows.length === 0) blockingErrors.push("No child bill matters found for MASTER_LAWSUIT_ID.");
  if (refresh.errors.length > 0) warnings.push("One or more lawsuit matters could not be refreshed from Clio.");

  const master = masterRows[0] || null;

  const provider = deriveField(
    master?.client_name || master?.provider_name,
    childRows.map((row: any) => row.client_name || row.provider_name),
    "provider",
    warnings
  );

  const patient = deriveField(
    master?.patient_name,
    childRows.map((row: any) => row.patient_name),
    "patient",
    warnings
  );

  const insurer = deriveField(
    master?.insurer_name,
    childRows.map((row: any) => row.insurer_name),
    "insurer",
    warnings
  );

  const claimNumber = deriveField(
    master?.claim_number_raw || master?.claim_number_normalized,
    childRows.map((row: any) => row.claim_number_raw || row.claim_number_normalized),
    "claim number",
    warnings
  );

  const indexAaaNumber = deriveField(
    lawsuit?.indexAaaNumber || master?.index_aaa_number,
    childRows.map((row: any) => row.index_aaa_number),
    "index/AAA number",
    warnings
  );

  if (!lawsuit) {
    warnings.push("No local Lawsuit row found for MASTER_LAWSUIT_ID; packet is using ClaimIndex-derived metadata only.");
  }

  const amountSought = lawsuit
    ? {
        mode: lawsuit.amountSoughtMode,
        amount: money(lawsuit.amountSought),
        customAmount: lawsuit.customAmountSought === null ? null : money(lawsuit.customAmountSought),
        breakdown: lawsuit.amountSoughtBreakdown,
      }
    : {
        mode: "balance_presuit",
        amount: null,
        customAmount: null,
        breakdown: null,
      };

  const childMatters = childRows.map((row: any) => ({
    matterId: row.matter_id,
    displayNumber: row.display_number,
    description: row.description,
    providerName: row.client_name || row.provider_name || "",
    patientName: row.patient_name || "",
    insurerName: row.insurer_name || "",
    claimNumber: row.claim_number_raw || row.claim_number_normalized || "",
    billNumber: row.bill_number || "",
    claimAmount: money(row.claim_amount),
    settledAmount: money(row.settled_amount),
    paymentVoluntary: money(row.payment_voluntary),
    balancePresuit: money(row.balance_presuit),
    balanceAmount: money(row.balance_amount),
    dosStart: row.dos_start || "",
    dosEnd: row.dos_end || "",
    denialReason: row.denial_reason || "",
    indexAaaNumber: row.index_aaa_number || "",
    status: row.status || "",
  }));

  const totals = {
    billCount: childMatters.length,
    claimAmountTotal: money(childMatters.reduce((sum, row) => sum + num(row.claimAmount), 0)),
    settledAmountTotal: money(childMatters.reduce((sum, row) => sum + num(row.settledAmount), 0)),
    paymentVoluntaryTotal: money(childMatters.reduce((sum, row) => sum + num(row.paymentVoluntary), 0)),
    balancePresuitTotal: money(childMatters.reduce((sum, row) => sum + num(row.balancePresuit), 0)),
    balanceAmountTotal: money(childMatters.reduce((sum, row) => sum + num(row.balanceAmount), 0)),
  };

  const packet = {
    masterLawsuitId,
    generatedAt: new Date().toISOString(),

    metadata: {
      provider,
      patient,
      insurer,
      claimNumber,
      indexAaaNumber,
      venue: {
        value: lawsuit?.venue || "",
        selection: lawsuit?.venueSelection || "",
        other: lawsuit?.venueOther || "",
        source: lawsuit?.venue ? "lawsuit" : "missing",
      },
      lawsuitNotes: lawsuit?.lawsuitNotes || "",
      lawsuitOptions: lawsuit?.lawsuitOptions || null,
      amountSought,
      caption: {
        providerName: provider.value,
        patientName: patient.value,
        insurerName: insurer.value,
        claimNumber: claimNumber.value,
      },
    },

    lawsuit: lawsuit
      ? {
          id: lawsuit.id,
          masterLawsuitId: lawsuit.masterLawsuitId,
          claimNumber: lawsuit.claimNumber,
          lawsuitMatters: lawsuit.lawsuitMatters,
          sharedFolderPath: lawsuit.sharedFolderPath,
          venue: lawsuit.venue,
          venueSelection: lawsuit.venueSelection,
          venueOther: lawsuit.venueOther,
          indexAaaNumber: lawsuit.indexAaaNumber,
          lawsuitNotes: lawsuit.lawsuitNotes,
          lawsuitOptions: lawsuit.lawsuitOptions,
          amountSoughtMode: lawsuit.amountSoughtMode,
          amountSought: lawsuit.amountSought,
          customAmountSought: lawsuit.customAmountSought,
          amountSoughtBreakdown: lawsuit.amountSoughtBreakdown,
          createdAt: lawsuit.createdAt,
          updatedAt: lawsuit.updatedAt,
        }
      : null,

    masterMatter: master
      ? {
          matterId: master.matter_id,
          displayNumber: master.display_number,
          description: master.description,
          providerName: master.client_name || master.provider_name || "",
          patientName: master.patient_name || "",
          insurerName: master.insurer_name || "",
          claimNumber: master.claim_number_raw || master.claim_number_normalized || "",
          indexAaaNumber: master.index_aaa_number || "",
          status: master.status || "",
        }
      : null,

    childMatters,
    totals,

    validation: {
      warnings,
      blockingErrors,
      canGenerate: blockingErrors.length === 0,
    },

    refresh: {
      seedCount: refresh.seedCount,
      refreshedMatterCount: refresh.refreshedMatterIds.length,
      refreshedMatterIds: refresh.refreshedMatterIds,
      errorCount: refresh.errors.length,
      errors: refresh.errors,
      scope: "master-lawsuit-only",
    },
  };

  return NextResponse.json({
    ok: blockingErrors.length === 0,
    packet,
  });
}
