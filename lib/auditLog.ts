import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type JsonLike = Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null | undefined;

export type MatterAuditLogInput = {
  action: string;
  summary: string;
  entityType: string;
  fieldName?: string | null;

  priorValue?: JsonLike;
  newValue?: JsonLike;
  details?: JsonLike;
  affectedMatterIds?: JsonLike;

  matterId?: number | string | null;
  matterDisplayNumber?: string | null;
  masterMatterId?: number | string | null;
  masterMatterDisplayNumber?: string | null;
  masterLawsuitId?: string | null;

  sourcePage?: string | null;
  workflow?: string | null;

  actorName?: string | null;
  actorEmail?: string | null;
};

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned || null;
}

function cleanPositiveNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function jsonOrUndefined(value: JsonLike): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value;
}

export async function createMatterAuditLogEntry(input: MatterAuditLogInput) {
  const action = cleanString(input.action);
  const summary = cleanString(input.summary);
  const entityType = cleanString(input.entityType);

  if (!action) {
    throw new Error("Audit action is required.");
  }

  if (!summary) {
    throw new Error("Audit summary is required.");
  }

  if (!entityType) {
    throw new Error("Audit entityType is required.");
  }

  return prisma.auditLog.create({
    data: {
      action,
      summary,
      entityType,
      fieldName: cleanString(input.fieldName),

      priorValue: jsonOrUndefined(input.priorValue),
      newValue: jsonOrUndefined(input.newValue),
      details: jsonOrUndefined(input.details),
      affectedMatterIds: jsonOrUndefined(input.affectedMatterIds),

      matterId: cleanPositiveNumber(input.matterId),
      matterDisplayNumber: cleanString(input.matterDisplayNumber),
      masterMatterId: cleanPositiveNumber(input.masterMatterId),
      masterMatterDisplayNumber: cleanString(input.masterMatterDisplayNumber),
      masterLawsuitId: cleanString(input.masterLawsuitId),

      sourcePage: cleanString(input.sourcePage),
      workflow: cleanString(input.workflow),

      actorName: cleanString(input.actorName),
      actorEmail: cleanString(input.actorEmail),
    },
  });
}

export function buildAuditWhere(params: {
  matterId?: unknown;
  matterDisplayNumber?: unknown;
  masterMatterId?: unknown;
  masterMatterDisplayNumber?: unknown;
  masterLawsuitId?: unknown;
}) {
  const matterId = cleanPositiveNumber(params.matterId);
  const matterDisplayNumber = cleanString(params.matterDisplayNumber);
  const masterMatterId = cleanPositiveNumber(params.masterMatterId);
  const masterMatterDisplayNumber = cleanString(params.masterMatterDisplayNumber);
  const masterLawsuitId = cleanString(params.masterLawsuitId);

  const OR: Array<Record<string, string | number>> = [];

  if (matterId) OR.push({ matterId });
  if (matterDisplayNumber) OR.push({ matterDisplayNumber });
  if (masterMatterId) OR.push({ masterMatterId });
  if (masterMatterDisplayNumber) OR.push({ masterMatterDisplayNumber });
  if (masterLawsuitId) OR.push({ masterLawsuitId });

  return OR.length ? { OR } : {};
}
