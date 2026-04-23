import { NextRequest, NextResponse } from "next/server";
import { clearLawsuitFields } from "@/lib/clioWrite";

type InputMatter = {
  id: number;
  displayNumber: string;
};

function normalizeMatters(rawMatters: any[]): InputMatter[] {
  return rawMatters
    .map((m) => ({
      id: Number(m?.id),
      displayNumber: String(m?.displayNumber || "").trim(),
    }))
    .filter(
      (m) =>
        Number.isFinite(m.id) &&
        m.id > 0 &&
        m.displayNumber.length > 0
    );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMatters = Array.isArray(body?.matters) ? body.matters : [];
    const matters = normalizeMatters(rawMatters);

    if (matters.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid matters selected" },
        { status: 400 }
      );
    }

    const results: Array<{
      id: number;
      displayNumber: string;
      ok: boolean;
      error?: string;
    }> = [];

    for (const matter of matters) {
      try {
        await clearLawsuitFields(matter.id);

        results.push({
          id: matter.id,
          displayNumber: matter.displayNumber,
          ok: true,
        });
      } catch (err: any) {
        results.push({
          id: matter.id,
          displayNumber: matter.displayNumber,
          ok: false,
          error: err?.message || "Unknown de-aggregation error",
        });
      }
    }

    const failed = results.filter((r) => !r.ok);

    return NextResponse.json({
      ok: failed.length === 0,
      stage: "deaggregate",
      requested: matters.length,
      succeeded: results.length - failed.length,
      failed: failed.length,
      results,
      error:
        failed.length > 0
          ? `De-aggregation failed for ${failed.length} matter(s).`
          : null,
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
