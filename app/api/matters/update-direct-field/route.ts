import { NextResponse } from "next/server";
import { getValidClioAccessToken } from "@/lib/clioTokenStore";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

const BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";

const MATTER_CF = {
  DOS_START: 22145960,
  DOS_END: 22145975,
  DENIAL_REASON: 22146035,
  CLOSE_REASON: 22145660,
};

async function clioFetch(path: string, options: RequestInit = {}) {
  const token = await getValidClioAccessToken();

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Clio API error ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

function customFieldId(row: any): number | null {
  const raw = row?.custom_field?.id ?? row?.custom_field_id ?? row?.custom_field;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function findCustomFieldValue(matter: any, fieldId: number) {
  const rows = Array.isArray(matter?.custom_field_values) ? matter.custom_field_values : [];
  return rows.find((row: any) => customFieldId(row) === fieldId) || null;
}

function cleanText(value: any): string {
  return String(value || "").trim();
}

function payloadForExistingCustomFieldValue(row: any, fieldId: number, value: string) {
  if (!row?.id) {
    throw new Error(`Cannot update custom field ${fieldId}; existing custom_field_value id was not found.`);
  }

  return {
    id: row.id,
    custom_field: { id: fieldId },
    value,
  };
}

function picklistValue(value: any): string {
  const cleaned = cleanText(value);
  if (!cleaned) throw new Error("Picklist value is required.");
  return cleaned;
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const matterId = Number(body?.matterId || "");
    const field = cleanText(body?.field);

    if (!Number.isFinite(matterId) || matterId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valid matterId is required." },
        { status: 400 }
      );
    }

    const supported = ["dos", "denialReason", "status", "finalStatus"];
    if (!supported.includes(field)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported direct matter field." },
        { status: 400 }
      );
    }

    const readFields = encodeURIComponent(
      "id,display_number,description,status,matter_stage{id,name},client,custom_field_values{id,value,custom_field}"
    );

    const beforeJson = await clioFetch(`/matters/${matterId}.json?fields=${readFields}`);
    const beforeMatter = beforeJson?.data;

    if (!beforeMatter?.id) {
      return NextResponse.json(
        { ok: false, error: "Matter was not returned from Clio." },
        { status: 502 }
      );
    }

    let patchData: any = {};

    if (field === "dos") {
      const dosStart = cleanText(body?.dosStart);
      const dosEnd = cleanText(body?.dosEnd);

      if (!dosStart || !dosEnd) {
        return NextResponse.json(
          { ok: false, error: "DOS Start and DOS End are required." },
          { status: 400 }
        );
      }

      const dosStartRow = findCustomFieldValue(beforeMatter, MATTER_CF.DOS_START);
      const dosEndRow = findCustomFieldValue(beforeMatter, MATTER_CF.DOS_END);

      patchData = {
        custom_field_values: [
          payloadForExistingCustomFieldValue(dosStartRow, MATTER_CF.DOS_START, dosStart),
          payloadForExistingCustomFieldValue(dosEndRow, MATTER_CF.DOS_END, dosEnd),
        ],
      };
    }

    if (field === "denialReason") {
      const denialReasonValue = picklistValue(body?.denialReasonValue);
      const denialReasonRow = findCustomFieldValue(beforeMatter, MATTER_CF.DENIAL_REASON);

      patchData = {
        custom_field_values: [
          payloadForExistingCustomFieldValue(
            denialReasonRow,
            MATTER_CF.DENIAL_REASON,
            denialReasonValue
          ),
        ],
      };
    }

    if (field === "finalStatus") {
      const finalStatusValue = picklistValue(body?.finalStatusValue);
      const closeReasonRow = findCustomFieldValue(beforeMatter, MATTER_CF.CLOSE_REASON);

      patchData = {
        custom_field_values: [
          payloadForExistingCustomFieldValue(
            closeReasonRow,
            MATTER_CF.CLOSE_REASON,
            finalStatusValue
          ),
        ],
      };
    }

    if (field === "status") {
      const statusValue = Number(body?.statusValue || body?.matterStageId || "");
      if (!Number.isFinite(statusValue) || statusValue <= 0) {
        return NextResponse.json(
          { ok: false, error: "Valid matter stage/status option is required." },
          { status: 400 }
        );
      }

      patchData = {
        matter_stage: {
          id: statusValue,
        },
      };
    }

    await clioFetch(`/matters/${matterId}.json`, {
      method: "PATCH",
      body: JSON.stringify({
        data: patchData,
      }),
    });

    const afterJson = await clioFetch(`/matters/${matterId}.json?fields=${readFields}`);
    const afterMatter = afterJson?.data;

    if (!afterMatter?.id) {
      return NextResponse.json(
        { ok: false, error: "Matter was not returned from Clio after writeback." },
        { status: 502 }
      );
    }

    await upsertClaimIndexFromMatter(afterMatter);

    return NextResponse.json({
      ok: true,
      action: "update-direct-matter-field",
      field,
      matterId,
      displayNumber: afterMatter.display_number || "",
      matter: afterMatter,
      safety: {
        clioWriteback: true,
        customFieldValueCreation: "blocked",
        claimIndexRefreshed: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
