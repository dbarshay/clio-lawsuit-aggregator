import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLAIM_INDEX_SELECT } from "@/lib/claimIndexQuery";

function clean(v: string | null | undefined) {
  return (v || "").trim();
}

function normalizePrefix(input: string | null) {
  const q = clean(input).toUpperCase();

  if (!q) return "";

  const full = q.match(/^BRL[_\s-]?(\d{4})(\d{5})$/);
  if (full) return `BRL_${full[1]}${full[2]}`;

  const digits = q.replace(/\D+/g, "");
  if (digits.length === 9) return `BRL_${digits}`;

  return q;
}

function displayNumberSortValue(displayNumber: string | null) {
  const match = clean(displayNumber).match(/^BRL\s*-?\s*(\d+)$/i);
  if (!match) return null;

  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function isBrlNewConvention(row: { display_number?: string | null }) {
  return /^BRL_\d{9}$/i.test(clean(row.display_number));
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

  const rows = candidateRows.filter(isBrlNewConvention).slice(0, limit);

  return NextResponse.json({
    ok: true,
    prefix,
    count: rows.length,
    rows,
  });
}
