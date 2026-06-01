import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown): string {
  return String(value || "").trim();
}

function numberOrNull(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function positiveLimit(value: unknown, fallback = 100): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.min(Math.floor(numeric), 250);
}

function iso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;

    const kind = clean(url.searchParams.get("kind"));
    const status = clean(url.searchParams.get("status")) || "open";
    const priority = clean(url.searchParams.get("priority"));
    const masterLawsuitId = clean(url.searchParams.get("masterLawsuitId"));
    const matterId = numberOrNull(url.searchParams.get("matterId"));
    const displayNumber = clean(url.searchParams.get("displayNumber"));
    const settlementRecordId = clean(url.searchParams.get("settlementRecordId"));
    const dueDate = clean(url.searchParams.get("dueDate"));
    const dueBefore = clean(url.searchParams.get("dueBefore"));
    const dueAfter = clean(url.searchParams.get("dueAfter"));
    const query = clean(url.searchParams.get("q"));
    const patient = clean(url.searchParams.get("patient"));
    const provider = clean(url.searchParams.get("provider"));
    const insuranceCompany = clean(url.searchParams.get("insuranceCompany"));
    const claim = clean(url.searchParams.get("claim"));
    const indexAaaNumber = clean(url.searchParams.get("indexAaaNumber"));
    const dateOpenedFrom = clean(url.searchParams.get("dateOpenedFrom"));
    const dateOpenedTo = clean(url.searchParams.get("dateOpenedTo"));
    const dosStart = clean(url.searchParams.get("dosStart"));
    const dosEnd = clean(url.searchParams.get("dosEnd"));
    const denialReason = clean(url.searchParams.get("denialReason"));
    const serviceType = clean(url.searchParams.get("serviceType"));
    const claimStatus = clean(url.searchParams.get("claimStatus"));
    const closeReason = clean(url.searchParams.get("closeReason"));
    const finalStatus = clean(url.searchParams.get("finalStatus"));
    const billNumber = clean(url.searchParams.get("billNumber"));
    const policyNumber = clean(url.searchParams.get("policyNumber"));
    const dateOfLoss = clean(url.searchParams.get("dateOfLoss"));
    const treatingProvider = clean(url.searchParams.get("treatingProvider"));
    const matterStage = clean(url.searchParams.get("matterStage"));
    const court = clean(url.searchParams.get("court"));
    const dateFiledFrom = clean(url.searchParams.get("dateFiledFrom"));
    const dateFiledTo = clean(url.searchParams.get("dateFiledTo"));
    const limit = positiveLimit(url.searchParams.get("limit"));

    const where: any = {};

    if (kind && kind !== "all") where.kind = kind;
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;
    if (masterLawsuitId) where.masterLawsuitId = masterLawsuitId;
    if (matterId !== null) where.matterId = matterId;
    if (displayNumber) where.displayNumber = displayNumber;
    if (settlementRecordId) where.settlementRecordId = settlementRecordId;

    if (dueDate || dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueDate) where.dueDate.equals = dueDate;
      if (dueBefore) where.dueDate.lte = dueBefore;
      if (dueAfter) where.dueDate.gte = dueAfter;
    }

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { displayNumber: { contains: query } },
        { masterLawsuitId: { contains: query } },
        { settlementRecordId: { contains: query } },
      ];
    }

    const claimIndexFilters = [
      patient,
      provider,
      insuranceCompany,
      claim,
      indexAaaNumber,
      dateOpenedFrom,
      dateOpenedTo,
      dosStart,
      dosEnd,
      denialReason,
      serviceType,
      claimStatus,
      closeReason,
      finalStatus,
      billNumber,
      policyNumber,
      dateOfLoss,
      treatingProvider,
      matterStage,
      court,
      dateFiledFrom,
      dateFiledTo,
    ].some(Boolean);

    if (claimIndexFilters) {
      const claimWhere: any = { AND: [] };

      if (patient) claimWhere.AND.push({ patient_name: { contains: patient } });
      if (provider) {
        claimWhere.AND.push({
          OR: [
            { provider_name: { contains: provider } },
            { client_name: { contains: provider } },
          ],
        });
      }
      if (insuranceCompany) claimWhere.AND.push({ insurer_name: { contains: insuranceCompany } });
      if (claim) claimWhere.AND.push({ claim_number_normalized: { contains: claim } });
      if (indexAaaNumber) claimWhere.AND.push({ index_aaa_number: { contains: indexAaaNumber } });
      if (denialReason) claimWhere.AND.push({ denial_reason: { contains: denialReason } });
      if (serviceType) claimWhere.AND.push({ service_type: { contains: serviceType } });
      if (claimStatus) claimWhere.AND.push({ status: { contains: claimStatus } });
      if (closeReason) claimWhere.AND.push({ close_reason: { contains: closeReason } });
      if (finalStatus) claimWhere.AND.push({ matter_stage_name: { contains: finalStatus } });
      if (billNumber) claimWhere.AND.push({ bill_number: { contains: billNumber } });
      if (policyNumber) claimWhere.AND.push({ policy_number: { contains: policyNumber } });
      if (dateOfLoss) claimWhere.AND.push({ date_of_loss: { contains: dateOfLoss } });
      if (treatingProvider) claimWhere.AND.push({ treating_provider: { contains: treatingProvider } });
      if (matterStage) claimWhere.AND.push({ matter_stage_name: { contains: matterStage } });

      if (court) {
        const loweredCourt = court.toLowerCase();
        const courtTerms = [court];
        if (loweredCourt.includes("civil")) courtTerms.push("CV");
        if (loweredCourt.includes("arbitration") || loweredCourt.includes("aaa")) courtTerms.push("AAA");
        claimWhere.AND.push({
          OR: courtTerms.flatMap((term) => [
            { index_aaa_number: { contains: term } },
            { matter_stage_name: { contains: term } },
            { raw_json: { contains: term } },
          ]),
        });
      }

      if (dateFiledFrom || dateFiledTo) {
        const filedRange: any = {};
        if (dateFiledFrom) filedRange.gte = new Date(`${dateFiledFrom}T00:00:00.000Z`);
        if (dateFiledTo) filedRange.lte = new Date(`${dateFiledTo}T23:59:59.999Z`);
        claimWhere.AND.push({ indexed_at: filedRange });
      }

      if (dateOpenedFrom || dateOpenedTo) {
        const indexedAt: any = {};
        if (dateOpenedFrom) indexedAt.gte = new Date(`${dateOpenedFrom}T00:00:00.000Z`);
        if (dateOpenedTo) indexedAt.lte = new Date(`${dateOpenedTo}T23:59:59.999Z`);
        claimWhere.AND.push({ indexed_at: indexedAt });
      }

      if (dosStart) claimWhere.AND.push({ dos_start: { gte: dosStart } });
      if (dosEnd) claimWhere.AND.push({ dos_end: { lte: dosEnd } });

      if (claimWhere.AND.length === 0) delete claimWhere.AND;

      const matchingClaims = await prisma.claimIndex.findMany({
        where: claimWhere,
        select: {
          matter_id: true,
          display_number: true,
          master_lawsuit_id: true,
        },
        take: 750,
      });

      const matterIds = Array.from(new Set(matchingClaims.map((row) => row.matter_id).filter((value) => Number.isFinite(Number(value)))));
      const displayNumbers = Array.from(new Set(matchingClaims.map((row) => row.display_number).filter(Boolean)));
      const masterLawsuitIds = Array.from(new Set(matchingClaims.map((row) => row.master_lawsuit_id).filter(Boolean)));

      if (matterIds.length === 0 && displayNumbers.length === 0 && masterLawsuitIds.length === 0) {
        where.id = "__NO_MATCHING_TICKLERS__";
      } else {
        const linkedClauses: any[] = [];
        if (matterIds.length) linkedClauses.push({ matterId: { in: matterIds } });
        if (displayNumbers.length) linkedClauses.push({ displayNumber: { in: displayNumbers } });
        if (masterLawsuitIds.length) linkedClauses.push({ masterLawsuitId: { in: masterLawsuitIds } });

        if (linkedClauses.length) {
          where.AND = [
            ...(Array.isArray(where.AND) ? where.AND : []),
            { OR: linkedClauses },
          ];
        }
      }
    }

    const ticklers = await prisma.localWorkflowTickler.findMany({
      where,
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      select: {
        id: true,
        kind: true,
        source: true,
        status: true,
        priority: true,
        title: true,
        description: true,
        masterLawsuitId: true,
        matterId: true,
        displayNumber: true,
        settlementRecordId: true,
        dueDate: true,
        completedAt: true,
        completedBy: true,
        completedNote: true,
        metadata: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const kinds = await prisma.localWorkflowTickler.findMany({
      distinct: ["kind"],
      orderBy: { kind: "asc" },
      select: { kind: true },
    });

    const statuses = await prisma.localWorkflowTickler.findMany({
      distinct: ["status"],
      orderBy: { status: "asc" },
      select: { status: true },
    });

    return NextResponse.json({
      ok: true,
      action: "admin-generic-tickler-search",
      count: ticklers.length,
      limit,
      filters: {
        kind: kind || "all",
        status,
        priority: priority || "all",
        masterLawsuitId: masterLawsuitId || null,
        matterId,
        displayNumber: displayNumber || null,
        settlementRecordId: settlementRecordId || null,
        dueDate: dueDate || null,
        dueBefore: dueBefore || null,
        dueAfter: dueAfter || null,
        q: query || null,
        patient: patient || null,
        provider: provider || null,
        insuranceCompany: insuranceCompany || null,
        claim: claim || null,
        indexAaaNumber: indexAaaNumber || null,
        dateOpenedFrom: dateOpenedFrom || null,
        dateOpenedTo: dateOpenedTo || null,
        dosStart: dosStart || null,
        dosEnd: dosEnd || null,
        denialReason: denialReason || null,
        serviceType: serviceType || null,
        claimStatus: claimStatus || null,
        closeReason: closeReason || null,
        finalStatus: finalStatus || null,
        billNumber: billNumber || null,
        policyNumber: policyNumber || null,
        dateOfLoss: dateOfLoss || null,
        treatingProvider: treatingProvider || null,
        matterStage: matterStage || null,
        court: court || null,
        dateFiledFrom: dateFiledFrom || null,
        dateFiledTo: dateFiledTo || null,
      },
      availableFilters: {
        kinds: kinds.map((row) => row.kind).filter(Boolean),
        statuses: statuses.map((row) => row.status).filter(Boolean),
      },
      ticklers: ticklers.map((tickler) => ({
        ...tickler,
        completedAt: iso(tickler.completedAt),
        createdAt: iso(tickler.createdAt),
        updatedAt: iso(tickler.updatedAt),
      })),
      safety: {
        administratorFunction: true,
        readOnly: true,
        localOnly: true,
        matterPageRunner: false,
        clioWritesPerformed: false,
        documentsChanged: false,
        emailsChanged: false,
        printQueueChanged: false,
      },
      note:
        "Administrator-only Barsh Matters local tickler search foundation. Filters are combinable across tickler fields and Advanced Search identity fields, including provider/client, patient, insurer, claim, date of loss, denial reason, status, close reason, court, date filed range, Index/AAA number, DOS, service type, bill number, policy number, treating provider, matter, and lawsuit context. This route is read-only and does not run or process ticklers.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "admin-generic-tickler-search",
        error: error?.message || "Admin generic tickler search failed.",
      },
      { status: 500 }
    );
  }
}
