export const runtime = "nodejs";

import { NextResponse } from "next/server";

function summarize(value: string | undefined) {
  if (!value) return null;

  return {
    length: value.length,
    startsWith: value.slice(0, 18),
    hasPooler: value.includes("-pooler"),
    hasEllipsis: value.includes("..."),
    hasQuotes: value.includes('"') || value.includes("'"),
    hasWhitespace: value !== value.trim(),
    hostMatch: value.match(/@([^/?]+)/)?.[1] ?? null,
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    POSTGRES_PRISMA_URL: summarize(process.env.POSTGRES_PRISMA_URL),
    DATABASE_URL: summarize(process.env.DATABASE_URL),
    POSTGRES_URL: summarize(process.env.POSTGRES_URL),
    POSTGRES_DATABASE_URL: summarize(process.env.POSTGRES_DATABASE_URL),
  });
}
