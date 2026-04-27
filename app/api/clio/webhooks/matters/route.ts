import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { indexMatterFromClioPayload } from "@/lib/claimIndexHydration";

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

async function fetchWebhookDetail(webhookId: number | string) {
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

  console.log("CLIO MATTER WEBHOOK RECEIVED:", {
    receivedAt: new Date().toISOString(),
    webhookId,
    body,
  });

  if (!webhookId) {
    return NextResponse.json({
      ok: true,
      received: true,
      skipped: true,
      reason: "No webhook_id in payload",
      receivedAt: new Date().toISOString(),
    });
  }

  try {
    const webhookDetail = await fetchWebhookDetail(webhookId);
    const matterId = extractMatterId(webhookDetail);

    console.log("CLIO WEBHOOK DETAIL FETCHED:", {
      webhookId,
      matterId,
      webhookDetail,
    });

    if (!matterId) {
      return NextResponse.json({
        ok: true,
        received: true,
        processed: false,
        webhookId,
        reason: "Could not extract matter id from webhook detail",
      });
    }

    const matter = await fetchMatterDetail(matterId);
    const indexed = await indexMatterFromClioPayload(matter);

      if ((indexed as any)?.skipped) {
        return NextResponse.json({ ok: true, skipped: true });
      }

    console.log("CLIO WEBHOOK MATTER INDEXED:", {
      webhookId,
      matterId,
      displayNumber: (indexed as any).display_number,
      claimNumber: (indexed as any).claim_number_raw,
    });

    return NextResponse.json({
      ok: true,
      received: true,
      processed: true,
      webhookId,
      matterId,
      displayNumber: (indexed as any).display_number,
      claimNumber: (indexed as any).claim_number_raw,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("CLIO WEBHOOK PROCESSING ERROR:", {
      webhookId,
      error: err?.message || String(err),
    });

    return NextResponse.json(
      {
        ok: false,
        received: true,
        processed: false,
        webhookId,
        error: err?.message || "Unknown webhook processing error",
      },
      { status: 500 }
    );
  }
}
