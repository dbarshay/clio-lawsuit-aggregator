export async function readMatterFromClio(matterId: number) {
  const url = `https://app.clio.com/api/v4/matters/${matterId}.json?fields=id,display_number,description,status,client,custom_field_values`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.CLIO_ACCESS_TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clio API ${res.status}: ${text}`);
  }

  const json = await res.json();

  return json?.data || null;
}
