import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTLEMENT_PAYMENT_DUE_KIND = "settlement_payment_due_followup";

type DuplicateCandidate = {
  id: string;
  kind: string;
  status: string;
  title: string | null;
  description: string | null;
  masterLawsuitId: string | null;
  matterId: number | null;
  displayNumber: string | null;
  settlementRecordId: string | null;
  dueDate: string | null;
  priority: string;
  source: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function duplicateKeyFor(tickler: {
  settlementRecordId: string | null;
  masterLawsuitId: string | null;
  dueDate: string | null;
}) {
  return [
    safeText(tickler.settlementRecordId),
    safeText(tickler.masterLawsuitId),
    safeText(tickler.dueDate),
  ].join("::");
}

function iso(value: Date | string | null | undefined): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value || null;
  return null;
}

function serializeTickler(row: DuplicateCandidate) {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    description: row.description,
    masterLawsuitId: row.masterLawsuitId,
    matterId: row.matterId,
    displayNumber: row.displayNumber,
    settlementRecordId: row.settlementRecordId,
    dueDate: row.dueDate,
    priority: row.priority,
    source: row.source,
    metadata: row.metadata,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export async function GET() {
  try {
    const ticklers = await prisma.localWorkflowTickler.findMany({
      where: {
        kind: SETTLEMENT_PAYMENT_DUE_KIND,
        status: "open",
      },
      orderBy: [
        { masterLawsuitId: "asc" },
        { settlementRecordId: "asc" },
        { dueDate: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        kind: true,
        status: true,
        title: true,
        description: true,
        masterLawsuitId: true,
        matterId: true,
        displayNumber: true,
        settlementRecordId: true,
        dueDate: true,
        priority: true,
        source: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const groups = new Map<string, DuplicateCandidate[]>();

    for (const tickler of ticklers) {
      const key = duplicateKeyFor(tickler);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tickler);
    }

    const cleanupPreviewGroups = Array.from(groups.entries())
      .map(([key, rows]) => {
        const retainCandidate = rows[0] || null;
        const removalCandidates = rows.slice(1);

        return {
          key,
          settlementRecordId: retainCandidate?.settlementRecordId || null,
          masterLawsuitId: retainCandidate?.masterLawsuitId || null,
          dueDate: retainCandidate?.dueDate || null,
          duplicateCount: rows.length,
          wouldRetainId: retainCandidate?.id || null,
          wouldRemoveCandidateIds: removalCandidates.map((row) => row.id),
          wouldRemoveCount: removalCandidates.length,
          retainCandidate: retainCandidate ? serializeTickler(retainCandidate) : null,
          removalCandidates: removalCandidates.map(serializeTickler),
          reason:
            "Preview-only duplicate cleanup plan. The earliest created open settlement payment follow-up tickler in each duplicate group would be retained; later duplicate candidates would be removal candidates if a future cleanup action is separately built and approved.",
        };
      })
      .filter((group) => group.duplicateCount > 1);

    return NextResponse.json({
      ok: true,
      readOnly: true,
      previewOnly: true,
      writePerformed: false,
      cleanupPerformed: false,
      kind: SETTLEMENT_PAYMENT_DUE_KIND,
      status: "open",
      checkedCount: ticklers.length,
      cleanupPreviewGroupCount: cleanupPreviewGroups.length,
      wouldRemoveTotal: cleanupPreviewGroups.reduce((sum, group) => sum + group.wouldRemoveCount, 0),
      cleanupPreviewGroups,
      note:
        "Preview-only duplicate settlement payment follow-up tickler cleanup plan. This route does not delete, complete, merge, reopen, rerun, process, pay, close, update Clio, email, print, queue, or modify records.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to preview duplicate settlement tickler cleanup plan." },
      { status: 500 },
    );
  }
}
