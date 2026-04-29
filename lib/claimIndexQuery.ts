import { Prisma } from "@prisma/client";

export function buildClaimIndexWhere(params: {
  patient?: string;
  provider?: string;
  insurer?: string;
  claim?: string;
}): Prisma.ClaimIndexWhereInput {
  const and: Prisma.ClaimIndexWhereInput[] = [];

  if (params.patient) {
    and.push({
      patient_name: {
        contains: params.patient,
        mode: "insensitive",
      },
    });
  }

  if (params.provider) {
    and.push({
      provider_name: {
        contains: params.provider,
        mode: "insensitive",
      },
    });
  }

  if (params.insurer) {
    and.push({
      insurer_name: {
        contains: params.insurer,
        mode: "insensitive",
      },
    });
  }

  if (params.claim) {
    and.push({
      claim_number_normalized: {
        contains: params.claim,
        mode: "insensitive",
      },
    });

    and.push({
      NOT: {
        claim_number_normalized: null,
      },
    });
  }

  if (and.length === 0) {
    return {};
  }

  return { AND: and };
}

export const CLAIM_INDEX_SELECT = {
  matter_id: true,
  display_number: true,
  patient_name: true,
  provider_name: true,
  client_name: true,
  insurer_name: true,
  claim_number_normalized: true,
  claim_amount: true,
  balance_presuit: true,
  master_lawsuit_id: true,
  index_aaa_number: true,
};
