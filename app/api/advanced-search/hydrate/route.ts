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

const ADVANCED_FIELD_IDS = {
  dosStart: 22145960,
  dosEnd: 22145975,
  closeReason: 22145660,
  serviceType: 22146005,
  denialReason: 22146035,
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  "12497915": "ANESTHESIA",
  "12497930": "CHIROPRACTIC",
  "12509225": "DENTAL",
  "12509240": "DISABILITY EXAM",
  "12509255": "DME",
  "12509270": "EEG",
  "12509285": "EM VISIT-FOLLOW UP",
  "12509300": "EM VISIT-INITIAL",
  "12509315": "EMG/NCV",
  "12509330": "EPIDURAL INJECTION",
  "12509345": "FACILITY FEE",
  "12509360": "FLUOROSCOPY",
  "12509375": "MUA",
  "12509390": "NERVE BLOCK",
  "12509405": "OT",
  "12509420": "OUTCOME ASSESSMENT",
  "12509435": "PHARMACY",
  "12509450": "PHYSICAL CAPACITY TESTING",
  "12509465": "PSYCH",
  "12509480": "PT",
  "12509495": "RADIOLOGY-CT",
  "12509510": "RADIOLOGY-MRI",
  "12509525": "RADIOLOGY-XRAY",
  "12509540": "ROM/MMT",
  "12509555": "SONOGRAM",
  "12509570": "SPINAL DECOMPRESSION",
  "12509585": "SURGERY",
  "12509600": "ULTRASOUND",
  "12509615": "UNKNOWN",
};

const CLOSE_REASON_LABELS: Record<string, string> = {
  "12497450": "AAA- DECISION- DISMISSED WITH PREJUDICE",
  "12497465": "AAA- VOLUNTARILY WITHDRAWN WITH PREJUDICE",
  "12497480": "DISCONTINUED WITH PREJUDICE",
  "12497495": "MOTION LOSS",
  "12497510": "OUT OF STATE CARRIER",
  "12497525": "PAID (DECISION)",
  "12497540": "PAID (JUDGMENT)",
  "12497555": "PAID (SETTLEMENT)",
  "12497570": "PAID (FEE SCHEDULE)",
  "12497585": "PAID (VOLUNTARY)",
  "12497600": "PER CLIENT",
  "12497615": "POLICY CANCELLED",
  "12497630": "POLICY EXHAUSTED/NO COVERAGE",
  "12497645": "PPO",
  "12497660": "SOL",
  "12497675": "TRIAL LOSS",
  "12497690": "WORKERS COMPENSATION",
  "12497825": "TRANSFERRED TO LB",
};

const DENIAL_REASON_LABELS: Record<string, string> = {
  "12497975": "Medical Necessity (IME)",
  "12497990": "Medical Necessity (Peer Review)",
  "12498035": "Medical Necessity (Causality)",
  "12498050": "Fee Schedule",
  "12498065": "No-Show (EUO)",
  "12498080": "No-Show (IME)",
  "12498095": "30 Day Rule (Late Notice of Claim)",
  "12498110": "45 Day Rule (Late Submission of Bill)",
  "12498125": "120 Day Rule- Failure to Provide Verification (OVR)",
  "12498140": "Alleged Fraud",
  "12498155": "No-Coverage (Wrong Carrier)",
  "12498170": "No Coverage (Policy Exhausted)",
  "12498185": "No Coverage (Policy Expired)",
  "12498200": "No Coverage (Motorcycle)",
  "12498215": "No Coverage (Out of State Carrier)",
  "12498230": "No Coverage (Not Eligible IP)",
};

function customFieldId(cfv: any) {
  const raw =
    cfv?.custom_field?.id ??
    cfv?.customField?.id ??
    cfv?.custom_field_id ??
    cfv?.customFieldId ??
    cfv?.field_id ??
    cfv?.fieldId;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function customFieldValue(matter: any, fieldId: number) {
  const rows = Array.isArray(matter?.custom_field_values)
    ? matter.custom_field_values
    : [];

  const match = rows.find((cfv: any) => customFieldId(cfv) === fieldId);
  return text(match?.value ?? match?.display_value ?? match?.displayValue ?? "");
}

function formatMmDdYyyy(value: any) {
  const raw = text(value);
  if (!raw) return "";

  const iso = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (!iso) return raw;

  const [yyyy, mm, dd] = iso.split("-");
  return `${mm}/${dd}/${yyyy}`;
}

function labelFrom(map: Record<string, string>, raw: any) {
  const key = text(raw);
  return map[key] || key;
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
  const fields = "id,display_number,status,matter_stage{id,name},client,custom_field_values{id,value,custom_field}";
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
        matter_stage: matter?.matter_stage || row?.matter_stage,
        matterStage: matter?.matter_stage || row?.matterStage,
        matter_stage_name: matter?.matter_stage?.name || row?.matter_stage_name,
        client_name: row?.client_name || matter?.client?.name,

        dos_start: customFieldValue(matter, ADVANCED_FIELD_IDS.dosStart) || row?.dos_start,
        dosStart: formatMmDdYyyy(customFieldValue(matter, ADVANCED_FIELD_IDS.dosStart) || row?.dos_start),
        dos_start_display: formatMmDdYyyy(customFieldValue(matter, ADVANCED_FIELD_IDS.dosStart) || row?.dos_start),

        dos_end: customFieldValue(matter, ADVANCED_FIELD_IDS.dosEnd) || row?.dos_end,
        dosEnd: formatMmDdYyyy(customFieldValue(matter, ADVANCED_FIELD_IDS.dosEnd) || row?.dos_end),
        dos_end_display: formatMmDdYyyy(customFieldValue(matter, ADVANCED_FIELD_IDS.dosEnd) || row?.dos_end),

        service_type_raw: customFieldValue(matter, ADVANCED_FIELD_IDS.serviceType),
        service_type: labelFrom(SERVICE_TYPE_LABELS, customFieldValue(matter, ADVANCED_FIELD_IDS.serviceType)),
        serviceType: labelFrom(SERVICE_TYPE_LABELS, customFieldValue(matter, ADVANCED_FIELD_IDS.serviceType)),

        close_reason_raw: customFieldValue(matter, ADVANCED_FIELD_IDS.closeReason) || row?.close_reason,
        close_reason: labelFrom(CLOSE_REASON_LABELS, customFieldValue(matter, ADVANCED_FIELD_IDS.closeReason) || row?.close_reason),
        closeReason: labelFrom(CLOSE_REASON_LABELS, customFieldValue(matter, ADVANCED_FIELD_IDS.closeReason) || row?.close_reason),

        denial_reason_raw: customFieldValue(matter, ADVANCED_FIELD_IDS.denialReason) || row?.denial_reason,
        denial_reason: labelFrom(DENIAL_REASON_LABELS, customFieldValue(matter, ADVANCED_FIELD_IDS.denialReason) || row?.denial_reason),
        denialReason: labelFrom(DENIAL_REASON_LABELS, customFieldValue(matter, ADVANCED_FIELD_IDS.denialReason) || row?.denial_reason),

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

  const requestedMatterIds = req.nextUrl.searchParams
    .getAll("matterIds")
    .flatMap((v) => String(v).split(","))
    .map((v) => text(v))
    .filter(Boolean);

  const requestedMatterIdNumbers = requestedMatterIds
    .map((v) => Number(v.replace(/^BRL/i, "")))
    .filter((v) => Number.isFinite(v));

  const requestedDisplayNumbers = requestedMatterIds.map((v) =>
    /^BRL/i.test(v) ? v.toUpperCase() : `BRL${v}`
  );

  const rows = await prisma.claimIndex.findMany({
    where:
      requestedMatterIds.length > 0
        ? {
            OR: [
              { matter_id: { in: requestedMatterIdNumbers } },
              { display_number: { in: requestedDisplayNumbers } },
            ],
          }
        : {
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
