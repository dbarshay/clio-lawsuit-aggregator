import { getValidClioAccessToken, refreshClioToken } from "@/lib/clioTokenStore";
import { type ClioLimitCategory, runWithClioLimit } from "@/lib/clioLimiter";

const RAW_CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com";

function normalizedClioApiBase(): string {
  const base = RAW_CLIO_API_BASE.replace(/\/$/, "");
  return base.endsWith("/api/v4") ? base : `${base}/api/v4`;
}

function buildClioUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  let normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Legacy app code sometimes passes /api/v4/... while this helper already
  // appends /api/v4. Strip it here so both styles work safely.
  normalizedPath = normalizedPath.replace(/^\/api\/v4(?=\/)/, "");

  return `${normalizedClioApiBase()}${normalizedPath}`;
}

function mergeHeaders(token: string, existing?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...(existing || {}),
  };
}

function classifyClioPath(path: string): ClioLimitCategory {
  const normalized = path.toLowerCase();

  if (normalized.includes("/oauth/token")) return "token";

  if (
    normalized.includes("/matters.json?") ||
    normalized.includes("/matters?") ||
    normalized.includes("/matters.json")
  ) {
    return "search";
  }

  if (normalized.includes("/matters/")) return "matter";

  if (normalized.includes("/contacts/")) return "contact";

  return "default";
}

export async function clioFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const category = classifyClioPath(path);

  return runWithClioLimit(category, async () => {
    const url = buildClioUrl(path);

    const token = await getValidClioAccessToken();

    let res = await fetch(url, {
      ...options,
      headers: mergeHeaders(token, options.headers),
    });

    if (res.status !== 401) return res;

    const refreshed = await refreshClioToken();

    res = await fetch(url, {
      ...options,
      headers: mergeHeaders(refreshed.accessToken, options.headers),
    });

    return res;
  });
}
