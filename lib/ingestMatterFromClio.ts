import { clioFetch } from "@/lib/clio";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

export async function ingestMatterFromClio(matterId: number) {
  const fields = encodeURIComponent(
    "id,display_number,description,status,client,custom_field_values{id,value,custom_field}"
  );

  const res = await clioFetch(`/api/v4/matters/${matterId}.json?fields=${fields}`);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Failed to read matter ${matterId}: ${text}`);
  }

  const json = text ? JSON.parse(text) : null;
  const matter = json?.data;

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} not returned`);
  }

  await upsertClaimIndexFromMatter(matter);

  return {
    matterId: Number(matter.id),
    displayNumber: matter.display_number || "",
    claimNumber: undefined,
    masterLawsuitId: undefined,
  };
}
