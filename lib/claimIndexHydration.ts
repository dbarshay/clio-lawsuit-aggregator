import { getDenialReasonLabel } from "@/lib/matterHelpers";
import { clioFetch } from "@/lib/clio";
import { upsertRow, normalizeClaimNumber } from "./claimIndex";
import { getCachedContact, setCachedContact } from "@/lib/contactCache";

const CLAIM_NUMBER_FIELD_ID = 22145915;
const BILL_NUMBER_FIELD_ID = 22145930;
const PATIENT_FIELD_ID = 22145885;
const INSURANCE_COMPANY_FIELD_ID = 22145900;
const CLAIM_AMOUNT_FIELD_ID = 22145945;
const DOS_START_FIELD_ID = 22145960;
const DOS_END_FIELD_ID = 22145975;
const DENIAL_REASON_FIELD_ID = 22146035;
const SETTLED_AMOUNT_FIELD_ID = 22146080;
const SETTLED_WITH_FIELD_ID = 22146110;
const ALLOCATED_SETTLEMENT_FIELD_ID = 22287260;
const INTEREST_AMOUNT_FIELD_ID = 22287275;
const PRINCIPAL_FEE_FIELD_ID = 22287290;
const INTEREST_FEE_FIELD_ID = 22287305;
const TOTAL_FEE_FIELD_ID = 22287320;
const PROVIDER_NET_FIELD_ID = 22287335;
const OVERDUE_DAYS_FIELD_ID = 22287350;
const PROVIDER_PRINCIPAL_NET_FIELD_ID = 22287365;
const PROVIDER_INTEREST_NET_FIELD_ID = 22287380;
const MASTER_LAWSUIT_ID_FIELD_ID = 22294835;
const PAYMENT_VOLUNTARY_FIELD_ID = 22296515;
const BALANCE_PRESUIT_FIELD_ID = 22296530;

function getField(matter: any, id: number) {
  return (
    matter?.custom_field_values?.find(
      (f: any) => Number(f?.custom_field?.id) === Number(id)
    )?.value ?? null
  );
}

function num(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function getContactName(contactId: number | string | null | undefined) {
  if (!contactId) return null;

  const id = Number(contactId);
  if (!Number.isFinite(id)) return null;

  const cached = getCachedContact(id);
  if (cached !== undefined) {
    return cached;
  }

  const res = await clioFetch(
    `/api/v4/contacts/${id}.json?fields=id,name`
  );

  if (!res.ok) {
    setCachedContact(id, null);
    return null;
  }

  const json = await res.json();
  const name = json?.data?.name ?? null;

  setCachedContact(id, name);
  return name;
}

export async function indexMatterFromClioPayload(m: any) {
  const claimRaw = getField(m, CLAIM_NUMBER_FIELD_ID);
  const claimNormalized = normalizeClaimNumber(claimRaw);

  if (!claimNormalized) {
    return { skipped: true, reason: "No claim number" };
  }

  const patientId = getField(m, PATIENT_FIELD_ID);
  const insurerId = getField(m, INSURANCE_COMPANY_FIELD_ID);

  const [patientName, insurerName] = await Promise.all([
    getContactName(patientId),
    getContactName(insurerId),
  ]);

  const row = {
    matter_id: Number(m.id),
    display_number: m.display_number ?? null,
    description: m.description ?? null,

    claim_number_raw: claimRaw ? String(claimRaw) : null,
    claim_number_normalized: claimNormalized,

    patient_name: patientName,
    client_name: m?.client?.name ?? null,
    insurer_name: insurerName,

    claim_amount: num(getField(m, CLAIM_AMOUNT_FIELD_ID)),
    settled_amount: num(getField(m, SETTLED_AMOUNT_FIELD_ID)),
    
    settled_with: getField(m, SETTLED_WITH_FIELD_ID)
      ? String(getField(m, SETTLED_WITH_FIELD_ID))
      : null,
    allocated_settlement: num(getField(m, ALLOCATED_SETTLEMENT_FIELD_ID)),
    interest_amount: num(getField(m, INTEREST_AMOUNT_FIELD_ID)),
    principal_fee: num(getField(m, PRINCIPAL_FEE_FIELD_ID)),
    interest_fee: num(getField(m, INTEREST_FEE_FIELD_ID)),
    total_fee: num(getField(m, TOTAL_FEE_FIELD_ID)),
    provider_net: num(getField(m, PROVIDER_NET_FIELD_ID)),
    provider_principal_net: num(getField(m, PROVIDER_PRINCIPAL_NET_FIELD_ID)),
    provider_interest_net: num(getField(m, PROVIDER_INTEREST_NET_FIELD_ID)),
    overdue_days: num(getField(m, OVERDUE_DAYS_FIELD_ID)),
payment_amount:
      num(m.pending_payment_total) ||
      num(m.collected) ||
      num(m.paid) ||
      0,
    balance_amount:
      num(m.outstanding_balance) ||
      num(m.client_balance) ||
      num(m.balance) ||
      0,

    bill_number: getField(m, BILL_NUMBER_FIELD_ID)
      ? String(getField(m, BILL_NUMBER_FIELD_ID))
      : "",
    dos_start: getField(m, DOS_START_FIELD_ID)
      ? String(getField(m, DOS_START_FIELD_ID))
      : "",
    dos_end: getField(m, DOS_END_FIELD_ID)
      ? String(getField(m, DOS_END_FIELD_ID))
      : "",
    denial_reason: getDenialReasonLabel(getField(m, DENIAL_REASON_FIELD_ID)),
    payment_voluntary: num(getField(m, PAYMENT_VOLUNTARY_FIELD_ID)),
    balance_presuit: num(getField(m, BALANCE_PRESUIT_FIELD_ID)),
    master_lawsuit_id: getField(m, MASTER_LAWSUIT_ID_FIELD_ID)
      ? String(getField(m, MASTER_LAWSUIT_ID_FIELD_ID))
      : "",

    status: m.status ?? null,
    raw_json: JSON.stringify(m),
  };

  await upsertRow(row);
  return row;
}
