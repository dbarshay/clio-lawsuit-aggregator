import { NextRequest, NextResponse } from "next/server";
import { getGraphAuthConfig, getGraphAuthReadiness } from "@/lib/graph/config";
import { requestMicrosoftGraphAppToken } from "@/lib/graph/token";

export const dynamic = "force-dynamic";

const REQUIRED_CONFIRMATION = "live-token-test";

export async function GET(req: NextRequest) {
  const config = getGraphAuthConfig();
  const readiness = getGraphAuthReadiness(config);
  const confirm = req.nextUrl.searchParams.get("confirm") || "";

  if (confirm !== REQUIRED_CONFIRMATION) {
    return NextResponse.json(
      {
        action: "graph-live-token-test",
        readOnly: true,
        previewOnly: true,
        graphCallsMade: false,
        tokenRequested: false,
        accessTokenReturned: false,
        createsOutlookDraft: false,
        sendsEmail: false,
        readsMailbox: false,
        syncsMailbox: false,
        clioRecordsChanged: false,
        databaseRecordsChanged: false,
        blocked: true,
        requiredConfirmation: REQUIRED_CONFIRMATION,
        readiness,
        note:
          "Fail-closed live token test.  Add ?confirm=live-token-test to explicitly request one Microsoft identity-platform token call.  The route never returns the access token.",
      },
      { status: 400 }
    );
  }

  if (!readiness.appOnlyTokenConfigReady) {
    return NextResponse.json(
      {
        action: "graph-live-token-test",
        readOnly: true,
        previewOnly: false,
        graphCallsMade: false,
        tokenRequested: false,
        accessTokenReturned: false,
        createsOutlookDraft: false,
        sendsEmail: false,
        readsMailbox: false,
        syncsMailbox: false,
        clioRecordsChanged: false,
        databaseRecordsChanged: false,
        blocked: true,
        readiness,
        error:
          "Microsoft Graph app-only token configuration is incomplete.  Configure tenant ID, client ID, and client secret before running a live token test.",
      },
      { status: 400 }
    );
  }

  const result = await requestMicrosoftGraphAppToken();

  return NextResponse.json(
    {
      action: "graph-live-token-test",
      readOnly: true,
      previewOnly: false,
      graphCallsMade: true,
      tokenRequested: true,
      accessTokenReturned: false,
      tokenReceived: Boolean(result.token?.accessToken),
      createsOutlookDraft: false,
      sendsEmail: false,
      readsMailbox: false,
      syncsMailbox: false,
      clioRecordsChanged: false,
      databaseRecordsChanged: false,
      readiness,
      result: {
        ok: result.ok,
        status: result.status,
        statusText: result.statusText,
        tokenType: result.token?.tokenType || null,
        expiresIn: result.token?.expiresIn || null,
        acquiredAt: result.token?.acquiredAt || null,
        error: result.error || null,
      },
      note:
        "Live Microsoft identity-platform token test completed.  The access token is intentionally omitted from this response.",
    },
    { status: result.ok ? 200 : 502 }
  );
}
