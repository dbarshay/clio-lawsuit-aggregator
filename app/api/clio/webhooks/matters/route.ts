export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function authorized(req: NextRequest) {
  const expected = process.env.CLIO_WEBHOOK_SECRET;
  const actual = req.nextUrl.searchParams.get("secret");

  if (!expected) return false;
  return actual === expected;
}

function clioHandshake(req: NextRequest) {
  const hookSecret = req.headers.get("x-hook-secret");

  if (!hookSecret) return null;

  return new NextResponse(null, {
    status: 200,
    headers: {
      "x-hook-secret": hookSecret,
    },
  });
}

function extractWebhookId(body: any) {
  return body?.data?.webhook_id ?? body?.webhook_id ?? null;
}

export async function GET(req: NextRequest) {
  const handshake = clioHandshake(req);
  if (handshake) return handshake;

  if (!authorized(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized webhook check" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    route: "clio-matter-webhook",
    method: "GET",
    receivedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const handshake = clioHandshake(req);
  if (handshake) return handshake;

  if (!authorized(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized webhook post" },
      { status: 401 }
    );
  }

  let body: any = null;

  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const webhookId = extractWebhookId(body);

  console.log("WEBHOOK RECEIVED (QUEUED):", {
    receivedAt: new Date().toISOString(),
    webhookId,
  });

  await prisma.webhookEvent.create({
    data: {
      webhookId: webhookId ? String(webhookId) : null,
      payload: body ?? {},
      status: "pending",
    },
  });

  return NextResponse.json({
    ok: true,
    queued: true,
    webhookId,
  });
}
