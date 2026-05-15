import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function textValue(value: unknown): string {
  return String(value ?? "").trim();
}

function normalize(value: unknown): string {
  return textValue(value).toLowerCase().replace(/\s+/g, " ");
}

function jsonError(message: string, status = 400, details: Record<string, unknown> = {}) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      ...details,
    },
    { status }
  );
}

function moneyNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fieldName = textValue(url.searchParams.get("fieldName"));
    const value = textValue(url.searchParams.get("value"));
    const normalizedNeedle = normalize(value);

    if (fieldName !== "treating_provider") {
      return jsonError("Unsupported identity-field search.  Only treating_provider is currently enabled.");
    }

    if (!value) {
      return jsonError("A search value is required.");
    }

    const candidates = await prisma.claimIndex.findMany({
      where: {
        treating_provider: {
          not: null,
        },
      },
      select: {
        matter_id: true,
        display_number: true,
        description: true,
        patient_name: true,
        client_name: true,
        provider_name: true,
        insurer_name: true,
        claim_number_raw: true,
        claim_number_normalized: true,
        claim_amount: true,
        balance_presuit: true,
        payment_voluntary: true,
        master_lawsuit_id: true,
        status: true,
        close_reason: true,
        service_type: true,
        denial_reason: true,
        policy_number: true,
        date_of_loss: true,
        treating_provider: true,
      },
      orderBy: {
        matter_id: "asc",
      },
      take: 5000,
    });

    const rows = candidates
      .filter((row) => {
        const current = normalize(row.treating_provider);
        return current === normalizedNeedle || current.includes(normalizedNeedle);
      })
      .map((row) => ({
        id: String(row.matter_id),
        matterId: row.matter_id,
        matter_id: row.matter_id,
        displayNumber: row.display_number || "",
        display_number: row.display_number || "",
        description: row.description || "",
        patient: row.patient_name || "",
        patientName: row.patient_name || "",
        patient_name: row.patient_name || "",
        provider: row.client_name || row.provider_name || "",
        clientName: row.client_name || "",
        client_name: row.client_name || "",
        providerName: row.provider_name || "",
        provider_name: row.provider_name || "",
        insurer: row.insurer_name || "",
        insurerName: row.insurer_name || "",
        insurer_name: row.insurer_name || "",
        claimNumber: row.claim_number_raw || row.claim_number_normalized || "",
        claim_number: row.claim_number_raw || row.claim_number_normalized || "",
        claim_number_raw: row.claim_number_raw || "",
        claim_number_normalized: row.claim_number_normalized || "",
        claimAmount: moneyNumber(row.claim_amount),
        claim_amount: moneyNumber(row.claim_amount),
        balancePresuit: moneyNumber(row.balance_presuit),
        balance_presuit: moneyNumber(row.balance_presuit),
        paymentVoluntary: moneyNumber(row.payment_voluntary),
        payment_voluntary: moneyNumber(row.payment_voluntary),
        masterLawsuitId: row.master_lawsuit_id || "",
        master_lawsuit_id: row.master_lawsuit_id || "",
        status: row.status || "",
        closeReason: row.close_reason || "",
        close_reason: row.close_reason || "",
        serviceType: row.service_type || "",
        service_type: row.service_type || "",
        denialReason: row.denial_reason || "",
        denial_reason: row.denial_reason || "",
        policyNumber: row.policy_number || "",
        policy_number: row.policy_number || "",
        dateOfLoss: row.date_of_loss || "",
        date_of_loss: row.date_of_loss || "",
        treatingProvider: row.treating_provider || "",
        treating_provider: row.treating_provider || "",
        matchedBy: "Treating Provider",
        source: "claimindex",
      }));

    return NextResponse.json({
      ok: true,
      source: "claimindex",
      noClioWrite: true,
      noClioRead: true,
      fieldName,
      value,
      count: rows.length,
      rows,
      safety: {
        clioWrite: false,
        clioRead: false,
        storage: "ClaimIndex",
      },
    });
  } catch (err: any) {
    return jsonError(err?.message || "ClaimIndex identity-field search failed.", 500);
  }
}
