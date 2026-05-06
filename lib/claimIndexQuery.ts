import { Prisma } from "@prisma/client";

export type ClaimIndexSearchParams = {
  matterId?: string;
  patient?: string;
  provider?: string;
  insurer?: string;
  claim?: string;
  masterLawsuitId?: string;
  indexAaaNumber?: string;
};

function clean(v?: string | null) {
  return (v || "").trim();
}

export function buildClaimIndexWhere(params: ClaimIndexSearchParams): Prisma.ClaimIndexWhereInput {
  const and: Prisma.ClaimIndexWhereInput[] = [];

  const matterId = clean(params.matterId);
  const patient = clean(params.patient);
  const provider = clean(params.provider);
  const insurer = clean(params.insurer);
  const claim = clean(params.claim);
  const masterLawsuitId = clean(params.masterLawsuitId);
  const indexAaaNumber = clean(params.indexAaaNumber);

  if (matterId) {
    const n = Number(matterId);
    if (Number.isFinite(n) && n > 0) {
      and.push({ matter_id: n });
    }
  }

  if (claim) {
    and.push({
      claim_number_normalized: {
        contains: claim,
        mode: "insensitive",
      },
    });
    and.push({
      NOT: {
        claim_number_normalized: null,
      },
    });
  }

  if (provider && patient) {
    and.push({
      OR: [
        {
          patient_provider: {
            contains: `${patient} ${provider}`,
            mode: "insensitive",
          },
        },
        {
          AND: [
            {
              patient_name: {
                contains: patient,
                mode: "insensitive",
              },
            },
            {
              OR: [
                {
                  provider_name: {
                    contains: provider,
                    mode: "insensitive",
                  },
                },
                {
                  client_name: {
                    contains: provider,
                    mode: "insensitive",
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  } else {
    if (provider) {
      and.push({
        OR: [
          {
            provider_name: {
              contains: provider,
              mode: "insensitive",
            },
          },
          {
            client_name: {
              contains: provider,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    if (patient) {
      and.push({
        patient_name: {
          contains: patient,
          mode: "insensitive",
        },
      });
    }
  }

  if (masterLawsuitId) {
    and.push({
      master_lawsuit_id: {
        contains: masterLawsuitId,
        mode: "insensitive",
      },
    });
  }

  // App scope: this lawsuit aggregation app is for BRL30000 and later.
  // Keep this at the query layer so older indexed matters do not enter
  // seed hydration, selector expansion, or grouped UI results.
  and.push({
    OR: [
      { display_number: { startsWith: "BRL3", mode: "insensitive" } },
      { display_number: { startsWith: "BRL4", mode: "insensitive" } },
      { display_number: { startsWith: "BRL5", mode: "insensitive" } },
      { display_number: { startsWith: "BRL6", mode: "insensitive" } },
      { display_number: { startsWith: "BRL7", mode: "insensitive" } },
      { display_number: { startsWith: "BRL8", mode: "insensitive" } },
      { display_number: { startsWith: "BRL9", mode: "insensitive" } },
    ],
  });

  if (indexAaaNumber) {
    and.push({
      index_aaa_number: {
        contains: indexAaaNumber,
        mode: "insensitive",
      },
    });
  }

  if (patient && insurer) {
    and.push({
      OR: [
        {
          patient_insurer: {
            contains: `${patient} ${insurer}`,
            mode: "insensitive",
          },
        },
        {
          AND: [
            {
              patient_name: {
                contains: patient,
                mode: "insensitive",
              },
            },
            {
              insurer_name: {
                contains: insurer,
                mode: "insensitive",
              },
            },
          ],
        },
      ],
    });
  } else if (insurer) {
    and.push({
      insurer_name: {
        contains: insurer,
        mode: "insensitive",
      },
    });
  }

  if (and.length === 0) return {};

  return { AND: and };
}

export const CLAIM_INDEX_SELECT = {
  matter_id: true,
  display_number: true,
  patient_name: true,
  client_name: true,
  insurer_name: true,
  claim_number_normalized: true,
  claim_amount: true,
  balance_presuit: true,
  master_lawsuit_id: true,
  index_aaa_number: true,
  dos_start: true,
  dos_end: true,
  denial_reason: true,
  status: true,
  close_reason: true,
  matter_stage_name: true,
};
