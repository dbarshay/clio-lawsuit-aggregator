import { NextResponse } from "next/server";
import { getValidClioAccessToken } from "@/lib/clioTokenStore";
import { ingestMattersFromClioBatch } from "@/lib/ingestMattersFromClioBatch";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

const BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";
const CLOSE_REASON_FIELD_ID = 22145660;

const CLOSE_REASON_OPTIONS: Record<string, number> = {
  "AAA- DECISION- DISMISSED WITH PREJUDICE": 12497450,
  "AAA- VOLUNTARILY WITHDRAWN WITH PREJUDICE": 12497465,
  "DISCONTINUED WITH PREJUDICE": 12497480,
  "MOTION LOSS": 12497495,
  "OUT OF STATE CARRIER": 12497510,
  "PAID (DECISION)": 12497525,
  "PAID (JUDGMENT)": 12497540,
  "PAID (SETTLEMENT)": 12497555,
  "PAID (FEE SCHEDULE)": 12497570,
  "PAID (VOLUNTARY)": 12497585,
  "PER CLIENT": 12497600,
  "POLICY CANCELLED": 12497615,
  "POLICY EXHAUSTED/NO COVERAGE": 12497630,
  "PPO": 12497645,
  "SOL": 12497660,
  "TRIAL LOSS": 12497675,
  "WORKERS COMPENSATION": 12497690,
  "TRANSFERRED TO LB": 12497825,

  // legacy UI aliases
  "PAID AFTER SETTLEMENT": 12497555,
  "PAID AFTER DECISION": 12497525,
  "PAID AFTER JUDGMENT": 12497540,
  "PAID PER FEE SCHEDULE": 12497570,
  "PAID VOLUNTARY": 12497585,
  "WORKERS COMP": 12497690,
};

async function clioFetch(path: string, options: RequestInit = {}) {
  const token = await getValidClioAccessToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Clio API error: ${res.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}


async function refreshSingleMatterIntoClaimIndex(matterId: number) {
  const fields = encodeURIComponent(
    "id,display_number,description,status,client,custom_field_values{id,value,custom_field}"
  );

  const matter = await clioFetch(`/matters/${matterId}.json?fields=${fields}`);

  if (!matter?.data?.id) {
    throw new Error(`Single matter refresh failed: matter ${matterId} not returned from Clio`);
  }

  if (Number(matter.data.id) !== Number(matterId)) {
    throw new Error(
      `Single matter refresh returned wrong matter ID ${matter.data.id}; expected ${matterId}`
    );
  }

  await upsertClaimIndexFromMatter(matter.data);

  return {
    matterId,
    ok: true,
    source: "single-matter-fallback",
  };
}

function customFieldId(cf: any): number | null {
  const raw = cf?.custom_field?.id ?? cf?.custom_field_id ?? cf?.custom_field;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}


async function fetchMatterForCloseReasonVerification(matterId: number) {
  const fields = encodeURIComponent(
    "id,display_number,status,custom_field_values{id,value,custom_field}"
  );

  return clioFetch(`/matters/${matterId}.json?fields=${fields}`);
}

function readCloseReasonValueFromClioMatter(matter: any): string {
  const cfValues = matter?.data?.custom_field_values || [];

  const cf = cfValues.find((v: any) => {
    const id = Number(v?.custom_field?.id ?? v?.custom_field_id ?? v?.custom_field);
    return id === CLOSE_REASON_FIELD_ID;
  });

  return String(cf?.value || "").trim();
}

export async function POST(req: Request) {
  try {
    const { matterId, closeReason } = await req.json();

    const numericMatterId = Number(matterId);

    if (!Number.isFinite(numericMatterId) || numericMatterId <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid matterId" }, { status: 400 });
    }

    const closeReasonOptionId = CLOSE_REASON_OPTIONS[closeReason];

    if (!closeReasonOptionId) {
      return NextResponse.json({ ok: false, error: "Invalid closeReason" }, { status: 400 });
    }

    const fields = encodeURIComponent(
      "id,display_number,status,custom_field_values{id,value,custom_field}"
    );

    const matter = await clioFetch(`/matters/${numericMatterId}.json?fields=${fields}`);

    const cfValues = matter?.data?.custom_field_values || [];

    // ALWAYS fetch fresh before updating CF
    const freshMatter = await fetchMatterForCloseReasonVerification(numericMatterId);
    const freshCfValues = freshMatter?.data?.custom_field_values || [];

    const closeReasonValue = freshCfValues.find(
      (cf: any) => customFieldId(cf) === CLOSE_REASON_FIELD_ID
    );

    if (!closeReasonValue?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: `Existing Close Reason custom field value not found on matter ${numericMatterId}`,
          foundCustomFieldIds: cfValues.map((cf: any) => customFieldId(cf)).filter(Boolean),
        },
        { status: 500 }
      );
    }

    const updated = await clioFetch(`/matters/${numericMatterId}.json`, {
      method: "PATCH",
      body: JSON.stringify({
        data: {
          status: "closed",
          custom_field_values: [
            {
              id: closeReasonValue.id,
              value: closeReasonOptionId,
            },
          ],
        },
      }),
    });

    let ingestResults: any = null;
    let ingestWarning: string | null = null;
    let ingestFallbackResult: any = null;

    try {
      ingestResults = await ingestMattersFromClioBatch([numericMatterId]);
    } catch (err: any) {
      ingestWarning = err?.message || "Batch ClaimIndex re-ingest failed after Clio close write.";
      // Re-fetch AFTER write to get updated Close Reason
      const freshAfterWrite = await fetchMatterForCloseReasonVerification(numericMatterId);

      await upsertClaimIndexFromMatter(freshAfterWrite.data);

      ingestFallbackResult = {
        matterId: numericMatterId,
        ok: true,
        source: "single-matter-fallback-fresh-after-write",
      };
    }

    return NextResponse.json({
      ok: true,
      matterId: numericMatterId,
      closeReason,
      closeReasonOptionId,
      status: "closed",
      closeReasonCustomFieldValueId: closeReasonValue.id,
      updated,
      ingestResults,
      ingestWarning,
      ingestFallbackResult,
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
