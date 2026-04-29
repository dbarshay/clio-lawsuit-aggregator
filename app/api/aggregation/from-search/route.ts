import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateMatterCustomFields } from "@/lib/clioUpdateCustomFields";

function buildMasterId() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return `${mm}.${yyyy}.${rand}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const matterIds: number[] = body.matterIds || [];

  if (!Array.isArray(matterIds) || matterIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "matterIds required" },
      { status: 400 }
    );
  }

  const rows = await prisma.claimIndex.findMany({
    where: { matter_id: { in: matterIds } },
  });

  if (rows.length !== matterIds.length) {
    return NextResponse.json(
      { ok: false, error: "Some matters not found in index" },
      { status: 400 }
    );
  }

  const claimSet = new Set(
    rows.map(r => r.claim_number_normalized).filter(Boolean)
  );

  if (claimSet.size !== 1) {
    return NextResponse.json(
      { ok: false, error: "All matters must share the same claim" },
      { status: 400 }
    );
  }

  const claimNumber = Array.from(claimSet)[0];

  const existingLawsuits = new Set(
    rows.map(r => r.master_lawsuit_id).filter(Boolean)
  );

  if (existingLawsuits.size > 1) {
    return NextResponse.json(
      { ok: false, error: "Matters belong to multiple lawsuits" },
      { status: 400 }
    );
  }

  let masterLawsuitId =
    existingLawsuits.size === 1
      ? Array.from(existingLawsuits)[0]
      : null;

  let created = false;

  if (!masterLawsuitId) {
    masterLawsuitId = buildMasterId();

    await prisma.lawsuit.create({
      data: {
        masterLawsuitId,
        claimNumber,
        lawsuitMatters: matterIds.join(","),
        sharedFolderPath: "",
      },
    });

    created = true;
  }

  // 🔥 REAL WRITEBACK (sequential to stay safe on rate limits)
  for (const id of matterIds) {
    await updateMatterCustomFields(id, masterLawsuitId, matterIds);
  }

  return NextResponse.json({
    ok: true,
    claimNumber,
    masterLawsuitId,
    created,
    matterCount: rows.length,
  });
}
