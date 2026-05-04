import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

type CFV = {
  id: number | string;
  value: unknown;
  custom_field?: {
    id?: number | string;
  };
};

type ClioMatter = {
  id: number;
  etag?: string;
  display_number?: string;
  description?: string;
  custom_field_values?: CFV[];
};

export type SettlementWritebackFields = {
  SETTLED_AMOUNT: number;
  SETTLED_WITH: number;
  SETTLED_WITH_NAME?: string;
  ALLOCATED_SETTLEMENT: number;
  INTEREST_AMOUNT: number;
  PRINCIPAL_FEE: number;
  INTEREST_FEE: number;
  TOTAL_FEE: number;
  PROVIDER_NET: number;
  PROVIDER_PRINCIPAL_NET: number;
  PROVIDER_INTEREST_NET: number;
  OVERDUE_DAYS?: number;
};

export type SettlementWritebackRequest = {
  matterId: number;
  displayNumber?: string;
  fields: SettlementWritebackFields;
};

const LIVE_FIELDS = [
  "id",
  "etag",
  "display_number",
  "description",
  "status",
  "custom_field_values{id,value,custom_field}",
].join(",");

const REQUIRED_SETTLEMENT_FIELDS: Array<{
  key: keyof SettlementWritebackFields;
  fieldId: number;
}> = [
  { key: "SETTLED_AMOUNT", fieldId: MATTER_CF.SETTLED_AMOUNT },
  { key: "SETTLED_WITH", fieldId: MATTER_CF.SETTLED_WITH },
  { key: "ALLOCATED_SETTLEMENT", fieldId: MATTER_CF.ALLOCATED_SETTLEMENT },
  { key: "INTEREST_AMOUNT", fieldId: MATTER_CF.INTEREST_AMOUNT },
  { key: "PRINCIPAL_FEE", fieldId: MATTER_CF.PRINCIPAL_FEE },
  { key: "INTEREST_FEE", fieldId: MATTER_CF.INTEREST_FEE },
  { key: "TOTAL_FEE", fieldId: MATTER_CF.TOTAL_FEE },
  { key: "PROVIDER_NET", fieldId: MATTER_CF.PROVIDER_NET },
  { key: "PROVIDER_PRINCIPAL_NET", fieldId: MATTER_CF.PROVIDER_PRINCIPAL_NET },
  { key: "PROVIDER_INTEREST_NET", fieldId: MATTER_CF.PROVIDER_INTEREST_NET },
];

const OPTIONAL_SETTLEMENT_FIELDS: Array<{
  key: keyof SettlementWritebackFields;
  fieldId: number;
}> = [
  { key: "OVERDUE_DAYS", fieldId: MATTER_CF.OVERDUE_DAYS },
];

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function money(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function isMasterMatter(matter: ClioMatter): boolean {
  return text(matter.description).toUpperCase().startsWith("MASTER LAWSUIT");
}

function cfId(cfv: CFV): number | null {
  const raw = cfv?.custom_field?.id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function findCFV(matter: ClioMatter, fieldId: number): CFV | undefined {
  return matter.custom_field_values?.find((cfv) => cfId(cfv) === Number(fieldId));
}

type ContactValidation = {
  ok: boolean;
  id: number | null;
  name: string | null;
  type: string | null;
  error?: string;
};

function isPersonContactType(type: unknown): boolean {
  return text(type).toLowerCase() === "person";
}

async function readClioContact(contactId: unknown): Promise<ContactValidation> {
  const id = Number(contactId);

  if (!Number.isFinite(id) || id <= 0) {
    return {
      ok: false,
      id: null,
      name: null,
      type: null,
      error: "SETTLED_WITH must be a valid Clio person contact ID.",
    };
  }

  const res = await clioFetch(
    `/api/v4/contacts/${id}.json?fields=${encodeURIComponent("id,name,type")}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const body = await res.text();

  if (!res.ok) {
    return {
      ok: false,
      id,
      name: null,
      type: null,
      error: `Could not read SETTLED_WITH contact ${id} from Clio: status ${res.status}; body ${body}`,
    };
  }

  const contact = body ? JSON.parse(body)?.data : null;
  const contactType = text(contact?.type);

  if (!isPersonContactType(contactType)) {
    return {
      ok: false,
      id,
      name: text(contact?.name) || null,
      type: contactType || null,
      error: `SETTLED_WITH must be a Person contact. Selected contact ${text(contact?.name) || id} is type ${contactType || "unknown"}.`,
    };
  }

  return {
    ok: true,
    id,
    name: text(contact?.name) || String(id),
    type: contactType,
  };
}

async function readMatterLive(matterId: number): Promise<ClioMatter> {
  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(LIVE_FIELDS)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `Failed to read matter ${matterId} from Clio: status ${res.status}; body ${body}`
    );
  }

  const matter = body ? JSON.parse(body)?.data : null;

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} was not returned by Clio.`);
  }

  return matter;
}

function buildSettlementCustomFieldPayload(params: {
  matter: ClioMatter;
  requested: SettlementWritebackRequest;
}) {
  const missingRequiredFields: Array<{ key: string; fieldId: number }> = [];
  const foundFieldValueIds: Record<string, number | string> = {};
  const payload: Array<{
    id: number | string;
    custom_field: { id: number };
    value: string | number;
  }> = [];

  for (const item of REQUIRED_SETTLEMENT_FIELDS) {
    const cfv = findCFV(params.matter, item.fieldId);

    if (!cfv?.id) {
      missingRequiredFields.push({
        key: item.key,
        fieldId: item.fieldId,
      });
      continue;
    }

    foundFieldValueIds[item.key] = cfv.id;

    const rawValue = params.requested.fields[item.key];
    const value =
      item.key === "SETTLED_WITH"
        ? Number(rawValue)
        : money(rawValue);

    if (
      item.key === "SETTLED_WITH" &&
      (!Number.isFinite(Number(rawValue)) || Number(rawValue) <= 0)
    ) {
      missingRequiredFields.push({
        key: item.key,
        fieldId: item.fieldId,
      });
      continue;
    }

    payload.push({
      id: cfv.id,
      custom_field: { id: item.fieldId },
      value,
    });
  }

  for (const item of OPTIONAL_SETTLEMENT_FIELDS) {
    const rawValue = params.requested.fields[item.key];

    if (rawValue === undefined || rawValue === null || rawValue === "") continue;

    const cfv = findCFV(params.matter, item.fieldId);

    if (!cfv?.id) {
      continue;
    }

    foundFieldValueIds[item.key] = cfv.id;

    payload.push({
      id: cfv.id,
      custom_field: { id: item.fieldId },
      value: money(rawValue),
    });
  }

  return {
    payload,
    missingRequiredFields,
    foundFieldValueIds,
  };
}

export async function previewSettlementWritebackToClio(params: {
  request: SettlementWritebackRequest;
}) {
  const matterId = Number(params.request.matterId);

  if (!Number.isFinite(matterId) || matterId <= 0) {
    throw new Error("Invalid matterId for settlement writeback preview.");
  }

  const matter = await readMatterLive(matterId);
  const payloadPlan = buildSettlementCustomFieldPayload({
    matter,
    requested: params.request,
  });

  const settledWithContact = await readClioContact(params.request.fields.SETTLED_WITH);
  const invalidContactFields = settledWithContact.ok
    ? []
    : [
        {
          key: "SETTLED_WITH",
          fieldId: MATTER_CF.SETTLED_WITH,
          contact: settledWithContact,
        },
      ];

  return {
    ok:
      payloadPlan.missingRequiredFields.length === 0 &&
      invalidContactFields.length === 0 &&
      !isMasterMatter(matter),
    action: "settlement-writeback-preview",
    dryRun: true,
    matterId,
    displayNumber: matter.display_number || params.request.displayNumber || String(matterId),
    isMasterMatter: isMasterMatter(matter),
    missingRequiredFields: payloadPlan.missingRequiredFields,
    invalidContactFields,
    settledWithContact,
    foundFieldValueIds: payloadPlan.foundFieldValueIds,
    plannedCustomFieldValues: payloadPlan.payload,
    safety: {
      noClioRecordsChanged: true,
      noDatabaseRecordsChanged: true,
      noDocumentsGenerated: true,
      noPrintQueueRecordsChanged: true,
      noPersistentFilesCreated: true,
    },
  };
}

export async function writeSettlementToClioMatter(params: {
  request: SettlementWritebackRequest;
  confirmWrite: boolean;
}) {
  const matterId = Number(params.request.matterId);

  if (!Number.isFinite(matterId) || matterId <= 0) {
    throw new Error("Invalid matterId for settlement writeback.");
  }

  if (!params.confirmWrite) {
    return {
      ok: false,
      action: "settlement-writeback",
      dryRun: false,
      matterId,
      error: "Settlement writeback requires confirmWrite: true.",
      safety: {
        noClioRecordsChanged: true,
        noDatabaseRecordsChanged: true,
      },
    };
  }

  const matter = await readMatterLive(matterId);

  if (isMasterMatter(matter)) {
    throw new Error(
      `Settlement financial writeback is blocked for master matter ${matter.display_number || matterId}.`
    );
  }

  if (!matter.etag) {
    throw new Error(
      `Matter ${matter.display_number || matterId} is missing an ETag and cannot be safely updated.`
    );
  }

  const payloadPlan = buildSettlementCustomFieldPayload({
    matter,
    requested: params.request,
  });

  if (payloadPlan.missingRequiredFields.length > 0) {
    throw new Error(
      `Matter ${matter.display_number || matterId} is missing required settlement custom field value record(s): ${payloadPlan.missingRequiredFields
        .map((field) => `${field.key} (${field.fieldId})`)
        .join(", ")}`
    );
  }

  const res = await clioFetch(`/api/v4/matters/${matterId}.json`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "If-Match": matter.etag,
    },
    body: JSON.stringify({
      data: {
        custom_field_values: payloadPlan.payload,
      },
    }),
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `Failed to write settlement fields to Clio matter ${matter.display_number || matterId}: status ${res.status}; body ${body}`
    );
  }

  const updatedMatter = await readMatterLive(matterId);
  await upsertClaimIndexFromMatter(updatedMatter);

  return {
    ok: true,
    action: "settlement-writeback",
    matterId,
    displayNumber: updatedMatter.display_number || matter.display_number || String(matterId),
    wroteCustomFieldValueIds: payloadPlan.foundFieldValueIds,
    customFieldCount: payloadPlan.payload.length,
    claimIndexRefreshed: true,
    safety: {
      clioRecordsChanged: true,
      databaseClaimIndexRefreshed: true,
      noDocumentsGenerated: true,
      noPrintQueueRecordsChanged: true,
      noPersistentFilesCreated: true,
    },
  };
}
