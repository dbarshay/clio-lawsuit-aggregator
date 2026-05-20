import { NextRequest, NextResponse } from "next/server";
import {
  BarshDocumentTemplateCategory,
  templateRepositoryRecords,
} from "@/lib/documents/templateRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeCategory(value: string): BarshDocumentTemplateCategory | "all" {
  const v = clean(value);
  if (
    v === "settlement" ||
    v === "lawsuit" ||
    v === "direct_matter" ||
    v === "payment" ||
    v === "general"
  ) {
    return v;
  }
  return "all";
}

function safetyDocumentTemplateRepository() {
  return {
    action: "document-template-repository-preview",
    localFirst: true,
    sourceOfTruth: "barsh-matters-local-template-registry",
    dryRun: true,
    previewOnly: true,
    readOnly: true,
    clioRecordsChanged: false,
    databaseRecordsChanged: false,
    documentsGenerated: false,
    persistentFilesCreated: false,
    printQueueChanged: false,
    emailsSent: false,
    templatesEdited: false,
    templateRepositoryWrites: false,
  };
}

export async function GET(req: NextRequest) {
  try {
    const category = normalizeCategory(req.nextUrl.searchParams.get("category") || "all");
    const templates = templateRepositoryRecords(category);

    return NextResponse.json({
      ok: true,
      action: "document-template-repository-preview",
      localFirst: true,
      sourceOfTruth: "barsh-matters-local-template-registry",
      repositoryMode: "code-registry-foundation",
      repositoryFuture: "database-backed editable document-template repository with versioning and merge fields",
      category,
      count: templates.length,
      templates,
      safety: safetyDocumentTemplateRepository(),
      note:
        "Read-only document-template repository foundation.  This route exposes seeded template definitions and merge-field metadata only.  It does not edit templates, generate documents, upload to Clio, create drafts, send email, print, or queue documents.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "document-template-repository-preview",
        localFirst: true,
        sourceOfTruth: "barsh-matters-local-template-registry",
        error: error?.message || "Document template repository preview failed.",
        safety: safetyDocumentTemplateRepository(),
      },
      { status: 500 }
    );
  }
}
