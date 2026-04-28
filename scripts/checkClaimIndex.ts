import { prisma } from "@/lib/prisma";

async function run() {
  const rows = await prisma.claimIndex.findMany({
    where: {
      display_number: {
        in: ["BRL30000", "BRL30001", "BRL30002", "BRL30003", "BRL30004", "BRL30005"],
      },
    },
    orderBy: { display_number: "asc" },
    select: {
      matter_id: true,
      display_number: true,
      claim_number_raw: true,
      patient_name: true,
      provider_name: true,
      insurer_name: true,
      patient_provider: true,
      patient_insurer: true,
      master_lawsuit_id: true,
      index_aaa_number: true,
    },
  });

  console.dir(rows, { depth: null });
}

run()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
