import { getValidClioAccessToken } from "@/lib/clioTokenStore";

const CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";

const MASTER_LAWSUIT_ID = 22294835;
const LAWSUIT_MATTERS = 22306250;

async function clioFetch(path: string, options: RequestInit = {}) {
  const accessToken = await getValidClioAccessToken();

  const res = await fetch(`${CLIO_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clio API error: ${res.status} ${text}`);
  }

  return res.json();
}

function customFieldId(cf: any): number | null {
  const raw =
    cf?.custom_field?.id ??
    cf?.custom_field_id ??
    cf?.custom_field;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeList(value: string | null | undefined) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

export async function updateMatterCustomFields(
  matterId: number,
  masterLawsuitId: string,
  lawsuitMatterIds: number[]
) {
  const fields = encodeURIComponent(
    "id,display_number,custom_field_values{id,value,custom_field}"
  );

  const data = await clioFetch(
    `/matters/${matterId}.json?fields=${fields}`
  );

  const cfValues = data?.data?.custom_field_values || [];

  const masterField = cfValues.find(
    (cf: any) => customFieldId(cf) === MASTER_LAWSUIT_ID
  );

  const mattersField = cfValues.find(
    (cf: any) => customFieldId(cf) === LAWSUIT_MATTERS
  );

  if (!masterField || !mattersField) {
    throw new Error(
      `Missing custom fields on matter ${matterId}. Found: ${cfValues
        .map((cf: any) => JSON.stringify(cf))
        .join(" | ")}`
    );
  }

  const nextMatterList = lawsuitMatterIds.join(",");

  const currentMaster = String(masterField.value || "").trim();
  const nextMaster = String(masterLawsuitId || "").trim();

  const currentMatterList = normalizeList(mattersField.value);
  const normalizedNextMatterList = normalizeList(nextMatterList);

  if (
    currentMaster === nextMaster &&
    currentMatterList === normalizedNextMatterList
  ) {
    return {
      matterId,
      updated: false,
      skipped: true,
      reason: "already-current",
    };
  }

  await clioFetch(`/matters/${matterId}.json`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        custom_field_values: [
          {
            id: masterField.id,
            value: masterLawsuitId,
          },
          {
            id: mattersField.id,
            value: nextMatterList,
          },
        ],
      },
    }),
  });

  return {
    matterId,
    updated: true,
    skipped: false,
  };
}
