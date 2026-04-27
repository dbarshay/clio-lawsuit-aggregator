import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    rows,
  });
}
