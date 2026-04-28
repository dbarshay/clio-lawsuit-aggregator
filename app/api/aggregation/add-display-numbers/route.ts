import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clioAuth";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

async function findMatterByDisplayNumber(displayNumber: string) {
  const fields = "id,display_number,description,client,custom_field_values{id,value,custom_field{id}}";

  const res = await clioFetch(
    `/api/v4/matters.json?query=${encodeURIComponent(displayNumber)}&fields=${encodeURIComponent(fields)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(`Clio search failed for ${displayNumber}`);
  }

  const matches = json?.data || [];

  const exact = matches.find(
    (m: any) => String(m.display_number).trim() === displayNumber
  );

  if (!exact) {
    throw new Error(`No exact matter found for ${displayNumber}`);
  }

  return exact;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const displayNumbers: string[] = body.displayNumbers || [];

    if (!Array.isArray(displayNumbers) || displayNumbers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No displayNumbers provided" },
        { status: 400 }
      );
    }

    const results = [];

    for (const displayNumber of displayNumbers) {
      try {
        const matter = await findMatterByDisplayNumber(displayNumber);
        await upsertClaimIndexFromMatter(matter);

        results.push({
          displayNumber,
          matterId: matter.id,
          ok: true,
        });
      } catch (err: any) {
        results.push({
          displayNumber,
          ok: false,
          error: err?.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: results.every((r) => r.ok),
      total: displayNumbers.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Add display numbers failed" },
      { status: 500 }
    );
  }
}
