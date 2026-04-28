import { prisma } from "@/lib/prisma";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";

function normalizeClaimNumber(raw: any): string {
  if (!raw) return "";
  return String(raw).trim();
}

export async function refreshClaimCluster(claimNumberRaw: any) {
  const claimNumber = normalizeClaimNumber(claimNumberRaw);

  if (!claimNumber) {
    return {
      ok: false,
      reason: "no claim number",
      refreshed: 0,
    };
  }

  // Find all indexed matters for this claim
  const rows = await prisma.claimIndex.findMany({
    where: {
      claim_number_normalized: claimNumber,
    },
    select: {
      matter_id: true,
    },
  });

  const matterIds = rows.map((r) => r.matter_id);

  if (matterIds.length === 0) {
    return {
      ok: true,
      claimNumber,
      refreshed: 0,
      reason: "no indexed matters",
    };
  }

  let refreshed = 0;

  for (const id of matterIds) {
    try {
      await ingestMatterFromClio(id);
      refreshed++;
    } catch (err) {
      // swallow — worker handles error logging separately
    }
  }

  return {
    ok: true,
    claimNumber,
    refreshed,
  };
}
