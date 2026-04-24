const CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com";
const CLIO_API_VERSION = process.env.CLIO_API_VERSION || "4.0.13";

let currentAccessToken = process.env.CLIO_ACCESS_TOKEN || "";
let currentRefreshToken = process.env.CLIO_REFRESH_TOKEN || "";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function normalizeHeaders(headers?: HeadersInit) {
  return new Headers(headers || {});
}

async function refreshClioAccessToken() {
  const clientId = requiredEnv("CLIO_CLIENT_ID");
  const clientSecret = requiredEnv("CLIO_CLIENT_SECRET");

  if (!currentRefreshToken) {
    currentRefreshToken = requiredEnv("CLIO_REFRESH_TOKEN");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: currentRefreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${CLIO_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Clio token refresh failed: ${res.status} ${text}`);
  }

  const data = JSON.parse(text);

  if (!data.access_token) {
    throw new Error(`Clio token refresh did not return access_token: ${text}`);
  }

  currentAccessToken = data.access_token;

  if (data.refresh_token) {
    currentRefreshToken = data.refresh_token;
  }

  return currentAccessToken;
}

export async function clioFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${CLIO_API_BASE}${path}`;

  if (!currentAccessToken) {
    currentAccessToken = requiredEnv("CLIO_ACCESS_TOKEN");
  }

  const headers = normalizeHeaders(options.headers);
  headers.set("Accept", headers.get("Accept") || "application/json");
  headers.set("Authorization", `Bearer ${currentAccessToken}`);
  headers.set("X-API-VERSION", headers.get("X-API-VERSION") || CLIO_API_VERSION);

  let res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status !== 401) {
    return res;
  }

  const refreshedToken = await refreshClioAccessToken();

  const retryHeaders = normalizeHeaders(options.headers);
  retryHeaders.set("Accept", retryHeaders.get("Accept") || "application/json");
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
  retryHeaders.set("X-API-VERSION", retryHeaders.get("X-API-VERSION") || CLIO_API_VERSION);

  res = await fetch(url, {
    ...options,
    headers: retryHeaders,
  });

  return res;
}
