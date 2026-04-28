import { prisma } from "@/lib/prisma";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";

function collectMatterIds(payload: any): number[] {
  const ids = new Set<number>();

  const maybeAdd = (v: any) => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) ids.add(n);
  };

  maybeAdd(payload?.id);
  maybeAdd(payload?.data?.id);
  maybeAdd(payload?.object?.id);

  if (Array.isArray(payload?.data)) {
    for (const item of payload.data) {
      maybeAdd(item?.id);
    }
  }

  return [...ids];
}

export async function processWebhookEvents() {
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
      let matterIds: number[] = [];

      if (event.matterId) {
        matterIds = [event.matterId];
      } else {
        matterIds = collectMatterIds(event.payload);
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
    scanned: events.length,
    processed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
