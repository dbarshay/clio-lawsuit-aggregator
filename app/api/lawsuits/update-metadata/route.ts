import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

    const existingOptions =
      existing.lawsuitOptions && typeof existing.lawsuitOptions === "object"
        ? (existing.lawsuitOptions as Record<string, unknown>)
        : {};

    const lawsuitOptions = {
      ...existingOptions,
      venue,
      venueSelection,
      venueOther,
      indexAaaNumber,
      notes: lawsuitNotes,
      updatedPostFiling: true,
      updatedPostFilingAt: new Date().toISOString(),
    };

    const lawsuit = await prisma.lawsuit.update({
      where: { masterLawsuitId },
      data: {
        venue: venue || null,
        venueSelection: venueSelection || null,
        venueOther: venueOther || null,
        indexAaaNumber: indexAaaNumber || null,
        lawsuitNotes: lawsuitNotes || null,
        lawsuitOptions,
      },
    });

    return NextResponse.json({
      ok: true,
      lawsuit,
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
