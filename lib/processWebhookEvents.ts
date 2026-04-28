import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { refreshBySelectors } from "@/lib/refreshBySelectors";

const WORKER_LOCK_NAME = "webhook-event-processor";
const WORKER_LOCK_TTL_SECONDS = 55;

async function acquireWorkerLock(ownerId: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ name: string }[]>`
    INSERT INTO "WorkerLock" ("name", "lockedBy", "lockedUntil", "createdAt", "updatedAt")
    VALUES (
      ${WORKER_LOCK_NAME},
      ${ownerId},
      NOW() + (${WORKER_LOCK_TTL_SECONDS} || ' seconds')::interval,
      NOW(),
      NOW()
    )
    ON CONFLICT ("name") DO UPDATE
    SET
      "lockedBy" = EXCLUDED."lockedBy",
      "lockedUntil" = EXCLUDED."lockedUntil",
      "updatedAt" = NOW()
    WHERE
      "WorkerLock"."lockedUntil" < NOW()
      OR "WorkerLock"."lockedBy" = ${ownerId}
    RETURNING "name";
  `;
  return rows.length > 0;
}

async function releaseWorkerLock(ownerId: string) {
  await prisma.workerLock.deleteMany({
    where: { name: WORKER_LOCK_NAME, lockedBy: ownerId },
  });
}

export async function processWebhookEvents() {
  const ownerId = `${process.env.VERCEL_REGION || "local"}-${randomUUID()}`;
  const acquired = await acquireWorkerLock(ownerId);

  if (!acquired) {
    return { ok: true, locked: true, scanned: 0, processed: 0, failed: 0, results: [] };
  }

  try {
    const events = await prisma.webhookEvent.findMany({
      where: {
        status: { in: ["pending", "failed"] },
        attempts: { lt: 5 },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const results: any[] = [];

    for (const event of events) {
      try {
        const payload = event.payload as any;

        const result = await refreshBySelectors(payload);

        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: "processed",
            attempts: { increment: 1 },
            lastError: `Selector refresh: ${result.refreshed}`,
            processedAt: new Date(),
          },
        });

        results.push({
          eventId: event.id,
          ok: true,
          refreshed: result.refreshed,
        });

      } catch (err: any) {
        const message = err?.message || "Unknown error";

        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: "failed",
            attempts: { increment: 1 },
            lastError: message,
          },
        });

        results.push({ eventId: event.id, ok: false });
      }
    }

    return {
      ok: true,
      locked: false,
      scanned: events.length,
      processed: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    };

  } finally {
    await releaseWorkerLock(ownerId);
  }
}
