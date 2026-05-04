import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clioFetch } from "@/lib/clio";
import { MATTER_CF } from "@/lib/clioFields";
import { getCustomFieldValue } from "@/lib/matterHelpers";

export const runtime = "nodejs";

type ClioMatter = {
  id: number;
  display_number?: string;
  description?: string;
  status?: string;
  client?: { id?: number; name?: string; type?: string };
  custom_field_values?: any[];
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safetyReadOnly() {
  return {
    readOnly: true,
    liveClioReadOnly: true,
    noClioRecordsChanged: true,
    noDatabaseRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
  };
}

function isMasterMatter(matter: ClioMatter): boolean {
  return clean(matter.description).toUpperCase().startsWith("MASTER LAWSUIT");
}

async function readClioMatter(matterId: number): Promise<ClioMatter> {
  const fields = [
    "id",
    "display_number",
    "description",
    "status",
    "client{id,name,type}",
    "custom_field_values{value,custom_field}",
  ].join(",");

  const res = await clioFetch(
    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  const body = await res.text();

  if (!res.ok) {
    throw new Error(`Could not read matter ${matterId} from Clio: status ${res.status}; body ${body}`);
  }

  const matter = body ? JSON.parse(body)?.data : null;

  if (!matter?.id) {
    throw new Error(`Matter ${matterId} was not returned by Clio.`);
  }

  return matter;
}

async function getContactName(contactId: unknown): Promise<string | null> {
  const id = clean(contactId);
  if (!id) return null;

  const res = await clioFetch(
    `/api/v4/contacts/${encodeURIComponent(id)}.json?fields=${encodeURIComponent("id,name,type")}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  if (!res.ok) return id;

  const body = await res.text();

  try {
    return body ? JSON.parse(body)?.data?.name ?? id : id;
  } catch {
    return id;
  }
}

async function settlementRowFromClioMatter(matter: ClioMatter) {
  const settledWithId = getCustomFieldValue(matter, MATTER_CF.SETTLED_WITH);
  const settledWithName = await getContactName(settledWithId);

  return {
    matterId: Number(matter.id),
    displayNumber: clean(matter.display_number),
    providerName: clean(matter.client?.name),
    status: clean(matter.status),
    isMasterMatter: isMasterMatter(matter),

    billNumber: clean(getCustomFieldValue(matter, MATTER_CF.BILL_NUMBER)),
    claimAmount: num(getCustomFieldValue(matter, MATTER_CF.CLAIM_AMOUNT)),
    balancePresuit: num(getCustomFieldValue(matter, MATTER_CF.BALANCE_PRESUIT)),

    settledAmount: num(getCustomFieldValue(matter, MATTER_CF.SETTLED_AMOUNT)),
    settledWith: settledWithName,
    settledWithContactId: settledWithId ? String(settledWithId) : null,
    allocatedSettlement: num(getCustomFieldValue(matter, MATTER_CF.ALLOCATED_SETTLEMENT)),
    interestAmount: num(getCustomFieldValue(matter, MATTER_CF.INTEREST_AMOUNT)),
    principalFee: num(getCustomFieldValue(matter, MATTER_CF.PRINCIPAL_FEE)),
    interestFee: num(getCustomFieldValue(matter, MATTER_CF.INTEREST_FEE)),
    totalFee: num(getCustomFieldValue(matter, MATTER_CF.TOTAL_FEE)),
    providerNet: num(getCustomFieldValue(matter, MATTER_CF.PROVIDER_NET)),
    providerPrincipalNet: num(getCustomFieldValue(matter, MATTER_CF.PROVIDER_PRINCIPAL_NET)),
    providerInterestNet: num(getCustomFieldValue(matter, MATTER_CF.PROVIDER_INTEREST_NET)),
    overdueDays: num(getCustomFieldValue(matter, MATTER_CF.OVERDUE_DAYS)),
  };
}

export async function GET(req: NextRequest) {
  try {
    const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

    if (!masterLawsuitId) {
      return NextResponse.json(
        {
          ok: false,
          action: "settlement-current-values",
          error: "Missing masterLawsuitId",
          safety: safetyReadOnly(),
        },
        { status: 400 }
      );
    }

    const indexedRows = await prisma.claimIndex.findMany({
      where: { master_lawsuit_id: masterLawsuitId },
      select: {
        matter_id: true,
        display_number: true,
      },
      orderBy: { display_number: "asc" },
    });

    const matterIds = Array.from(
      new Set(
        indexedRows
          .map((row) => Number(row.matter_id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    const rows = [];

    for (const matterId of matterIds) {
      const matter = await readClioMatter(matterId);
      const row = await settlementRowFromClioMatter(matter);

      if (!row.isMasterMatter) {
        rows.push(row);
      }
    }

    const totals = {
      childMatterCount: rows.length,
      settledAmountTotal: rows.reduce((sum, row) => sum + (row.settledAmount ?? 0), 0),
      allocatedSettlementTotal: rows.reduce((sum, row) => sum + (row.allocatedSettlement ?? 0), 0),
      interestAmountTotal: rows.reduce((sum, row) => sum + (row.interestAmount ?? 0), 0),
      principalFeeTotal: rows.reduce((sum, row) => sum + (row.principalFee ?? 0), 0),
      interestFeeTotal: rows.reduce((sum, row) => sum + (row.interestFee ?? 0), 0),
      totalFeeTotal: rows.reduce((sum, row) => sum + (row.totalFee ?? 0), 0),
      providerNetTotal: rows.reduce((sum, row) => sum + (row.providerNet ?? 0), 0),
      providerPrincipalNetTotal: rows.reduce((sum, row) => sum + (row.providerPrincipalNet ?? 0), 0),
      providerInterestNetTotal: rows.reduce((sum, row) => sum + (row.providerInterestNet ?? 0), 0),
    };

    return NextResponse.json({
      ok: true,
      action: "settlement-current-values",
      masterLawsuitId,
      count: rows.length,
      source: "live-clio-read",
      rows,
      totals,
      safety: safetyReadOnly(),
      note:
        "Read-only live Clio settlement field readback for child/bill matters.  This endpoint does not write to Clio, the database, documents, or the print queue.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "settlement-current-values",
        error: err?.message || "Could not load current Clio settlement values.",
        safety: safetyReadOnly(),
      },
      { status: 500 }
    );
  }
}
