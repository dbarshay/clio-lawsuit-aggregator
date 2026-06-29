import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function safeObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, any>) } : {};
}

const VALID_ACTIONS = new Set(["make-active", "deactivate", "archive", "delete", "restore"]);

function nextStateFor(action: string) {
  if (action === "make-active") {
    return {
      enabled: true,
      versionStatus: "production-ready",
      metadataPatch: {
        archived: false,
        deleted: false,
        productionTemplateReady: true,
        finalProductionDocument: false,
        lifecycleStatus: "active",
      },
    };
  }

  if (action === "deactivate") {
    return {
      enabled: false,
      versionStatus: "draft",
      metadataPatch: {
        archived: false,
        deleted: false,
        productionTemplateReady: false,
        finalProductionDocument: false,
        lifecycleStatus: "inactive",
      },
    };
  }

  if (action === "archive") {
    return {
      enabled: false,
      versionStatus: "archived",
      metadataPatch: {
        archived: true,
        deleted: false,
        productionTemplateReady: false,
        finalProductionDocument: false,
        lifecycleStatus: "archived",
      },
    };
  }

  if (action === "delete") {
    return {
      enabled: false,
      versionStatus: "deleted",
      metadataPatch: {
        archived: false,
        deleted: true,
        productionTemplateReady: false,
        finalProductionDocument: false,
        lifecycleStatus: "deleted",
      },
    };
  }

  return {
    enabled: false,
    versionStatus: "draft",
    metadataPatch: {
      archived: false,
      deleted: false,
      productionTemplateReady: false,
      finalProductionDocument: false,
      lifecycleStatus: "inactive",
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const key = clean(body?.key);
    const action = clean(body?.action);

    if (!key) {
      return NextResponse.json({ ok: false, action: "document-template-lifecycle", error: "Missing template key." }, { status: 400 });
    }

    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ ok: false, action: "document-template-lifecycle", error: "Invalid lifecycle action." }, { status: 400 });
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { key },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!template) {
      return NextResponse.json({ ok: false, action: "document-template-lifecycle", error: "Template not found." }, { status: 404 });
    }

    const currentVersion = template.versions[0] || null;
    const nextState = nextStateFor(action);
    const priorMetadata = safeObject(template.metadata);
    const nextMetadata = {
      ...priorMetadata,
      ...nextState.metadataPatch,
      lastLifecycleAction: action,
      lastLifecycleActionAt: new Date().toISOString(),
      lifecycleWritesLocalOnly: true,
      clioWrites: false,
      documentsGenerated: false,
      printQueued: false,
      emailsSent: false,
      draftsCreated: false,
    };

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTemplate = await tx.documentTemplate.update({
        where: { id: template.id },
        data: {
          enabled: nextState.enabled,
          metadata: nextMetadata,
        },
      });

      let updatedVersion = currentVersion;
      if (currentVersion) {
        updatedVersion = await tx.documentTemplateVersion.update({
          where: { id: currentVersion.id },
          data: {
            status: nextState.versionStatus,
            contentJson: {
              ...safeObject(currentVersion.contentJson),
              productionTemplateReady: nextState.metadataPatch.productionTemplateReady,
              finalProductionDocument: false,
              lifecycleStatus: nextState.metadataPatch.lifecycleStatus,
              lastLifecycleAction: action,
              lastLifecycleActionAt: nextMetadata.lastLifecycleActionAt,
            },
          },
        });
      }

      return { updatedTemplate, updatedVersion };
    });

    return NextResponse.json({
      ok: true,
      action: "document-template-lifecycle",
      lifecycleAction: action,
      key,
      template: {
        id: updated.updatedTemplate.id,
        key: updated.updatedTemplate.key,
        label: updated.updatedTemplate.label,
        enabled: updated.updatedTemplate.enabled,
        metadata: updated.updatedTemplate.metadata,
        currentVersionId: updated.updatedTemplate.currentVersionId,
        currentVersion: updated.updatedVersion
          ? {
              id: updated.updatedVersion.id,
              versionNumber: updated.updatedVersion.versionNumber,
              status: updated.updatedVersion.status,
              storageKind: updated.updatedVersion.storageKind,
              mergeFieldSet: updated.updatedVersion.mergeFieldSet,
            }
          : null,
      },
      safety: {
        localFirst: true,
        templateRepositoryWrites: true,
        clioWrites: false,
        documentsGenerated: false,
        printQueued: false,
        emailsSent: false,
        draftsCreated: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "document-template-lifecycle",
        error: error?.message || "Template lifecycle update failed.",
      },
      { status: 500 }
    );
  }
}
