import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [pending, failed, processed, skipped, total, recent] = await Promise.all([
      prisma.webhookEvent.count({ where: { status: "pending" } }),
      prisma.webhookEvent.count({ where: { status: "failed" } }),
      prisma.webhookEvent.count({ where: { status: "processed" } }),
      prisma.webhookEvent.count({ where: { status: "skipped" } }),
      prisma.webhookEvent.count(),
      prisma.webhookEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          matterId: true,
          status: true,
          attempts: true,
          lastError: true,
          createdAt: true,
          processedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      counts: {
        total,
        pending,
        failed,
        processed,
        skipped,
      },
      recent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Webhook stats failed" },
      { status: 500 }
    );
  }
}
