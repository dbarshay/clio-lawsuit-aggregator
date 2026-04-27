import { prisma } from "@/lib/prisma";
import { normalizeClaimNumber } from "@/lib/claimIndex";

function num(val: any): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function str(val: any): string | null {
  if (val === undefined || val === null || val === "") return null;
  return String(val);
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

  const CLAIM_NUMBER = 22145915;
  const CLAIM_AMOUNT = 22145945;
  const PATIENT = 22145885;
  const INSURER = 22145900;
  const BILL_NUMBER = 22145930;
  const DOS_START = 22145960;
  const DOS_END = 22145975;
  const DENIAL_REASON = 22146035;
  const PAYMENT_VOLUNTARY = 22296515;
  const BALANCE_PRESUIT = 22296530;
  const MASTER_ID = 22294835;

  const claimRaw = str(cf(CLAIM_NUMBER));
  const claimNorm = claimRaw ? normalizeClaimNumber(claimRaw) : null;

  const row = {
    display_number: str(matter.display_number),
    description: str(matter.description),

    claim_number_raw: claimRaw,
    claim_number_normalized: claimNorm,

    patient_name: str(cf(PATIENT)),
    insurer_name: str(cf(INSURER)),

    claim_amount: num(cf(CLAIM_AMOUNT)),

    bill_number: str(cf(BILL_NUMBER)),

    dos_start: str(cf(DOS_START)),
    dos_end: str(cf(DOS_END)),

    denial_reason: str(cf(DENIAL_REASON)),

    payment_voluntary: num(cf(PAYMENT_VOLUNTARY)),
    balance_presuit: num(cf(BALANCE_PRESUIT)),

    master_lawsuit_id: str(cf(MASTER_ID)),

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
