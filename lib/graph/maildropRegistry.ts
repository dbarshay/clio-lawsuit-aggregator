import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function lowerEmail(value: unknown): string {
  return clean(value).toLowerCase();
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export type MaildropRegistryInput = {
  source?: string | null;
  matterId?: number | string | null;
  matterDisplayNumber?: string | null;
  masterLawsuitId?: string | null;
  clioMatterId?: number | string | null;
  clioDisplayNumber?: string | null;
  clioMaildropEmail?: string | null;
  clioMaildropLabel?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function upsertMaildropAddress(input: MaildropRegistryInput) {
  const clioMaildropEmail = lowerEmail(input.clioMaildropEmail);
  if (!clioMaildropEmail) return null;

  const data = {
    source: clean(input.source) || "local_registry",
    matterId: numberOrNull(input.matterId),
    matterDisplayNumber: clean(input.matterDisplayNumber) || null,
    masterLawsuitId: clean(input.masterLawsuitId) || null,
    clioMatterId: numberOrNull(input.clioMatterId),
    clioDisplayNumber: clean(input.clioDisplayNumber) || null,
    clioMaildropEmail,
    clioMaildropLabel: clean(input.clioMaildropLabel) || null,
    active: true,
    lastResolvedAt: new Date(),
    metadata: (input.metadata || {}) as Prisma.InputJsonObject,
  };

  return prisma.maildropAddress.upsert({
    where: { clioMaildropEmail },
    create: data,
    update: {
      source: data.source,
      matterId: data.matterId,
      matterDisplayNumber: data.matterDisplayNumber,
      masterLawsuitId: data.masterLawsuitId,
      clioMatterId: data.clioMatterId,
      clioDisplayNumber: data.clioDisplayNumber,
      clioMaildropLabel: data.clioMaildropLabel,
      active: true,
      lastResolvedAt: data.lastResolvedAt,
      metadata: data.metadata,
    },
  });
}

export async function loadKnownMaildropAddresses(limit: number) {
  const registryRows = await prisma.maildropAddress.findMany({
    where: {
      active: true,
      clioMaildropEmail: { not: "" },
    },
    orderBy: [{ lastResolvedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      source: true,
      matterId: true,
      matterDisplayNumber: true,
      masterLawsuitId: true,
      clioMatterId: true,
      clioDisplayNumber: true,
      clioMaildropEmail: true,
      clioMaildropLabel: true,
      lastResolvedAt: true,
      updatedAt: true,
    },
  });

  const byEmail = new Map<string, any>();

  for (const row of registryRows) {
    const email = lowerEmail(row.clioMaildropEmail);
    if (!email || byEmail.has(email)) continue;
    byEmail.set(email, row);
  }

  if (byEmail.size >= limit) return Array.from(byEmail.values()).slice(0, limit);

  const threadRows = await prisma.emailThread.findMany({
    where: {
      provider: "microsoft_graph",
      clioMaildropEmail: { not: null },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      source: true,
      matterId: true,
      matterDisplayNumber: true,
      masterLawsuitId: true,
      clioMatterId: true,
      clioDisplayNumber: true,
      clioMaildropEmail: true,
      clioMaildropLabel: true,
      updatedAt: true,
    },
  });

  for (const row of threadRows) {
    const email = lowerEmail(row.clioMaildropEmail);
    if (!email || byEmail.has(email)) continue;
    byEmail.set(email, {
      ...row,
      source: clean(row.source) || "email_thread_fallback",
      lastResolvedAt: row.updatedAt,
    });
  }

  return Array.from(byEmail.values()).slice(0, limit);
}
