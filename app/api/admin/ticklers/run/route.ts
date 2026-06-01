import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_MODES = new Set(["preview", "complete"]);

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(500, Math.floor(parsed)));
}

function dueThroughDate(value: string): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 10);
}


function extractRunnerCaseData(tickler: any): Record<string, unknown> {
  const metadata = tickler?.metadata && typeof tickler.metadata === "object" && !Array.isArray(tickler.metadata)
    ? tickler.metadata
    : {};

  const candidate =
    (metadata as any).caseData ||
    (metadata as any).case ||
    (metadata as any).context ||
    (metadata as any).matterContext ||
    {};

  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    return candidate as Record<string, unknown>;
  }

  return {};
}

function serializeDate(value: Date | string | null | undefined): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value || null;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const mode = clean(body.mode) || "preview";
    if (!ALLOWED_MODES.has(mode)) {
      return NextResponse.json({ ok: false, error: "Unsupported tickler runner mode." }, { status: 400 });
    }

    const kind = clean(body.kind) || "all";
    const dueThrough = clean(body.dueThrough);
    const limit = cleanLimit(body.limit);
    const completedBy = clean(body.completedBy) || "admin-bulk-tickler-runner";
    const completedNote =
      clean(body.completedNote) ||
      "Completed by Administrator bulk tickler runner.";

    const where: any = {
      status: "open",
      dueDate: { lte: dueThroughDate(dueThrough) },
    };

    if (kind && kind !== "all") {
      where.kind = kind;
    }

    const ticklers = await prisma.localWorkflowTickler.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: limit,
      select: {
        id: true,
        kind: true,
        status: true,
        dueDate: true,
        matterId: true,
        masterLawsuitId: true,
        settlementRecordId: true,
        displayNumber: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        completedBy: true,
        completedNote: true,
      },
    });

    const rows = ticklers.map((tickler) => ({
      id: tickler.id,
      kind: tickler.kind,
      status: tickler.status,
      dueAt: serializeDate(tickler.dueDate),
      matterId: tickler.matterId,
      masterLawsuitId: tickler.masterLawsuitId,
      settlementRecordId: tickler.settlementRecordId,
      displayNumber: tickler.displayNumber,
      caseData: extractRunnerCaseData(tickler),
      metadata: tickler.metadata,
      createdAt: serializeDate(tickler.createdAt),
      updatedAt: serializeDate(tickler.updatedAt),
      completedAt: serializeDate(tickler.completedAt),
      completedBy: tickler.completedBy,
      completedNote: tickler.completedNote,
    }));

    if (mode === "preview") {
      return NextResponse.json({
        ok: true,
        mode,
        writePerformed: false,
        criteria: { kind, status: "open", dueThrough: dueThrough || "today", limit },
        count: rows.length,
        ticklers: rows,
      });
    }

    const ids = ticklers.map((tickler) => tickler.id);

    if (ids.length === 0) {
      return NextResponse.json({
        ok: true,
        mode,
        writePerformed: false,
        criteria: { kind, status: "open", dueThrough: dueThrough || "today", limit },
        completedCount: 0,
        ticklers: [],
      });
    }

    const completedAt = new Date();

    await prisma.localWorkflowTickler.updateMany({
      where: {
        id: { in: ids },
        status: "open",
      },
      data: {
        status: "completed",
        completedAt,
        completedBy,
        completedNote,
      },
    });

    const completedTicklers = await prisma.localWorkflowTickler.findMany({
      where: { id: { in: ids } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        kind: true,
        status: true,
        dueDate: true,
        matterId: true,
        masterLawsuitId: true,
        settlementRecordId: true,
        displayNumber: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        completedBy: true,
        completedNote: true,
      },
    });

    return NextResponse.json({
      ok: true,
      mode,
      writePerformed: true,
      criteria: { kind, status: "open", dueThrough: dueThrough || "today", limit },
      completedCount: completedTicklers.length,
      ticklers: completedTicklers.map((tickler) => ({
        id: tickler.id,
        kind: tickler.kind,
        status: tickler.status,
        dueAt: serializeDate(tickler.dueDate),
        matterId: tickler.matterId,
        masterLawsuitId: tickler.masterLawsuitId,
        settlementRecordId: tickler.settlementRecordId,
        displayNumber: tickler.displayNumber,
        caseData: extractRunnerCaseData(tickler),
        metadata: tickler.metadata,
        createdAt: serializeDate(tickler.createdAt),
        updatedAt: serializeDate(tickler.updatedAt),
        completedAt: serializeDate(tickler.completedAt),
        completedBy: tickler.completedBy,
        completedNote: tickler.completedNote,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to run Admin Tickler bulk runner." },
      { status: 500 },
    );
  }
}
