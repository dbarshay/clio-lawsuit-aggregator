import { NextResponse } from "next/server";
import { getValidClioAccessToken } from "@/lib/clioTokenStore";
import { prisma } from "@/lib/prisma";

const CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";
const MASTER_LAWSUIT_ID = 22294835;
const LAWSUIT_MATTERS = 22306250;

async function clioFetch(path: string, options: RequestInit = {}) {
  const accessToken = await getValidClioAccessToken();

  const res = await fetch(`${CLIO_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(`Clio API error: ${res.status} ${text}`);
  }

  return json;
}

function customFieldId(cf: any): number | null {
  const raw =
    cf?.custom_field?.id ??
    cf?.custom_field_id ??
    cf?.custom_field;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function resetMatter(matterId: number) {
  const fields = encodeURIComponent(
    "id,display_number,custom_field_values{id,value,custom_field}"
  );

  const data = await clioFetch(`/matters/${matterId}.json?fields=${fields}`);
  const cfValues = data?.data?.custom_field_values || [];

  const masterField = cfValues.find(
    (cf: any) => customFieldId(cf) === MASTER_LAWSUIT_ID
  );

  const mattersField = cfValues.find(
    (cf: any) => customFieldId(cf) === LAWSUIT_MATTERS
  );

  if (!masterField || !mattersField) {
    throw new Error(
      `Missing custom fields on matter ${matterId}. Found: ${cfValues
        .map((cf: any) => JSON.stringify(cf))
        .join(" | ")}`
    );
  }

  await clioFetch(`/matters/${matterId}.json`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        custom_field_values: [
          { id: masterField.id, value: "" },
          { id: mattersField.id, value: "" },
        ],
      },
    }),
  });

  return matterId;
}

export async function POST() {
  const matterIds = [1870311350, 1870482830];

  const reset = [];
  for (const id of matterIds) {
    reset.push(await resetMatter(id));
  }

  await prisma.claimIndex.updateMany({
    where: {
      matter_id: { in: matterIds },
    },
    data: {
      master_lawsuit_id: null,
    },
  });

  return NextResponse.json({
    ok: true,
    reset,
    claimIndexReset: true,
  });
}
