import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));

    const event = await prisma.webhookEvent.create({
      data: {
        payload,
        status: "pending",
      },
    });

    const matterIds = collectMatterIds(payload);

    return NextResponse.json({
      ok: true,
      accepted: true,
      eventId: event.id,
      matterIds,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Webhook error" },
      { status: 500 }
    );
  }
}
