import { NextResponse } from "next/server";
import { processWebhookEvents } from "@/lib/processWebhookEvents";

export async function POST() {
  try {
    const result = await processWebhookEvents();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Webhook processor server error",
      },
      { status: 500 }
    );
  }
}
