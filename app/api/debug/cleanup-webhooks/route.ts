import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const events = await prisma.webhookEvent.findMany({
    where: { matterId: { not: null } },
    select: { id: true, matterId: true, payload: true },
  });

  let cleaned = 0;

  for (const e of events) {
    const payload = e.payload as any;
    const payloadId = payload?.data?.id;

    if (
      payloadId &&
      Number(payloadId) === e.matterId &&
      e.matterId < 1_000_000_000
    ) {
      await prisma.webhookEvent.update({
        where: { id: e.id },
        data: { matterId: null },
      });

      cleaned++;
    }
  }

  return NextResponse.json({ ok: true, cleaned });
}
