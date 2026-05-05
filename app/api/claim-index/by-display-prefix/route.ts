import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLAIM_INDEX_SELECT } from "@/lib/claimIndexQuery";

function clean(v: string | null) {
  return (v || "").trim();
}

function normalizePrefix(input: string | null) {
  const q = clean(input);

  if (!q) return "";

  const brl = q.match(/^BRL\s*-?\s*(\d*)$/i);
  if (brl) return `BRL${brl[1] || ""}`;

  if (/^\d+$/.test(q)) return `BRL${q}`;

  return q;
}

function displayNumberSortValue(displayNumber: string | null) {
  const match = clean(displayNumber).match(/^BRL\s*-?\s*(\d+)$/i);
  if (!match) return null;

  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function isBrl30000Plus(row: { display_number?: string | null }) {
  const n = displayNumberSortValue(row.display_number || null);
  return n != null && n >= 30000;
}

export async function GET(req: NextRequest) {
  const prefix = normalizePrefix(req.nextUrl.searchParams.get("prefix"));
  const limitRaw = Number(req.nextUrl.searchParams.get("limit") || 8);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 25)) : 8;

  if (!prefix || prefix.length < 2) {
    return NextResponse.json(
      { ok: false, error: "At least two prefix characters required" },
      { status: 400 }
    );
  }

  const candidateRows = await prisma.claimIndex.findMany({
    where: {
      display_number: {
        startsWith: prefix,
        mode: "insensitive",
      },
    },
    orderBy: { display_number: "asc" },
    take: Math.max(limit * 3, 25),
    select: CLAIM_INDEX_SELECT,
  });

  const rows = candidateRows.filter(isBrl30000Plus).slice(0, limit);

  return NextResponse.json({
    ok: true,
    prefix,
    count: rows.length,
    rows,
  });
}
