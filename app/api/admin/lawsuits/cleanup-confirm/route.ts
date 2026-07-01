import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const KEEP_MASTER = "2026.05.00001";

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function money(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function claimIndexRow(row: any) {
  return {
    displayNumber: text(row.display_number),
    matterId: text(row.matter_id),
    masterLawsuitId: text(row.master_lawsuit_id),
    patient: text(row.patient_name),
    provider: text(row.client_name || row.provider_name),
    insurer: text(row.insurer_name),
    claimNumber: text(row.claim_number_raw || row.claim_number_normalized),
    claimAmount: money(row.claim_amount),
    balancePresuit: money(row.balance_presuit || row.balance_amount),
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const masterLawsuitId = text(body?.masterLawsuitId);
  const confirmation = text(body?.confirmation);
  const deleteClioShell = Boolean(body?.deleteClioShell);
  const actorName = text(body?.actorName) || "Admin Lawsuit Cleanup";
  const actorEmail = text(body?.actorEmail);

  const expectedConfirmation = `DEAGGREGATE AND DELETE ${masterLawsuitId}`;

  if (!masterLawsuitId) {
    return NextResponse.json(
      {
        ok: false,
        error: "masterLawsuitId is required.",
        writesLocalDb: false,
        writesClio: false,
        deletesClio: false,
      },
      { status: 400 }
    );
  }

  if (masterLawsuitId === KEEP_MASTER) {
    return NextResponse.json(
      {
        ok: false,
        error: `Protected keep-master lawsuit ${KEEP_MASTER} cannot be deaggregated or deleted by this route.`,
        writesLocalDb: false,
        writesClio: false,
        deletesClio: false,
      },
      { status: 409 }
    );
  }

  if (confirmation !== expectedConfirmation) {
    return NextResponse.json(
      {
        ok: false,
        error: `Exact confirmation required: ${expectedConfirmation}`,
        expectedConfirmation,
        writesLocalDb: false,
        writesClio: false,
        deletesClio: false,
      },
      { status: 400 }
    );
  }

  const lawsuit = await prisma.lawsuit.findUnique({
    where: { masterLawsuitId },
  });

  if (!lawsuit) {
    return NextResponse.json(
      {
        ok: false,
        error: `No local Lawsuit row found for ${masterLawsuitId}.`,
        writesLocalDb: false,
        writesClio: false,
        deletesClio: false,
      },
      { status: 404 }
    );
  }

  const childRows = await prisma.claimIndex.findMany({
    where: { master_lawsuit_id: masterLawsuitId },
    orderBy: [{ display_number: "asc" }, { matter_id: "asc" }],
  });

  // Clio is a document repository only. Any clioMaster* fields are stale LOCAL metadata from the
  // legacy per-matter-shell era; there is no per-lawsuit Clio matter to delete. Cleanup is purely
  // local: we clear child links and delete the local Lawsuit row (which drops the stale metadata).
  // No Clio call is made here, regardless of the deleteClioShell request flag.
  const clioMasterMatterId = typeof lawsuit.clioMasterMatterId === "number" ? lawsuit.clioMasterMatterId : null;
  const clioMasterDisplayNumber = text(lawsuit.clioMasterDisplayNumber);
  const clioMasterMappingSource = text(lawsuit.clioMasterMappingSource);

  const childSnapshot = (childRows as any[]).map(claimIndexRow);

  const localResult = await prisma.$transaction(async (tx: any) => {
    const cleared = await tx.claimIndex.updateMany({
      where: { master_lawsuit_id: masterLawsuitId },
      data: { master_lawsuit_id: null },
    });

    const deleted = await tx.lawsuit.delete({
      where: { masterLawsuitId },
    });

    const auditEntry = await tx.auditLog.create({
      data: {
        action: "admin-lawsuit-cleanup-confirm",
        summary: `Admin deaggregated and deleted lawsuit ${masterLawsuitId}.`,
        entityType: "lawsuit",
        masterLawsuitId,
        actorName,
        actorEmail: actorEmail || null,
        details: {
          masterLawsuitId,
          amountSought: money((lawsuit as any).amountSought),
          venue: text((lawsuit as any).venue || (lawsuit as any).venueSelection),
          indexAaaNumber: text((lawsuit as any).indexAaaNumber),
          childCount: childSnapshot.length,
          children: childSnapshot,
          clioShell: {
            deleteRequested: deleteClioShell,
            deleted: false,
            clioWrite: false,
            note: "No Clio call made. Clio is a document repository; stale clioMaster* metadata was cleared locally only.",
            clioMasterMatterId,
            clioMasterDisplayNumber,
            clioMasterMappingSource,
          },
          safety: {
            keepMasterProtected: KEEP_MASTER,
            noClioWrite: true,
            noChildClioMatterDeletion: true,
            noDocumentUpload: true,
            noEmail: true,
            noPrintQueue: true,
          },
        },
      },
    });

    return {
      clearedClaimIndexLinks: cleared.count,
      deletedLocalLawsuit: {
        masterLawsuitId: deleted.masterLawsuitId,
        clioMasterMatterId: deleted.clioMasterMatterId,
        clioMasterDisplayNumber: deleted.clioMasterDisplayNumber,
      },
      auditLogId: auditEntry.id,
    };
  });

  return NextResponse.json({
    ok: true,
    destructiveCleanupCompleted: true,
    masterLawsuitId,
    childCount: childSnapshot.length,
    children: childSnapshot,
    clioDeleteResult: null,
    localResult,
    writesLocalDb: true,
    writesClio: false,
    deletesClio: false,
    deletedClioShellOnly: false,
    deletedChildClioMatters: false,
    safetyDecision:
      "Completed local-only Admin Lawsuit Cleanup. Cleared local child lawsuit links, deleted the local Lawsuit row, made no Clio call, and wrote an AuditLog entry.",
  });
}
