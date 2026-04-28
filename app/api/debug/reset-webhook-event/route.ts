import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const event = await prisma.webhookEvent.update({
      where: { id },
      data: {
        status: "pending",
        attempts: 0,
        lastError: null,
        processedAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      event: {
        id: event.id,
        matterId: event.matterId,
        status: event.status,
        attempts: event.attempts,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Reset failed" },
      { status: 500 }
    );
  }
}
