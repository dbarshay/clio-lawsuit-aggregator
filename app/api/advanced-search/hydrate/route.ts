import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { prisma } from "@/lib/prisma";
import { CLAIM_INDEX_SELECT } from "@/lib/claimIndexQuery";

export const dynamic = "force-dynamic";

function text(v: any) {
  return String(v ?? "").trim();
}

function rowMatterId(row: any) {
  return text(row?.matter_id || row?.matterId || row?.id);
}

async function clioJson(path: string) {
  const resOrJson: any = await clioFetch(path);

  if (resOrJson && typeof resOrJson.json === "function") {
    const json = await resOrJson.json();

    if (!resOrJson.ok) {
      throw new Error(
        `Clio request failed ${resOrJson.status || ""}: ${JSON.stringify(json).slice(0, 500)}`
      );
    }

    return json;
  }

  return resOrJson;
}

async function fetchMatter(matterId: string) {
  const fields = "id,display_number,status,client,custom_field_values{id,value,custom_field}";
  const json: any = await clioJson(
    `/api/v4/matters/${encodeURIComponent(matterId)}.json?fields=${encodeURIComponent(fields)}`
  );

  return json?.data || json || null;
}

async function hydrateRows(rows: any[]) {
  const hydrated: any[] = [];

  for (const row of rows) {
    const matterId = rowMatterId(row);

    if (!matterId) {
      hydrated.push(row);
      continue;
    }

    try {
      const matter = await fetchMatter(matterId);

      hydrated.push({
        ...row,
        id: row?.id || matter?.id || matterId,
        matter_id: row?.matter_id || matter?.id || matterId,
        display_number: row?.display_number || matter?.display_number,
        status: matter?.status || row?.status,
        client_name: row?.client_name || matter?.client?.name,
        custom_field_values: Array.isArray(matter?.custom_field_values)
          ? matter.custom_field_values
          : row?.custom_field_values,
      });
    } catch (err: any) {
      hydrated.push({
        ...row,
        advancedHydrationError: err?.message || String(err),
      });
    }
  }

  return hydrated;
}

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 250), 750);

  const rows = await prisma.claimIndex.findMany({
    where: {
      OR: [
        { display_number: { startsWith: "BRL3" } },
        { display_number: { startsWith: "BRL4" } },
        { display_number: { startsWith: "BRL5" } },
      ],
    },
    select: CLAIM_INDEX_SELECT,
    take: limit,
    orderBy: {
      matter_id: "desc",
    },
  });

  const hydratedRows = await hydrateRows(rows);

  return NextResponse.json({
    ok: true,
    action: "advanced-search-hydrate-candidates",
    count: hydratedRows.length,
    rows: hydratedRows,
    safety: {
      readOnly: true,
      noClioRecordsChanged: true,
      noDatabaseRecordsChanged: true,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const inputRows = Array.isArray(body?.rows) ? body.rows : [];
  const inputMatterIds = Array.isArray(body?.matterIds) ? body.matterIds : [];

  let rows = inputRows;

  if (rows.length === 0 && inputMatterIds.length > 0) {
    rows = inputMatterIds.map((id: any) => ({ matter_id: text(id), id: text(id) }));
  }

  const hydratedRows = await hydrateRows(rows);

  return NextResponse.json({
    ok: true,
    action: "advanced-search-hydrate",
    count: hydratedRows.length,
    rows: hydratedRows,
    safety: {
      readOnly: true,
      noClioRecordsChanged: true,
      noDatabaseRecordsChanged: true,
    },
  });
}
