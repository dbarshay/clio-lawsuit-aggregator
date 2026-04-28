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

    // Build TRUE newest-per-matter map
    const newestEventByMatter = new Map<number, typeof events[0]>();

    for (const event of events) {
      if (!event.matterId) continue;

      const existing = newestEventByMatter.get(event.matterId);

      if (!existing || event.createdAt > existing.createdAt) {
        newestEventByMatter.set(event.matterId, event);
      }
    }

    const results: any[] = [];

    for (const event of events) {
      try {
        if (!event.matterId) {
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              status: "skipped",
              attempts: { increment: 1 },
              lastError: "No valid matterId on event (claim-based or non-matter webhook)",
              processedAt: new Date(),
            },
          });

          results.push({
            eventId: event.id,
            ok: true,
            skipped: true,
            reason: "no matterId",
          });

          continue;
        }

        const newest = newestEventByMatter.get(event.matterId);

        if (!newest || newest.id !== event.id) {
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
            reason: "newer event exists",
            matterId: event.matterId,
          });

          continue;
        }

        await ingestMatterFromClio(event.matterId);

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
          matterId: event.matterId,
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
