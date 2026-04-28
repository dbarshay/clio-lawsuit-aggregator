import { NextResponse } from "next/server";
import { processWebhookEvents } from "@/lib/processWebhookEvents";

export async function GET() {
  try {
    const result = await processWebhookEvents();

    return NextResponse.json({
      ok: true,
      triggered: true,
      workerResponse: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Cron trigger failed" },
      { status: 500 }
    );
  }
}
