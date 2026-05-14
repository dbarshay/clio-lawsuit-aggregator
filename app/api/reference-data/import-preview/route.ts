import { NextRequest, NextResponse } from "next/server";
import { buildReferenceImportPreview, safetyImportPreview } from "@/lib/referenceImport";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const preview = await buildReferenceImportPreview({
      type: body?.type,
      csvText: String(body?.csvText ?? ""),
      columnMappings: body?.columnMappings || {},
    });

    return NextResponse.json({
      ok: true,
      action: "reference-import-preview",
      ...preview,
      safety: safetyImportPreview(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "reference-import-preview",
        error: err?.message || "Unknown reference import preview error.",
        headers: err?.headers,
        mappings: err?.mappings,
        mappingSummary: err?.mappingSummary,
        safety: safetyImportPreview(),
      },
      { status: err?.headers ? 400 : 500 }
    );
  }
}
