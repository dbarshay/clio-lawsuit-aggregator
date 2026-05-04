import { NextRequest, NextResponse } from "next/server";

function clean(value: unknown): string {
  return String(value || "").trim();
}

function safeFilePart(value: unknown): string {
  return clean(value)
    .replace(/[\/\\:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function todayPathPart() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: NextRequest) {
  const masterLawsuitId = clean(req.nextUrl.searchParams.get("masterLawsuitId"));

  if (!masterLawsuitId) {
    return NextResponse.json(
      { ok: false, error: "Missing masterLawsuitId" },
      { status: 400 }
    );
  }

  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
  packetUrl.searchParams.set("masterLawsuitId", masterLawsuitId);

  const packetRes = await fetch(packetUrl, {
    method: "GET",
    cache: "no-store",
  });

  const packetJson = await packetRes.json();

  if (!packetRes.ok || !packetJson?.packet) {
    return NextResponse.json(
      {
        ok: false,
        error: packetJson?.error || "Could not load document packet.",
        packetStatus: packetRes.status,
      },
      { status: 500 }
    );
  }

  const packet = packetJson.packet;
  const metadata = packet.metadata || {};
  const validation = packet.validation || {};
  const masterMatter = packet.masterMatter || {};
  const totals = packet.totals || {};

  const canGenerate = Boolean(validation.canGenerate);
  const provider = safeFilePart(metadata.provider?.value || "Provider");
  const patient = safeFilePart(metadata.patient?.value || "Patient");
  const insurer = safeFilePart(metadata.insurer?.value || "Insurer");
  const claimNumber = safeFilePart(metadata.claimNumber?.value || "No Claim");
  const masterDisplay = safeFilePart(masterMatter.displayNumber || masterLawsuitId);

  const baseName = `${masterDisplay} - ${provider} aao ${patient} v ${insurer} - Claim ${claimNumber}`;
  const folderPath = `Lawsuits/${todayPathPart()}/${masterLawsuitId} - ${masterDisplay}`;

  const plannedDocuments = [
    {
      key: "bill-schedule",
      label: "Bill Schedule",
      filename: `${baseName} - Bill Schedule.docx`,
      endpoint: `/api/documents/bill-schedule?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
      status: canGenerate ? "ready" : "blocked",
      availableNow: true,
    },
    {
      key: "packet-summary",
      label: "Packet Summary",
      filename: `${baseName} - Packet Summary.docx`,
      endpoint: `/api/documents/packet-summary?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
      status: canGenerate ? "ready" : "blocked",
      availableNow: true,
    },
    {
      key: "summons-complaint",
      label: "Summons and Complaint",
      filename: `${baseName} - Summons and Complaint.docx`,
      endpoint: null,
      status: "not-built-yet",
      availableNow: false,
    },
  ];

  return NextResponse.json({
    ok: canGenerate,
    dryRun: true,
    masterLawsuitId,
    folderPath,
    plannedDocuments,
    packetSummary: {
      masterMatter: masterMatter.displayNumber || "",
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
    validation: {
      warnings: validation.warnings || [],
      blockingErrors: validation.blockingErrors || [],
      canGenerate,
    },
    note: "Dry run only. No files were created, no Clio records were changed, and no database records were changed.",
  });
}
