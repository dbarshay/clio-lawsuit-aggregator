import { NextRequest, NextResponse } from "next/server";
import { createMatterAuditLogEntry } from "@/lib/auditLog";
import { prisma } from "@/lib/prisma";
import {
  cleanReferenceText,
  findReferenceEntityById,
  normalizeReferenceText,
} from "@/lib/referenceData";

export const runtime = "nodejs";

function safetyLocalReferenceData() {
  return {
    localBarshMattersReferenceData: true,
    clioData: false,
    noClioRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    hardDeleteSupported: false,
  };
}

function actorFromBody(body: any) {
  return {
    actorName: cleanReferenceText(body?.actorName) || "Barsh Matters User",
    actorEmail: cleanReferenceText(body?.actorEmail) || null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entityId = cleanReferenceText(body?.entityId);
    const alias = cleanReferenceText(body?.alias);
    const normalizedAlias = normalizeReferenceText(alias);

    if (!entityId) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-alias-create",
          error: "Reference entity id is required.",
          safety: safetyLocalReferenceData(),
        },
        { status: 400 }
      );
    }

    if (!alias) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-alias-create",
          error: "Alias is required.",
          safety: safetyLocalReferenceData(),
        },
        { status: 400 }
      );
    }

    const entity = await findReferenceEntityById(entityId);
    if (!entity) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-alias-create",
          error: "Reference entity not found.",
          safety: safetyLocalReferenceData(),
        },
        { status: 404 }
      );
    }

    const row = await prisma.referenceAlias.create({
      data: {
        entityId,
        alias,
        normalizedAlias,
      },
    });

    const actor = actorFromBody(body);
    await createMatterAuditLogEntry({
      action: "reference_alias_created",
      summary: `Added alias "${alias}" to ${entity.type} reference record: ${entity.displayName}`,
      entityType: "reference_alias",
      fieldName: "alias",
      priorValue: null,
      newValue: { id: row.id, entityId, alias, normalizedAlias },
      details: {
        localReferenceData: true,
        clioData: false,
        entity: {
          id: entity.id,
          type: entity.type,
          displayName: entity.displayName,
        },
      },
      sourcePage: "admin-reference-data",
      workflow: "reference-data",
      actorName: actor.actorName,
      actorEmail: actor.actorEmail,
    });

    return NextResponse.json({
      ok: true,
      action: "reference-alias-create",
      alias: row,
      safety: {
        ...safetyLocalReferenceData(),
        databaseRecordsChanged: true,
      },
    });
  } catch (err: any) {
    const status = err?.code === "P2002" ? 409 : 500;
    return NextResponse.json(
      {
        ok: false,
        action: "reference-alias-create",
        error:
          err?.code === "P2002"
            ? "This alias already exists for the selected reference record."
            : err?.message || "Unknown reference alias create error.",
        safety: safetyLocalReferenceData(),
      },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = cleanReferenceText(body?.id);
    const alias = cleanReferenceText(body?.alias);
    const normalizedAlias = normalizeReferenceText(alias);

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-alias-update",
          error: "Reference alias id is required.",
          safety: safetyLocalReferenceData(),
        },
        { status: 400 }
      );
    }

    if (!alias) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-alias-update",
          error: "Alias cannot be blank.",
          safety: safetyLocalReferenceData(),
        },
        { status: 400 }
      );
    }

    const prior = await prisma.referenceAlias.findUnique({
      where: { id },
      include: { entity: true },
    });

    if (!prior) {
      return NextResponse.json(
        {
          ok: false,
          action: "reference-alias-update",
          error: "Reference alias not found.",
          safety: safetyLocalReferenceData(),
        },
        { status: 404 }
      );
    }

    const row = await prisma.referenceAlias.update({
      where: { id },
      data: {
        alias,
        normalizedAlias,
      },
    });

    const actor = actorFromBody(body);
    await createMatterAuditLogEntry({
      action: "reference_alias_updated",
      summary: `Updated alias for ${prior.entity.type} reference record: ${prior.entity.displayName}`,
      entityType: "reference_alias",
      fieldName: "alias",
      priorValue: {
        id: prior.id,
        entityId: prior.entityId,
        alias: prior.alias,
        normalizedAlias: prior.normalizedAlias,
      },
      newValue: {
        id: row.id,
        entityId: row.entityId,
        alias: row.alias,
        normalizedAlias: row.normalizedAlias,
      },
      details: {
        localReferenceData: true,
        clioData: false,
        entity: {
          id: prior.entity.id,
          type: prior.entity.type,
          displayName: prior.entity.displayName,
        },
      },
      sourcePage: "admin-reference-data",
      workflow: "reference-data",
      actorName: actor.actorName,
      actorEmail: actor.actorEmail,
    });

    return NextResponse.json({
      ok: true,
      action: "reference-alias-update",
      alias: row,
      safety: {
        ...safetyLocalReferenceData(),
        databaseRecordsChanged: true,
        hardDeletePerformed: false,
      },
    });
  } catch (err: any) {
    const status = err?.code === "P2002" ? 409 : 500;
    return NextResponse.json(
      {
        ok: false,
        action: "reference-alias-update",
        error:
          err?.code === "P2002"
            ? "This alias already exists for the selected reference record."
            : err?.message || "Unknown reference alias update error.",
        safety: safetyLocalReferenceData(),
      },
      { status }
    );
  }
}
