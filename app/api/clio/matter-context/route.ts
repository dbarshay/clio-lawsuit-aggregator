import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";
import { getCustomFieldValue } from "@/lib/matterHelpers";

async function getContactName(contactId: number | string | null | undefined) {
  if (!contactId) return null;

  const res = await clioFetch(
    `/api/v4/contacts/${contactId}.json?fields=id,name`
  );

  if (!res.ok) {
    return null;
  }

  const json = await res.json();
  return json?.data?.name ?? null;
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
      "created_at",
      "updated_at",
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

    const [patientName, insurerName] = await Promise.all([
      getContactName(patientId),
      getContactName(insurerId),
    ]);

    const normalized = {
      id: matter.id,
      etag: matter.etag,
      displayNumber: matter.display_number,
      description: matter.description,
      status: matter.status,

      claimNumber: getCustomFieldValue(matter, MATTER_CF.CLAIM_NUMBER),
      billNumber: getCustomFieldValue(matter, MATTER_CF.BILL_NUMBER),
      claimAmount: getCustomFieldValue(matter, MATTER_CF.CLAIM_AMOUNT),
      dosStart: getCustomFieldValue(matter, MATTER_CF.DOS_START),
      dosEnd: getCustomFieldValue(matter, MATTER_CF.DOS_END),
      denialReason: getCustomFieldValue(matter, MATTER_CF.DENIAL_REASON),
      indexNumber: getCustomFieldValue(matter, MATTER_CF.INDEX_AAA_NUMBER),
      settledAmount: getCustomFieldValue(matter, MATTER_CF.SETTLED_AMOUNT),

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
      rawCustomFieldValues: matter.custom_field_values,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
