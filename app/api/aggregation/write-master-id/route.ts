import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

const MASTER_LAWSUIT_ID_FIELD_ID = 22294835;

type ClioCustomFieldValue = {
  id?: number | string;
  value?: string | number | null;
  etag?: string;
  custom_field?: {
    id?: number;
    name?: string;
  };
};

type ClioMatter = {
  id: number;
  etag?: string;
  custom_field_values?: ClioCustomFieldValue[];
};

function normalizeMatterId(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeMasterId(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function findExistingMasterFieldValue(
  matter: ClioMatter
): ClioCustomFieldValue | undefined {
  return matter.custom_field_values?.find((cfv) => {
    // MASTER LAWSUIT ID is a TEXT field → text_line-
    return typeof cfv?.id === "string" && cfv.id.startsWith("text_line-");
  });
}

async function readMatterWithFields(matterId: number): Promise<ClioMatter> {
 const res = await clioFetch(
  `/api/v4/matters/${matterId}?fields=id,etag,custom_field_values`,
  {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Failed to read matter ${matterId}: ${text}`);
  }

  const json = JSON.parse(text);
  const matter = json?.data;

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} was returned without usable data.`);
  }

   console.log(
    "DEBUG matter custom_field_values:",
    JSON.stringify(matter?.custom_field_values, null, 2)
  );

  return matter as ClioMatter;
}

async function patchMatterCustomFieldValues(params: {
  matterId: number;
  matterEtag: string;
  customFieldValues: Array<{
    id?: number | string;
    custom_field: { id: number };
    value: string;
  }>;
}) {
  const { matterId, matterEtag, customFieldValues } = params;

  const res = await clioFetch(`/api/v4/matters/${matterId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "If-Match": matterEtag,
    },
    body: JSON.stringify({
      data: {
        custom_field_values: customFieldValues,
      },
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Failed updating matter ${matterId}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function writeMasterLawsuitIdToMatter(
  matterId: number,
  masterMatterId: string
) {
  const matter = await readMatterWithFields(matterId);

  const matterEtag = matter.etag;
  if (!matterEtag) {
    throw new Error(`Matter ${matterId} did not include an ETag.`);
  }

  const existing = findExistingMasterFieldValue(matter);

  const customFieldValues = existing?.id
    ? [
        {
          id: existing.id,
          custom_field: {
            id: MASTER_LAWSUIT_ID_FIELD_ID,
          },
          value: masterMatterId,
        },
      ]
    : [
        {
          custom_field: {
            id: MASTER_LAWSUIT_ID_FIELD_ID,
          },
          value: masterMatterId,
        },
      ];

  await patchMatterCustomFieldValues({
    matterId,
    matterEtag,
    customFieldValues,
  });

  return {
    matterId,
    action: existing?.id ? "updated" as const : "created" as const,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rawSelectedMatterIds: unknown[] = Array.isArray(body?.selectedMatterIds)
      ? body.selectedMatterIds
      : [];

    const masterMatterId = normalizeMasterId(body?.masterMatterId);

    if (!masterMatterId) {
      return NextResponse.json(
        {
          ok: false,
          error: "masterMatterId is required.",
        },
        { status: 400 }
      );
    }

    const selectedMatterIds = rawSelectedMatterIds
      .map(normalizeMatterId)
      .filter((id: number | null): id is number => id !== null);

    if (!selectedMatterIds.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "selectedMatterIds must contain at least one valid matter ID.",
        },
        { status: 400 }
      );
    }

    const results: Array<{
      matterId: number;
      action?: "created" | "updated";
      error?: string;
    }> = [];

    for (const matterId of selectedMatterIds) {
      try {
        const result = await writeMasterLawsuitIdToMatter(
          matterId,
          masterMatterId
        );

        results.push({
          matterId: result.matterId,
          action: result.action === "created" ? "created" : "updated",
        });
      } catch (err: any) {
        results.push({
          matterId,
          error: err?.message || "Unknown error",
        });
      }
    }

    const failed = results.filter((r) => r.error);
    const succeeded = results.filter((r) => !r.error);

    return NextResponse.json({
      ok: failed.length === 0,
      masterMatterId,
      requested: selectedMatterIds.length,
      succeeded: succeeded.length,
      failed: failed.length,
      results,
      error:
        failed.length > 0
          ? `Write-back failed for ${failed.length} matter(s).`
          : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}