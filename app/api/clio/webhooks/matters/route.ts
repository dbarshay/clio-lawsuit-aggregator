import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function makeEventKey(payload: any, matterId: number | null): string {
  const sourceId =
    payload?.id ??
    payload?.event_id ??
    payload?.webhook_id ??
    payload?.data?.id ??
    payload?.object?.id ??
    payload?.record?.id ??
    "";

  const updatedAt =
    payload?.updated_at ??
    payload?.updatedAt ??
    payload?.data?.updated_at ??
    payload?.data?.updatedAt ??
    payload?.object?.updated_at ??
    payload?.record?.updated_at ??
    "";

  const basis = {
    matterId,
    sourceId,
    updatedAt,
    payload,
  };

  return createHash("sha256")
    .update(stableStringify(basis))
    .digest("hex");
}

function isUniqueConstraintError(err: any) {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  );
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));

    const matterId = extractMatterId(payload);
    const eventKey = makeEventKey(payload, matterId);

    try {
      const event = await prisma.webhookEvent.create({
        data: {
          eventKey,
          payload,
          matterId,
          status: "pending",
        },
      });

      return NextResponse.json({
        ok: true,
        accepted: true,
        duplicate: false,
        eventId: event.id,
        eventKey,
        matterId,
      });
    } catch (err: any) {
      if (!isUniqueConstraintError(err)) {
        throw err;
      }

      const existing = await prisma.webhookEvent.findUnique({
        where: { eventKey },
        select: {
          id: true,
          status: true,
          matterId: true,
          createdAt: true,
          processedAt: true,
        },
      });

      return NextResponse.json({
        ok: true,
        accepted: true,
        duplicate: true,
        eventId: existing?.id ?? null,
        eventKey,
        matterId: existing?.matterId ?? matterId,
        status: existing?.status ?? null,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Webhook error" },
      { status: 500 }
    );
  }
}
