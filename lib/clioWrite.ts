import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";

type CFV = {
  id: number | string;
  value: any;
  custom_field: {
    id: number;
  };
};

type Matter = {
  id: number;
  etag: string;
  display_number: string;
  custom_field_values: CFV[];
};

async function readMatter(matterId: number): Promise<Matter> {
  const fields = encodeURIComponent(
    "id,etag,display_number,custom_field_values{id,value,custom_field}"
  );

  const res = await clioFetch(`/api/v4/matters/${matterId}.json?fields=${fields}`);

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Failed to read matter ${matterId}: ${text}`);
  }

  const json = text ? JSON.parse(text) : null;
  return json.data;
}

function findCFV(matter: Matter, fieldId: number): CFV | undefined {
  return matter.custom_field_values.find(
    (cfv) => Number(cfv?.custom_field?.id) === Number(fieldId)
  );
}

export async function preflightLawsuitMatter(matterId: number) {
  const matter = await readMatter(matterId);

  const existing = findCFV(matter, MATTER_CF.MASTER_LAWSUIT_ID);

  return {
    matter,
    existingMasterValue:
      existing?.value == null ? "" : String(existing.value).trim(),
    existingMasterId: existing?.id,
  };
}

export async function writeLawsuitFields(
  matterId: number,
  masterId: string,
  lawsuitMatters: string
) {
  const matter = await readMatter(matterId);

  const masterCFV = findCFV(matter, MATTER_CF.MASTER_LAWSUIT_ID);
  const mattersCFV = findCFV(matter, MATTER_CF.LAWSUIT_MATTERS);

  if (!masterCFV || !mattersCFV) {
    throw new Error("Required custom fields not found on matter");
  }

  const payload = [
    {
      id: masterCFV.id,
      value: masterId,
    },
    {
      id: mattersCFV.id,
      value: lawsuitMatters,
    },
  ];

  const res = await clioFetch(`/api/v4/matters/${matterId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "If-Match": matter.etag,
    },
    body: JSON.stringify({
      data: {
        custom_field_values: payload,
      },
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Write failed: ${text}`);
  }

  return { ok: true };
}

export async function clearLawsuitFields(matterId: number) {
  const matter = await readMatter(matterId);

  const masterCFV = findCFV(matter, MATTER_CF.MASTER_LAWSUIT_ID);
  const mattersCFV = findCFV(matter, MATTER_CF.LAWSUIT_MATTERS);

  if (!masterCFV || !mattersCFV) {
    throw new Error("Required custom fields not found on matter");
  }

  const payload = [
    {
      id: masterCFV.id,
      value: "",
    },
    {
      id: mattersCFV.id,
      value: "",
    },
  ];

  const res = await clioFetch(`/api/v4/matters/${matterId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "If-Match": matter.etag,
    },
    body: JSON.stringify({
      data: {
        custom_field_values: payload,
      },
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Clear failed: ${text}`);
  }

  return {
    matterId,
    displayNumber: matter.display_number || String(matterId),
    ok: true,
  };
}
