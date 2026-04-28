import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";

function collectMatterIds(payload: any): number[] {
  const ids = new Set<number>();

  const maybeAdd = (v: any) => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) ids.add(n);
  };

  maybeAdd(payload?.id);
  maybeAdd(payload?.matter_id);
  maybeAdd(payload?.matterId);

  maybeAdd(payload?.data?.id);
  maybeAdd(payload?.data?.matter_id);
  maybeAdd(payload?.data?.matterId);

  maybeAdd(payload?.object?.id);
  maybeAdd(payload?.object?.matter_id);
  maybeAdd(payload?.object?.matterId);

  maybeAdd(payload?.record?.id);
  maybeAdd(payload?.record?.matter_id);
  maybeAdd(payload?.record?.matterId);

  if (Array.isArray(payload?.data)) {
    for (const item of payload.data) {
      maybeAdd(item?.id);
      maybeAdd(item?.matter_id);
      maybeAdd(item?.matterId);
      maybeAdd(item?.record?.id);
    }
  }

  if (Array.isArray(payload?.records)) {
    for (const item of payload.records) {
      maybeAdd(item?.id);
      maybeAdd(item?.matter_id);
      maybeAdd(item?.matterId);
    }
  }

  return [...ids];
}

export async function POST() {
  try {
    const events = await prisma.webhookEvent.findMany({
      where: {
        status: { in: ["pending", "failed"] },
        attempts: { lt: 5 },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const results: Array<{
      eventId: string;
      ok: boolean;
      matterIds?: number[];
      processed?: number;
      error?: string;
    }> = [];

    for (const event of events) {
      try {
        const matterIds = collectMatterIds(event.payload);

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
          processed: matterIds.length,
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

    return NextResponse.json({
      ok: true,
      scanned: events.length,
      processed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Webhook processor server error",
      },
      { status: 500 }
    );
  }
}
