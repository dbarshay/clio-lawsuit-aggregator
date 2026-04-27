export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clioFetch } from "@/lib/clio";
import { indexMatterFromClioPayload } from "@/lib/claimIndexHydration";

function authorized(req: NextRequest) {
  const expected = process.env.CLIO_WEBHOOK_SECRET;
  const actual = req.nextUrl.searchParams.get("secret");
  if (!expected) return false;
  return actual === expected;
}

function extractMatterId(webhookDetail: any) {
  const data = webhookDetail?.data ?? webhookDetail;

  const candidates = [
    data?.payload?.id,
    data?.payload?.matter?.id,
    data?.payload?.resource?.id,
    data?.resource?.id,
    data?.matter?.id,
    data?.matter_id,
    data?.subject?.id,
    data?.subject_id,
  ];

  for (const value of candidates) {
    const id = Number(value);
    if (Number.isFinite(id) && id > 0) return id;
  }

  return null;
}

async function fetchWebhookDetail(webhookId: string) {
  const res = await clioFetch(`/api/v4/webhooks/${webhookId}.json`);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Clio webhook fetch failed ${res.status}: ${text}`);
  }

  return JSON.parse(text);
}

async function fetchMatterDetail(matterId: number) {
  const fields = [
    "id",
    "display_number",
    "description",
    "status",
    "client",
    "custom_field_values{value,custom_field}",
  ].join(",");

  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Clio matter fetch failed ${res.status}: ${text}`);
  }

  const json = JSON.parse(text);
  return json?.data;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized webhook processor" },
      { status: 401 }
    );
  }

  const events = await prisma.webhookEvent.findMany({
    where: {
      status: {
        in: ["pending", "failed"],
      },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  const results = [];

  for (const event of events) {
    try {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          attempts: { increment: 1 },
          lastError: null,
        },
      });

      if (!event.webhookId) {
        throw new Error("Missing webhookId");
      }

      const webhookDetail = await fetchWebhookDetail(event.webhookId);
      const matterId = extractMatterId(webhookDetail);

      if (!matterId) {
        throw new Error("Could not extract matter id");
      }

      const matter = await fetchMatterDetail(matterId);
      const indexed = await indexMatterFromClioPayload(matter);

      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          matterId,
          status: "processed",
          processedAt: new Date(),
        },
      });

      results.push({
        eventId: event.id,
        webhookId: event.webhookId,
        matterId,
        status: "processed",
        skipped: Boolean((indexed as any)?.skipped),
      });

    } catch (err: any) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "failed",
          lastError: err?.message || String(err),
        },
      });

      results.push({
        eventId: event.id,
        webhookId: event.webhookId,
        status: "failed",
        error: err?.message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    selected: events.length,
    results,
  });
}
