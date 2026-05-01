import { NextResponse } from "next/server";
import { getValidClioAccessToken } from "@/lib/clioTokenStore";

const BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";

async function clio(path: string) {
  const token = await getValidClioAccessToken();

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    return { ok: false, status: res.status, body: text };
  }

  return { ok: true, json: JSON.parse(text) };
}

function cfId(cf: any) {
  return Number(cf?.custom_field?.id ?? cf?.custom_field_id ?? cf?.custom_field);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const displayNumber = url.searchParams.get("displayNumber") || "BRL30003";

  const search = await clio(
    `/matters.json?query=${encodeURIComponent(displayNumber)}&fields=id,display_number,status&limit=10`
  );

  if (!search.ok) {
    return NextResponse.json({ ok: false, step: "search", search }, { status: 500 });
  }

  const match = search.json?.data?.find((m: any) => m.display_number === displayNumber);

  if (!match?.id) {
    return NextResponse.json({
      ok: false,
      error: `Matter ${displayNumber} not found`,
      searchResults: search.json?.data || [],
    }, { status: 404 });
  }

  const fields = encodeURIComponent(
    "id,display_number,status,custom_field_values{id,value,custom_field}"
  );

  const matter = await clio(`/matters/${match.id}.json?fields=${fields}`);

  if (!matter.ok) {
    return NextResponse.json({ ok: false, step: "matter", matter }, { status: 500 });
  }

  const cfValues = matter.json?.data?.custom_field_values || [];
  const closeReasonCandidateIds = [22145660, 22145675, 22145690];

  return NextResponse.json({
    ok: true,
    displayNumber,
    matterId: match.id,
    status: matter.json?.data?.status,
    customFieldCount: cfValues.length,
    knownCloseReasonFieldsOnMatter: cfValues
      .filter((cf: any) => closeReasonCandidateIds.includes(cfId(cf)))
      .map((cf: any) => ({
        cfValueId: cf.id,
        value: cf.value,
        customFieldId: cfId(cf),
        rawCustomField: cf.custom_field,
      })),
    allCloseCandidateIdsFound: cfValues
      .map((cf: any) => cfId(cf))
      .filter((id: number) => closeReasonCandidateIds.includes(id)),
  });
}
