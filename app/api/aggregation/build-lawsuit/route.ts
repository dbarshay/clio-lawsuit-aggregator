import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clioAuth";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

const MASTER_LAWSUIT_ID_FIELD_ID = 22294835;

function generateMasterId(counter: number) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const seq = String(counter).padStart(5, "0");
  return `${mm}.${yyyy}.${seq}`;
}

// TEMP: replace later with DB-backed counter
let LOCAL_COUNTER = 1;

async function readMatterForMasterWrite(matterId: number) {
  const fields = "id,etag,display_number,custom_field_values{id,value,custom_field}";
  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Read failed for ${matterId}: status ${res.status}; body ${text}`);
  }

  const matter = JSON.parse(text)?.data;

  if (!matter?.etag) {
    throw new Error(`Matter ${matterId} missing ETag.`);
  }

  const existing = (matter.custom_field_values || []).find(
    (cfv: any) => Number(cfv?.custom_field?.id) === MASTER_LAWSUIT_ID_FIELD_ID
  );

  // existing may be undefined — that's OK (we will create it)

  return { matter, existing };
}

async function createMasterMatter(baseMatterId: number) {
  const baseRes = await clioFetch(
    `/api/v4/matters/${baseMatterId}.json?fields=id,client`
  );

  const baseText = await baseRes.text();

  if (!baseRes.ok) {
    throw new Error(`Failed to read base matter: status ${baseRes.status}; body ${baseText}`);
  }

  const baseJson = JSON.parse(baseText);
  const clientId = baseJson?.data?.client?.id;

  if (!clientId) {
    throw new Error("Base matter missing client");
  }

  const createRes = await clioFetch(`/api/v4/matters.json`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        description: `MASTER LAWSUIT`,
        client: { id: clientId },
      },
    }),
  });

  const createdText = await createRes.text();

  let created: any = null;
  try {
    created = createdText ? JSON.parse(createdText) : null;
  } catch {
    created = null;
  }

  if (!createRes.ok || !created?.data?.id) {
    throw new Error(
      `Failed to create master matter: status ${createRes.status}; body ${createdText}`
    );
  }

  return created.data;
}

async function refreshMatterIndex(matterId: number) {
  const fields = [
    "id",
    "etag",
    "display_number",
    "description",
    "status",
    "matter_stage{id,name}",
    "client",
    "custom_field_values{value,custom_field}",
  ].join(",");

  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `Failed to refresh claim index for ${matterId}: status ${res.status}; body ${text}`
    );
  }

  const matter = JSON.parse(text)?.data;
  await upsertClaimIndexFromMatter(matter);
}

async function writeMasterId(params: {
  matterId: number;
  etag: string;
  fieldValueId?: string;
  masterId: string;
}) {
  const payload = params.fieldValueId
    ? [
        {
          id: params.fieldValueId,
          custom_field: { id: MASTER_LAWSUIT_ID_FIELD_ID },
          value: params.masterId,
        },
      ]
    : [
        {
          custom_field: { id: MASTER_LAWSUIT_ID_FIELD_ID },
          value: params.masterId,
        },
      ];

  const patch = await clioFetch(`/api/v4/matters/${params.matterId}.json`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "If-Match": params.etag,
    },
    body: JSON.stringify({
      data: {
        custom_field_values: payload,
      },
    }),
  });

  const text = await patch.text();

  if (!patch.ok) {
    throw new Error(
      `Write failed ${params.matterId}: status ${patch.status}; body ${text}`
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const baseMatterId = Number(body.baseMatterId);
    const selectedMatterIds = Array.isArray(body.selectedMatterIds)
      ? body.selectedMatterIds.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    if (!baseMatterId || !selectedMatterIds.length) {
      return NextResponse.json(
        { ok: false, error: "Missing inputs" },
        { status: 400 }
      );
    }

    const allMatterIds: number[] = Array.from(new Set(selectedMatterIds));

    // Preflight BEFORE creating a master matter.
    const preflight = [];
    for (const matterId of allMatterIds) {
      const { matter, existing } = await readMatterForMasterWrite(matterId);
      preflight.push({
        matterId,
        etag: matter.etag,
        fieldValueId: existing?.id,
      });
    }

    const masterMatter = await createMasterMatter(baseMatterId);
    const masterId = generateMasterId(LOCAL_COUNTER++);

    const results = [];

    for (const item of preflight) {
      try {
        await writeMasterId({
          matterId: item.matterId,
          etag: item.etag,
          fieldValueId: item.fieldValueId,
          masterId,
        });

        await refreshMatterIndex(item.matterId);

        results.push({ matterId: item.matterId, ok: true });
      } catch (err: any) {
        results.push({
          matterId: item.matterId,
          ok: false,
          error: err?.message || "Unknown write error",
        });
      }
    }

    const failed = results.filter((r) => !r.ok);

    return NextResponse.json({
      ok: failed.length === 0,
      masterMatterId: masterMatter.id,
      masterLawsuitId: masterId,
      total: allMatterIds.length,
      failed: failed.length,
      results,
      error: failed.length ? failed.map((f) => f.error).join("\\n") : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Lawsuit build failed" },
      { status: 500 }
    );
  }
}
