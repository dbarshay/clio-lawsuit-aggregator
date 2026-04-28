import { prisma } from "@/lib/prisma";
import { ingestMatterFromClio } from "@/lib/ingestMatterFromClio";

type Payload = any;

export async function refreshBySelectors(payload: Payload) {
  const data = payload?.data || {};

  let matterIds: number[] = [];

  // 1. matterId
  if (data?.matter_id || data?.matterId) {
    matterIds = [Number(data?.matter_id || data?.matterId)];
  }

  // 2. claim_number
  else if (data?.claim_number || data?.id) {
    const rows = await prisma.claimIndex.findMany({
      where: { claim_number_normalized: String(data?.claim_number || data?.id) },
      select: { matter_id: true },
    });
    matterIds = rows.map(r => r.matter_id);
  }

  // 3. provider + patient
  else if (data?.client_name && data?.patient_name) {
    const rows = await prisma.claimIndex.findMany({
      where: {
        client_name: data.client_name,
        patient_name: data.patient_name,
      },
      select: { matter_id: true },
    });
    matterIds = rows.map(r => r.matter_id);
  }

  // 4. patient only
  else if (data?.patient_name) {
    const rows = await prisma.claimIndex.findMany({
      where: { patient_name: data.patient_name },
      select: { matter_id: true },
    });
    matterIds = rows.map(r => r.matter_id);
  }

  // 5. master lawsuit
  else if (data?.master_lawsuit_id) {
    const rows = await prisma.claimIndex.findMany({
      where: { master_lawsuit_id: data.master_lawsuit_id },
      select: { matter_id: true },
    });
    matterIds = rows.map(r => r.matter_id);
  }

  // 6. patient + insurer
  else if (data?.patient_name && data?.insurer_name) {
    const rows = await prisma.claimIndex.findMany({
      where: {
        patient_name: data.patient_name,
        insurer_name: data.insurer_name,
      },
      select: { matter_id: true },
    });
    matterIds = rows.map(r => r.matter_id);
  }

  let refreshed = 0;

  for (const id of matterIds) {
    try {
      await ingestMatterFromClio(id);
      refreshed++;
    } catch {}
  }

  return { refreshed, count: matterIds.length };
}
