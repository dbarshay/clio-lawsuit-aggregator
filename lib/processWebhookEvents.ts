import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";

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
    where: {
      name: WORKER_LOCK_NAME,
      lockedBy: ownerId,
    },
  });
}

export async function processWebhookEvents() {
  const ownerId = `${process.env.VERCEL_REGION || "local"}-${randomUUID()}`;

  const acquired = await acquireWorkerLock(ownerId);

  if (!acquired) {
    return {
      ok: true,
      locked: true,
      scanned: 0,
      processed: 0,
      failed: 0,
      results: [],
    };
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

    const newestEventIdByMatterId = new Map<number, string>();

    for (const event of events) {
      if (!event.matterId) continue;

      newestEventIdByMatterId.set(event.matterId, event.id);
    }

    const results: any[] = [];

    for (const event of events) {
      try {
        let matterIds: number[] = [];

        // ONLY trust stored matterId from ingestion
        if (event.matterId) {
          matterIds = [event.matterId];
        } else {
          // No valid matterId → skip safely
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              status: "skipped",
              attempts: { increment: 1 },
              lastError: "No valid matterId on event (ignored payload-derived IDs)",
              processedAt: new Date(),
            },
          });

          results.push({
            eventId: event.id,
            ok: true,
            skipped: true,
            reason: "no valid matterId",
          });

          continue;
        }

        const hasNewerQueuedMatterEvent = matterIds.some(
          (matterId) => newestEventIdByMatterId.get(matterId) !== event.id
        );

        if (hasNewerQueuedMatterEvent) {
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              status: "skipped",
              attempts: { increment: 1 },
              lastError: "Skipped because a newer queued webhook event exists for this matter.",
              processedAt: new Date(),
            },
          });

          results.push({
            eventId: event.id,
            ok: true,
            skipped: true,
            reason: "newer queued matter event exists",
            matterIds,
          });

          continue;
        }

        for (const id of matterIds) {
          await ingestMatterFromClio(id);
        }

        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: "processed",
            attempts: { increment: 1 },
            lastError: null,
            processedAt: new Date(),
          },
        });

        results.push({
          eventId: event.id,
          ok: true,
          matterIds,
        });
      } catch (err: any) {
        const message = err?.message || "Unknown webhook processing error";

        const isNonRetryableSkip =
          message.includes("has no claim number") ||
          message.includes("was not returned by Clio") ||
          message.includes("Not Found");

        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: isNonRetryableSkip ? "skipped" : "failed",
            attempts: { increment: 1 },
            lastError: message,
            processedAt: isNonRetryableSkip ? new Date() : undefined,
          },
        });

        results.push({
          eventId: event.id,
          ok: isNonRetryableSkip,
          error: message,
        });
      }
    }

    return {
      ok: true,
      locked: false,
      scanned: events.length,
      processed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  } finally {
    await releaseWorkerLock(ownerId);
  }
}
