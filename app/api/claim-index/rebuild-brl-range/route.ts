import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";
import { parseRetryAfterMs } from "@/lib/clioRateLimit";
import { prisma } from "@/lib/prisma";

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
    const rebuildName =
      req.nextUrl.searchParams.get("name") || "default";

    const min = Number(
      req.nextUrl.searchParams.get("start") || "30000"
    );

    const max = Number(
      req.nextUrl.searchParams.get("end") || "39999"
    );

    const limit = Math.min(
      10000,
      Number(req.nextUrl.searchParams.get("limit") || "10000")
    );

    const delayMs = Number(
      req.nextUrl.searchParams.get("delayMs") || "1500"
    );

    let indexed = 0;
    let failed = 0;

    const errors: Array<{
      id?: number;
      displayNumber?: string;
      error: string;
    }> = [];

    const state = await prisma.claimIndexRebuildState.upsert({
      where: {
        name: rebuildName,
      },
      update: {
        status: "running",
        lastError: null,
      },
      create: {
        name: rebuildName,
        status: "running",
      },
    });

    const resumeFrom = state.currentBrlNumber || min;

    const candidateRows = await prisma.claimIndex.findMany({
      where: {
        display_number: {
          startsWith: "BRL",
        },
      },
      select: {
        matter_id: true,
        display_number: true,
      },
      orderBy: {
        matter_id: "asc",
      },
      take: limit,
    });

    for (const m of candidateRows) {
      const n = brlNumber(m.display_number || undefined);

      if (n == null || n < min || n > max) continue;
      if (n < resumeFrom) continue;

      try {
        await ingestMatterFromClio(Number(m.matter_id));

        await prisma.claimIndexRebuildState.update({
          where: {
            name: rebuildName,
          },
          data: {
            currentBrlNumber: n,
            lastProcessedAt: new Date(),
            status: "running",
            lastError: null,
          },
        });

        indexed++;
      } catch (err: any) {
        const message = err?.message || String(err);

        if (/Rate limit|RateLimited|429/i.test(message)) {
          const retryAfterMs =
            parseRetryAfterMs(message) || 60000;

          errors.push({
            id: m.matter_id,
            displayNumber: m.display_number || undefined,
            error: `RATE LIMITED - retrying after ${retryAfterMs}ms`,
          });

          await sleep(retryAfterMs + 2000);

          try {
            await ingestMatterFromClio(Number(m.matter_id));

            await prisma.claimIndexRebuildState.update({
              where: {
                name: rebuildName,
              },
              data: {
                currentBrlNumber: n,
                lastProcessedAt: new Date(),
                status: "running",
                lastError: null,
              },
            });

            indexed++;
          } catch (retryErr: any) {
            failed++;

            errors.push({
              id: m.matter_id,
              displayNumber: m.display_number || undefined,
              error:
                retryErr?.message || String(retryErr),
            });

            await prisma.claimIndexRebuildState.update({
              where: {
                name: rebuildName,
              },
              data: {
                lastError:
                  retryErr?.message || String(retryErr),
              },
            });
          }
        } else {
          failed++;

          errors.push({
            id: m.matter_id,
            displayNumber: m.display_number || undefined,
            error: message,
          });

          await prisma.claimIndexRebuildState.update({
            where: {
              name: rebuildName,
            },
            data: {
              lastError: message,
            },
          });
        }
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }

    await prisma.claimIndexRebuildState.update({
      where: {
        name: rebuildName,
      },
      data: {
        status: "idle",
      },
    });

    return NextResponse.json({
      ok: true,
      indexed,
      failed,
      resumeFrom,
      errorCount: errors.length,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Rebuild failed",
      },
      {
        status: 500,
      }
    );
  }
}
