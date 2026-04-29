import { prisma } from "@/lib/prisma";

export async function buildMasterId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const mm = String(month).padStart(2, "0");

  // atomic increment using upsert
  const counter = await prisma.lawsuitSequenceCounter.upsert({
    where: {
      year_month: {
        year,
        month,
      },
    },
    update: {
      lastSequence: {
        increment: 1,
      },
    },
    create: {
      year,
      month,
      lastSequence: 1,
    },
  });

  const seq = String(counter.lastSequence).padStart(5, "0");

  return `${mm}.${year}.${seq}`;
}
