import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";
import { parseRetryAfterMs } from "@/lib/clioRateLimit";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function brlNumber(displayNumber?: string): number | null {
  const match = String(displayNumber || "").match(/^BRL(\d+)$/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  try {
    const min = Number(req.nextUrl.searchParams.get("start") || "30000");
    const max = Number(req.nextUrl.searchParams.get("end") || "39999");
    const limit = Math.min(200, Number(req.nextUrl.searchParams.get("limit") || "200"));
    const delayMs = Number(req.nextUrl.searchParams.get("delayMs") || "1500");

    let nextUrl: string | null = `/api/v4/matters.json?fields=id,display_number&limit=${limit}`;

    let indexed = 0;
    let failed = 0;
    const errors: Array<{ id?: number; displayNumber?: string; error: string }> = [];

    while (nextUrl) {
      const res = await clioFetch(nextUrl);
      const json = await res.json();

      const matters = json?.data || [];

      for (const m of matters) {
        const n = brlNumber(m.display_number);

        if (n == null || n < min || n > max) continue;

        try {
          await ingestMatterFromClio(Number(m.id));
          indexed++;
        } catch (err: any) {
          const message = err?.message || String(err);

          if (/Rate limit|RateLimited|429/i.test(message)) {
            const retryAfterMs = parseRetryAfterMs(message) || 60000;

            errors.push({
              id: m.id,
              displayNumber: m.display_number,
              error: `RATE LIMITED - retrying after ${retryAfterMs}ms`,
            });

            await sleep(retryAfterMs + 2000);

            try {
              await ingestMatterFromClio(Number(m.id));
              indexed++;
            } catch (retryErr: any) {
              failed++;

              errors.push({
                id: m.id,
                displayNumber: m.display_number,
                error: retryErr?.message || String(retryErr),
              });
            }
          } else {
            failed++;

            errors.push({
              id: m.id,
              displayNumber: m.display_number,
              error: message,
            });
          }
        }

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      nextUrl = json?.meta?.paging?.next || null;
    }

    return NextResponse.json({
      ok: true,
      indexed,
      failed,
      errors,
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Rebuild failed" },
      { status: 500 }
    );
  }
}
