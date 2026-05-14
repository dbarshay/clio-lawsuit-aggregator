import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMatterAuditLogEntry } from "@/lib/auditLog";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function numberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function jsonSafe(value: unknown): any {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function safety() {
  return {
    action: "matter-local-field",
    localBarshMattersMatterField: true,
    clioData: false,
    noClioRecordsChanged: true,
    noClioCustomFieldsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    hardDeleteSupported: false,
    auditLogged: true,
  };
}

const ALLOWED_FIELDS = new Set(["treating_provider"]);

function validateFieldName(value: unknown): string {
  const fieldName = clean(value).toLowerCase();
  if (!ALLOWED_FIELDS.has(fieldName)) {
    throw new Error(`Unsupported local matter field: ${fieldName || "(blank)"}`);
  }
  return fieldName;
}

async function verifyReferenceValue(fieldName: string, fieldValueId: string, fieldValue: string) {
  if (fieldName !== "treating_provider") {
    return { id: fieldValueId || "", displayName: fieldValue || "" };
  }

  if (!fieldValueId && !fieldValue) {
    return { id: "", displayName: "" };
  }

  if (fieldValueId) {
    const row = await prisma.referenceEntity.findFirst({
      where: {
        id: fieldValueId,
        type: "treating_provider",
        active: true,
      },
      select: {
        id: true,
        displayName: true,
        type: true,
        active: true,
      },
    });

    if (!row) {
      throw new Error("Selected Treating Provider was not found in active local reference data.");
    }

    return { id: row.id, displayName: row.displayName };
  }

  const row = await prisma.referenceEntity.findFirst({
    where: {
      type: "treating_provider",
      active: true,
      normalizedName: fieldValue.toLowerCase().replace(/[’']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(),
    },
    select: {
      id: true,
      displayName: true,
      type: true,
      active: true,
    },
  });

  if (!row) {
    throw new Error("Treating Provider value must match an active local reference-data record.");
  }

  return { id: row.id, displayName: row.displayName };
}

export async function GET(req: NextRequest) {
  try {
    const matterId = numberOrNull(req.nextUrl.searchParams.get("matterId"));
    const fieldName = validateFieldName(req.nextUrl.searchParams.get("fieldName"));

    if (!matterId) {
      return NextResponse.json(
        {
          ok: false,
          action: "matter-local-field-read",
          error: "matterId is required.",
          safety: safety(),
        },
        { status: 400 }
      );
    }

    const row = await prisma.matterLocalField.findUnique({
      where: {
        matterId_fieldName: {
          matterId,
          fieldName,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      action: "matter-local-field-read",
      field: row,
      safety: safety(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "matter-local-field-read",
        error: err?.message || "Could not read local matter field.",
        safety: safety(),
      },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const matterId = numberOrNull(body?.matterId);
    const matterDisplayNumber = clean(body?.matterDisplayNumber);
    const fieldName = validateFieldName(body?.fieldName);
    const requestedFieldValueId = clean(body?.fieldValueId);
    const requestedFieldValue = clean(body?.fieldValue);
    const actorName = clean(body?.actorName) || "Barsh Matters User";
    const actorEmail = clean(body?.actorEmail);

    if (!matterId) {
      return NextResponse.json(
        {
          ok: false,
          action: "matter-local-field-update",
          error: "matterId is required.",
          safety: safety(),
        },
        { status: 400 }
      );
    }

    const verified = await verifyReferenceValue(fieldName, requestedFieldValueId, requestedFieldValue);

    const prior = await prisma.matterLocalField.findUnique({
      where: {
        matterId_fieldName: {
          matterId,
          fieldName,
        },
      },
    });

    const row = await prisma.matterLocalField.upsert({
      where: {
        matterId_fieldName: {
          matterId,
          fieldName,
        },
      },
      create: {
        matterId,
        matterDisplayNumber: matterDisplayNumber || null,
        fieldName,
        fieldValue: verified.displayName || null,
        fieldValueId: verified.id || null,
        details: jsonSafe({
          referenceType: fieldName === "treating_provider" ? "treating_provider" : null,
          selectedReferenceEntityId: verified.id || null,
        }),
      },
      update: {
        matterDisplayNumber: matterDisplayNumber || prior?.matterDisplayNumber || null,
        fieldValue: verified.displayName || null,
        fieldValueId: verified.id || null,
        details: jsonSafe({
          referenceType: fieldName === "treating_provider" ? "treating_provider" : null,
          selectedReferenceEntityId: verified.id || null,
        }),
      },
    });

    await createMatterAuditLogEntry({
      action: "matter_local_field_updated",
      summary: `Updated local ${fieldName.replace(/_/g, " ")} for ${matterDisplayNumber || `matter ${matterId}`}: ${verified.displayName || "—"}`,
      entityType: "matter_local_field",
      fieldName,
      priorValue: prior
        ? {
            fieldValue: prior.fieldValue,
            fieldValueId: prior.fieldValueId,
          }
        : null,
      newValue: {
        fieldValue: row.fieldValue,
        fieldValueId: row.fieldValueId,
      },
      details: {
        localBarshMattersMatterField: true,
        clioData: false,
        noClioRecordsChanged: true,
        source: "matter-local-field-route",
      },
      matterId,
      matterDisplayNumber: matterDisplayNumber || null,
      sourcePage: "direct-matter",
      workflow: "local-matter-fields",
      actorName,
      actorEmail: actorEmail || null,
    });

    return NextResponse.json({
      ok: true,
      action: "matter-local-field-update",
      field: row,
      prior,
      safety: safety(),
      message: "Local matter field updated.  No Clio records were changed.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "matter-local-field-update",
        error: err?.message || "Could not update local matter field.",
        safety: safety(),
      },
      { status: 400 }
    );
  }
}
