import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const disabledPayload = {
  ok: false,
  action: "legacy-clio-settlement-route-disabled",
  disabled: true,
  localFirst: true,
  sourceOfTruth: "barsh-matters-local",
  error:
    "This legacy Clio settlement operational route is disabled.  Settlement/payment/workflow data is now handled by Barsh Matters local-first settlement routes.  Clio remains available only for document storage/access and MailDrop/document-vault behavior.",
  replacementRoutes: [
    "/api/settlements/local-preview",
    "/api/settlements/local-record-preview",
    "/api/settlements/local-record",
  ],
  safety: {
    clioRecordsChanged: false,
    databaseRecordsChanged: false,
    documentsGenerated: false,
    printQueueChanged: false,
    mattersClosed: false,
    settlementWritebackPerformed: false,
  },
};

export async function GET() {
  return NextResponse.json(disabledPayload, { status: 410 });
}

export async function POST() {
  return NextResponse.json(disabledPayload, { status: 410 });
}
