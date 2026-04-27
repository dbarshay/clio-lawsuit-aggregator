import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeClaimNumber(value: string) {
  return value.replace(/\D/g, "");
}

export async function GET(req: NextRequest) {
  const claimNumber = req.nextUrl.searchParams.get("claimNumber");

  if (!claimNumber) {
    return NextResponse.json(
      { ok: false, error: "Missing claimNumber" },
      { status: 400 }
    );
  }

  const normalized = normalizeClaimNumber(claimNumber);

  const rows = await prisma.claimIndex.findMany({
    where: {
      claim_number_normalized: normalized,
    },
    orderBy: [
      { master_lawsuit_id: "asc" },
      { display_number: "asc" },
    ],
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    claimNumber,
    normalized,
    rows,
  });
}
