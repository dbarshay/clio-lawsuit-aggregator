import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export const runtime = "nodejs";

const PROVIDER_PRINCIPAL_NF_CF = 22156490;
const PROVIDER_INTEREST_CF = 22156565;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function percent(value: unknown): number | null {
  const n = num(value);
  if (n === null) return null;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n * 100) / 100;
}

function safetyReadOnly() {
  return {
    readOnly: true,
    noClioRecordsChanged: true,
    noDatabaseRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
  };
}

async function readClioJson(path: string) {
  const res = await clioFetch(path, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await res.text();

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    text,
    json,
  };
}

function customFieldId(cfv: any): number | null {
  const raw = cfv?.custom_field?.id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function fieldName(cfv: any): string {
  return clean(cfv?.field_name);
}

function findContactCustomFieldValue(contact: any, fieldId: number, fallbackName: string) {
  const rows = Array.isArray(contact?.custom_field_values)
    ? contact.custom_field_values
    : [];

  const exact = rows.find((row: any) => customFieldId(row) === fieldId);
  if (exact) return exact;

  const targetName = fallbackName.toLowerCase();
  return rows.find((row: any) => fieldName(row).toLowerCase() === targetName) || null;
}

export async function GET(req: NextRequest) {
  try {
    const matterId = clean(req.nextUrl.searchParams.get("matterId"));

    if (!matterId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-provider-fee-defaults",
          error: "Missing matterId",
          safety: safetyReadOnly(),
        },
        { status: 400 }
      );
    }

    const matterFields = [
      "id",
      "display_number",
      "client{id,name,type}",
    ].join(",");

    const matterRead = await readClioJson(
      `/api/v4/matters/${encodeURIComponent(matterId)}.json?fields=${encodeURIComponent(matterFields)}`
    );

    if (!matterRead.ok) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-provider-fee-defaults",
          matterId,
          error: `Could not read matter ${matterId} from Clio: status ${matterRead.status}`,
          clioBody: matterRead.text,
          safety: safetyReadOnly(),
        },
        { status: 500 }
      );
    }

    const matter = matterRead.json?.data;
    const providerContactId = matter?.client?.id;

    if (!providerContactId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-provider-fee-defaults",
          matterId,
          matter: {
            id: matter?.id,
            displayNumber: matter?.display_number,
            client: matter?.client ?? null,
          },
          error: "Matter has no provider/client contact ID.",
          safety: safetyReadOnly(),
        },
        { status: 404 }
      );
    }

    const contactFields = [
      "id",
      "name",
      "type",
      "custom_field_values{id,field_name,value,custom_field}",
    ].join(",");

    const contactRead = await readClioJson(
      `/api/v4/contacts/${encodeURIComponent(String(providerContactId))}.json?fields=${encodeURIComponent(contactFields)}`
    );

    if (!contactRead.ok) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-provider-fee-defaults",
          matterId,
          matter: {
            id: matter?.id,
            displayNumber: matter?.display_number,
            client: matter?.client ?? null,
          },
          error: `Could not read provider contact ${providerContactId} from Clio: status ${contactRead.status}`,
          clioBody: contactRead.text,
          safety: safetyReadOnly(),
        },
        { status: 500 }
      );
    }

    const contact = contactRead.json?.data;
    const principalRow = findContactCustomFieldValue(
      contact,
      PROVIDER_PRINCIPAL_NF_CF,
      "Retainer Principal NF"
    );
    const interestRow = findContactCustomFieldValue(
      contact,
      PROVIDER_INTEREST_CF,
      "Retainer Interest"
    );

    const principalFeePercent = percent(principalRow?.value);
    const interestFeePercent = percent(interestRow?.value);

    const missingDefaults = [];
    if (principalFeePercent === null) missingDefaults.push("Retainer Principal NF");
    if (interestFeePercent === null) missingDefaults.push("Retainer Interest");

    return NextResponse.json({
      ok: true,
      action: "settlement-provider-fee-defaults",
      matterId,
      matter: {
        id: matter?.id,
        displayNumber: matter?.display_number,
        client: matter?.client ?? null,
      },
      providerContact: {
        id: contact?.id,
        name: contact?.name,
        type: contact?.type,
      },
      defaults: {
        principalFeePercent,
        interestFeePercent,
      },
      sourceFields: {
        principalFeePercent: principalRow
          ? {
              customFieldId: customFieldId(principalRow) ?? PROVIDER_PRINCIPAL_NF_CF,
              customFieldValueId: principalRow?.id ?? null,
              fieldName: fieldName(principalRow) || "Retainer Principal NF",
              value: principalRow?.value ?? null,
            }
          : null,
        interestFeePercent: interestRow
          ? {
              customFieldId: customFieldId(interestRow) ?? PROVIDER_INTEREST_CF,
              customFieldValueId: interestRow?.id ?? null,
              fieldName: fieldName(interestRow) || "Retainer Interest",
              value: interestRow?.value ?? null,
            }
          : null,
      },
      validation: {
        canApplyAnyDefault:
          principalFeePercent !== null || interestFeePercent !== null,
        canApplyPrincipalDefault: principalFeePercent !== null,
        canApplyInterestDefault: interestFeePercent !== null,
        missingDefaults,
      },
      safety: safetyReadOnly(),
      note:
        "Read-only provider fee defaults from the Clio provider/client contact.  No Clio records, database records, documents, or print queue records were changed.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-provider-fee-defaults",
        error: err?.message || "Could not load provider fee defaults.",
        safety: safetyReadOnly(),
      },
      { status: 500 }
    );
  }
}
