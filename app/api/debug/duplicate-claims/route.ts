import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const grouped = await prisma.claimIndex.groupBy({
    by: ["claim_number_normalized"],
    where: {
      claim_number_normalized: {
        not: null,
      },
    },
    _count: {
      matter_id: true,
    },
    orderBy: {
      _count: {
        matter_id: "desc",
      },
    },
    take: 25,
  });

  return NextResponse.json({
    ok: true,
    count: grouped.length,
    claims: grouped,
  });
}
