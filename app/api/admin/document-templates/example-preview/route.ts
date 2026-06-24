import { NextRequest, NextResponse } from "next/server";
import { resolveTemplateBuilderExamplePreview } from "@/src/lib/templates/template-builder-live-example-preview";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const matter = request.nextUrl.searchParams.get("matter")?.trim();
  if (!matter) {
    return NextResponse.json({ error: "Missing matter parameter" }, { status: 400 });
  }

  const result = await resolveTemplateBuilderExamplePreview(matter);
  return NextResponse.json(result);
}
