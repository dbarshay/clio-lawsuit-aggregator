import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateMatterCustomFields } from "@/lib/clioUpdateCustomFields";
import { buildMasterId } from "@/lib/buildMasterId";

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

  // 🔥 LIVE CLIO CHECK (source of truth)
  const { getMasterIdFromClio } = await import("@/lib/getMasterIdFromClio");

  const liveIds = [];

  for (const id of matterIds) {
    const live = await getMasterIdFromClio(id);
    if (live) liveIds.push(live);
  }

  const existingLawsuits = new Set(liveIds);

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
    // CHECK DB FIRST (critical for idempotency)
    const existing = await prisma.lawsuit.findFirst({
      where: { claimNumber },
    });

    if (existing) {
      masterLawsuitId = existing.masterLawsuitId;
    } else {
      masterLawsuitId = await buildMasterId();

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
  }

  const writebacks = [];

  for (const id of matterIds) {
    const result = await updateMatterCustomFields(id, masterLawsuitId, matterIds);
    writebacks.push(result);
  }

  await prisma.claimIndex.updateMany({
    where: {
      matter_id: { in: matterIds },
    },
    data: {
      master_lawsuit_id: masterLawsuitId,
    },
  });

  const anyUpdated = writebacks.some((w: any) => w.updated);
  const allSkipped = writebacks.every((w: any) => w.skipped);

  const status = created
    ? "created"
    : anyUpdated
      ? "updated"
      : allSkipped
        ? "no-op"
        : "completed";

  return NextResponse.json({
    ok: true,
    status,
    claimNumber,
    masterLawsuitId,
    created,
    matterCount: rows.length,
    writebacks,
  });
}
