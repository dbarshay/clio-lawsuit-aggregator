import { prisma } from "@/lib/prisma";

export function normalizeClaimNumber(value: any) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export async function upsertRow(row: any) {
  return prisma.claimIndex.upsert({
    where: { matter_id: Number(row.matter_id) },
    update: {
      display_number: row.display_number,
      description: row.description,
      claim_number_raw: row.claim_number_raw,
      claim_number_normalized: row.claim_number_normalized,
      patient_name: row.patient_name,
      provider_name: row.provider_name,
      client_name: row.client_name,
      insurer_name: row.insurer_name,
      patient_provider: row.patient_provider,
      patient_insurer: row.patient_insurer,
      claim_amount: row.claim_amount,
      settled_amount: row.settled_amount,
      settled_with: row.settled_with,
      allocated_settlement: row.allocated_settlement,
      interest_amount: row.interest_amount,
      principal_fee: row.principal_fee,
      interest_fee: row.interest_fee,
      total_fee: row.total_fee,
      provider_net: row.provider_net,
      provider_principal_net: row.provider_principal_net,
      provider_interest_net: row.provider_interest_net,
      overdue_days: row.overdue_days,
      settled_with: row.settled_with,
      allocated_settlement: row.allocated_settlement,
      interest_amount: row.interest_amount,
      principal_fee: row.principal_fee,
      interest_fee: row.interest_fee,
      total_fee: row.total_fee,
      provider_net: row.provider_net,
      provider_principal_net: row.provider_principal_net,
      provider_interest_net: row.provider_interest_net,
      overdue_days: row.overdue_days,
      payment_amount: row.payment_amount,
      balance_amount: row.balance_amount,
      bill_number: row.bill_number,
      dos_start: row.dos_start,
      dos_end: row.dos_end,
      denial_reason: row.denial_reason,
      payment_voluntary: row.payment_voluntary,
      balance_presuit: row.balance_presuit,
      master_lawsuit_id: row.master_lawsuit_id,
      index_aaa_number: row.index_aaa_number,
      status: row.status,
      raw_json: row.raw_json,
      indexed_at: new Date(),
    },
    create: {
      matter_id: Number(row.matter_id),
      display_number: row.display_number,
      description: row.description,
      claim_number_raw: row.claim_number_raw,
      claim_number_normalized: row.claim_number_normalized,
      patient_name: row.patient_name,
      provider_name: row.provider_name,
      client_name: row.client_name,
      insurer_name: row.insurer_name,
      patient_provider: row.patient_provider,
      patient_insurer: row.patient_insurer,
      claim_amount: row.claim_amount,
      settled_amount: row.settled_amount,
      payment_amount: row.payment_amount,
      balance_amount: row.balance_amount,
      bill_number: row.bill_number,
      dos_start: row.dos_start,
      dos_end: row.dos_end,
      denial_reason: row.denial_reason,
      payment_voluntary: row.payment_voluntary,
      balance_presuit: row.balance_presuit,
      master_lawsuit_id: row.master_lawsuit_id,
      index_aaa_number: row.index_aaa_number,
      status: row.status,
      raw_json: row.raw_json,
      indexed_at: new Date(),
    },
  });
}

export async function getMatter(matterId: number) {
  return prisma.claimIndex.findUnique({
    where: { matter_id: Number(matterId) },
  });
}

export async function getSiblings(normalized: string) {
  return prisma.claimIndex.findMany({
    where: { claim_number_normalized: normalized },
    orderBy: { matter_id: "asc" },
  });
}
