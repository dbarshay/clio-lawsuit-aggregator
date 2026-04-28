import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clioAuth";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const matterIds: number[] = body.matterIds || [];

    if (!Array.isArray(matterIds) || matterIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No matterIds provided" },
        { status: 400 }
      );
    }

    const results = [];

    for (const matterId of matterIds) {
      try {
        const res = await clioFetch(
          `/api/v4/matters/${matterId}.json?fields=id,display_number,description,client,custom_field_values{id,value,custom_field{id}}`
        );

        const json = await res.json();

        if (!res.ok || !json?.data) {
          throw new Error(`Failed to fetch matter ${matterId}`);
        }

        await upsertClaimIndexFromMatter(json.data);

        results.push({ matterId, ok: true });
      } catch (err: any) {
        results.push({
          matterId,
          ok: false,
          error: err?.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      total: matterIds.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Add matters failed" },
      { status: 500 }
    );
  }
}
