import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
    const state = crypto.randomBytes(24).toString("hex");

    const redirectUri =
      process.env.CLIO_REDIRECT_URI ||
      `${getBaseUrl(req)}/api/clio/oauth/callback`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: requiredEnv("CLIO_CLIENT_ID"),
      redirect_uri: redirectUri,
      state,
    });

    const res = NextResponse.redirect(
      `https://app.clio.com/oauth/authorize?${params.toString()}`
    );

    res.cookies.set("clio_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 10 * 60,
    });

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
