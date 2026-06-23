import { NextResponse } from "next/server";
import { buildTemplateLayoutCompositionAdminReadinessPayload } from "../../../../../src/lib/templates/layout-composition-admin-readiness.mjs";
import { templateLayoutCompositionRegistrySource } from "../../../../../src/lib/templates/template-layout-composition-registry-source.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = buildTemplateLayoutCompositionAdminReadinessPayload(templateLayoutCompositionRegistrySource);
  return NextResponse.json({
    ok: payload.ok,
    status: payload.status,
    generatedAt: new Date(0).toISOString(),
    source: {
      kind: "fixture",
      label: "locked template registry source",
    },
    cards: payload.cards,
    sections: payload.sections,
    markdown: payload.markdown,
  });
}

export async function POST() {
  return NextResponse.json({ ok: false, error: "Method not allowed. This endpoint is read-only." }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ ok: false, error: "Method not allowed. This endpoint is read-only." }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ ok: false, error: "Method not allowed. This endpoint is read-only." }, { status: 405 });
}
