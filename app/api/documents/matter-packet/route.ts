import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: unknown): number {
  return Math.round(num(value) * 100) / 100;
}

function moneyOption(value: unknown): number {
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
  }
  return money(value);
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function compactObject(value: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === "string" && !v.trim()) return false;
      if (Array.isArray(v) && v.length === 0) return false;
      if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) return false;
      return true;
    })
  );
}

function referenceSummary(entity: any | null) {
  if (!entity) return null;
  const details = asRecord(entity.details);
  const hidden = asRecord(details._hiddenImportFields);

  return {
    id: entity.id,
    type: entity.type,
    displayName: entity.displayName,
    normalizedName: entity.normalizedName,
    notes: entity.notes || "",
    source: entity.source || "",
    details,
    hiddenDetails: hidden,
  };
}

function findReferenceEntity(entities: any[], type: string, value: unknown) {
  const wanted = clean(value).toLowerCase();
  if (!wanted) return null;

  return (
    entities.find((entity) => {
      const displayName = clean(entity.displayName).toLowerCase();
      const normalizedName = clean(entity.normalizedName).toLowerCase();
      return entity.type === type && (displayName === wanted || normalizedName === wanted);
    }) || null
  );
}

async function loadMatterDocumentReferenceData(args: {
  providerName: string;
  patientName: string;
  insurerName: string;
  treatingProviderName: string;
}) {
  const lookupValues = uniqueStrings([
    args.providerName,
    args.patientName,
    args.insurerName,
    args.treatingProviderName,
  ]);

  if (lookupValues.length === 0) {
    return {
      provider: null,
      patient: null,
      insurer: null,
      treatingProvider: null,
      lookupValues,
    };
  }

  const entities = await prisma.referenceEntity.findMany({
    where: {
      active: true,
      type: {
        in: ["provider_client", "patient", "insurer_company", "treating_provider"],
      },
      displayName: {
        in: lookupValues,
      },
    },
    select: {
      id: true,
      type: true,
      displayName: true,
      normalizedName: true,
      notes: true,
      details: true,
      source: true,
    },
  });

  return {
    provider: referenceSummary(findReferenceEntity(entities, "provider_client", args.providerName)),
    patient: referenceSummary(findReferenceEntity(entities, "patient", args.patientName)),
    insurer: referenceSummary(findReferenceEntity(entities, "insurer_company", args.insurerName)),
    treatingProvider: referenceSummary(findReferenceEntity(entities, "treating_provider", args.treatingProviderName)),
    lookupValues,
  };
}

function brlNumber(value: string): string {
  const cleaned = clean(value).toUpperCase();
  if (!cleaned) return "";
  if (cleaned.startsWith("BRL")) return cleaned;
  if (/^\d+$/.test(cleaned)) return `BRL${cleaned}`;
  return cleaned;
}

function rowDisplayNumber(row: any): string {
  return clean(row?.display_number || row?.displayNumber || row?.matter_display_number || row?.matterDisplayNumber);
}

function rowMatterId(row: any): number {
  return Number(row?.matter_id || row?.matterId || 0);
}

function rowMasterLawsuitId(row: any): string {
  return clean(row?.master_lawsuit_id || row?.masterLawsuitId);
}

function rowProvider(row: any): string {
  return clean(row?.client_name || row?.provider_name || row?.providerName);
}

function rowPatient(row: any): string {
  return clean(row?.patient_name || row?.patientName);
}

function rowInsurer(row: any): string {
  return clean(row?.insurer_name || row?.insurerName);
}

function rowClaimNumber(row: any): string {
  return clean(row?.claim_number_raw || row?.claim_number_normalized || row?.claimNumber);
}

function rowTreatingProvider(row: any): string {
  return clean(row?.treating_provider || row?.treatingProvider);
}

async function findMatterRow(input: string) {
  const displayNumber = brlNumber(input);
  const numericMatterId = Number(input);

  const or: any[] = [];
  if (displayNumber) {
    or.push({ display_number: displayNumber });
  }
  if (Number.isFinite(numericMatterId) && numericMatterId > 0) {
    or.push({ matter_id: numericMatterId });
  }

  if (or.length === 0) return null;

  return prisma.claimIndex.findFirst({
    where: { OR: or },
  });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const matterIdInput =
      clean(url.searchParams.get("matterId")) ||
      clean(url.searchParams.get("matter")) ||
      clean(url.searchParams.get("displayNumber")) ||
      clean(url.searchParams.get("brl"));

    if (!matterIdInput) {
      return NextResponse.json(
        {
          ok: false,
          error: "matterId, matter, displayNumber, or brl is required.",
          generatesDocuments: false,
          localOnly: true,
          clioCorrectnessDependency: false,
        },
        { status: 400 }
      );
    }

    const matter = await findMatterRow(matterIdInput);

    if (!matter) {
      return NextResponse.json(
        {
          ok: false,
          error: `No local ClaimIndex row found for ${matterIdInput}.`,
          matterIdInput,
          generatesDocuments: false,
          localOnly: true,
          clioCorrectnessDependency: false,
          sources: {
            claimIndex: false,
            referenceData: false,
            lawsuit: false,
            clio: false,
          },
        },
        { status: 404 }
      );
    }

    const displayNumber = rowDisplayNumber(matter);
    const numericMatterId = rowMatterId(matter);
    const masterLawsuitId = rowMasterLawsuitId(matter);
    const providerName = rowProvider(matter);
    const patientName = rowPatient(matter);
    const insurerName = rowInsurer(matter);
    const claimNumber = rowClaimNumber(matter);
    const treatingProviderName = rowTreatingProvider(matter);

    const lawsuit = masterLawsuitId
      ? await prisma.lawsuit.findUnique({
          where: { masterLawsuitId },
        })
      : null;

    const lawsuitOptions = asRecord(lawsuit?.lawsuitOptions);
    const selectedCourtDetails = lawsuitOptions.selectedCourtDetails || null;
    const dateOfLoss = clean(lawsuitOptions.dateOfLoss || matter?.date_of_loss);
    const dateFiled = clean(lawsuitOptions.dateFiled);
    const indexFee = moneyOption(lawsuitOptions.indexFee ?? lawsuitOptions.filingFee);
    const serviceFee = moneyOption(lawsuitOptions.serviceFee);
    const otherCourtFees = moneyOption(lawsuitOptions.otherCourtFees ?? lawsuitOptions.otherCourtCosts);
    const courtCostsTotal =
      moneyOption(lawsuitOptions.courtCostsTotal) || money(indexFee + serviceFee + otherCourtFees);

    const referenceData = await loadMatterDocumentReferenceData({
      providerName,
      patientName,
      insurerName,
      treatingProviderName,
    });

    const claimIndexFields = {
      matterId: numericMatterId || null,
      displayNumber,
      providerName,
      patientName,
      insurerName,
      claimNumber,
      treatingProviderName,
      masterLawsuitId,
      billNumber: clean(matter?.bill_number),
      claimAmount: money(matter?.claim_amount),
      paymentVoluntary: money(matter?.payment_voluntary),
      balancePresuit: money(matter?.balance_presuit),
      balanceAmount: money(matter?.balance_amount),
      settledAmount: money(matter?.settled_amount),
      settledWith: clean(matter?.settled_with),
      allocatedSettlement: money(matter?.allocated_settlement),
      interestAmount: money(matter?.interest_amount),
      principalFee: money(matter?.principal_fee),
      interestFee: money(matter?.interest_fee),
      totalFee: money(matter?.total_fee),
      providerNet: money(matter?.provider_net),
      providerPrincipalNet: money(matter?.provider_principal_net),
      providerInterestNet: money(matter?.provider_interest_net),
      overdueDays: num(matter?.overdue_days),
      dosStart: clean(matter?.dos_start),
      dosEnd: clean(matter?.dos_end),
      denialReason: clean(matter?.denial_reason),
      indexAaaNumber: clean(matter?.index_aaa_number || lawsuit?.indexAaaNumber),
      status: clean(matter?.status),
      description: clean(matter?.description),
    };

    const lawsuitContext = lawsuit
      ? {
          masterLawsuitId: lawsuit.masterLawsuitId,
          claimNumber: lawsuit.claimNumber,
          venue: lawsuit.venue,
          venueSelection: lawsuit.venueSelection,
          venueOther: lawsuit.venueOther,
          indexAaaNumber: lawsuit.indexAaaNumber,
          lawsuitNotes: lawsuit.lawsuitNotes,
          lawsuitOptions,
          selectedCourtDetails,
          dateOfLoss,
          dateFiled,
          indexFee,
          serviceFee,
          otherCourtFees,
          courtCostsTotal,
        }
      : null;

    const templateFields = compactObject({
      matterId: numericMatterId || null,
      displayNumber,
      brlNumber: displayNumber,
      masterLawsuitId,
      providerName,
      patientName,
      insurerName,
      claimNumber,
      treatingProviderName,
      billNumber: claimIndexFields.billNumber,
      claimAmount: claimIndexFields.claimAmount,
      paymentVoluntary: claimIndexFields.paymentVoluntary,
      balancePresuit: claimIndexFields.balancePresuit,
      balanceAmount: claimIndexFields.balanceAmount,
      dosStart: claimIndexFields.dosStart,
      dosEnd: claimIndexFields.dosEnd,
      denialReason: claimIndexFields.denialReason,
      indexAaaNumber: claimIndexFields.indexAaaNumber,
      status: claimIndexFields.status,
      courtName: lawsuit?.venue || "",
      courtSelection: lawsuit?.venueSelection || "",
      courtOther: lawsuit?.venueOther || "",
      courtDetails: selectedCourtDetails,
      dateOfLoss,
      dateFiled,
      indexFee,
      serviceFee,
      otherCourtFees,
      courtCostsTotal,
    });

    const blockingErrors: string[] = [];
    if (!displayNumber) blockingErrors.push("Matter display number is missing.");
    if (!providerName) blockingErrors.push("Provider/client is missing.");
    if (!patientName) blockingErrors.push("Patient is missing.");
    if (!insurerName) blockingErrors.push("Insurer is missing.");
    if (!claimNumber) blockingErrors.push("Claim number is missing.");

    const documentData = {
      readyForTemplates: true,
      generatesDocuments: false,
      localOnly: true,
      clioCorrectnessDependency: false,
      documentScope: "direct_matter",
      sources: {
        claimIndex: true,
        referenceData: true,
        lawsuit: !!lawsuit,
        clio: false,
      },
      claimIndexFields,
      lawsuitContext,
      referenceData,
      templateFields,
    };

    return NextResponse.json({
      ok: blockingErrors.length === 0,
      matterIdInput,
      packet: {
        documentScope: "direct_matter",
        generatedAt: new Date().toISOString(),
        matter: claimIndexFields,
        lawsuit: lawsuitContext,
        metadata: {
          provider: { value: providerName, source: "claimIndex" },
          patient: { value: patientName, source: "claimIndex" },
          insurer: { value: insurerName, source: "claimIndex" },
          claimNumber: { value: claimNumber, source: "claimIndex" },
          treatingProvider: { value: treatingProviderName, source: "claimIndex" },
          masterLawsuitId: { value: masterLawsuitId, source: masterLawsuitId ? "claimIndex" : "missing" },
          documentData,
        },
        validation: {
          blockingErrors,
          canGenerate: blockingErrors.length === 0,
        },
        refresh: {
          skipped: true,
          reason: "local-direct-matter-document-packet-no-clio-refresh",
          clioCorrectnessDependency: false,
          seedCount: 0,
          refreshedMatterCount: 0,
          refreshedMatterIds: [],
          errorCount: 0,
          errors: [],
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Direct matter document packet lookup failed.",
        generatesDocuments: false,
        localOnly: true,
        clioCorrectnessDependency: false,
      },
      { status: 500 }
    );
  }
}
