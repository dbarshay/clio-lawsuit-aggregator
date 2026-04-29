import { Prisma } from "@prisma/client";

export function buildClaimIndexWhere(params: {
  patient?: string;
  provider?: string;
  insurer?: string;
  claim?: string;
}): Prisma.ClaimIndexWhereInput {
  const where: Prisma.ClaimIndexWhereInput = {
    AND: [],
  };

  if (params.patient) {
    where.AND?.push({
      patient_name: {
        contains: params.patient,
        mode: "insensitive",
      },
    });
  }

  if (params.provider) {
    where.AND?.push({
      provider_name: {
        contains: params.provider,
        mode: "insensitive",
      },
    });
  }

  if (params.insurer) {
    where.AND?.push({
      insurer_name: {
        contains: params.insurer,
        mode: "insensitive",
      },
    });
  }

  if (params.claim) {
    where.AND?.push({
      claim_number_normalized: {
        contains: params.claim,
        mode: "insensitive",
      },
    });

    // CRITICAL: exclude null claims when filtering by claim
    where.AND?.push({
      NOT: {
        claim_number_normalized: null,
      },
    });
  }

  if (where.AND && where.AND.length === 0) {
    return {};
  }

  return where;
}

export const CLAIM_INDEX_SELECT = {
  matter_id: true,
  display_number: true,
  patient_name: true,
  provider_name: true,
  insurer_name: true,
  claim_number_normalized: true,
  claim_amount: true,
  balance_presuit: true,
  master_lawsuit_id: true,
  index_aaa_number: true,
};
