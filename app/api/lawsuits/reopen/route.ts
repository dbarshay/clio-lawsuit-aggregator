import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLawsuitMatterIds } from "@/lib/lawsuitMembership";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Reopening a lawsuit (and its child matters) is LOCAL ONLY (admin action). Clio is a document
// repository — it is never written for lawsuit/matter status. No Clio call happens here.
// Symmetric to Close Lawsuit: closing a lawsuit closes its child matters; reopening a lawsuit
// reopens those child matters.

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function jsonError(message: string, status = 400, details: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...details }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const masterLawsuitId = text(body?.masterLawsuitId);
    const actorName = text(body?.actorName) || "Barsh Matters Admin";
    const actorEmail = text(body?.actorEmail);

    if (!masterLawsuitId) {
      return jsonError("masterLawsuitId is required.");
    }

    const existing = await prisma.lawsuit.findUnique({
      where: { masterLawsuitId },
    });

    if (!existing) {
      return jsonError(`No local Lawsuit row found for ${masterLawsuitId}.`, 404, { masterLawsuitId });
    }

    const childMatterIds = parseLawsuitMatterIds(existing.lawsuitMatters);
    const existingOptions =
      existing.lawsuitOptions && typeof existing.lawsuitOptions === "object" && !Array.isArray(existing.lawsuitOptions)
        ? (existing.lawsuitOptions as Record<string, unknown>)
        : {};

    const result = await prisma.$transaction(async (tx) => {
      const lawsuit = await tx.lawsuit.update({
        where: { masterLawsuitId },
        data: {
          lawsuitOptions: {
            ...existingOptions,
            finalStatus: "Open",
            final_status: "Open",
            closeReason: "",
            close_reason: "",
            reopenedAt: new Date().toISOString(),
            closeWorkflow: "local-reopen-lawsuit",
          },
        },
      });

      const childByMasterUpdate = await tx.claimIndex.updateMany({
        where: { master_lawsuit_id: masterLawsuitId },
        data: {
          final_status: "Open",
          close_reason: "",
          indexed_at: new Date(),
        },
      });

      const childByMatterIdUpdate = childMatterIds.length
        ? await tx.claimIndex.updateMany({
            where: { matter_id: { in: childMatterIds } },
            data: {
              final_status: "Open",
              close_reason: "",
              indexed_at: new Date(),
            },
          })
        : { count: 0 };

      await tx.auditLog.create({
        data: {
          action: "local-lawsuit-reopen",
          summary: `Reopened lawsuit ${masterLawsuitId} locally (admin); child matters marked Open.`,
          entityType: "lawsuit",
          fieldName: "final_status",
          priorValue: {
            lawsuitOptions: existing.lawsuitOptions || null,
          },
          newValue: {
            finalStatus: "Open",
            childFinalStatus: "Open",
          },
          details: {
            source: "local-reopen-lawsuit-route",
            storage: "Lawsuit.lawsuitOptions + ClaimIndex (local only)",
            childMatterIds,
            childByMasterUpdatedCount: childByMasterUpdate.count,
            childByMatterIdUpdatedCount: childByMatterIdUpdate.count,
            clioWrite: false,
            adminAction: true,
          },
          affectedMatterIds: childMatterIds,
          masterLawsuitId,
          sourcePage: "master-lawsuit",
          workflow: "local-reopen-lawsuit",
          actorName,
          actorEmail: actorEmail || null,
        },
      });

      return {
        lawsuit,
        childByMasterUpdatedCount: childByMasterUpdate.count,
        childByMatterIdUpdatedCount: childByMatterIdUpdate.count,
        childMatterIds,
      };
    });

    return NextResponse.json({
      ok: true,
      action: "local-reopen-lawsuit",
      source: "local-lawsuit-schema-and-claimindex",
      clioWrite: false,
      masterLawsuitId,
      finalStatus: "Open",
      childFinalStatus: "Open",
      childMatterIds: result.childMatterIds,
      childByMasterUpdatedCount: result.childByMasterUpdatedCount,
      childByMatterIdUpdatedCount: result.childByMatterIdUpdatedCount,
      lawsuit: result.lawsuit,
      safety: {
        clioWrite: false,
        lawsuitUpdated: true,
        childClaimIndexUpdated: true,
        auditLogCreated: true,
      },
    });
  } catch (error: any) {
    return jsonError(error?.message || "Local lawsuit reopen failed.", 500);
  }
}
