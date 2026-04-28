import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.claimIndex.findMany({
    where: {
      display_number: {
        in: ["BRL30022", "BRL30023", "BRL30024", "BRL30025", "BRL30026", "BRL30033", "BRL30034", "BRL30035", "BRL30036", "BRL30037", "BRL30038", "BRL30039", "BRL30040"],
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

  return NextResponse.json({ ok: true, rows });
}
