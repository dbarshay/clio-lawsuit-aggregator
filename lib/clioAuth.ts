const CLIO_API_BASE = process.env.CLIO_API_BASE!;
const CLIO_ACCESS_TOKEN = process.env.CLIO_ACCESS_TOKEN!;

if (!CLIO_API_BASE) {
  throw new Error("CLIO_API_BASE is not set");
}

if (!CLIO_ACCESS_TOKEN) {
  throw new Error("CLIO_ACCESS_TOKEN is not set");
}

export async function clioFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${CLIO_API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${CLIO_ACCESS_TOKEN}`,
      ...(options.headers || {}),
    },
  });

  return res;
}
