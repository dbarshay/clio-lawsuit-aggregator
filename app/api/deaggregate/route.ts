import { NextRequest, NextResponse } from "next/server";
import { clearLawsuitFields, preflightLawsuitMatter } from "@/lib/clioWrite";
import { MATTER_CF } from "@/lib/clioFields";

function parseMatterIds(raw: string): number[] {
  return String(raw || "")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMatters = Array.isArray(body?.matters) ? body.matters : [];

    if (rawMatters.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No matters provided" },
        { status: 400 }
      );
    }

    // --- STEP 1: resolve cluster from first matter ---
    const firstId = Number(rawMatters[0]?.id);

    if (!Number.isFinite(firstId) || firstId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid matter id" },
        { status: 400 }
      );
    }

    const { matter, existingMasterValue } =
      await preflightLawsuitMatter(firstId);

    if (!existingMasterValue) {
      return NextResponse.json(
        { ok: false, error: "Matter is not part of a lawsuit cluster" },
        { status: 400 }
      );
    }

    const mattersCFV = matter.custom_field_values.find(
      (cfv) => Number(cfv?.custom_field?.id) === MATTER_CF.LAWSUIT_MATTERS
    );

    const clusterIds = parseMatterIds(mattersCFV?.value || "");

    if (clusterIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No cluster members found" },
        { status: 400 }
      );
    }

    // --- STEP 2: preflight ALL cluster members before any Clio mutation ---
    const preflighted: Array<{ id: number; displayNumber: string }> = [];

    for (const id of clusterIds) {
      const check = await preflightLawsuitMatter(id);

      if (check.existingMasterValue !== existingMasterValue) {
        return NextResponse.json(
          {
            ok: false,
            error: `Cluster consistency check failed for matter ${id}. Expected ${existingMasterValue}, found ${check.existingMasterValue || "(blank)"}. No fields were cleared.`,
          },
          { status: 409 }
        );
      }

      preflighted.push({
        id,
        displayNumber: check.matter.display_number || String(id),
      });
    }

    // --- STEP 3: clear ALL verified cluster members ---
    const results: any[] = [];

    for (const id of clusterIds) {
      try {
        const res = await clearLawsuitFields(id);
        results.push({ ...res, ok: true });
      } catch (err: any) {
        return NextResponse.json(
          {
            ok: false,
            error: `Failed clearing matter ${id}: ${err?.message || "Unknown error"}`,
            partial: results,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      stage: "deaggregate",
      clusterSize: clusterIds.length,
      cleared: clusterIds.length,
      masterLawsuitId: existingMasterValue,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
