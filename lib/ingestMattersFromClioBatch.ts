import { clioFetch } from "@/lib/clio";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

const FIELDS = encodeURIComponent(
  "id,display_number,description,status,client,custom_field_values{id,value,custom_field}"
);

export async function ingestMattersFromClioBatch(matterIds: number[]) {
  if (!matterIds.length) return [];

  const idsParam = matterIds.join(",");

  const res = await clioFetch(
    `/api/v4/matters.json?ids=${idsParam}&fields=${FIELDS}`
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Batch fetch failed: ${res.status} ${text}`);
  }

  const json = text ? JSON.parse(text) : null;
  const matters = json?.data || [];

  const requestedIds = new Set(matterIds.map((id) => Number(id)));

  // Safety check: if Clio ignores the ids= parameter and returns unrelated
  // matters, do not upsert them.  Throw so the caller falls back to the
  // known-correct per-matter hydration path.
  const unexpectedIds = matters
    .map((m: any) => Number(m?.id))
    .filter((id: number) => Number.isFinite(id) && !requestedIds.has(id));

  if (unexpectedIds.length > 0) {
    throw new Error(
      `Batch matter fetch returned unrequested matter IDs; falling back to per-matter hydration`
    );
  }

  const results: {
    matterId: number;
    ok: boolean;
    error?: string;
  }[] = [];

  const returnedIds = new Set<number>();

  for (const m of matters) {
    try {
      if (!m?.id) continue;

      await upsertClaimIndexFromMatter(m);

      const id = Number(m.id);
      returnedIds.add(id);

      results.push({
        matterId: id,
        ok: true,
      });
    } catch (err: any) {
      results.push({
        matterId: Number(m?.id || 0),
        ok: false,
        error: err?.message || "Upsert failed",
      });
    }
  }

  // Handle missing IDs (Clio didn’t return them)
  for (const id of matterIds) {
    if (!returnedIds.has(id)) {
      results.push({
        matterId: id,
        ok: false,
        error: "Not returned from Clio batch",
      });
    }
  }

  return results;
}
