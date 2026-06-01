import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTLEMENT_PAYMENT_DUE_KIND = "settlement_payment_due_followup";

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

    const groups = new Map<string, typeof ticklers>();

    for (const tickler of ticklers) {
      const key = duplicateKeyFor(tickler);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tickler);
    }

    const duplicateGroups = Array.from(groups.entries())
      .map(([key, rows]) => ({
        key,
        count: rows.length,
        settlementRecordId: rows[0]?.settlementRecordId || null,
        masterLawsuitId: rows[0]?.masterLawsuitId || null,
        dueDate: rows[0]?.dueDate || null,
        retainedCandidateId: rows[0]?.id || null,
        duplicateCandidateIds: rows.slice(1).map((row) => row.id),
        ticklers: rows.map((row) => ({
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
        })),
      }))
      .filter((group) => group.count > 1);

    return NextResponse.json({
      ok: true,
      readOnly: true,
      writePerformed: false,
      kind: SETTLEMENT_PAYMENT_DUE_KIND,
      status: "open",
      checkedCount: ticklers.length,
      duplicateGroupCount: duplicateGroups.length,
      duplicateTicklerCount: duplicateGroups.reduce((sum, group) => sum + group.count, 0),
      duplicateGroups,
      note:
        "Read-only duplicate settlement payment follow-up tickler diagnostic. This route does not delete, complete, merge, reopen, rerun, process, pay, close, update Clio, email, print, queue, or modify records.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to preview duplicate settlement ticklers." },
      { status: 500 },
    );
  }
}
