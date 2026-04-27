export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      ok: true,
      count: rows.length,
      rows,
    });
  } catch (err: any) {
    console.error("DEBUG WEBHOOKS ERROR:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
