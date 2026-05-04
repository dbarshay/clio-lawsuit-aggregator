import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safeFilePart(value: unknown, maxLength = 120): string {
  return clean(value)
    .replace(/[\/\\:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildBaseName(packet: any, masterLawsuitId: string) {
  const metadata = packet.metadata || {};
  const masterMatter = packet.masterMatter || {};

  const provider = safeFilePart(metadata.provider?.value || "Provider");
  const patient = safeFilePart(metadata.patient?.value || "Patient");
  const insurer = safeFilePart(metadata.insurer?.value || "Insurer");
  const claimNumber = safeFilePart(metadata.claimNumber?.value || "No Claim");
  const masterDisplay = safeFilePart(masterMatter.displayNumber || masterLawsuitId);

  return `${masterDisplay} - ${provider} aao ${patient} v ${insurer} - Claim ${claimNumber}`;
}

function buildDocumentPlan(masterLawsuitId: string, baseName: string, canGenerate: boolean) {
  return [
    {
      key: "bill-schedule",
      label: "Bill Schedule",
      filename: `${baseName} - Bill Schedule.docx`,
      sourceEndpoint: `/api/documents/bill-schedule?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
      wouldGenerate: canGenerate,
      wouldUploadToClio: canGenerate,
      availableNow: true,
      status: canGenerate ? "ready-for-finalization" : "blocked",
    },
    {
      key: "packet-summary",
      label: "Packet Summary",
      filename: `${baseName} - Packet Summary.docx`,
      sourceEndpoint: `/api/documents/packet-summary?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
      wouldGenerate: canGenerate,
      wouldUploadToClio: canGenerate,
      availableNow: true,
      status: canGenerate ? "ready-for-finalization" : "blocked",
    },
    {
      key: "summons-complaint",
      label: "Summons and Complaint",
      filename: `${baseName} - Summons and Complaint.docx`,
      sourceEndpoint: `/api/documents/summons-complaint?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
      wouldGenerate: canGenerate,
      wouldUploadToClio: canGenerate,
      availableNow: true,
      status: canGenerate ? "ready-for-finalization" : "blocked",
      note: "Current Summons and Complaint output is a scaffold/draft until final pleading content is approved.",
    },
  ];
}

async function loadPacket(req: NextRequest, masterLawsuitId: string) {
  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
  packetUrl.searchParams.set("masterLawsuitId", masterLawsuitId);

  const packetRes = await fetch(packetUrl, {
    method: "GET",
    cache: "no-store",
  });

  const packetJson = await packetRes.json();

  if (!packetRes.ok || !packetJson?.packet) {
    throw new Error(packetJson?.error || "Could not load document packet.");
  }

  return packetJson.packet;
}

export async function GET(req: NextRequest) {
  try {
    const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

    if (!masterLawsuitId) {
      return NextResponse.json(
        { ok: false, error: "Missing masterLawsuitId" },
        { status: 400 }
      );
    }

    const packet = await loadPacket(req, masterLawsuitId);
    const metadata = packet.metadata || {};
    const validation = packet.validation || {};
    const masterMatter = packet.masterMatter || {};
    const totals = packet.totals || {};

    const canGenerate = Boolean(validation.canGenerate);
    const baseName = buildBaseName(packet, masterLawsuitId);
    const plannedDocuments = buildDocumentPlan(masterLawsuitId, baseName, canGenerate);

    const masterMatterId =
      masterMatter.matterId ??
      masterMatter.id ??
      packet.masterMatterId ??
      null;

    const masterDisplayNumber = clean(masterMatter.displayNumber || masterLawsuitId);

    return NextResponse.json({
      ok: canGenerate,
      dryRun: true,
      action: "finalize-preview",
      masterLawsuitId,
      generatedAt: new Date().toISOString(),
      finalizationDate: todayIsoDate(),

      clioUploadTarget: {
        type: "master-matter-documents-tab",
        matterId: masterMatterId,
        displayNumber: masterDisplayNumber,
        masterLawsuitId,
        wouldUploadToClio: canGenerate,
      },

      packetSummary: {
        masterMatter: masterDisplayNumber,
        venue: metadata.venue?.value || "",
        indexAaaNumber: metadata.indexAaaNumber?.value || "",
        amountSought: metadata.amountSought?.amount ?? null,
        amountSoughtMode: metadata.amountSought?.mode || "",
        provider: metadata.provider?.value || "",
        patient: metadata.patient?.value || "",
        insurer: metadata.insurer?.value || "",
        claimNumber: metadata.claimNumber?.value || "",
        billCount: totals.billCount || 0,
      },

      plannedDocuments,

      validation: {
        warnings: validation.warnings || [],
        blockingErrors: validation.blockingErrors || [],
        canGenerate,
      },

      safety: {
        noPersistentFilesCreated: true,
        noClioRecordsChanged: true,
        noDatabaseRecordsChanged: true,
        noOneDriveOrSharePointFoldersCreated: true,
        noUploadPerformed: true,
      },

      note:
        "Dry run only. This endpoint previews finalization/upload targets only. No files were persisted, no documents were uploaded to Clio, no Clio records were changed, no folders were created, and no database records were changed.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        dryRun: true,
        action: "finalize-preview",
        error: err?.message || "Finalize preview failed.",
        safety: {
          noPersistentFilesCreated: true,
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noOneDriveOrSharePointFoldersCreated: true,
          noUploadPerformed: true,
        },
      },
      { status: 500 }
    );
  }
}
