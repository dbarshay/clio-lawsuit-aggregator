export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envCheck = {
      hasPostgresPrismaUrl: Boolean(process.env.POSTGRES_PRISMA_URL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasClioWebhookSecret: Boolean(process.env.CLIO_WEBHOOK_SECRET),
      nodeEnv: process.env.NODE_ENV,
    };

    const { prisma } = await import("@/lib/prisma");

    const rows = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      ok: true,
      envCheck,
      count: rows.length,
      rows,
    });
  } catch (err: any) {
    console.error("DEBUG WEBHOOKS ERROR:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || String(err),
        stack: err?.stack || null,
      },
      { status: 500 }
    );
  }
}
