import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";
import { refreshClaimCluster } from "@/lib/refreshClaimCluster";

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
        // CLAIM-BASED EVENTS
        if (!event.matterId) {
          const payload = event.payload as any;
          const claimNumber = payload?.data?.id;

          if (claimNumber) {
            const result = await refreshClaimCluster(claimNumber);

            await prisma.webhookEvent.update({
              where: { id: event.id },
              data: {
                status: "processed",
                attempts: { increment: 1 },
                lastError: `Claim refresh: ${result.refreshed}`,
                processedAt: new Date(),
              },
            });

            results.push({
              eventId: event.id,
              ok: true,
              claimNumber,
              refreshed: result.refreshed,
            });

            continue;
          }

          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              status: "skipped",
              attempts: { increment: 1 },
              lastError: "No matterId or claimNumber",
              processedAt: new Date(),
            },
          });

          results.push({
            eventId: event.id,
            ok: true,
            skipped: true,
          });

          continue;
        }

        // MATTER-BASED EVENTS
        const newest = newestEventByMatter.get(event.matterId);

        if (!newest || newest.id !== event.id) {
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              status: "skipped",
              attempts: { increment: 1 },
              lastError: "Skipped because newer event exists",
              processedAt: new Date(),
            },
          });

          results.push({ eventId: event.id, ok: true, skipped: true });
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

        results.push({ eventId: event.id, ok: true, matterId: event.matterId });

      } catch (err: any) {
        const message = err?.message || "Unknown error";

        const skip =
          message.includes("has no claim number") ||
          message.includes("was not returned by Clio") ||
          message.includes("Not Found");

        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: skip ? "skipped" : "failed",
            attempts: { increment: 1 },
            lastError: message,
            processedAt: skip ? new Date() : undefined,
          },
        });

        results.push({ eventId: event.id, ok: skip });
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
