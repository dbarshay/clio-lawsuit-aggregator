import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalize(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safety() {
  return {
    action: "matter-local-field-search",
    localBarshMattersMatterField: true,
    clioData: false,
    noClioRecordsChanged: true,
    noClioCustomFieldsChanged: true,
    databaseRecordsChanged: false,
    noDatabaseRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
  };
}

export async function GET(req: NextRequest) {
  try {
    const fieldName = clean(req.nextUrl.searchParams.get("fieldName")).toLowerCase();
    const value = clean(req.nextUrl.searchParams.get("value"));
    const normalizedValue = normalize(value);

    if (fieldName !== "treating_provider") {
      return NextResponse.json(
        {
          ok: false,
          action: "matter-local-field-search",
          error: "Only treating_provider local-field search is supported.",
          safety: safety(),
        },
        { status: 400 }
      );
    }

    if (!value) {
      return NextResponse.json(
        {
          ok: false,
          action: "matter-local-field-search",
          error: "value is required.",
          safety: safety(),
        },
        { status: 400 }
      );
    }

    const localFields = await prisma.matterLocalField.findMany({
      where: {
        fieldName,
        OR: [
          { fieldValue: { contains: value, mode: "insensitive" } },
          { fieldValue: { contains: normalizedValue, mode: "insensitive" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 500,
    });

    const matterIds = Array.from(
      new Set(
        localFields
          .map((row) => Number(row.matterId))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    const indexRows = matterIds.length
      ? await prisma.claimIndex.findMany({
          where: { matter_id: { in: matterIds } },
        })
      : [];

    const indexByMatterId = new Map(indexRows.map((row) => [Number(row.matter_id), row]));

    const rows = localFields.map((localField) => {
      const index = indexByMatterId.get(Number(localField.matterId));

      return {
        matterId: localField.matterId,
        matter_id: localField.matterId,
        id: localField.matterId,
        displayNumber: index?.display_number || localField.matterDisplayNumber || String(localField.matterId),
        display_number: index?.display_number || localField.matterDisplayNumber || String(localField.matterId),
        description: index?.description || "",
        patientName: index?.patient_name || "",
        patient_name: index?.patient_name || "",
        providerName: index?.client_name || index?.provider_name || "",
        provider_name: index?.client_name || index?.provider_name || "",
        clientName: index?.client_name || "",
        client_name: index?.client_name || "",
        insurerName: index?.insurer_name || "",
        insurer_name: index?.insurer_name || "",
        claimNumber: index?.claim_number_raw || index?.claim_number_normalized || "",
        claim_number: index?.claim_number_raw || index?.claim_number_normalized || "",
        masterLawsuitId: index?.master_lawsuit_id || "",
        master_lawsuit_id: index?.master_lawsuit_id || "",
        claimAmount: index?.claim_amount ?? null,
        claim_amount: index?.claim_amount ?? null,
        balancePresuit: index?.balance_presuit ?? index?.balance_amount ?? null,
        balance_presuit: index?.balance_presuit ?? index?.balance_amount ?? null,
        paymentVoluntary: index?.payment_voluntary ?? null,
        payment_voluntary: index?.payment_voluntary ?? null,
        treatingProvider: localField.fieldValue || "",
        treating_provider: localField.fieldValue || "",
        matchedBy: "Treating Provider",
        localField,
      };
    });

    return NextResponse.json({
      ok: true,
      action: "matter-local-field-search",
      count: rows.length,
      rows,
      safety: safety(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "matter-local-field-search",
        error: err?.message || "Local matter field search failed.",
        safety: safety(),
      },
      { status: 400 }
    );
  }
}
