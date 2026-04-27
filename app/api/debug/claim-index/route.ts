import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.claimIndex.findMany({
    orderBy: { indexed_at: "desc" },
    take: 20,
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    rows,
  });
}
