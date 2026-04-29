import { clioFetch } from "@/lib/clio";
import { indexMatterFromClioPayload } from "@/lib/claimIndexHydration";

export async function indexMatterInternal(matterId: number) {
  try {
    const fields = [
      "id",
      "display_number",
      "description",
      "status",
      "client",
      "custom_field_values{value,custom_field}"
    ].join(",");

    const res = await clioFetch(
      `/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
    );

    if (!res.ok) {
      const text = await res.text();
      return { matterId, ok: false, error: text };
    }

    const json = await res.json();
    const detail = json?.data;

    const indexed = await indexMatterFromClioPayload(detail);

    if ((indexed as any)?.skipped) {
      return { matterId, ok: true, skipped: true };
    }

    return { matterId, ok: true };
  } catch (err: any) {
    return {
      matterId,
      ok: false,
      error: err?.message || "Unknown error",
    };
  }
}
