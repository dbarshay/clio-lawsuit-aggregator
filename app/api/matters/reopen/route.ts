import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLawsuitMembershipForMatter } from "@/lib/lawsuitMembership";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Reopening a matter is LOCAL ONLY (admin action). Clio is a document repository and is never
// written for status. A matter that is aggregated into a lawsuit is reopened by reopening the
// lawsuit (which cascades to its child matters), not individually.

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function jsonError(message: string, status = 400, details: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...details }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const matterId = Number(body?.matterId);
    const actorName = text(body?.actorName) || "Barsh Matters Admin";
    const actorEmail = text(body?.actorEmail);

    if (!Number.isFinite(matterId) || matterId <= 0) {
      return jsonError("A valid matterId is required.");
    }

    const existing = await prisma.claimIndex.findUnique({
      where: { matter_id: matterId },
      select: {
        matter_id: true,
        display_number: true,
        master_lawsuit_id: true,
        final_status: true,
        close_reason: true,
      },
    });

    if (!existing) {
      return jsonError("No local ClaimIndex row exists for this matter.", 404, { matterId });
    }

    // A matter aggregated into a lawsuit is governed by the lawsuit — reopen it via the lawsuit.
    const membership = await getLawsuitMembershipForMatter(matterId, existing.master_lawsuit_id);
    if (membership.inLawsuit) {
      return jsonError(
        `This matter is part of lawsuit ${membership.masterLawsuitId}. Reopen the lawsuit to reopen its matters.`,
        409,
        { matterId, masterLawsuitId: membership.masterLawsuitId, inLawsuit: true }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const claimIndex = await tx.claimIndex.update({
        where: { matter_id: matterId },
        data: {
          final_status: "Open",
          close_reason: "",
          indexed_at: new Date(),
        },
        select: {
          matter_id: true,
          display_number: true,
          patient_name: true,
          client_name: true,
          insurer_name: true,
          master_lawsuit_id: true,
          status: true,
          matter_stage_name: true,
          final_status: true,
          close_reason: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "claimindex-matter-reopen",
          summary: `Reopened matter ${claimIndex.display_number || claimIndex.matter_id} locally (admin).`,
          entityType: "matter",
          fieldName: "final_status",
          priorValue: {
            finalStatus: existing.final_status || null,
            closeReason: existing.close_reason || null,
          },
          newValue: {
            finalStatus: "Open",
            closeReason: "",
          },
          details: {
            source: "local-reopen-matter-route",
            storage: "ClaimIndex (local only)",
            clioWrite: false,
            adminAction: true,
          },
          affectedMatterIds: [matterId],
          matterId,
          matterDisplayNumber: claimIndex.display_number || null,
          masterLawsuitId: claimIndex.master_lawsuit_id || null,
          sourcePage: "direct-matter",
          workflow: "local-reopen-matter",
          actorName,
          actorEmail: actorEmail || null,
        },
      });

      return claimIndex;
    });

    return NextResponse.json({
      ok: true,
      action: "local-reopen-matter",
      source: "claimindex-local-only",
      clioWrite: false,
      matterId,
      displayNumber: updated.display_number || "",
      finalStatus: updated.final_status || "Open",
      closeReason: updated.close_reason || "",
      matter: {
        id: updated.matter_id,
        matterId: updated.matter_id,
        matter_id: updated.matter_id,
        displayNumber: updated.display_number || "",
        display_number: updated.display_number || "",
        finalStatus: updated.final_status || "Open",
        final_status: updated.final_status || "Open",
        closeReason: updated.close_reason || "",
        close_reason: updated.close_reason || "",
      },
      claimIndex: updated,
      safety: {
        clioWrite: false,
        claimIndexUpdated: true,
        auditLogCreated: true,
      },
    });
  } catch (error: any) {
    return jsonError(error?.message || "Local matter reopen failed.", 500);
  }
}
