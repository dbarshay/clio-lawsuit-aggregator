import { prisma } from "@/lib/prisma";
import { normalizeClaimNumber } from "@/lib/claimIndex";
import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";
import { getDenialReasonLabel } from "@/lib/matterHelpers";

const CLOSE_REASON_LITIGATION_ARBITRATION = 22145660;
const SERVICE_TYPE = 22146005;
const POLICY_NUMBER = 22403975;
const DATE_OF_LOSS = 22405400;

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
  const closeReasonRaw = cf(CLOSE_REASON_LITIGATION_ARBITRATION);
  const settledWithRaw = cf(MATTER_CF.SETTLED_WITH);

  const [patientName, insurerName, settledWithName] = await Promise.all([
    getContactName(patientRaw),
    getContactName(insurerRaw),
    getContactName(settledWithRaw),
  ]);

    // --- SELECTOR-FIRST EXTRACTION ---
  const indexAaaRaw = cf(MATTER_CF.INDEX_AAA_NUMBER);
  const providerName = str(matter?.client?.name);
  // --- NORMALIZATION HELPERS ---
  const norm = (v: any) =>
    String(v || "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase() || null;

  const joinNorm = (...vals: any[]) =>
    vals
      .map(norm)
      .filter(Boolean)
      .join(" | ") || null;

  // --- DERIVED NUMERIC FIELDS ---
  const paymentAmount = num(cf(MATTER_CF.PAYMENT_VOLUNTARY));
  const claimAmount = num(cf(MATTER_CF.CLAIM_AMOUNT));

  const balanceAmount =
    claimAmount !== null && paymentAmount !== null
      ? claimAmount - paymentAmount
      : null;

  const row = {
    display_number: str(matter.display_number),
    description: str(matter.description),

    // --- CLAIM ---
    claim_number_raw: claimRaw,
    claim_number_normalized: claimNorm,

    // --- CORE ENTITIES ---
    patient_name: patientName,
    provider_name: str(matter?.client?.name),
    client_name: str(matter?.client?.name),
    insurer_name: insurerName || "",

    // --- COMPOSITE SELECTORS ---
    patient_provider: joinNorm(patientName, providerName),
    patient_insurer: joinNorm(patientName, insurerName),

    // --- FINANCIALS ---
    claim_amount: claimAmount,
    settled_amount: num(cf(MATTER_CF.SETTLED_AMOUNT)),
    settled_with: settledWithName || str(settledWithRaw),
    allocated_settlement: num(cf(MATTER_CF.ALLOCATED_SETTLEMENT)),
    interest_amount: num(cf(MATTER_CF.INTEREST_AMOUNT)),
    principal_fee: num(cf(MATTER_CF.PRINCIPAL_FEE)),
    interest_fee: num(cf(MATTER_CF.INTEREST_FEE)),
    total_fee: num(cf(MATTER_CF.TOTAL_FEE)),
    provider_net: num(cf(MATTER_CF.PROVIDER_NET)),
    provider_principal_net: num(cf(MATTER_CF.PROVIDER_PRINCIPAL_NET)),
    provider_interest_net: num(cf(MATTER_CF.PROVIDER_INTEREST_NET)),
    overdue_days: num(cf(MATTER_CF.OVERDUE_DAYS)),
    payment_amount: paymentAmount,
    balance_amount: balanceAmount,

    // --- BILL DATA ---
    bill_number: str(cf(MATTER_CF.BILL_NUMBER)),
    dos_start: str(cf(MATTER_CF.DOS_START)),
    dos_end: str(cf(MATTER_CF.DOS_END)),

    // --- LEGAL / STATUS ---
    denial_reason: getDenialReasonLabel(rawDenialReason),
    payment_voluntary: paymentAmount,
    balance_presuit: num(cf(MATTER_CF.BALANCE_PRESUIT)),

    master_lawsuit_id: str(cf(MATTER_CF.MASTER_LAWSUIT_ID)),
    index_aaa_number: str(indexAaaRaw),

    matter_stage_name: str(matter?.matter_stage?.name),
    status: str(matter.status),
    close_reason: str(closeReasonRaw),

    // --- RAW SNAPSHOT ---
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
