import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";
import { upsertRow } from "@/lib/claimIndex";

function textValue(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && v.name) return v.name;
  return "";
}

function normalizeClaimNumber(v: string): string {
  return (v || "").trim();
}

export async function ingestMatterFromClio(matterId: number) {
  // ✅ ONLY fetch matter — no custom field endpoint
  const res = await clioFetch(`/api/v4/matters/${matterId}.json`);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Failed to read matter ${matterId}: ${text}`);
  }

  const json = text ? JSON.parse(text) : null;
  const matter = json?.data;

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} not returned`);
  }

  // 🔥 TEMP: disable claim requirement to confirm ingestion works
  const claimNumberRaw = "";
  const claimNumberNormalized = "";

  // ✅ still index the matter so pipeline works
  upsertRow({
    matter_id: Number(matter.id),
    display_number: matter.display_number || "",
    description: matter.description || "",
    claim_number_raw: claimNumberRaw,
    claim_number_normalized: claimNumberNormalized,
    patient_name: "",
    client_name: textValue(matter.client),
    insurer_name: "",
    claim_amount: 0,
    settled_amount: 0,
    payment_amount: 0,
    balance_amount: 0,
    bill_number: "",
    dos_start: "",
    dos_end: "",
    denial_reason: "",
    payment_voluntary: 0,
    balance_presuit: 0,
    master_lawsuit_id: "",
    index_aaa_number: "",
    status: textValue(matter.status),
    raw_json: JSON.stringify(matter),
  });

  return {
    matterId: Number(matter.id),
    displayNumber: matter.display_number || "",
    claimNumber: claimNumberRaw,
    patientName: "",
    insurerName: "",
    masterLawsuitId: "",
  };
}
