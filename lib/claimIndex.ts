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
      client_name: row.client_name,
      insurer_name: row.insurer_name,
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
      client_name: row.client_name,
      insurer_name: row.insurer_name,
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
