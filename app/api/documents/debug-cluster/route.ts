import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown): string {
  return String(value || "").trim();
}

function isMasterRow(row: any): boolean {
  const description = clean(row.description).toUpperCase();
  return description.startsWith("MASTER LAWSUIT");
}

export async function GET(req: NextRequest) {
  const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

  if (!masterLawsuitId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing masterLawsuitId",
      },
      { status: 400 }
    );
  }

  const rawRows = await prisma.claimIndex.findMany({
    where: {
      master_lawsuit_id: masterLawsuitId,
    },
    orderBy: [
      { display_number: "asc" },
      { matter_id: "asc" },
    ],
  });

  const rows = rawRows
    .map((row: any) => ({
      ...row,
      isMaster: isMasterRow(row),
      is_master: isMasterRow(row),
    }))
    .sort((a: any, b: any) => {
      if (a.isMaster && !b.isMaster) return -1;
      if (!a.isMaster && b.isMaster) return 1;
      return clean(a.display_number).localeCompare(clean(b.display_number));
    });

  const masterRows = rows.filter((row: any) => row.isMaster);
  const childRows = rows.filter((row: any) => !row.isMaster);

  return NextResponse.json({
    ok: true,
    masterLawsuitId,
    count: rows.length,
    masterCount: masterRows.length,
    childCount: childRows.length,
    rows,
    masterRows,
    childRows,
  });
}
