import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { baseMatterId, selectedMatterIds } = body;

    if (!baseMatterId || !selectedMatterIds?.length) {
      return NextResponse.json(
        { ok: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    console.log("CREATE-LAWSUIT BODY:", body);

    const baseRes = await clioFetch(
      `/api/v4/matters/${baseMatterId}.json?fields=id,display_number,description,status,client`
    );

    const baseJson = await baseRes.json();
    const base = baseJson.data;

    console.log("BASE MATTER:", base);

    const clientId = base?.client?.id;

    console.log("CLIENT ID:", clientId);

    if (!clientId) {
      return NextResponse.json(
        { ok: false, error: "Base matter has no client_id" },
        { status: 400 }
      );
    }

    const payload = {
      data: {
        description: `MASTER LAWSUIT - Aggregated from ${baseMatterId}`,
        client: {
          id: clientId,
        },
      },
    };

    console.log("CREATE PAYLOAD:", JSON.stringify(payload, null, 2));

    const createRes = await clioFetch(`/api/v4/matters.json`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const created = await createRes.json();

    console.log("CREATE RESPONSE:", created);

    return NextResponse.json({
      ok: true,
      masterMatter: created.data,
      aggregatedMatterIds: selectedMatterIds,
    });
  } catch (error: any) {
    console.error("CREATE-LAWSUIT ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}