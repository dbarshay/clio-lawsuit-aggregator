import { clioFetch } from "@/lib/clio";
import { upsertRow, normalizeClaimNumber } from "@/lib/claimIndex";
import { MATTER_CF } from "@/lib/clioFields";

type ClioCFV = {
  id?: number | string;
  value?: any;
  custom_field?: {
    id?: number;
  };
};

type ClioMatter = {
  id: number;
  display_number?: string;
  description?: string;
  status?: string;
  client?: any;
  custom_field_values?: ClioCFV[];
};

function cfValue(matter: ClioMatter, fieldId: number) {
  return matter.custom_field_values?.find(
    (cfv) => Number(cfv?.custom_field?.id) === Number(fieldId)
  )?.value;
}

function textValue(v: any): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);

  if (Array.isArray(v)) {
    return v.map(textValue).filter(Boolean).join(", ");
  }

  if (typeof v === "object") {
    if (typeof v.name === "string" && v.name.trim()) return v.name;
    if (typeof v.value === "string" && v.value.trim()) return v.value;
    if (typeof v.label === "string" && v.label.trim()) return v.label;
    if (typeof v.description === "string" && v.description.trim()) return v.description;
    if (typeof v.display_value === "string" && v.display_value.trim()) return v.display_value;
    if (typeof v.displayName === "string" && v.displayName.trim()) return v.displayName;
    if (typeof v.text === "string" && v.text.trim()) return v.text;

    if (v.contact) return textValue(v.contact);
    if (v.person) return textValue(v.person);
    if (v.company) return textValue(v.company);
    if (v.client) return textValue(v.client);
    if (v.insurer) return textValue(v.insurer);
    if (v.patient) return textValue(v.patient);
  }

  return "";
}

function numValue(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function readMatterFromClio(matterId: number): Promise<ClioMatter> {
  const fields = encodeURIComponent(
    [
      "id",
      "display_number",
      "description",
      "status",
      "client",
      "custom_field_values{id,value,custom_field}",
    ].join(",")
  );

  const res = await clioFetch(`/api/v4/matters/${matterId}.json?fields=${fields}`);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Failed to read matter ${matterId}: ${text}`);
  }

  const json = text ? JSON.parse(text) : null;
  return json?.data;
}

export async function ingestMatterFromClio(matterId: number) {
  const matter = await readMatterFromClio(matterId);

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} was not returned by Clio`);
  }

  const claimNumberRaw = textValue(cfValue(matter, MATTER_CF.CLAIM_NUMBER));
  const claimNumberNormalized = normalizeClaimNumber(claimNumberRaw);

  if (!claimNumberNormalized) {
    throw new Error(`Matter ${matterId} has no claim number`);
  }

  const billNumber = textValue(cfValue(matter, MATTER_CF.BILL_NUMBER));
  const claimAmount = numValue(cfValue(matter, MATTER_CF.CLAIM_AMOUNT));
  const dosStart = textValue(cfValue(matter, MATTER_CF.DOS_START));
  const dosEnd = textValue(cfValue(matter, MATTER_CF.DOS_END));
  const denialReason = textValue(cfValue(matter, MATTER_CF.DENIAL_REASON));
  const masterLawsuitId = textValue(cfValue(matter, MATTER_CF.MASTER_LAWSUIT_ID));

  upsertRow({
    matter_id: Number(matter.id),
    display_number: matter.display_number || "",
    description: matter.description || "",
    claim_number_raw: claimNumberRaw,
    claim_number_normalized: claimNumberNormalized,
    patient_name: "",
    client_name: textValue(matter.client),
    insurer_name: "",
    claim_amount: claimAmount,
    settled_amount: 0,
    payment_amount: 0,
    balance_amount: 0,
    bill_number: billNumber,
    dos_start: dosStart,
    dos_end: dosEnd,
    denial_reason: denialReason,
    payment_voluntary: 0,
    balance_presuit: 0,
    master_lawsuit_id: masterLawsuitId,
    status: textValue(matter.status),
    raw_json: JSON.stringify(matter),
  });

  return {
    matterId: Number(matter.id),
    displayNumber: matter.display_number || "",
    claimNumber: claimNumberRaw,
    masterLawsuitId,
  };
}
