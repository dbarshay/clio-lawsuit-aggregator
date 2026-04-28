import { NextRequest, NextResponse } from "next/server";
import { saveClioToken } from "@/lib/clioTokenStore";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host");

  if (!host) throw new Error("Unable to determine host for OAuth redirect.");
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const expectedState = req.cookies.get("clio_oauth_state")?.value;

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Clio authorization failed: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Missing OAuth code from Clio." },
        { status: 400 }
      );
    }

    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.json(
        { ok: false, error: "Invalid OAuth state. Please restart Clio authorization." },
        { status: 400 }
      );
    }

    const redirectUri =
      process.env.CLIO_REDIRECT_URI ||
      `${getBaseUrl(req)}/api/clio/oauth/callback`;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: requiredEnv("CLIO_CLIENT_ID"),
      client_secret: requiredEnv("CLIO_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch("https://app.clio.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const json = await tokenRes.json().catch(() => null);

    if (!tokenRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Clio token exchange failed.",
          status: tokenRes.status,
          details: json,
        },
        { status: 400 }
      );
    }

    const accessToken = json?.access_token;
    const refreshToken = json?.refresh_token;
    const expiresIn = Number(json?.expires_in || 0);

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Clio token exchange did not return both access_token and refresh_token.",
          details: json,
        },
        { status: 400 }
      );
    }

    const saved = await saveClioToken({
      accessToken,
      refreshToken,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
    });

    const res = NextResponse.json({
      ok: true,
      message: "Clio authorization complete. Tokens saved.",
      expiresAt: saved.expiresAt,
    });

    res.cookies.delete("clio_oauth_state");

    return res;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
