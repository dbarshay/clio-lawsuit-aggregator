import { prisma } from "@/lib/prisma";

// Shared rule for whether a matter is aggregated into a lawsuit, and whether that lawsuit is open.
//
// Business rules this supports:
//  - An individual matter is closable UNLESS it is aggregated into a lawsuit that is OPEN
//    (close the lawsuit to close its matters).
//  - An individual matter is reopenable only when it is standalone (not aggregated into a lawsuit);
//    a matter that belongs to a lawsuit is reopened by reopening the lawsuit (which cascades).

export type LawsuitMembership = {
  inLawsuit: boolean;
  masterLawsuitId: string | null;
  lawsuitOpen: boolean;
};

function textValue(value: unknown): string {
  return String(value ?? "").trim();
}

export function lawsuitOptionsAreClosed(lawsuitOptions: unknown): boolean {
  if (!lawsuitOptions || typeof lawsuitOptions !== "object" || Array.isArray(lawsuitOptions)) {
    return false;
  }
  const opts = lawsuitOptions as Record<string, unknown>;
  const finalStatus = textValue(opts.finalStatus ?? opts.final_status).toLowerCase();
  if (finalStatus === "closed") return true;
  if (finalStatus === "open") return false;
  // Fall back to close reason presence when finalStatus is blank.
  return textValue(opts.closeReason ?? opts.close_reason).length > 0;
}

export function parseLawsuitMatterIds(lawsuitMatters: string | null | undefined): number[] {
  return String(lawsuitMatters || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

// Resolve whether the given matter is aggregated into a lawsuit, and whether that lawsuit is open.
// `masterLawsuitIdHint` is the ClaimIndex.master_lawsuit_id when the caller already has it.
export async function getLawsuitMembershipForMatter(
  matterId: number,
  masterLawsuitIdHint?: string | null
): Promise<LawsuitMembership> {
  const hint = textValue(masterLawsuitIdHint);

  let lawsuit:
    | { masterLawsuitId: string; lawsuitMatters: string | null; lawsuitOptions: unknown }
    | null = null;

  if (hint) {
    lawsuit = await prisma.lawsuit.findUnique({
      where: { masterLawsuitId: hint },
      select: { masterLawsuitId: true, lawsuitMatters: true, lawsuitOptions: true },
    });
  }

  if (!lawsuit) {
    // Fallback: some links live only in Lawsuit.lawsuitMatters (CSV of matter ids).
    const candidates = await prisma.lawsuit.findMany({
      select: { masterLawsuitId: true, lawsuitMatters: true, lawsuitOptions: true },
    });
    lawsuit = candidates.find((row) => parseLawsuitMatterIds(row.lawsuitMatters).includes(matterId)) || null;
  }

  if (!lawsuit) {
    return { inLawsuit: false, masterLawsuitId: null, lawsuitOpen: false };
  }

  return {
    inLawsuit: true,
    masterLawsuitId: lawsuit.masterLawsuitId,
    lawsuitOpen: !lawsuitOptionsAreClosed(lawsuit.lawsuitOptions),
  };
}
