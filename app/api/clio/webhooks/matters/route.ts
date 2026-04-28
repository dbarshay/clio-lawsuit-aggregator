import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractMatterId(payload: any): number | null {
  const candidates = [
    payload?.id,
    payload?.matter_id,
    payload?.matterId,

    payload?.data?.id,
    payload?.data?.matter_id,
    payload?.data?.matterId,

    payload?.object?.id,
    payload?.object?.matter_id,
    payload?.object?.matterId,

    payload?.record?.id,
    payload?.record?.matter_id,
    payload?.record?.matterId,
  ];

  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));

    const matterId = extractMatterId(payload);

    const event = await prisma.webhookEvent.create({
      data: {
        payload,
        matterId,
        status: "pending",
      },
    });

    return NextResponse.json({
      ok: true,
      accepted: true,
      eventId: event.id,
      matterId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Webhook error" },
      { status: 500 }
    );
  }
}
