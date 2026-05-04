import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";
import { getCustomFieldValue } from "@/lib/matterHelpers";

async function getContactName(contactId: number | string | null | undefined) {
  if (!contactId) return null;

  const res = await clioFetch(`/api/v4/contacts/${contactId}.json?fields=id,name`);
  if (!res.ok) return null;

  const json = await res.json();
  return json?.data?.name ?? null;
}

const CLOSE_REASON_LITIGATION_ARBITRATION = 22145660;

const DENIAL_REASON_LABELS: Record<string, string> = {
  "12497975": "Medical Necessity (IME)",
  "12498065": "Fee Schedule / Coding",
};

function isSelectableForSettlement(matterStage: any, status: any) {
  const stageName = String(matterStage?.name || "").toUpperCase();
  const statusValue = String(status || "").toLowerCase();

  return (
    stageName.includes("READY FOR ARBITRATION/LITIGATION") &&
    statusValue.includes("open")
  );
}

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

function getCloseReasonLabel(value: any) {
  if (value == null || value === "") return "";
  return CLOSE_REASON_LABELS[String(value)] || "";
}

function getDenialReasonLabel(value: any) {
  if (value == null || value === "") return null;
  return DENIAL_REASON_LABELS[String(value)] || String(value);
}

export async function GET(req: NextRequest) {
  try {
    const matterId = req.nextUrl.searchParams.get("matterId");

    if (!matterId) {
      return NextResponse.json(
        { ok: false, error: "Missing matterId" },
        { status: 400 }
      );
    }

    const fields = [
      "id",
      "etag",
      "display_number",
      "description",
      "status",
      "matter_stage{id,name}",
      "matter_stage{id,name}",
      "client",
      "custom_field_values{value,custom_field}",
    ].join(",");

    const res = await clioFetch(
      `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: text || "Failed to load matter" },
        { status: res.status }
      );
    }

    const json = await res.json();
    const matter = json?.data;

    if (!matter?.id) {
      return NextResponse.json(
        { ok: false, error: "Matter not found" },
        { status: 404 }
      );
    }

    const patientId = getCustomFieldValue(matter, MATTER_CF.PATIENT);
    const insurerId = getCustomFieldValue(matter, MATTER_CF.INSURANCE_COMPANY);
    const rawDenialReason = getCustomFieldValue(matter, MATTER_CF.DENIAL_REASON);
    const closeReasonRaw = getCustomFieldValue(matter, CLOSE_REASON_LITIGATION_ARBITRATION);
    const settledWithId = getCustomFieldValue(matter, MATTER_CF.SETTLED_WITH);

    const [patientName, insurerName, settledWithName] = await Promise.all([
      getContactName(patientId),
      getContactName(insurerId),
      getContactName(settledWithId),
    ]);

    const normalized = {
      id: matter.id,
      etag: matter.etag,
      displayNumber: matter.display_number,
      description: matter.description,
      status: matter.status,
      closeReason: getCloseReasonLabel(closeReasonRaw),
      matterStage: matter.matter_stage,
      selectableForSettlement: isSelectableForSettlement(matter.matter_stage, matter.status),

      claimNumber: getCustomFieldValue(matter, MATTER_CF.CLAIM_NUMBER),
      billNumber: getCustomFieldValue(matter, MATTER_CF.BILL_NUMBER),
      claimAmount: getCustomFieldValue(matter, MATTER_CF.CLAIM_AMOUNT),
      dosStart: getCustomFieldValue(matter, MATTER_CF.DOS_START),
      dosEnd: getCustomFieldValue(matter, MATTER_CF.DOS_END),
      denialReason: getDenialReasonLabel(rawDenialReason),
      indexNumber: getCustomFieldValue(matter, MATTER_CF.INDEX_AAA_NUMBER),
      settledAmount: getCustomFieldValue(matter, MATTER_CF.SETTLED_AMOUNT),

      
      settledWith: settledWithName,
      settledWithContactId: settledWithId,
      allocatedSettlement: getCustomFieldValue(matter, MATTER_CF.ALLOCATED_SETTLEMENT),
      interestAmount: getCustomFieldValue(matter, MATTER_CF.INTEREST_AMOUNT),
      principalFee: getCustomFieldValue(matter, MATTER_CF.PRINCIPAL_FEE),
      interestFee: getCustomFieldValue(matter, MATTER_CF.INTEREST_FEE),
      totalFee: getCustomFieldValue(matter, MATTER_CF.TOTAL_FEE),
      providerNet: getCustomFieldValue(matter, MATTER_CF.PROVIDER_NET),
      providerPrincipalNet: getCustomFieldValue(matter, MATTER_CF.PROVIDER_PRINCIPAL_NET),
      providerInterestNet: getCustomFieldValue(matter, MATTER_CF.PROVIDER_INTEREST_NET),
      overdueDays: getCustomFieldValue(matter, MATTER_CF.OVERDUE_DAYS),
paymentVoluntary: getCustomFieldValue(
        matter,
        MATTER_CF.PAYMENT_VOLUNTARY
      ),

      balancePresuit: getCustomFieldValue(
        matter,
        MATTER_CF.BALANCE_PRESUIT
      ),

      masterLawsuitId: getCustomFieldValue(
        matter,
        MATTER_CF.MASTER_LAWSUIT_ID
      ),

      lawsuitMatters: getCustomFieldValue(
        matter,
        MATTER_CF.LAWSUIT_MATTERS
      ),

      patient: {
        id: patientId,
        name: patientName,
      },

      insurer: {
        id: insurerId,
        name: insurerName,
      },

      client: {
        id: matter?.client?.id ?? null,
        name: matter?.client?.name ?? null,
      },
    };

    return NextResponse.json({
      ok: true,
      matter: normalized,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
        stack: error?.stack || null,
      },
      { status: 500 }
    );
  }
}
