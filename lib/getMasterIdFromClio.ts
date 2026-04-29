import { getValidClioAccessToken } from "@/lib/clioTokenStore";

const CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";

const MASTER_LAWSUIT_ID = 22294835;

async function clioFetch(path: string) {
  const accessToken = await getValidClioAccessToken();

  const res = await fetch(`${CLIO_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clio API error: ${res.status} ${text}`);
  }

  return res.json();
}

export async function getMasterIdFromClio(matterId: number) {
  const fields = encodeURIComponent(
    "custom_field_values{id,value,custom_field}"
  );

  const data = await clioFetch(
    `/matters/${matterId}.json?fields=${fields}`
  );

  const cfValues = data?.data?.custom_field_values || [];

  const field = cfValues.find(
    (cf: any) => Number(cf.custom_field?.id) === MASTER_LAWSUIT_ID
  );

  return field?.value || null;
}
