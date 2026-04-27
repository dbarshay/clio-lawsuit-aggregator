import { prisma } from "@/lib/prisma";
import { normalizeClaimNumber } from "@/lib/claimIndex";
import { clioFetch } from "@/lib/clioAuth";
import { MATTER_CF } from "@/lib/clioFields";
import { getDenialReasonLabel } from "@/lib/matterHelpers";

function num(val: any): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function str(val: any): string | null {
  if (val === undefined || val === null || val === "") return null;
  return String(val);
}

async function getContactName(contactId: any): Promise<string | null> {
  if (!contactId) return null;

  const id = String(contactId);

  if (!/^\d+$/.test(id)) return str(contactId);

  const res = await clioFetch(`/api/v4/contacts/${id}.json?fields=id,name`);
  const text = await res.text();

  if (!res.ok) return id;

  try {
    return JSON.parse(text)?.data?.name ?? id;
  } catch {
    return id;
  }
}

export async function upsertClaimIndexFromMatter(matter: any) {
  const id = Number(matter.id);

  if (!Number.isFinite(id)) {
    throw new Error("Invalid matter id");
  }

  const cf = (fieldId: number) =>
    matter.custom_field_values?.find(
      (c: any) => Number(c.custom_field?.id) === fieldId
    )?.value;

  const claimRaw = str(cf(MATTER_CF.CLAIM_NUMBER));
  const claimNorm = claimRaw ? normalizeClaimNumber(claimRaw) : null;

  const patientRaw = cf(MATTER_CF.PATIENT);
  const insurerRaw = cf(MATTER_CF.INSURANCE_COMPANY);
  const rawDenialReason = cf(MATTER_CF.DENIAL_REASON);

  const [patientName, insurerName] = await Promise.all([
    getContactName(patientRaw),
    getContactName(insurerRaw),
  ]);

  const row = {
    display_number: str(matter.display_number),
    description: str(matter.description),

    claim_number_raw: claimRaw,
    claim_number_normalized: claimNorm,

    patient_name: patientName,
    client_name: str(matter?.client?.name),
    insurer_name: insurerName,

    claim_amount: num(cf(MATTER_CF.CLAIM_AMOUNT)),
    settled_amount: num(cf(MATTER_CF.SETTLED_AMOUNT)),

    bill_number: str(cf(MATTER_CF.BILL_NUMBER)),

    dos_start: str(cf(MATTER_CF.DOS_START)),
    dos_end: str(cf(MATTER_CF.DOS_END)),

    denial_reason: getDenialReasonLabel(rawDenialReason),

    payment_voluntary: num(cf(MATTER_CF.PAYMENT_VOLUNTARY)),
    balance_presuit: num(cf(MATTER_CF.BALANCE_PRESUIT)),

    master_lawsuit_id: str(cf(MATTER_CF.MASTER_LAWSUIT_ID)),
    matter_stage_name: str(matter?.matter_stage?.name),
    status: str(matter.status),

    raw_json: JSON.stringify(matter),
    indexed_at: new Date(),
  };

  return prisma.claimIndex.upsert({
    where: { matter_id: id },
    update: row,
    create: {
      matter_id: id,
      ...row,
    },
  });
}
