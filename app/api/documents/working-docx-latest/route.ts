import { NextRequest, NextResponse } from "next/server";
import { findLatestWorkingDocxInGraph } from "@/lib/documents/graphWorkingDocuments";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function searchPhraseForTemplate(templateKey: string, templateLabel: string): string {
  const key = clean(templateKey).toLowerCase();
  const label = clean(templateLabel);

  if (key === "bill-schedule" || label.toLowerCase().includes("bill schedule")) return "bill schedule";
  if (key === "packet-summary" || label.toLowerCase().includes("packet summary")) return "packet summary";
  if (key === "summons-complaint" || label.toLowerCase().includes("summons")) return "summons";
  return label || key;
}

export async function GET(req: NextRequest) {
  try {
    const templateKey = clean(req.nextUrl.searchParams.get("templateKey"));
    const templateLabel = clean(req.nextUrl.searchParams.get("templateLabel"));
    const filenameIncludes = searchPhraseForTemplate(templateKey, templateLabel);

    const result = await findLatestWorkingDocxInGraph({
      filenameIncludes,
      folder: "BarshMattersWorkingDocs",
    });

    return NextResponse.json({
      ok: Boolean(result.ok && result.found),
      action: "working-docx-latest",
      templateKey,
      templateLabel,
      filenameIncludes,
      workingDocument: result.ok && result.found ? result : null,
      found: Boolean(result.found),
      result,
      safety: {
        readOnly: true,
        graphFileCreated: false,
        clioRecordsChanged: false,
        databaseRecordsChanged: false,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "working-docx-latest",
        error: err?.message || "Could not find latest working DOCX.",
        safety: {
          readOnly: true,
          graphFileCreated: false,
          clioRecordsChanged: false,
          databaseRecordsChanged: false,
        },
      },
      { status: 500 }
    );
  }
}
