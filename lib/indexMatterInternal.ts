import { clioFetch } from "@/lib/clio";
import { indexMatterFromClioPayload } from "@/lib/claimIndexHydration";
import { prisma } from "@/lib/prisma";

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

    const fields = [
      "id",
      "display_number",
      "description",
      "status",
      "client",
      "custom_field_values{value,custom_field}"
    ].join(",");

    const res = await clioFetch(
      `/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
    );

    if (!res.ok) {
      const text = await res.text();
      if (text && text.includes("Rate limit")) {
      return {
        matterId,
        ok: false,
        rateLimited: true,
        error: text,
      };
    }

    return { matterId, ok: false, error: text };
    }

    const json = await res.json();
    const detail = json?.data;

    const indexed = await indexMatterFromClioPayload(detail);

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

    if (msg.includes("Rate limit")) {
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
