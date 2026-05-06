import { NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export const dynamic = "force-dynamic";

const FIELD_IDS = {
  denialReason: 22146035,
  closeReason: 22145660,
  serviceType: 22146005,
};

const FINAL_STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "Pending", label: "Pending" },
  { value: "Closed", label: "Closed" },
];

const FALLBACK_STATUS_STAGE_OPTIONS = [
  { value: "READY FOR ARBITRATION/LITIGATION", label: "READY FOR ARBITRATION/LITIGATION" },
  { value: "READY FOR ARBITRATION LITIGATION", label: "READY FOR ARBITRATION LITIGATION" },
];

const FALLBACK_DENIAL_REASON_OPTIONS = [
  { value: "12497975", label: "Medical Necessity (IME)" },
  { value: "12497990", label: "Medical Necessity (Peer Review)" },
  { value: "12498035", label: "Medical Necessity (Causality)" },
  { value: "12498050", label: "Fee Schedule" },
  { value: "12498065", label: "No-Show (EUO)" },
  { value: "12498080", label: "No-Show (IME)" },
  { value: "12498095", label: "30 Day Rule (Late Notice of Claim)" },
  { value: "12498110", label: "45 Day Rule (Late Submission of Bill)" },
  { value: "12498125", label: "120 Day Rule- Failure to Provide Verification (OVR)" },
  { value: "12498140", label: "Alleged Fraud" },
  { value: "12498155", label: "No-Coverage (Wrong Carrier)" },
  { value: "12498170", label: "No Coverage (Policy Exhausted)" },
  { value: "12498185", label: "No Coverage (Policy Expired)" },
  { value: "12498200", label: "No Coverage (Motorcycle)" },
  { value: "12498215", label: "No Coverage (Out of State Carrier)" },
  { value: "12498230", label: "No Coverage (Not Eligible IP)" },
];

const FALLBACK_CLOSE_REASON_OPTIONS = [
  { value: "12497450", label: "AAA- DECISION- DISMISSED WITH PREJUDICE" },
  { value: "12497465", label: "AAA- VOLUNTARILY WITHDRAWN WITH PREJUDICE" },
  { value: "12497480", label: "DISCONTINUED WITH PREJUDICE" },
  { value: "12497495", label: "MOTION LOSS" },
  { value: "12497510", label: "OUT OF STATE CARRIER" },
  { value: "12497525", label: "PAID (DECISION)" },
  { value: "12497540", label: "PAID (JUDGMENT)" },
  { value: "12497555", label: "PAID (SETTLEMENT)" },
  { value: "12497570", label: "PAID (FEE SCHEDULE)" },
  { value: "12497585", label: "PAID (VOLUNTARY)" },
  { value: "12497600", label: "PER CLIENT" },
  { value: "12497615", label: "POLICY CANCELLED" },
  { value: "12497630", label: "POLICY EXHAUSTED/NO COVERAGE" },
  { value: "12497645", label: "PPO" },
  { value: "12497660", label: "SOL" },
  { value: "12497675", label: "TRIAL LOSS" },
  { value: "12497690", label: "WORKERS COMPENSATION" },
  { value: "12497825", label: "TRANSFERRED TO LB" },
];

const FALLBACK_SERVICE_TYPE_OPTIONS = [
  { value: "12497915", label: "ANESTHESIA" },
  { value: "12497930", label: "CHIROPRACTIC" },
  { value: "12509225", label: "DENTAL" },
  { value: "12509240", label: "DISABILITY EXAM" },
  { value: "12509255", label: "DME" },
  { value: "12509270", label: "EEG" },
  { value: "12509285", label: "EM VISIT-FOLLOW UP" },
  { value: "12509300", label: "EM VISIT-INITIAL" },
  { value: "12509315", label: "EMG/NCV" },
  { value: "12509330", label: "EPIDURAL INJECTION" },
  { value: "12509345", label: "FACILITY FEE" },
  { value: "12509360", label: "FLUOROSCOPY" },
  { value: "12509375", label: "MUA" },
  { value: "12509390", label: "NERVE BLOCK" },
  { value: "12509405", label: "OT" },
  { value: "12509420", label: "OUTCOME ASSESSMENT" },
  { value: "12509435", label: "PHARMACY" },
  { value: "12509450", label: "PHYSICAL CAPACITY TESTING" },
  { value: "12509465", label: "PSYCH" },
  { value: "12509480", label: "PT" },
  { value: "12509495", label: "RADIOLOGY-CT" },
  { value: "12509510", label: "RADIOLOGY-MRI" },
  { value: "12509525", label: "RADIOLOGY-XRAY" },
  { value: "12509540", label: "ROM/MMT" },
  { value: "12509555", label: "SONOGRAM" },
  { value: "12509570", label: "SPINAL DECOMPRESSION" },
  { value: "12509585", label: "SURGERY" },
  { value: "12509600", label: "ULTRASOUND" },
  { value: "12509615", label: "UNKNOWN" },
];

function text(v: any) {
  return String(v ?? "").trim();
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

function normalizeOptionRows(rows: any[]) {
  const out: Array<{ value: string; label: string }> = [];

  for (const row of rows) {
    const value = text(row?.id || row?.value || row?.option_id || row?.key || row?.name);
    const label = text(row?.option || row?.name || row?.label || row?.value);

    if (!value || !label) continue;

    out.push({ value, label });
  }

  return out;
}

async function fetchCustomFieldOptions(fieldId: number) {
  try {
    const fields = "id,name,parent_type,field_type,displayed,picklist_options";
    const json: any = await clioJson(
      `/api/v4/custom_fields/${fieldId}.json?fields=${encodeURIComponent(fields)}`
    );

    const field = json?.data || json || {};
    const rawOptions = Array.isArray(field?.picklist_options)
      ? field.picklist_options
      : [];

    const normalized = normalizeOptionRows(rawOptions);

    return {
      ok: normalized.length > 0,
      fieldId,
      fieldName: text(field?.name),
      options: normalized,
      rawOptionCount: rawOptions.length,
      error: null,
    };
  } catch (err: any) {
    return {
      ok: false,
      fieldId,
      fieldName: "",
      options: [],
      rawOptionCount: 0,
      error: err?.message || String(err),
    };
  }
}

async function fetchMatterStageOptions() {
  const attempts = [
    "/api/v4/matter_stages.json?fields=id,name",
    "/api/v4/matter_stages.json?fields=id,name,practice_area",
  ];

  for (const path of attempts) {
    try {
      const json: any = await clioJson(path);
      const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      const options = normalizeOptionRows(rows);

      if (options.length > 0) {
        return {
          ok: true,
          fieldId: null,
          fieldName: "Matter Stage",
          options,
          rawOptionCount: rows.length,
          usedFallback: false,
          error: null,
        };
      }
    } catch {
      // Try next shape, then fallback.
    }
  }

  return {
    ok: true,
    fieldId: null,
    fieldName: "Matter Stage",
    options: FALLBACK_STATUS_STAGE_OPTIONS,
    rawOptionCount: FALLBACK_STATUS_STAGE_OPTIONS.length,
    usedFallback: true,
    error: "Matter stages could not be loaded from Clio; local fallback used.",
  };
}

export async function GET() {
  const denial = await fetchCustomFieldOptions(FIELD_IDS.denialReason);
  const closeReason = await fetchCustomFieldOptions(FIELD_IDS.closeReason);
  const serviceType = await fetchCustomFieldOptions(FIELD_IDS.serviceType);
  const matterStages = await fetchMatterStageOptions();

  const closeReasonOptions = closeReason.options.length
    ? closeReason.options
    : FALLBACK_CLOSE_REASON_OPTIONS;

  return NextResponse.json({
    ok: true,
    action: "advanced-search-picklists",
    denialReason: {
      ...denial,
      options: denial.options.length ? denial.options : FALLBACK_DENIAL_REASON_OPTIONS,
      usedFallback: denial.options.length === 0,
    },
    status: matterStages,
    closeReason: {
      ...closeReason,
      options: closeReasonOptions,
      usedFallback: closeReason.options.length === 0,
      sourceFieldId: FIELD_IDS.closeReason,
      sourceFieldName: "CLOSE REASON (Litigation/Arbitration)",
    },
    finalStatus: {
      ok: true,
      fieldId: null,
      fieldName: "Matter Status",
      options: FINAL_STATUS_OPTIONS,
      rawOptionCount: FINAL_STATUS_OPTIONS.length,
      usedFallback: false,
      error: null,
    },
    serviceType: {
      ...serviceType,
      options: serviceType.options.length ? serviceType.options : FALLBACK_SERVICE_TYPE_OPTIONS,
      usedFallback: serviceType.options.length === 0,
    },
    safety: {
      readOnly: true,
      noClioRecordsChanged: true,
      noDatabaseRecordsChanged: true,
    },
  });
}
