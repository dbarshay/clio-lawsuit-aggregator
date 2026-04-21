const CLIO_API_BASE = process.env.CLIO_API_BASE;

export async function clioFetch(
  path: string,
  options: RequestInit = {}
) {
  const url = `${CLIO_API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.CLIO_ACCESS_TOKEN}`,
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  return res;
}