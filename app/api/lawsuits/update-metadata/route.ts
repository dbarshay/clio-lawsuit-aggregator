import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";
import { prisma } from "@/lib/prisma";
import { upsertClaimIndexFromMatter } from "@/lib/claimIndexUpsert";

type CFV = {
  id: number | string;
  value: unknown;
  custom_field?: {
    id?: number | string;
  };
};

type ClioMatter = {
  id: number;
  etag?: string;
  display_number?: string;
  description?: string;
  custom_field_values?: CFV[];
};

const LIVE_FIELDS = [
  "id",
  "etag",
  "display_number",
  "description",
  "custom_field_values{id,value,custom_field}",
].join(",");

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseMatterIds(value: unknown): number[] {
  return Array.from(
    new Set(
      text(value)
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  );
}

function cfv(matter: ClioMatter, fieldId: number): CFV | undefined {
  return matter.custom_field_values?.find(
    (item) => Number(item?.custom_field?.id) === Number(fieldId)
  );
}

function isMasterMatter(matter: ClioMatter): boolean {
  return text(matter.description).toUpperCase().startsWith("MASTER LAWSUIT");
}

async function readMatterLive(matterId: number): Promise<ClioMatter> {
  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(LIVE_FIELDS)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `Failed to read matter ${matterId} from Clio: status ${res.status}; body ${body}`
    );
  }

  const matter = body ? JSON.parse(body)?.data : null;

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} was not returned by Clio.`);
  }

  return matter;
}

async function findMasterMatterForLawsuit(params: {
  masterLawsuitId: string;
  lawsuitMatters: string;
}) {
  const matterIds = parseMatterIds(params.lawsuitMatters);

  for (const matterId of matterIds) {
    const matter = await readMatterLive(matterId);
    if (isMasterMatter(matter)) return matter;
  }

  const indexedMaster = await prisma.claimIndex.findFirst({
    where: {
      master_lawsuit_id: params.masterLawsuitId,
      description: {
        startsWith: "MASTER LAWSUIT",
        mode: "insensitive",
      },
    },
    select: {
      matter_id: true,
    },
  });

  if (indexedMaster?.matter_id) {
    const matter = await readMatterLive(Number(indexedMaster.matter_id));
    if (isMasterMatter(matter)) return matter;
  }

  throw new Error(
    `Could not find Clio master matter for MASTER_LAWSUIT_ID ${params.masterLawsuitId}.`
  );
}

async function writeIndexAaaNumberToClioMaster(params: {
  masterMatter: ClioMatter;
  indexAaaNumber: string;
}) {
  const field = cfv(params.masterMatter, MATTER_CF.INDEX_AAA_NUMBER);

  if (!field?.id) {
    throw new Error(
      `Master matter ${params.masterMatter.display_number || params.masterMatter.id} is missing INDEX / AAA NUMBER custom field value.`
    );
  }

  if (!params.masterMatter.etag) {
    throw new Error(
      `Master matter ${params.masterMatter.display_number || params.masterMatter.id} is missing an ETag and cannot be safely updated.`
    );
  }

  const res = await clioFetch(`/api/v4/matters/${params.masterMatter.id}.json`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "If-Match": params.masterMatter.etag,
    },
    body: JSON.stringify({
      data: {
        custom_field_values: [
          {
            id: field.id,
            custom_field: { id: MATTER_CF.INDEX_AAA_NUMBER },
            value: params.indexAaaNumber,
          },
        ],
      },
    }),
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `Failed to write Index / AAA Number to Clio master matter ${params.masterMatter.display_number || params.masterMatter.id}: status ${res.status}; body ${body}`
    );
  }

  const updatedMatter = await readMatterLive(Number(params.masterMatter.id));
  await upsertClaimIndexFromMatter(updatedMatter);

  return {
    matterId: Number(updatedMatter.id),
    displayNumber: updatedMatter.display_number || "",
    indexAaaNumber: text(cfv(updatedMatter, MATTER_CF.INDEX_AAA_NUMBER)?.value),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const masterLawsuitId = text(body?.masterLawsuitId);
    const venueSelection = text(body?.venueSelection);
    const venueOther = text(body?.venueOther);
    const venue =
      venueSelection === "Other" ? venueOther : text(body?.venue || venueSelection);
    const indexAaaNumber = text(body?.indexAaaNumber);
    const lawsuitNotes = text(body?.lawsuitNotes);

    if (!masterLawsuitId) {
      return NextResponse.json(
        { ok: false, error: "masterLawsuitId is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.lawsuit.findUnique({
      where: { masterLawsuitId },
      select: {
        id: true,
        lawsuitMatters: true,
        lawsuitOptions: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          error: `No local Lawsuit row found for MASTER_LAWSUIT_ID ${masterLawsuitId}.`,
        },
        { status: 404 }
      );
    }

    const masterMatter = await findMasterMatterForLawsuit({
      masterLawsuitId,
      lawsuitMatters: existing.lawsuitMatters,
    });

    const clioIndexWrite = await writeIndexAaaNumberToClioMaster({
      masterMatter,
      indexAaaNumber,
    });

    const existingOptions =
      existing.lawsuitOptions && typeof existing.lawsuitOptions === "object"
        ? (existing.lawsuitOptions as Record<string, unknown>)
        : {};

    const lawsuitOptions = {
      ...existingOptions,
      venue,
      venueSelection,
      venueOther,
      indexAaaNumber: clioIndexWrite.indexAaaNumber,
      notes: lawsuitNotes,
      updatedPostFiling: true,
      updatedPostFilingAt: new Date().toISOString(),
      indexAaaNumberWrittenToClio: true,
      indexAaaNumberClioMasterMatterId: clioIndexWrite.matterId,
    };

    const lawsuit = await prisma.lawsuit.update({
      where: { masterLawsuitId },
      data: {
        venue: venue || null,
        venueSelection: venueSelection || null,
        venueOther: venueOther || null,
        indexAaaNumber: clioIndexWrite.indexAaaNumber || null,
        lawsuitNotes: lawsuitNotes || null,
        lawsuitOptions,
      },
    });

    return NextResponse.json({
      ok: true,
      lawsuit,
      clioIndexWrite,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to update lawsuit metadata.",
      },
      { status: 500 }
    );
  }
}
