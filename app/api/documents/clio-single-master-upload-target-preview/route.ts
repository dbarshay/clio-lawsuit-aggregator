import { NextRequest, NextResponse } from "next/server";
import { buildClioSingleMasterUploadTargetPreview } from "@/lib/clioSingleMasterUploadTargetPreview";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const bmMatterId =
      clean(req.nextUrl.searchParams.get("bmMatterId")) ||
      clean(req.nextUrl.searchParams.get("matterId")) ||
      clean(req.nextUrl.searchParams.get("directMatterId")) ||
      clean(req.nextUrl.searchParams.get("masterLawsuitId"));
    const displayNumber =
      clean(req.nextUrl.searchParams.get("displayNumber")) ||
      clean(req.nextUrl.searchParams.get("directMatterDisplayNumber"));
    const lawsuitId = clean(req.nextUrl.searchParams.get("lawsuitId")) || clean(req.nextUrl.searchParams.get("masterLawsuitId"));
    const label = clean(req.nextUrl.searchParams.get("label"));

    if (!bmMatterId && !displayNumber && !lawsuitId) {
      return NextResponse.json({
        ok: false,
        action: "clio-single-master-upload-target-preview",
        error: "Missing bmMatterId, matterId, displayNumber, directMatterDisplayNumber, lawsuitId, or masterLawsuitId.",
        safety: {
          previewOnly: true,
          uploadRewired: false,
          noExistingRoutesRewired: true,
          noClioCalls: true,
          noFolderCreation: true,
          noDocumentUploads: true,
          noDatabaseMutation: true,
        },
      }, { status: 400 });
    }

    const preview = buildClioSingleMasterUploadTargetPreview({
      bmMatterId: bmMatterId || displayNumber || lawsuitId,
      displayNumber,
      lawsuitId,
      label,
    });

    return NextResponse.json({
      ok: true,
      action: "clio-single-master-upload-target-preview",
      preview,
      safety: {
        previewOnly: true,
        uploadRewired: false,
        noExistingRoutesRewired: true,
        noClioCalls: true,
        noFolderCreation: true,
        noDocumentUploads: true,
        noDatabaseMutation: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      action: "clio-single-master-upload-target-preview",
      error: err?.message || "Could not build single-master upload target preview.",
      safety: {
        previewOnly: true,
        uploadRewired: false,
        noExistingRoutesRewired: true,
        noClioCalls: true,
        noFolderCreation: true,
        noDocumentUploads: true,
        noDatabaseMutation: true,
      },
    }, { status: 500 });
  }
}
