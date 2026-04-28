import { NextResponse } from "next/server";
import { processWebhookEvents } from "@/lib/processWebhookEvents";

export async function POST() {
  try {
    const result = await processWebhookEvents();

    return NextResponse.json({
      ok: true,
      workerResponse: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Worker failed" },
      { status: 500 }
    );
  }
}
