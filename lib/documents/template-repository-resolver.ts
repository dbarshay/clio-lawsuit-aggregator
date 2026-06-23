import { prisma } from "@/lib/prisma";

export type TemplateRepositoryKind = "generation_template" | "layout_asset";

export type TemplateRepositoryResolution = {
  ok: boolean;
  key: string;
  category: string;
  label: string;
  kind: TemplateRepositoryKind;
  enabled: boolean;
  selectableForNormalGeneration: boolean;
  layoutFamily?: string;
  layoutAssetKey?: string;
  currentVersionId: string;
  storageKind: string;
  bodyFormat: string;
  contentText: string;
  metadata: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function boolFromMetadata(metadata: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = metadata[key];
  return typeof value === "boolean" ? value : fallback;
}

function stringFromMetadata(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function templateKind(metadata: Record<string, unknown>): TemplateRepositoryKind {
  return metadata.templateKind === "layout_asset" || metadata.nonGenerationAsset === true ? "layout_asset" : "generation_template";
}

function selectableForNormalGeneration(enabled: boolean, metadata: Record<string, unknown>): boolean {
  if (templateKind(metadata) === "layout_asset") return false;
  return boolFromMetadata(metadata, "selectableForNormalGeneration", enabled);
}

export async function resolveGenerationTemplateFromRepository(params: {
  key: string;
  category?: string;
  includeDrafts?: boolean;
}): Promise<TemplateRepositoryResolution | null> {
  const key = params.key.trim();
  if (!key) return null;

  const template = await prisma.documentTemplate.findUnique({
    where: { key },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!template) return null;
  const metadata = asRecord(template.metadata);
  if (templateKind(metadata) !== "generation_template") return null;
  if (params.category && template.category !== params.category) return null;
  if (!params.includeDrafts && template.enabled !== true) return null;

  const version = template.versions?.[0];
  if (!version || version.storageKind !== "db-docx-base64" || !version.contentText) return null;

  return {
    ok: true,
    key: template.key,
    category: template.category,
    label: template.label,
    kind: "generation_template",
    enabled: template.enabled,
    selectableForNormalGeneration: selectableForNormalGeneration(template.enabled, metadata),
    layoutFamily: stringFromMetadata(metadata, "layoutFamily"),
    layoutAssetKey: stringFromMetadata(metadata, "layoutAssetKey"),
    currentVersionId: version.id,
    storageKind: version.storageKind,
    bodyFormat: version.bodyFormat,
    contentText: version.contentText,
    metadata,
  };
}

export async function resolveLayoutAssetFromRepository(layoutAssetKey: string): Promise<TemplateRepositoryResolution | null> {
  const key = layoutAssetKey.trim();
  if (!key) return null;

  const layout = await prisma.documentTemplate.findUnique({
    where: { key },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!layout) return null;
  const metadata = asRecord(layout.metadata);
  if (templateKind(metadata) !== "layout_asset") return null;

  const version = layout.versions?.[0];
  if (!version || version.storageKind !== "db-docx-base64" || !version.contentText) return null;

  return {
    ok: true,
    key: layout.key,
    category: layout.category,
    label: layout.label,
    kind: "layout_asset",
    enabled: layout.enabled,
    selectableForNormalGeneration: false,
    layoutFamily: stringFromMetadata(metadata, "layoutFamily"),
    layoutAssetKey: layout.key,
    currentVersionId: version.id,
    storageKind: version.storageKind,
    bodyFormat: version.bodyFormat,
    contentText: version.contentText,
    metadata,
  };
}

export async function listSelectableGenerationTemplatesFromRepository(category?: string) {
  const templates = await prisma.documentTemplate.findMany({
    where: {
      ...(category ? { category } : {}),
      enabled: true,
    },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    orderBy: [{ category: "asc" }, { label: "asc" }, { key: "asc" }],
  });

  return templates
    .map((template) => {
      const metadata = asRecord(template.metadata);
      const version = template.versions?.[0];
      if (templateKind(metadata) !== "generation_template") return null;
      if (!selectableForNormalGeneration(template.enabled, metadata)) return null;
      if (!version || version.storageKind !== "db-docx-base64" || !version.contentText) return null;
      return {
        ok: true,
        key: template.key,
        category: template.category,
        label: template.label,
        kind: "generation_template" as const,
        enabled: template.enabled,
        selectableForNormalGeneration: true,
        layoutFamily: stringFromMetadata(metadata, "layoutFamily"),
        layoutAssetKey: stringFromMetadata(metadata, "layoutAssetKey"),
        currentVersionId: version.id,
        storageKind: version.storageKind,
        bodyFormat: version.bodyFormat,
        contentText: version.contentText,
        metadata,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export async function resolveGenerationTemplateWithLayoutFromRepository(params: {
  key: string;
  category?: string;
  includeDrafts?: boolean;
}) {
  const template = await resolveGenerationTemplateFromRepository(params);
  if (!template) return null;

  const layoutAssetKey = template.layoutAssetKey || stringFromMetadata(template.metadata, "layoutAssetKey");
  const layout = layoutAssetKey ? await resolveLayoutAssetFromRepository(layoutAssetKey) : null;

  return {
    ok: true,
    template,
    layout,
    repositorySource: "barsh-matters-template-repository",
    codeRegistryFallbackUsed: false,
  };
}
