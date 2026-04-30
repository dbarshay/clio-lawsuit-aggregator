import { clioFetch } from "@/lib/clio";
import { indexMatterFromClioPayload } from "@/lib/claimIndexHydration";
import { prisma } from "@/lib/prisma";
import { deleteClaimClusterCache } from "@/lib/claimClusterCache";
import { parseRetryAfterMs, sleep } from "@/lib/clioRateLimit";

const FRESHNESS_WINDOW_MS = 30_000;

type IndexMatterInternalOptions = {
  force?: boolean;
};

export async function indexMatterInternal(
  matterId: number,
  options: IndexMatterInternalOptions = {}
) {
  try {
    if (!options.force) {
      const existing = await prisma.claimIndex.findUnique({
        where: { matter_id: matterId },
        select: { indexed_at: true },
      });

      if (existing?.indexed_at) {
        const ageMs = Date.now() - existing.indexed_at.getTime();

        if (ageMs >= 0 && ageMs < FRESHNESS_WINDOW_MS) {
          return {
            matterId,
            ok: true,
            skipped: true,
            reason: "recently-indexed",
            ageMs,
          };
        }
      }
    }

    const existingRow = await prisma.claimIndex.findUnique({
      where: { matter_id: matterId },
      select: { claim_number_normalized: true },
    });

    const oldClaim = existingRow?.claim_number_normalized || null;

    const fields = [
      "id",
      "display_number",
      "description",
      "status",
      "client",
      "custom_field_values{value,custom_field}",
    ].join(",");

    const path = `/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`;

    let res = await clioFetch(path);

    if (!res.ok) {
      const text = await res.text();

      if (res.status === 429 || /Rate limit/i.test(text)) {
        const retryAfterMs = Math.min(parseRetryAfterMs(text, 5000), 10000);

        await sleep(retryAfterMs);

        res = await clioFetch(path);

        if (!res.ok) {
          const retryText = await res.text();

          return {
            matterId,
            ok: false,
            rateLimited: res.status === 429 || /Rate limit/i.test(retryText),
            retried: true,
            error: retryText,
          };
        }
      } else {
        return { matterId, ok: false, error: text };
      }
    }

    const json = await res.json();
    const detail = json?.data;

    const indexed = await indexMatterFromClioPayload(detail);

    const newRow = await prisma.claimIndex.findUnique({
      where: { matter_id: matterId },
      select: { claim_number_normalized: true },
    });

    const newClaim = newRow?.claim_number_normalized || null;

    // --- CACHE INVALIDATION ---
    await deleteClaimClusterCache(oldClaim);
    await deleteClaimClusterCache(newClaim);


    if ((indexed as any)?.skipped) {
      return {
        matterId,
        ok: true,
        skipped: true,
        reason: (indexed as any)?.reason,
      };
    }

    return { matterId, ok: true, skipped: false };
  } catch (err: any) {
    const msg = err?.message || "Unknown error";

    if (/Rate limit/i.test(msg)) {
      return {
        matterId,
        ok: false,
        rateLimited: true,
        error: msg,
      };
    }

    return {
      matterId,
      ok: false,
      error: msg,
    };
  }
}
