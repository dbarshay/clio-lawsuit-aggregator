import { prisma } from "@/lib/prisma";

type StoredClioToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
};

let refreshInFlight: Promise<StoredClioToken> | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function isFresh(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() > Date.now() + 90_000;
}

export async function getStoredClioToken(): Promise<StoredClioToken> {
  const dbToken = await prisma.clioToken.findUnique({
    where: { id: "default" },
  });

  if (dbToken?.accessToken && dbToken?.refreshToken) {
    return {
      accessToken: dbToken.accessToken,
      refreshToken: dbToken.refreshToken,
      expiresAt: dbToken.expiresAt,
    };
  }

  const accessToken = requiredEnv("CLIO_ACCESS_TOKEN");
  const refreshToken = requiredEnv("CLIO_REFRESH_TOKEN");

  return {
    accessToken,
    refreshToken,
    expiresAt: null,
  };
}

export async function saveClioToken(token: StoredClioToken): Promise<StoredClioToken> {
  const saved = await prisma.clioToken.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
    },
    update: {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
    },
  });

  return {
    accessToken: saved.accessToken,
    refreshToken: saved.refreshToken,
    expiresAt: saved.expiresAt,
  };
}

async function refreshClioTokenNow(): Promise<StoredClioToken> {
  const current = await getStoredClioToken();

  const body = new URLSearchParams({
    client_id: requiredEnv("CLIO_CLIENT_ID"),
    client_secret: requiredEnv("CLIO_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: current.refreshToken,
  });

  const res = await fetch("https://app.clio.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      `Clio token refresh failed: ${res.status} ${JSON.stringify(json)}`
    );
  }

  const accessToken = json?.access_token;
  const refreshToken = json?.refresh_token || current.refreshToken;
  const expiresIn = Number(json?.expires_in || 0);

  if (!accessToken) {
    throw new Error(`Clio token refresh returned no access_token: ${JSON.stringify(json)}`);
  }

  return saveClioToken({
    accessToken,
    refreshToken,
    expiresAt: expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null,
  });
}

export async function refreshClioToken(): Promise<StoredClioToken> {
  if (!refreshInFlight) {
    refreshInFlight = refreshClioTokenNow().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function getValidClioAccessToken(): Promise<string> {
  const current = await getStoredClioToken();

  if (isFresh(current.expiresAt)) {
    return current.accessToken;
  }

  const refreshed = await refreshClioToken();
  return refreshed.accessToken;
}
