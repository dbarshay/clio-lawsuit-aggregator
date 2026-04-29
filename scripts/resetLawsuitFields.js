require("dotenv").config();

const CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";
const ACCESS_TOKEN = process.env.CLIO_ACCESS_TOKEN;

const MASTER_LAWSUIT_ID = 22294835;
const LAWSUIT_MATTERS = 22306250;

async function clioFetch(path, options = {}) {
  const res = await fetch(`${CLIO_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(json));
  }

  return json;
}

async function resetMatter(matterId) {
  const data = await clioFetch(`/matters/${matterId}.json?fields=custom_field_values`);

  const cfValues = data.data.custom_field_values;

  const masterField = cfValues.find(
    (cf) => cf.custom_field.id === MASTER_LAWSUIT_ID
  );

  const mattersField = cfValues.find(
    (cf) => cf.custom_field.id === LAWSUIT_MATTERS
  );

  if (!masterField || !mattersField) {
    throw new Error(`Missing fields on ${matterId}`);
  }

  await clioFetch(`/matters/${matterId}.json`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        custom_field_values: [
          { id: masterField.id, value: "" },
          { id: mattersField.id, value: "" },
        ],
      },
    }),
  });

  console.log(`Reset ${matterId}`);
}

async function main() {
  const matterIds = [1870311350, 1870482830];

  for (const id of matterIds) {
    await resetMatter(id);
  }
}

main().catch(console.error);
