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

function matterFieldsPath(matterId: number) {
  const fields = "id,display_number,custom_field_values{id,value,custom_field}";
  return `/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`;
}

function customFieldId(cf: any): number | null {
  const id =
    cf?.custom_field?.id ??
    cf?.custom_field_id ??
    cf?.custom_field;

  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

export async function updateMatterCustomFields(
  matterId: number,
  masterLawsuitId: string,
  lawsuitMatterIds: number[]
) {
  const data = await clioFetch(matterFieldsPath(matterId));

  const cfValues = data?.data?.custom_field_values || [];

  const masterField = cfValues.find(
    (cf: any) => customFieldId(cf) === MASTER_LAWSUIT_ID
  );

  const mattersField = cfValues.find(
    (cf: any) => customFieldId(cf) === LAWSUIT_MATTERS
  );

  if (!masterField || !mattersField) {
    throw new Error(
      `Missing required custom field values on matter ${matterId}. Found: ${cfValues
        .map((cf: any) => JSON.stringify(cf))
        .join(" | ")}`
    );
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
            value: lawsuitMatterIds.join(","),
          },
        ],
      },
    }),
  });

  return true;
}
