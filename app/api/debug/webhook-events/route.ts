import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(Number(limitParam) || 5, 20);

  const events = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      matterId: true,
      status: true,
      createdAt: true,
      payload: true,
    },
  });

  return NextResponse.json({
    ok: true,
    count: events.length,
    events,
  });
}
