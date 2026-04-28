import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [byStatus, recentEvents, lock, errorSummary] = await Promise.all([
      prisma.webhookEvent.groupBy({
        by: ["status"],
        _count: { status: true },
        orderBy: { status: "asc" },
      }),

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
          nextAttemptAt: true,
        },
      }),

      prisma.workerLock.findUnique({
        where: { name: "webhook-event-processor" },
        select: {
          name: true,
          lockedBy: true,
          lockedUntil: true,
          updatedAt: true,
        },
      }),

      prisma.webhookEvent.groupBy({
        by: ["lastError"],
        where: {
          lastError: { not: null },
        },
        _count: { lastError: true },
        orderBy: {
          _count: {
            lastError: "desc",
          },
        },
        take: 10,
      }),
    ]);

    const counts = Object.fromEntries(
      byStatus.map((row) => [row.status, row._count.status])
    );

    const pending = counts.pending ?? 0;
    const failed = counts.failed ?? 0;
    const processed = counts.processed ?? 0;
    const skipped = counts.skipped ?? 0;

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      counts: {
        pending,
        processed,
        skipped,
        failed,
        total: pending + processed + skipped + failed,
      },
      workerLock: lock
        ? {
            ...lock,
            isCurrentlyLocked: new Date(lock.lockedUntil).getTime() > Date.now(),
          }
        : null,
      errorSummary: errorSummary.map((row) => ({
        lastError: row.lastError,
        count: row._count.lastError,
      })),
      recentEvents,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to load webhook stats",
      },
      { status: 500 }
    );
  }
}
