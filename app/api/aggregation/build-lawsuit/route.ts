import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { prisma } from "@/lib/prisma";
import { buildMasterId } from "@/lib/buildMasterId";
import { MATTER_CF } from "@/lib/clioFields";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

type CFV = {
  id: number | string;
  value: unknown;
  custom_field?: {
    id?: number | string;
  };
};

type ClioMatter = {
  id: number;
  etag?: string;
  display_number?: string;
  description?: string;
  status?: string;
  client?: {
    id?: number;
    name?: string;
  };
  practice_area?: {
    id?: number;
    name?: string;
  };
  matter_stage?: {
    id?: number;
    name?: string;
  };
  custom_field_values?: CFV[];
};

const LIVE_FIELDS = [
  "id",
  "etag",
  "display_number",
  "description",
  "status",
  "client",
  "practice_area{id,name}",
  "matter_stage{id,name}",
  "custom_field_values{id,value,custom_field}",
].join(",");

function normalizeMatterIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];

  return Array.from(
    new Set(
      raw
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  );
}

function cfv(matter: ClioMatter, fieldId: number): CFV | undefined {
  return matter.custom_field_values?.find(
    (item) => Number(item?.custom_field?.id) === Number(fieldId)
  );
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeMatterList(ids: number[]): string {
  return Array.from(new Set(ids))
    .sort((a, b) => a - b)
    .join(",");
}

function clioMatterUrl(matterId: number | string): string {
  return `https://app.clio.com/nc/#/matters/${matterId}`;
}

function lawsuitMatterDisplayLinkList(matters: ClioMatter[]): string {
  return Array.from(
    new Map(
      matters
        .map((matter) => {
          const displayNumber = text(matter.display_number) || String(matter.id);
          return [
            displayNumber,
            `${displayNumber} — ${clioMatterUrl(matter.id)}`,
          ] as const;
        })
        .filter(([displayNumber]) => Boolean(displayNumber))
    ).values()
  )
    .sort((a, b) => a.localeCompare(b))
    .join("\n");
}

function normalizeLawsuitOptions(raw: any) {
  const rawAmountSoughtMode = String(raw?.amountSoughtMode || "balance_presuit");
  const amountSoughtMode =
    rawAmountSoughtMode === "claim_amount" || rawAmountSoughtMode === "custom"
      ? rawAmountSoughtMode
      : "balance_presuit";

  const rawCustomAmount =
    raw?.customAmountSought === null || raw?.customAmountSought === undefined
      ? null
      : Number(raw.customAmountSought);

  return {
    venue: text(raw?.venue),
    venueSelection: text(raw?.venueSelection),
    venueOther: text(raw?.venueOther),
    amountSoughtMode,
    customAmountSought:
      amountSoughtMode === "custom" &&
      Number.isFinite(rawCustomAmount) &&
      Number(rawCustomAmount) >= 0
        ? Number(rawCustomAmount)
        : null,
    indexAaaNumber: text(raw?.indexAaaNumber),
    notes: text(raw?.notes),
  };
}

function amountNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value).replace(/[$,\s]/g, "");
  if (!cleaned) return null;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function customFieldNumber(matter: ClioMatter, fieldId: number): number | null {
  return amountNumber(cfv(matter, fieldId)?.value);
}

function computeAmountSought(params: {
  liveMatters: ClioMatter[];
  lawsuitOptions: ReturnType<typeof normalizeLawsuitOptions>;
}) {
  const mode = params.lawsuitOptions.amountSoughtMode;

  if (mode === "custom") {
    if (params.lawsuitOptions.customAmountSought === null) {
      throw new Error("Custom Amount is required when Amount Sought is set to Custom Amount.");
    }

    return {
      mode,
      amountSought: params.lawsuitOptions.customAmountSought,
      customAmountSought: params.lawsuitOptions.customAmountSought,
      sourceField: "custom",
      selectedMatterCount: params.liveMatters.length,
      components: params.liveMatters.map((matter) => ({
        matterId: matter.id,
        displayNumber: matter.display_number || "",
        amount: null,
      })),
      missingAmountMatterIds: [],
    };
  }

  const fieldId =
    mode === "claim_amount"
      ? MATTER_CF.CLAIM_AMOUNT
      : MATTER_CF.BALANCE_PRESUIT;

  const sourceField =
    mode === "claim_amount" ? "CLAIM_AMOUNT" : "BALANCE_PRESUIT";

  const components = params.liveMatters.map((matter) => {
    const amount = customFieldNumber(matter, fieldId);

    return {
      matterId: matter.id,
      displayNumber: matter.display_number || "",
      amount,
    };
  });

  const missingAmountMatterIds = components
    .filter((item) => item.amount === null)
    .map((item) => item.matterId);

  const amountSought = components.reduce(
    (sum, item) => sum + (item.amount ?? 0),
    0
  );

  return {
    mode,
    amountSought,
    customAmountSought: null,
    sourceField,
    selectedMatterCount: params.liveMatters.length,
    components,
    missingAmountMatterIds,
  };
}

async function readMatterLive(matterId: number): Promise<ClioMatter> {
  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(LIVE_FIELDS)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `Failed to read matter ${matterId} from Clio: status ${res.status}; body ${body}`
    );
  }

  const matter = body ? JSON.parse(body)?.data : null;

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} was not returned by Clio.`);
  }

  return matter;
}

function requireWritableFields(matter: ClioMatter) {
  const master = cfv(matter, MATTER_CF.MASTER_LAWSUIT_ID);
  const matters = cfv(matter, MATTER_CF.LAWSUIT_MATTERS);

  if (!master?.id || !matters?.id) {
    throw new Error(
      `Matter ${matter.display_number || matter.id} is missing MASTER_LAWSUIT_ID or LAWSUIT_MATTERS custom field values.`
    );
  }

  if (!matter.etag) {
    throw new Error(
      `Matter ${matter.display_number || matter.id} is missing an ETag and cannot be safely updated.`
    );
  }

  return { master, matters, etag: matter.etag };
}

function requireClaimField(matter: ClioMatter) {
  const claim = cfv(matter, MATTER_CF.CLAIM_NUMBER);

  if (!claim?.id) {
    throw new Error(
      `Matter ${matter.display_number || matter.id} is missing CLAIM_NUMBER custom field value.`
    );
  }

  return claim;
}

function existingMasterValue(matter: ClioMatter): string {
  return text(cfv(matter, MATTER_CF.MASTER_LAWSUIT_ID)?.value);
}

function claimValue(matter: ClioMatter): string {
  return text(cfv(matter, MATTER_CF.CLAIM_NUMBER)?.value);
}

function patientValue(matter: ClioMatter): string {
  return text(cfv(matter, MATTER_CF.PATIENT)?.value);
}

async function createMasterMatter(params: {
  baseMatter: ClioMatter;
  masterLawsuitId: string;
}) {
  const clientId = params.baseMatter?.client?.id;

  if (!clientId) {
    throw new Error("Base matter is missing client ID.");
  }

  const data: any = {
    description: `MASTER LAWSUIT - ${params.masterLawsuitId}`,
    client: { id: clientId },
  };

  if (params.baseMatter.practice_area?.id) {
    data.practice_area = { id: params.baseMatter.practice_area.id };
  }

  if (params.baseMatter.matter_stage?.id) {
    data.matter_stage = { id: params.baseMatter.matter_stage.id };
  }

  const res = await clioFetch(`/api/v4/matters.json`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });

  const body = await res.text();
  const parsed = body ? JSON.parse(body) : null;

  if (!res.ok || !parsed?.data?.id) {
    throw new Error(
      `Failed to create Clio master matter: status ${res.status}; body ${body}`
    );
  }

  return Number(parsed.data.id);
}

async function writeLawsuitFieldsAfterLiveRecheck(params: {
  matterId: number;
  masterLawsuitId: string;
  lawsuitMatters: string;
  lawsuitMatterDisplayNumbers?: string | null;
  claimNumber?: string | null;
  patientContactId?: string | null;
  allowSameMaster?: boolean;
}) {
  const matter = await readMatterLive(params.matterId);

  const existingMaster = existingMasterValue(matter);

  if (
    existingMaster &&
    !(params.allowSameMaster && existingMaster === params.masterLawsuitId)
  ) {
    throw new Error(
      `Matter ${matter.display_number || params.matterId} was assigned to MASTER LAWSUIT ID ${existingMaster} before write.`
    );
  }

  const { master, matters, etag } = requireWritableFields(matter);

  const customFieldValues: Array<{
    id: number | string;
    custom_field: { id: number };
    value: string | number;
  }> = [
    {
      id: master.id,
      custom_field: { id: MATTER_CF.MASTER_LAWSUIT_ID },
      value: params.masterLawsuitId,
    },
    {
      id: matters.id,
      custom_field: { id: MATTER_CF.LAWSUIT_MATTERS },
      value: params.lawsuitMatters,
    },
  ];

  if (params.lawsuitMatterDisplayNumbers) {
    const brlNumbers = cfv(matter, MATTER_CF.LAWSUIT_MATTER_BRL_NUMBERS);

    if (brlNumbers?.id) {
      customFieldValues.push({
        id: brlNumbers.id,
        custom_field: { id: MATTER_CF.LAWSUIT_MATTER_BRL_NUMBERS },
        value: params.lawsuitMatterDisplayNumbers,
      });
    }
  }

  if (params.claimNumber) {
    const claim = requireClaimField(matter);
    customFieldValues.push({
      id: claim.id,
      custom_field: { id: MATTER_CF.CLAIM_NUMBER },
      value: params.claimNumber,
    });
  }

  if (params.patientContactId) {
    const patient = cfv(matter, MATTER_CF.PATIENT);
    if (patient?.id) {
      customFieldValues.push({
        id: patient.id,
        custom_field: { id: MATTER_CF.PATIENT },
        value: Number(params.patientContactId),
      });
    }
  }

  const res = await clioFetch(`/api/v4/matters/${params.matterId}.json`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "If-Match": etag,
    },
    body: JSON.stringify({
      data: {
        custom_field_values: customFieldValues,
      },
    }),
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `Failed to write lawsuit fields to matter ${params.matterId}: status ${res.status}; body ${body}`
    );
  }

  return body ? JSON.parse(body)?.data : null;
}

async function clearNewMasterOnly(matterId: number, masterLawsuitId: string) {
  const matter = await readMatterLive(matterId);

  if (existingMasterValue(matter) !== masterLawsuitId) {
    return { matterId, skipped: true, reason: "current-master-different" };
  }

  const { master, matters, etag } = requireWritableFields(matter);

  const res = await clioFetch(`/api/v4/matters/${matterId}.json`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "If-Match": etag,
    },
    body: JSON.stringify({
      data: {
        custom_field_values: [
          {
            id: master.id,
            custom_field: { id: MATTER_CF.MASTER_LAWSUIT_ID },
            value: "",
          },
          {
            id: matters.id,
            custom_field: { id: MATTER_CF.LAWSUIT_MATTERS },
            value: "",
          },
        ],
      },
    }),
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `Rollback failed for matter ${matterId}: status ${res.status}; body ${body}`
    );
  }

  return { matterId, skipped: false, reason: "cleared" };
}

async function refreshClaimIndexFromClio(matterId: number) {
  const matter = await readMatterLive(matterId);
  await upsertClaimIndexFromMatter(matter);
}

export async function POST(req: NextRequest) {
  const writtenMatterIds: number[] = [];
  let masterLawsuitId = "";
  let clioMasterMatterId: number | null = null;

  try {
    const body = await req.json();

    const baseMatterId = Number(body?.baseMatterId);
    const selectedMatterIds = normalizeMatterIds(body?.selectedMatterIds);
    const lawsuitOptions = normalizeLawsuitOptions(body?.lawsuitOptions);

    console.log("build-lawsuit lawsuitOptions stage-1", {
      baseMatterId,
      selectedMatterIds,
      lawsuitOptions,
    });

    if (!Number.isFinite(baseMatterId) || baseMatterId <= 0) {
      return NextResponse.json(
        { ok: false, error: "baseMatterId is required." },
        { status: 400 }
      );
    }

    if (selectedMatterIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "selectedMatterIds must contain at least one matter." },
        { status: 400 }
      );
    }

    const liveMatters = await Promise.all(
      selectedMatterIds.map((id) => readMatterLive(id))
    );

    for (const matter of liveMatters) {
      requireWritableFields(matter);

      const existingMaster = existingMasterValue(matter);
      if (existingMaster) {
        return NextResponse.json(
          {
            ok: false,
            stage: "preflight",
            error: `Matter ${matter.display_number || matter.id} already belongs to MASTER LAWSUIT ID ${existingMaster}.`,
            matterId: matter.id,
            existingMasterLawsuitId: existingMaster,
          },
          { status: 400 }
        );
      }
    }

    const claimSet = new Set(liveMatters.map(claimValue).filter(Boolean));

    if (claimSet.size > 1) {
      return NextResponse.json(
        {
          ok: false,
          stage: "preflight",
          error: "Selected matters do not share the same live Clio claim number.",
          claims: Array.from(claimSet),
        },
        { status: 400 }
      );
    }

    const claimNumber = Array.from(claimSet)[0] || null;

    let amountSought;
    try {
      amountSought = computeAmountSought({ liveMatters, lawsuitOptions });
    } catch (amountErr: any) {
      return NextResponse.json(
        {
          ok: false,
          stage: "preflight",
          error: amountErr?.message || "Amount Sought calculation failed.",
        },
        { status: 400 }
      );
    }

    const patientSet = new Set(liveMatters.map(patientValue).filter(Boolean));
    const multiplePatientsContactId =
      process.env.CLIO_MULTIPLE_PATIENTS_CONTACT_ID || "2507344805";
    const masterPatientContactId =
      patientSet.size === 1
        ? Array.from(patientSet)[0]
        : patientSet.size > 1
          ? multiplePatientsContactId
          : null;

    const baseMatter =
      liveMatters.find((m) => Number(m.id) === Number(baseMatterId)) ||
      (await readMatterLive(baseMatterId));

    masterLawsuitId = await buildMasterId();

    clioMasterMatterId = await createMasterMatter({
      baseMatter,
      masterLawsuitId,
    });

    const allMatterIds = normalizeMatterIds([
      clioMasterMatterId,
      ...selectedMatterIds,
    ]);

    const lawsuitMatters = normalizeMatterList(allMatterIds);

    // Verify the newly created master matter has the required no-fault custom fields.
    // If Clio creates it without those fields, fail before mutating any selected bill matters.
    const masterMatter = await readMatterLive(clioMasterMatterId);
    requireWritableFields(masterMatter);
    if (claimNumber) requireClaimField(masterMatter);

    const lawsuitMatterDisplayNumbers = lawsuitMatterDisplayLinkList([
      masterMatter,
      ...liveMatters,
    ]);

    await writeLawsuitFieldsAfterLiveRecheck({
      matterId: clioMasterMatterId,
      masterLawsuitId,
      lawsuitMatters,
      lawsuitMatterDisplayNumbers,
      claimNumber,
      patientContactId: masterPatientContactId,
      allowSameMaster: true,
    });
    writtenMatterIds.push(clioMasterMatterId);

    for (const matterId of selectedMatterIds) {
      await writeLawsuitFieldsAfterLiveRecheck({
        matterId,
        masterLawsuitId,
        lawsuitMatters,
        lawsuitMatterDisplayNumbers,
      });

      writtenMatterIds.push(matterId);
    }

    for (const matterId of allMatterIds) {
      await refreshClaimIndexFromClio(matterId);
    }

    const lawsuit = await prisma.lawsuit.create({
      data: {
        masterLawsuitId,
        claimNumber,
        lawsuitMatters,
        sharedFolderPath: "",
        venue: lawsuitOptions.venue || null,
        venueSelection: lawsuitOptions.venueSelection || null,
        venueOther: lawsuitOptions.venueOther || null,
        indexAaaNumber: lawsuitOptions.indexAaaNumber || null,
        lawsuitNotes: lawsuitOptions.notes || null,
        lawsuitOptions,
        amountSoughtMode: amountSought.mode,
        amountSought: amountSought.amountSought,
        customAmountSought: amountSought.customAmountSought,
        amountSoughtBreakdown: amountSought,
      },
    });

    return NextResponse.json({
      ok: true,
      stage: "completed",
      lawsuitId: lawsuit.id,
      lawsuitOptions,
      amountSought,
      masterMatterId: clioMasterMatterId,
      masterLawsuitId,
      lawsuitMatters,
      claimNumber,
      requested: selectedMatterIds.length,
      succeeded: selectedMatterIds.length,
      failed: 0,
      results: allMatterIds.map((matterId) => ({
        matterId,
        role: matterId === clioMasterMatterId ? "master" : "bill",
        ok: true,
      })),
    });
  } catch (err: any) {
    const rollbackResults = [];

    if (masterLawsuitId && writtenMatterIds.length > 0) {
      for (const matterId of writtenMatterIds) {
        try {
          const rollback = await clearNewMasterOnly(matterId, masterLawsuitId);
          rollbackResults.push({ matterId, ok: true, rollback });

          try {
            await refreshClaimIndexFromClio(matterId);
          } catch (refreshErr: any) {
            rollbackResults.push({
              matterId,
              ok: false,
              error: `Rollback succeeded but ClaimIndex refresh failed: ${refreshErr?.message || refreshErr}`,
            });
          }
        } catch (rollbackErr: any) {
          rollbackResults.push({
            matterId,
            ok: false,
            error: rollbackErr?.message || "Unknown rollback error",
          });
        }
      }
    }

    return NextResponse.json(
      {
        ok: false,
        stage: "failed",
        error: err?.message || "Lawsuit build failed.",
        masterLawsuitId: masterLawsuitId || null,
        masterMatterId: clioMasterMatterId,
        writtenMatterIds,
        rollbackResults,
      },
      { status: 500 }
    );
  }
}
