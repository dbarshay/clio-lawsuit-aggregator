import { NextRequest, NextResponse } from "next/server";
import {
  buildAuditWhere,
  createMatterAuditLogEntry,
} from "@/lib/auditLog";
import { prisma } from "@/lib/prisma";

function limitFromSearchParams(req: NextRequest): number {
  const raw = Number(req.nextUrl.searchParams.get("limit") || 100);
  if (!Number.isFinite(raw)) return 100;
  return Math.max(1, Math.min(250, Math.floor(raw)));
}

export async function GET(req: NextRequest) {
  try {
    const where = buildAuditWhere({
      matterId: req.nextUrl.searchParams.get("matterId"),
      matterDisplayNumber: req.nextUrl.searchParams.get("matterDisplayNumber"),
      masterMatterId: req.nextUrl.searchParams.get("masterMatterId"),
      masterMatterDisplayNumber: req.nextUrl.searchParams.get("masterMatterDisplayNumber"),
      masterLawsuitId: req.nextUrl.searchParams.get("masterLawsuitId"),
    });

    const entries = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limitFromSearchParams(req),
    });

    return NextResponse.json({
      ok: true,
      count: entries.length,
      entries,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown audit log read error.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = await createMatterAuditLogEntry({
      action: body?.action,
      summary: body?.summary,
      entityType: body?.entityType,
      fieldName: body?.fieldName,

      priorValue: body?.priorValue,
      newValue: body?.newValue,
      details: body?.details,
      affectedMatterIds: body?.affectedMatterIds,

      matterId: body?.matterId,
      matterDisplayNumber: body?.matterDisplayNumber,
      masterMatterId: body?.masterMatterId,
      masterMatterDisplayNumber: body?.masterMatterDisplayNumber,
      masterLawsuitId: body?.masterLawsuitId,

      sourcePage: body?.sourcePage,
      workflow: body?.workflow,

      actorName: body?.actorName,
      actorEmail: body?.actorEmail,
    });

    return NextResponse.json({
      ok: true,
      entry,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown audit log write error.",
      },
      { status: 500 }
    );
  }
}
