import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";
import { acquireLock, releaseLock } from "@/lib/workerLock";

const BATCH_SIZE = 10;

export async function POST(req: NextRequest) {
  const gotLock = await acquireLock();

  if (!gotLock) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "worker already running",
    });
  }

  try {
    const events = await prisma.webhookEvent.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    if (events.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
      });
    }

    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        const matter = (event.payload as any)?.data;

        if (!matter?.id) {
          throw new Error("Missing matter in payload");
        }

        await upsertClaimIndexFromMatter(matter);

        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: "processed",
            processedAt: new Date(),
          },
        });

        processed++;
      } catch (err: any) {
        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: "failed",
            attempts: { increment: 1 },
            lastError: err?.message ?? "unknown error",
          },
        });

        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      failed,
    });
  } catch (err: any) {
    console.error("WORKER ERROR:", err);

    return NextResponse.json(
      { ok: false, error: err?.message ?? "Worker failed" },
      { status: 500 }
    );
  } finally {
    await releaseLock();
  }
}
