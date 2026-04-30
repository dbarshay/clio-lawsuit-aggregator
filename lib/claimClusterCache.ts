import { prisma } from "@/lib/prisma";

const TTL_MS = 2 * 60 * 1000; // 2 minutes

function parseIds(raw: string): number[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(Number).filter(n => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
}

function serializeIds(ids: number[]): string {
  return JSON.stringify(Array.from(new Set(ids)));
}

export async function getClaimClusterCache(claim: string) {
  if (!claim) return null;

  const row = await prisma.claimClusterCache.findUnique({
    where: { claim_number_normalized: claim },
  });

  if (!row) return null;

  const age = Date.now() - new Date(row.updated_at).getTime();
  if (age > TTL_MS) return null;

  return parseIds(row.matter_ids);
}

export async function setClaimClusterCache(claim: string, matterIds: number[]) {
  if (!claim || matterIds.length === 0) return;

  await prisma.claimClusterCache.upsert({
    where: { claim_number_normalized: claim },
    update: { matter_ids: serializeIds(matterIds) },
    create: {
      claim_number_normalized: claim,
      matter_ids: serializeIds(matterIds),
    },
  });
}
