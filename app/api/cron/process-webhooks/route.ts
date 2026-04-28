import { NextResponse } from "next/server";

export async function GET() {
  try {
    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const res = await fetch(`${base}/api/clio/webhooks/process`, {
      method: "POST",
    });

    const data = await res.json();

    return NextResponse.json({
      ok: true,
      triggered: true,
      workerResponse: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Cron trigger failed" },
      { status: 500 }
    );
  }
}
