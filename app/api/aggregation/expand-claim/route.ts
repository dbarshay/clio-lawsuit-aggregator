import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const matterId = Number(req.nextUrl.searchParams.get("matterId"));

    if (!matterId) {
      return NextResponse.json(
        { ok: false, error: "Missing matterId" },
        { status: 400 }
      );
    }

    // 1. get base matter from index
    const base = await prisma.claimIndex.findFirst({
      where: { matter_id: matterId },
    });

    if (!base?.claim_number_normalized) {
      return NextResponse.json(
        {
          ok: false,
          error: "Base matter not indexed",
          matterId,
        },
        { status: 400 }
      );
    }

    const claimNumber = base.claim_number_normalized;

    // 2. get FULL cluster from local DB
    const rows = await prisma.claimIndex.findMany({
      where: {
        claim_number_normalized: claimNumber,
      },
      orderBy: {
        display_number: "asc",
      },
    });

    return NextResponse.json({
      ok: true,
      source: "local-claim-index",
      claimNumber,
      count: rows.length,
      rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Expand failed" },
      { status: 500 }
    );
  }
}
