import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safety() {
  return {
    action: "treating-provider-options",
    localBarshMattersReferenceData: true,
    clioData: false,
    noClioRecordsChanged: true,
    noClioCustomFieldsChanged: true,
    databaseRecordsChanged: false,
    noDatabaseRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
  };
}

export async function GET(req: NextRequest) {
  try {
    const q = clean(req.nextUrl.searchParams.get("q"));
    const where: any = {
      type: "treating_provider",
      active: true,
    };

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: "insensitive" } },
        { normalizedName: { contains: q.toLowerCase().replace(/[’']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(), mode: "insensitive" } },
      ];
    }

    const options = await prisma.referenceEntity.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        normalizedName: true,
        details: true,
      },
      orderBy: { displayName: "asc" },
      take: 1000,
    });

    return NextResponse.json({
      ok: true,
      action: "treating-provider-options",
      count: options.length,
      options,
      safety: safety(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "treating-provider-options",
        error: err?.message || "Could not load treating provider options.",
        safety: safety(),
      },
      { status: 400 }
    );
  }
}
