import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeClaimNumber(value: unknown): string {
  return cleanText(value).replace(/\s+/g, "").toUpperCase();
}

function parseMatterId(value: unknown): number | null {
  const cleaned = cleanText(value);
  if (!cleaned) return null;

  const withoutPrefix = cleaned.replace(/^BRL/i, "").trim();
  const parsed = Number(withoutPrefix);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function requiredText(value: unknown, label: string): string {
  const cleaned = cleanText(value);
  if (!cleaned) throw new Error(`${label} is required.`);
  return cleaned;
}

function updateRawJson(rawJson: string | null | undefined, updates: Record<string, any>): string {
  let parsed: any = {};

  const raw = cleanText(rawJson);
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    parsed = {};
  }

  const next = {
    ...parsed,
    ...updates,
  };

  return JSON.stringify(next);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const matterId = parseMatterId(body?.matterId);
    const field = cleanText(body?.field);

    if (!matterId) {
      return NextResponse.json(
        { ok: false, error: "Valid matterId is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.claimIndex.findUnique({
      where: { matter_id: matterId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: `Matter BRL${matterId} was not found in ClaimIndex.` },
        { status: 404 }
      );
    }

    const data: any = {};
    const rawUpdates: Record<string, any> = {};

    if (field === "dos") {
      const dosStart = requiredText(body?.dosStart, "DOS Start");
      const dosEnd = requiredText(body?.dosEnd, "DOS End");

      data.dos_start = dosStart;
      data.dos_end = dosEnd;
      rawUpdates.dosStart = dosStart;
      rawUpdates.dosEnd = dosEnd;
      rawUpdates.dos_start = dosStart;
      rawUpdates.dos_end = dosEnd;
    } else if (field === "denialReason") {
      const denialReason = requiredText(
        body?.denialReasonLabel || body?.label || body?.denialReasonValue || body?.value,
        "Denial Reason"
      );

      data.denial_reason = denialReason;
      rawUpdates.denialReason = denialReason;
      rawUpdates.denial_reason = denialReason;
    } else if (field === "status") {
      const status = requiredText(
        body?.statusLabel || body?.label || body?.statusValue || body?.matterStageName || body?.value,
        "Status"
      );

      data.status = status;
      data.matter_stage_name = status;
      rawUpdates.status = status;
      rawUpdates.matterStage = { name: status };
      rawUpdates.matter_stage = { name: status };
    } else if (field === "finalStatus") {
      const closeReason = requiredText(
        body?.finalStatusLabel || body?.label || body?.finalStatusValue || body?.closeReason || body?.value,
        "Closed Reason"
      );

      data.close_reason = closeReason;
      rawUpdates.closeReason = closeReason;
      rawUpdates.close_reason = closeReason;
    } else if (field === "patient") {
      const patientName = requiredText(body?.patientName || body?.value, "Patient");
      data.patient_name = patientName;
      data.patient_provider = [patientName, existing.provider_name || existing.client_name || ""].filter(Boolean).join(" | ");
      data.patient_insurer = [patientName, existing.insurer_name || ""].filter(Boolean).join(" | ");
      rawUpdates.patient = { name: patientName };
      rawUpdates.patientName = patientName;
    } else if (field === "provider") {
      const providerName = requiredText(body?.providerName || body?.value, "Provider");
      data.provider_name = providerName;
      data.client_name = providerName;
      data.patient_provider = [existing.patient_name || "", providerName].filter(Boolean).join(" | ");
      rawUpdates.provider = { name: providerName };
      rawUpdates.client = { name: providerName };
      rawUpdates.providerName = providerName;
      rawUpdates.clientName = providerName;
    } else if (field === "insurer") {
      const insurerName = requiredText(body?.insurerName || body?.value, "Insurer");
      data.insurer_name = insurerName;
      data.patient_insurer = [existing.patient_name || "", insurerName].filter(Boolean).join(" | ");
      rawUpdates.insurer = { name: insurerName };
      rawUpdates.insuranceCompany = { name: insurerName };
      rawUpdates.insurerName = insurerName;
    } else if (field === "claimNumber") {
      const claimNumber = requiredText(body?.claimNumber || body?.value, "Claim Number");
      data.claim_number_raw = claimNumber;
      data.claim_number_normalized = normalizeClaimNumber(claimNumber);
      rawUpdates.claimNumber = claimNumber;
      rawUpdates.claim_number = claimNumber;
    } else {
      return NextResponse.json(
        { ok: false, error: "Unsupported direct matter field." },
        { status: 400 }
      );
    }

    data.raw_json = updateRawJson(existing.raw_json, rawUpdates);
    data.indexed_at = new Date();

    const row = await prisma.claimIndex.update({
      where: { matter_id: matterId },
      data,
    });

    return NextResponse.json({
      ok: true,
      action: "update-direct-matter-field-local",
      field,
      matterId,
      displayNumber: row.display_number || `BRL${matterId}`,
      row,
      safety: {
        clioWriteback: false,
        clioHydration: false,
        customFieldValueCreation: "not-applicable-local-only",
        claimIndexUpdated: true,
        sourceOfTruth: "ClaimIndex/local Barsh Matters data",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
