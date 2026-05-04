"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(v: any) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num(v));
}

function formatDate(v?: string) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-US");
}

function formatDOS(start?: string, end?: string) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return s === e ? s : `${s} - ${e}`;
  return s || e || "";
}

function stageColor(stage?: string) {
  if (!stage) return {};
  if (stage.includes("READY FOR ARBITRATION/LITIGATION")) {
    return { color: "green", fontWeight: "600" };
  }
  return { color: "red" };
}

function statusColor(status?: string) {
  if (!status) return {};
  const s = status.toLowerCase();

  if (s.includes("open")) {
    return { color: "green", fontWeight: "600" };
  }

  if (s.includes("pending") || s.includes("closed")) {
    return { color: "red", fontWeight: "700" };
  }

  return {};
}

function isSelectable(r: any) {
  return !String(r.closeReason || "").trim();
}

function isDisabledByGroup(r: any, activeGroupKey?: string | null) {
  if (!activeGroupKey) return false;

  const rowGroup = String(r?.masterLawsuitId || "").trim();
  if (!rowGroup) return false;

  return rowGroup !== activeGroupKey;
}


function isAggregated(r: any) {
  return !!(r?.masterLawsuitId && String(r.masterLawsuitId).trim());
}

function getColorForLawsuit(id: string): string {
  const colors = [
    "#f0f7ff",
    "#f5fff0",
    "#fff7f0",
    "#f9f0ff",
    "#fff0f5",
    "#f0fff9",
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function statusDisplay(status?: string) {
  if (!status) return "";
  const s = status.toLowerCase();

  if (s.includes("pending") || s.includes("closed")) {
    return "**" + status + "**";
  }

  return status;
}

function clioMatterUrl(matterId: any): string {
  return `https://app.clio.com/nc/#/matters/${matterId}`;
}

function textValue(v: any): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);

  if (Array.isArray(v)) {
    return v.map(textValue).filter(Boolean).join(", ");
  }

  if (typeof v === "object") {
    if (typeof v.name === "string" && v.name.trim()) return v.name;
    if (typeof v.value === "string" && v.value.trim()) return v.value;
    if (typeof v.label === "string" && v.label.trim()) return v.label;
    if (typeof v.description === "string" && v.description.trim()) return v.description;
    if (typeof v.display_value === "string" && v.display_value.trim()) return v.display_value;
    if (typeof v.displayName === "string" && v.displayName.trim()) return v.displayName;
    if (typeof v.text === "string" && v.text.trim()) return v.text;

    if (v.contact) return textValue(v.contact);
    if (v.person) return textValue(v.person);
    if (v.company) return textValue(v.company);
    if (v.client) return textValue(v.client);
    if (v.insurer) return textValue(v.insurer);
  }

  return "";
}

function providerValue(v: any): string {
  return textValue(v?.client) || textValue(v?.clientName) || "";
}

function insurerValue(v: any): string {
  

return (
    textValue(v?.insurer) ||
    textValue(v?.insuranceCompany) ||
    textValue(v?.insurance_company) ||
    ""
  );
}

const DENIAL_REASON_LABELS: Record<string, string> = {
  "12497975": "Medical Necessity (IME)",
  "12498065": "Fee Schedule / Coding",
};

function denialReasonValue(v: any): string {
  const raw =
    textValue(v?.denialReason) ||
    textValue(v?.denial_reason) ||
    "";

  if (!raw) return "";
  return DENIAL_REASON_LABELS[raw] || raw;
}

const VALID_CLOSE_REASONS = [
  "AAA- DECISION- DISMISSED WITH PREJUDICE",
  "AAA- VOLUNTARILY WITHDRAWN WITH PREJUDICE",
  "DISCONTINUED WITH PREJUDICE",
  "MOTION LOSS",
  "OUT OF STATE CARRIER",
  "PAID (DECISION)",
  "PAID (JUDGMENT)",
  "PAID (SETTLEMENT)",
  "PAID (FEE SCHEDULE)",
  "PAID (VOLUNTARY)",
  "PER CLIENT",
  "POLICY CANCELLED",
  "POLICY EXHAUSTED/NO COVERAGE",
  "PPO",
  "SOL",
  "TRIAL LOSS",
  "WORKERS COMPENSATION",
  "TRANSFERRED TO LB",
];

const VENUE_OPTIONS = [
  "Civil Court of the City of New York, Queens County",
  "Civil Court of the City of New York, Kings County",
  "Civil Court of the City of New York, New York County",
  "Civil Court of the City of New York, Bronx County",
  "Civil Court of the City of New York, Richmond County",
  "Nassau County District Court",
  "Suffolk County District Court",
  "AAA No-Fault Arbitration",
  "Other",
];

type AmountSoughtMode = "balance_presuit" | "claim_amount" | "custom";

type LawsuitOptions = {
  venue: string;
  venueOther: string;
  amountSoughtMode: AmountSoughtMode;
  customAmountSought: string;
  indexAaaNumber: string;
  notes: string;
};

type LawsuitMetadataEdit = {
  venueSelection: string;
  venueOther: string;
  amountSoughtMode: AmountSoughtMode;
  customAmountSought: string;
  indexAaaNumber: string;
  lawsuitNotes: string;
};

function defaultLawsuitMetadataEdit(): LawsuitMetadataEdit {
  return {
    venueSelection: "",
    venueOther: "",
    amountSoughtMode: "balance_presuit",
    customAmountSought: "",
    indexAaaNumber: "",
    lawsuitNotes: "",
  };
}

function defaultLawsuitOptions(): LawsuitOptions {
  return {
    venue: "",
    venueOther: "",
    amountSoughtMode: "balance_presuit",
    customAmountSought: "",
    indexAaaNumber: "",
    notes: "",
  };
}

type MatterWorkspaceTab =
  | "overview"
  | "lawsuit"
  | "documents"
  | "settlement"
  | "print_queue"
  | "audit_history";

const matterWorkspaceTabs: Array<{ key: MatterWorkspaceTab; label: string; note: string }> = [
  { key: "overview", label: "Overview", note: "Matter and sibling context" },
  { key: "lawsuit", label: "Lawsuit", note: "Aggregation and lawsuit metadata" },
  { key: "documents", label: "Documents", note: "Preview, finalize, and Clio upload" },
  { key: "settlement", label: "Settlement", note: "Settlement workflow placeholder" },
  { key: "print_queue", label: "Print Queue", note: "Matter-level print workflow" },
  { key: "audit_history", label: "Audit / History", note: "Local workflow history" },
];

function matterWorkspaceTabStyle(active: boolean) {
  return {
    border: "1px solid " + (active ? "#0f172a" : "#cbd5e1"),
    background: active ? "#0f172a" : "#ffffff",
    color: active ? "#ffffff" : "#0f172a",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  };
}

const tabPlaceholderPanelStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 18,
  background: "#ffffff",
  margin: "0 0 18px",
};

const tabPlaceholderTextStyle: React.CSSProperties = {
  color: "#475569",
  lineHeight: 1.5,
  marginBottom: 0,
};

function parseMoneyInput(v: string): number | null {
  const cleaned = String(v || "").replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [matterId, setMatterId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setMatterId(p.id));
  }, [params]);

  const [matter, setMatter] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

const selectedRows = useMemo(() => {
  return rows.filter((r) => selected.includes(Number(r.id)));
}, [rows, selected]);

const selectedGroupKeys = useMemo(() => {
  return Array.from(
    new Set(
      selectedRows
        .map((r) => String(r.masterLawsuitId || "").trim())
        .filter(Boolean)
    )
  );
}, [selectedRows]);

const activeGroupKey =
  selectedGroupKeys.length === 1 ? selectedGroupKeys[0] : null;

  const [submitting, setSubmitting] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [closing, setClosing] = useState(false);
  const [closeMatterTarget, setCloseMatterTarget] = useState<any>(null);
  const [showClosed, setShowClosed] = useState(true);
  const [showLawsuitOptionsModal, setShowLawsuitOptionsModal] = useState(false);
  const [lawsuitOptions, setLawsuitOptions] = useState<LawsuitOptions>(() =>
    defaultLawsuitOptions()
  );
  const [packetPreview, setPacketPreview] = useState<any>(null);
  const [packetPreviewOpen, setPacketPreviewOpen] = useState(false);
  const [packetLoading, setPacketLoading] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<any>(null);
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [finalizeUploadLoading, setFinalizeUploadLoading] = useState(false);
  const [finalizeUploadResult, setFinalizeUploadResult] = useState<any>(null);
  const [finalizationHistory, setFinalizationHistory] = useState<any>(null);
  const [finalizationHistoryLoading, setFinalizationHistoryLoading] = useState(false);
  const [expandedFinalizationId, setExpandedFinalizationId] = useState<string | null>(null);
  const [printQueuePreview, setPrintQueuePreview] = useState<any>(null);
  const [printQueuePreviewLoading, setPrintQueuePreviewLoading] = useState(false);
  const [printQueueAddLoading, setPrintQueueAddLoading] = useState(false);
  const [printQueueAddResult, setPrintQueueAddResult] = useState<any>(null);
  const [printQueueList, setPrintQueueList] = useState<any>(null);
  const [printQueueListLoading, setPrintQueueListLoading] = useState(false);
  const [printQueueStatusFilter, setPrintQueueStatusFilter] = useState<"" | "queued" | "printed" | "hold" | "skipped">("");
  const [printQueueStatusLoadingId, setPrintQueueStatusLoadingId] = useState<number | null>(null);
  const [printQueueStatusResult, setPrintQueueStatusResult] = useState<any>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<MatterWorkspaceTab>("overview");
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [metadataEdit, setMetadataEdit] = useState<LawsuitMetadataEdit>(() =>
    defaultLawsuitMetadataEdit()
  );

  const [settlementPreviewInput, setSettlementPreviewInput] = useState({
    grossSettlementAmount: "",
    settledWith: "",
    settlementDate: "",
    paymentExpectedDate: "",
    allocationMode: "proportional_balance_presuit",
    principalFeePercent: "",
    interestAmount: "",
    interestFeePercent: "",
    notes: "",
  });
  const [settlementPreviewLoading, setSettlementPreviewLoading] = useState(false);
  const [settlementPreviewResult, setSettlementPreviewResult] = useState<any>(null);


  useEffect(() => {
    if (!matterId) return;

    async function load() {
      const baseResponse = await fetch(
        `/api/clio/matter-context?matterId=${matterId}`
      ).then((r) => r.json());

      const siblingsResponse = await fetch(
        `/api/aggregation/find-siblings?matterId=${matterId}`
      ).then((r) => r.json());

      const base = baseResponse?.matter || null;
      const siblings = Array.isArray(siblingsResponse?.siblings)
        ? siblingsResponse.siblings
        : [];

      const all: any[] = [];
      const seen = new Set<number>();

      if (base?.id) {
        all.push(base);
        seen.add(Number(base.id));
      }

      for (const sib of siblings) {
        const idNum = Number(sib.id ?? sib.matterId);
        if (!idNum || seen.has(idNum)) continue;

        all.push({
          id: idNum,
          displayNumber: sib.displayNumber,
          patient: sib.patient,
          clientName: sib.clientName,
          insuranceCompany: sib.insuranceCompany,
          claimAmount: sib.claimAmount,
          paymentVoluntary: sib.paymentVoluntary,
          balancePresuit: sib.balancePresuit,
          dosStart: sib.dosStart,
          dosEnd: sib.dosEnd,
          denialReason: sib.denialReason,
          status: sib.status,
          closeReason: sib.closeReason,
          masterLawsuitId: sib.masterLawsuitId,
          matterStage: sib.matterStage || sib.stage || null,
          stage: sib.stage || sib.matterStage || null,
          selectableForSettlement: !!sib.selectableForSettlement,
          isMaster: !!(sib.isMaster || sib.is_master),
        });

        seen.add(idNum);
      }

      const sortedAll = [...all].sort((a, b) => {
        const aIsBase = Number(a?.id) === Number(base?.id);
        const bIsBase = Number(b?.id) === Number(base?.id);

        if (aIsBase && !bIsBase) return -1;
        if (!aIsBase && bIsBase) return 1;

        const aMaster = String(a?.masterLawsuitId || "").trim();
        const bMaster = String(b?.masterLawsuitId || "").trim();

        if (aMaster && bMaster) {
          const cmp = aMaster.localeCompare(bMaster);
          if (cmp !== 0) return cmp;
        } else if (aMaster && !bMaster) {
          return -1;
        } else if (!aMaster && bMaster) {
          return 1;
        }

        return String(a?.displayNumber || "").localeCompare(
          String(b?.displayNumber || "")
        );
      });

      setMatter(base || null);
      setRows(sortedAll);
      setSelected((prev) =>
        prev.filter((id) => {
          const row = all.find((r) => Number(r.id) === id);
          return row && !isAggregated(row) && isSelectable(row);
        })
      );
    }

    load();
  }, [matterId]);

  function toggle(id: number) {
    const row = rows.find((r) => Number(r.id) === id);

    if (!row) return;
    if (isAggregated(row)) return;
    if (!isSelectable(row)) return;
  if (isDisabledByGroup(row, activeGroupKey)) return;

    const alreadySelected = selected.includes(id);

    if (alreadySelected) {
      setSelected((prev) => prev.filter((x) => x !== id));
      return;
    }

    const selectedRows = rows.filter((r) => selected.includes(Number(r.id)));

    const selectedMasterIds = new Set(
      selectedRows
        .map((r) => textValue(r.masterLawsuitId))
        .filter(Boolean)
    );

    const rowMasterId = textValue(row.masterLawsuitId);

    if (
      selectedMasterIds.size > 0 &&
      rowMasterId &&
      !selectedMasterIds.has(rowMasterId)
    ) {
      alert("Cannot mix matters from different existing lawsuits.");
      return;
    }

    setSelected((prev) => [...prev, id]);
  }

    async function handleCloseMatter() {
    if (!closeMatterTarget?.id || !closeReason) return;

    setClosing(true);

    try {
      const res = await fetch("/api/matters/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matterId: Number(closeMatterTarget.id),
          closeReason,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "Close failed");
        return;
      }

      setShowCloseModal(false);
      setCloseMatterTarget(null);
      setCloseReason("");

      // FORCE fresh Clio-backed refresh (not cache)
      await fetch(`/api/claim-index/refresh-cluster?matterId=${Number(closeMatterTarget.id)}`);

      window.location.reload();
    } catch (err) {
      alert("Close failed");
    } finally {
      setClosing(false);
    }
  }

  async function submitAggregationWithOptions() {
    if (submitting) return;

    const selectedRows = rows.filter((r) => selected.includes(Number(r.id)));

    if (selectedRows.length === 0) {
      alert("Select at least one matter.");
      return;
    }

    const invalid = selectedRows.filter(
      (r) => isAggregated(r) || !isSelectable(r)
    );

    if (invalid.length > 0) {
      alert("One or more selected matters are not eligible for aggregation.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/aggregation/build-lawsuit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseMatterId: Number(matter.id),
          selectedMatterIds: selectedRows.map((r) => Number(r.id)),
          lawsuitOptions: {
            venue:
              lawsuitOptions.venue === "Other"
                ? lawsuitOptions.venueOther.trim()
                : lawsuitOptions.venue.trim(),
            venueSelection: lawsuitOptions.venue,
            venueOther: lawsuitOptions.venueOther.trim(),
            amountSoughtMode: lawsuitOptions.amountSoughtMode,
            customAmountSought:
              lawsuitOptions.amountSoughtMode === "custom"
                ? parseMoneyInput(lawsuitOptions.customAmountSought)
                : null,
            indexAaaNumber: lawsuitOptions.indexAaaNumber.trim(),
            notes: lawsuitOptions.notes.trim(),
          },
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "Lawsuit build failed");
        return;
      }

      setShowLawsuitOptionsModal(false);

      alert(
        `MASTER CREATED\n\nMaster Matter ID: ${json.masterMatterId}\nMaster Lawsuit ID: ${json.masterLawsuitId}`
      );

      await new Promise((r) => setTimeout(r, 2000));
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || "Lawsuit build failed");
    } finally {
      setSubmitting(false);
    }
  }

  

  function openLawsuitOptionsModal() {
    if (submitting) return;

    const selectedRows = rows.filter((r) => selected.includes(Number(r.id)));

    if (selectedRows.length === 0) {
      alert("Select at least one matter.");
      return;
    }

    const invalid = selectedRows.filter(
      (r) => isAggregated(r) || !isSelectable(r)
    );

    if (invalid.length > 0) {
      alert("One or more selected matters are not eligible for lawsuit generation.");
      return;
    }

    setLawsuitOptions(defaultLawsuitOptions());
    setShowLawsuitOptionsModal(true);
  }

  async function deaggregateCluster() {
    if (!matter?.masterLawsuitId) {
      alert("This matter is not part of a lawsuit.");
      return;
    }

    const clusterRows = rows.filter(
      (r) => String(r.masterLawsuitId || "").trim() === String(matter.masterLawsuitId).trim()
    );

    const clusterSize = clusterRows.length;

    const confirmed = confirm(
      `DE-AGGREGATE LAWSUIT\n\n` +
      `Master Lawsuit ID: ${matter.masterLawsuitId}\n` +
      `Total Matters: ${clusterSize}\n\n` +
      `This will REMOVE ALL matters from this lawsuit.\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    try {
      const res = await fetch("/api/deaggregate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matters: clusterRows.map((r) => ({
            id: r.id,
            displayNumber: r.displayNumber,
          })),
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "De-aggregation failed");
        return;
      }

      alert(
        `DE-AGGREGATION COMPLETE\n\n` +
        `Master Lawsuit ID: ${json.masterLawsuitId}\n` +
        `Cleared: ${json.cleared} matters`
      );

      window.location.reload();
    } catch (err: any) {
      alert(err?.message || "De-aggregation failed");
    }
  }


  async function expandClaim() {
    if (expanding) return;

    setExpanding(true);

    try {
      const res = await fetch(
        `/api/aggregation/expand-claim?matterId=${matterId}&limit=20&delayMs=1200`
      );

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "Expansion failed");
        return;
      }

      alert(`Expanded claim cluster.\nRefreshed: ${json.refreshed} matters.`);
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || "Expansion failed");
    } finally {
      setExpanding(false);
    }
  }

  async function fetchPacketPreview(masterLawsuitId: string) {
    const res = await fetch(
      `/api/documents/packet?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`
    );

    const json = await res.json();

    if (!json?.packet) {
      throw new Error(json?.error || "Document packet preview failed.");
    }

    setPacketPreview(json);
    setPacketPreviewOpen(true);

    if (json?.packet?.masterLawsuitId) {
      await loadFinalizationHistory(json.packet.masterLawsuitId);
      await loadPrintQueuePreview(json.packet.masterLawsuitId);
      await loadPrintQueueList(json.packet.masterLawsuitId);
    }

    return json;
  }

  async function loadPacketPreviewForMaster(masterLawsuitId: string) {
    const cleanMasterLawsuitId = textValue(masterLawsuitId);

    if (!cleanMasterLawsuitId) {
      alert("No Master Lawsuit ID found.");
      return;
    }

    setPacketLoading(true);

    try {
      await fetchPacketPreview(cleanMasterLawsuitId);
    } catch (err: any) {
      alert(err?.message || "Document packet preview failed.");
    } finally {
      setPacketLoading(false);
    }
  }

  async function loadPacketPreview() {
    const masterLawsuitId = textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("This matter is not part of a lawsuit.");
      return;
    }

    await loadPacketPreviewForMaster(masterLawsuitId);
  }

  function buildPacketSummaryText(packet: any): string {
    const metadata = packet?.metadata || {};
    const totals = packet?.totals || {};
    const validation = packet?.validation || {};
    const masterMatter = packet?.masterMatter || {};
    const children = Array.isArray(packet?.childMatters) ? packet.childMatters : [];

    const lines: string[] = [];

    lines.push("DOCUMENT PACKET SUMMARY");
    lines.push("");
    lines.push(`Master Lawsuit ID: ${textValue(packet?.masterLawsuitId) || "—"}`);
    lines.push(`Master Matter: ${textValue(masterMatter.displayNumber) || "—"}`);
    lines.push(`Venue: ${textValue(metadata?.venue?.value) || "—"}`);
    lines.push(`Index / AAA Number: ${textValue(metadata?.indexAaaNumber?.value) || "—"}`);
    lines.push(
      `Amount Sought: ${money(metadata?.amountSought?.amount)} (${textValue(metadata?.amountSought?.mode) || "—"})`
    );

    lines.push("");
    lines.push("CAPTION / CLAIM METADATA");
    lines.push(`Provider: ${textValue(metadata?.provider?.value) || "—"}`);
    lines.push(`Patient: ${textValue(metadata?.patient?.value) || "—"}`);
    lines.push(`Insurer: ${textValue(metadata?.insurer?.value) || "—"}`);
    lines.push(`Claim Number: ${textValue(metadata?.claimNumber?.value) || "—"}`);

    lines.push("");
    lines.push("TOTALS");
    lines.push(`Bill Count: ${num(totals.billCount)}`);
    lines.push(`Claim Amount Total: ${money(totals.claimAmountTotal)}`);
    lines.push(`Payment Voluntary Total: ${money(totals.paymentVoluntaryTotal)}`);
    lines.push(`Balance Presuit Total: ${money(totals.balancePresuitTotal)}`);
    lines.push(`Balance Amount Total: ${money(totals.balanceAmountTotal)}`);

    lines.push("");
    lines.push("CHILD BILL MATTERS");

    if (children.length === 0) {
      lines.push("—");
    } else {
      for (const child of children) {
        lines.push(
          [
            textValue(child.displayNumber) || "—",
            `Patient: ${textValue(child.patientName) || "—"}`,
            `Provider: ${textValue(child.providerName) || "—"}`,
            `DOS: ${formatDOS(child.dosStart, child.dosEnd) || "—"}`,
            `Claim Amount: ${money(child.claimAmount)}`,
            `Balance Presuit: ${money(child.balancePresuit)}`,
          ].join(" | ")
        );
      }
    }

    if (validation?.warnings?.length) {
      lines.push("");
      lines.push("WARNINGS");
      for (const warning of validation.warnings) lines.push(`- ${warning}`);
    }

    if (validation?.blockingErrors?.length) {
      lines.push("");
      lines.push("BLOCKING ERRORS");
      for (const error of validation.blockingErrors) lines.push(`- ${error}`);
    }

    return lines.join("\n");
  }

  async function copyPacketSummary() {
    if (!packetPreview?.packet) {
      alert("Load the packet preview first.");
      return;
    }

    const summary = buildPacketSummaryText(packetPreview.packet);

    try {
      await navigator.clipboard.writeText(summary);
      alert("Packet summary copied to clipboard.");
    } catch {
      alert("Could not copy to clipboard.");
    }
  }

  function buildFilingDemandSummaryText(packet: any): string {
    const metadata = packet?.metadata || {};
    const totals = packet?.totals || {};
    const children = Array.isArray(packet?.childMatters) ? packet.childMatters : [];

    const provider = textValue(metadata?.provider?.value) || "—";
    const patient = textValue(metadata?.patient?.value) || "—";
    const insurer = textValue(metadata?.insurer?.value) || "—";
    const claimNumber = textValue(metadata?.claimNumber?.value) || "—";
    const indexAaaNumber = textValue(metadata?.indexAaaNumber?.value) || "—";
    const venue = textValue(metadata?.venue?.value) || "—";
    const amountSought = money(metadata?.amountSought?.amount);
    const amountMode = textValue(metadata?.amountSought?.mode) || "—";

    const dosValues = Array.from(
      new Set(
        children
          .map((child: any) => formatDOS(child.dosStart, child.dosEnd))
          .filter(Boolean)
      )
    );

    const denialReasons = Array.from(
      new Set(
        children
          .map((child: any) => textValue(child.denialReason))
          .filter(Boolean)
      )
    );

    const lines: string[] = [];

    lines.push("FILING / DEMAND SUMMARY");
    lines.push("");
    lines.push(provider);
    lines.push(`as assignee of ${patient}`);
    lines.push("against");
    lines.push(insurer);

    lines.push("");
    lines.push(`Venue: ${venue}`);
    lines.push(`Index / AAA No.: ${indexAaaNumber}`);
    lines.push(`Claim No.: ${claimNumber}`);
    lines.push(`Amount Sought: ${amountSought} (${amountMode})`);

    lines.push("");
    lines.push(`Bill Count: ${num(totals.billCount)}`);
    lines.push(`Claim Amount Total: ${money(totals.claimAmountTotal)}`);
    lines.push(`Payment Voluntary Total: ${money(totals.paymentVoluntaryTotal)}`);
    lines.push(`Balance Presuit Total: ${money(totals.balancePresuitTotal)}`);

    if (dosValues.length > 0) {
      lines.push(`Date(s) of Service: ${dosValues.join("; ")}`);
    }

    if (denialReasons.length > 0) {
      lines.push(`Denial Reason(s): ${denialReasons.join("; ")}`);
    }

    lines.push("");
    lines.push("Bill Matter(s):");

    if (children.length === 0) {
      lines.push("—");
    } else {
      for (const child of children) {
        lines.push(
          [
            textValue(child.displayNumber) || "—",
            `DOS: ${formatDOS(child.dosStart, child.dosEnd) || "—"}`,
            `Claim Amount: ${money(child.claimAmount)}`,
            `Balance Presuit: ${money(child.balancePresuit)}`,
          ].join(" | ")
        );
      }
    }

    return lines.join("\n");
  }

  async function copyFilingDemandSummary() {
    if (!packetPreview?.packet) {
      alert("Load the packet preview first.");
      return;
    }

    const summary = buildFilingDemandSummaryText(packetPreview.packet);

    try {
      await navigator.clipboard.writeText(summary);
      alert("Filing / demand summary copied to clipboard.");
    } catch {
      alert("Could not copy to clipboard.");
    }
  }

  async function loadDocumentGenerationPreview() {
    const masterLawsuitId =
      textValue(packetPreview?.packet?.masterLawsuitId) ||
      textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("Load a lawsuit packet first.");
      return;
    }

    setDocumentPreviewLoading(true);

    try {
      const res = await fetch(
        `/api/documents/generate-preview?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`
      );

      const json = await res.json();

      if (!json) {
        alert("Document generation preview failed.");
        return;
      }

      setDocumentPreview(json);
      setFinalizeUploadResult(null);

      if (!json.ok && json?.validation?.blockingErrors?.length) {
        alert(`Documents are blocked:\n\n${json.validation.blockingErrors.join("\n")}`);
      }
    } catch (err: any) {
      alert(err?.message || "Document generation preview failed.");
    } finally {
      setDocumentPreviewLoading(false);
    }
  }

  async function loadFinalizationHistory(masterLawsuitIdInput?: string) {
    const masterLawsuitId =
      textValue(masterLawsuitIdInput) ||
      textValue(packetPreview?.packet?.masterLawsuitId) ||
      textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      setFinalizationHistory(null);
      return null;
    }

    setFinalizationHistoryLoading(true);

    try {
      const res = await fetch(
        `/api/documents/finalization-history?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}&limit=10`
      );

      const json = await res.json().catch(() => null);

      setFinalizationHistory(json);

      return json;
    } catch (err: any) {
      setFinalizationHistory({
        ok: false,
        error: err?.message || "Could not load finalization history.",
      });

      return null;
    } finally {
      setFinalizationHistoryLoading(false);
    }
  }

  async function loadPrintQueuePreview(masterLawsuitIdInput?: string) {
    const masterLawsuitId =
      textValue(masterLawsuitIdInput) ||
      textValue(packetPreview?.packet?.masterLawsuitId) ||
      textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      setPrintQueuePreview(null);
      return null;
    }

    setPrintQueuePreviewLoading(true);

    try {
      const res = await fetch(
        `/api/documents/print-queue-preview?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}&limit=10`
      );

      const json = await res.json().catch(() => null);

      setPrintQueuePreview(json);

      return json;
    } catch (err: any) {
      setPrintQueuePreview({
        ok: false,
        error: err?.message || "Could not load print queue preview.",
      });

      return null;
    } finally {
      setPrintQueuePreviewLoading(false);
    }
  }

  async function loadPrintQueueList(
    masterLawsuitIdInput?: string,
    statusFilterInput?: "" | "queued" | "printed" | "hold" | "skipped"
  ) {
    const masterLawsuitId =
      textValue(masterLawsuitIdInput) ||
      textValue(packetPreview?.packet?.masterLawsuitId) ||
      textValue(matter?.masterLawsuitId);

    const statusFilter =
      statusFilterInput === undefined ? printQueueStatusFilter : statusFilterInput;

    if (!masterLawsuitId) {
      setPrintQueueList(null);
      return null;
    }

    setPrintQueueListLoading(true);

    try {
      const url = new URL("/api/documents/print-queue", window.location.origin);
      url.searchParams.set("masterLawsuitId", masterLawsuitId);
      url.searchParams.set("limit", "20");

      if (statusFilter) {
        url.searchParams.set("status", statusFilter);
      }

      const res = await fetch(url.toString());

      const json = await res.json().catch(() => null);
      setPrintQueueList(json);

      return json;
    } catch (err: any) {
      setPrintQueueList({
        ok: false,
        error: err?.message || "Could not load print queue.",
      });

      return null;
    } finally {
      setPrintQueueListLoading(false);
    }
  }


  async function changePrintQueueStatusFilter(
    nextStatusFilter: "" | "queued" | "printed" | "hold" | "skipped"
  ) {
    setPrintQueueStatusFilter(nextStatusFilter);

    const masterLawsuitId =
      textValue(packetPreview?.packet?.masterLawsuitId) ||
      textValue(matter?.masterLawsuitId);

    if (masterLawsuitId) {
      await loadPrintQueueList(masterLawsuitId, nextStatusFilter);
    }
  }


  async function addVerifiedCandidatesToPrintQueue(masterLawsuitIdInput?: string) {
    const masterLawsuitId =
      masterLawsuitIdInput || packetPreview?.packet?.masterLawsuitId || "";

    if (!masterLawsuitId) {
      setPrintQueueAddResult({
        ok: false,
        error: "No MASTER_LAWSUIT_ID is available for print queue creation.",
      });
      return;
    }

    setPrintQueueAddLoading(true);
    setPrintQueueAddResult(null);

    try {
      const res = await fetch("/api/documents/print-queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          masterLawsuitId,
          confirmAdd: true,
        }),
      });

      const json = await res.json();
      setPrintQueueAddResult(json);

      if (json?.ok) {
        await loadPrintQueuePreview(masterLawsuitId);
        await loadPrintQueueList(masterLawsuitId);
      }
    } catch (err: any) {
      setPrintQueueAddResult({
        ok: false,
        error: err?.message || "Could not add documents to the print queue.",
      });
    } finally {
      setPrintQueueAddLoading(false);
    }
  }


  async function updatePrintQueueStatus(row: any, status: "queued" | "printed" | "hold" | "skipped") {
    const id = Number(row?.id);
    const masterLawsuitId =
      textValue(row?.masterLawsuitId) ||
      textValue(packetPreview?.packet?.masterLawsuitId) ||
      textValue(matter?.masterLawsuitId);

    if (!Number.isFinite(id) || id <= 0) {
      setPrintQueueStatusResult({
        ok: false,
        error: "Missing print queue item id.",
      });
      return;
    }

    const label =
      status === "printed"
        ? "mark this document as printed"
        : status === "hold"
          ? "place this document on hold"
          : status === "skipped"
            ? "mark this document as skipped"
            : "return this document to queued status";

    const confirmed = confirm(
      `UPDATE PRINT QUEUE STATUS\n\n` +
        `Document: ${textValue(row?.documentLabel) || textValue(row?.documentKey) || "—"}\n` +
        `Filename: ${textValue(row?.filename) || "—"}\n\n` +
        `This will ${label}.\n\n` +
        `This updates only the local print queue record.  It will not change Clio, upload documents, create folders, or modify document contents.\n\n` +
        `Continue?`
    );

    if (!confirmed) return;

    setPrintQueueStatusLoadingId(id);
    setPrintQueueStatusResult(null);

    try {
      const res = await fetch("/api/documents/print-queue", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
          confirmStatusUpdate: true,
        }),
      });

      const json = await res.json().catch(() => null);
      setPrintQueueStatusResult(json);

      if (json?.ok && masterLawsuitId) {
        await loadPrintQueueList(masterLawsuitId);
      }
    } catch (err: any) {
      setPrintQueueStatusResult({
        ok: false,
        error: err?.message || "Could not update print queue status.",
      });
    } finally {
      setPrintQueueStatusLoadingId(null);
    }
  }


  async function loadFinalizePreview() {
    const masterLawsuitId =
      textValue(packetPreview?.packet?.masterLawsuitId) ||
      textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("Load a lawsuit packet first.");
      return;
    }

    setDocumentPreviewLoading(true);

    try {
      const res = await fetch(
        `/api/documents/finalize-preview?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`
      );

      const json = await res.json();

      if (!json) {
        alert("Finalize documents preview failed.");
        return;
      }

      setDocumentPreview(json);
      setFinalizeUploadResult(null);

      if (!json.ok && json?.validation?.blockingErrors?.length) {
        alert(`Finalization is blocked:\n\n${json.validation.blockingErrors.join("\n")}`);
      }
    } catch (err: any) {
      alert(err?.message || "Finalize documents preview failed.");
    } finally {
      setDocumentPreviewLoading(false);
    }
  }


  async function uploadFinalDocumentsToClio() {
    if (finalizeUploadLoading) return;

    const masterLawsuitId =
      textValue(packetPreview?.packet?.masterLawsuitId) ||
      textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("Load a lawsuit packet first.");
      return;
    }

    if (documentPreview?.action !== "finalize-preview" || !documentPreview?.ok) {
      alert("Run Finalize Documents Preview successfully before uploading final documents to Clio.");
      return;
    }

    const plannedDocuments = Array.isArray(documentPreview?.plannedDocuments)
      ? documentPreview.plannedDocuments
      : [];

    const uploadableDocuments = plannedDocuments.filter(
      (doc: any) => doc?.wouldGenerate && doc?.wouldUploadToClio
    );

    if (uploadableDocuments.length === 0) {
      alert("No final documents are ready for upload.");
      return;
    }

    const targetDisplay =
      textValue(documentPreview?.clioUploadTarget?.displayNumber) || "the Clio master matter";
    const targetMatterId = textValue(documentPreview?.clioUploadTarget?.matterId);

    const documentList = uploadableDocuments
      .map((doc: any) => `- ${textValue(doc.label) || textValue(doc.key)}: ${textValue(doc.filename)}`)
      .join("\n");

    const confirmed = confirm(
      `FINALIZE AND UPLOAD TO CLIO\n\n` +
        `Target: ${targetDisplay}${targetMatterId ? ` / Matter ID ${targetMatterId}` : ""}\n\n` +
        `This will upload the following final document copy/copies to the Clio master matter Documents tab:\n\n` +
        `${documentList}\n\n` +
        `This is an explicit finalization action. Preview and download actions remain non-persistent.\n\n` +
        `WARNING: Running this again may create duplicate uploaded documents in Clio.\n\n` +
        `Continue?`
    );

    if (!confirmed) return;

    setFinalizeUploadLoading(true);
    setFinalizeUploadResult(null);

    try {
      const res = await fetch("/api/documents/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          masterLawsuitId,
          confirmUpload: true,
          documentKeys: uploadableDocuments.map((doc: any) => textValue(doc.key)).filter(Boolean),
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setFinalizeUploadResult(json || { ok: false, error: "Finalize upload failed." });
        alert(json?.error || "Finalize upload failed.");
        return;
      }

      setFinalizeUploadResult(json);
      await loadFinalizationHistory(masterLawsuitId);
      await loadPrintQueuePreview(masterLawsuitId);

      const uploadedCount = Array.isArray(json.uploaded) ? json.uploaded.length : 0;
      alert(`Final upload complete.\n\nUploaded to Clio: ${uploadedCount} document(s).`);
    } catch (err: any) {
      const result = {
        ok: false,
        error: err?.message || "Finalize upload failed.",
      };

      setFinalizeUploadResult(result);
      alert(result.error);
    } finally {
      setFinalizeUploadLoading(false);
    }
  }

  function downloadBillScheduleDocx() {
    const masterLawsuitId = textValue(packetPreview?.packet?.masterLawsuitId || matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("No Master Lawsuit ID found.");
      return;
    }

    window.open(
      `/api/documents/bill-schedule?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadPacketSummaryDocx() {
    const masterLawsuitId = textValue(packetPreview?.packet?.masterLawsuitId || matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("No Master Lawsuit ID found.");
      return;
    }

    window.open(
      `/api/documents/packet-summary?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadSummonsComplaintDocx() {
    const masterLawsuitId = textValue(packetPreview?.packet?.masterLawsuitId || matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("No Master Lawsuit ID found.");
      return;
    }

    window.open(
      `/api/documents/summons-complaint?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  async function openMetadataModalForMaster(masterLawsuitIdInput?: string) {
    const masterLawsuitId =
      textValue(masterLawsuitIdInput) || textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("This matter is not part of a lawsuit.");
      return;
    }

    setPacketLoading(true);

    try {
      const currentPreviewMasterId = textValue(packetPreview?.packet?.masterLawsuitId);
      const json =
        packetPreview?.packet && currentPreviewMasterId === masterLawsuitId
          ? packetPreview
          : await fetchPacketPreview(masterLawsuitId);

      const lawsuit = json?.packet?.lawsuit || null;
      const metadata = json?.packet?.metadata || {};

      setMetadataEdit({
        venueSelection:
          textValue(lawsuit?.venueSelection) ||
          textValue(metadata?.venue?.selection) ||
          textValue(lawsuit?.venue) ||
          "",
        venueOther: textValue(lawsuit?.venueOther),
        amountSoughtMode:
          textValue(lawsuit?.amountSoughtMode) === "claim_amount" ||
          textValue(lawsuit?.amountSoughtMode) === "custom"
            ? (textValue(lawsuit?.amountSoughtMode) as AmountSoughtMode)
            : "balance_presuit",
        customAmountSought:
          textValue(lawsuit?.customAmountSought) ||
          textValue(metadata?.amountSought?.customAmount) ||
          "",
        indexAaaNumber:
          textValue(lawsuit?.indexAaaNumber) ||
          textValue(metadata?.indexAaaNumber?.value) ||
          "",
        lawsuitNotes:
          textValue(lawsuit?.lawsuitNotes) ||
          textValue(metadata?.lawsuitNotes) ||
          "",
      });

      setShowMetadataModal(true);
    } catch (err: any) {
      alert(err?.message || "Could not load lawsuit metadata.");
    } finally {
      setPacketLoading(false);
    }
  }

  async function openMetadataModal() {
    await openMetadataModalForMaster();
  }

  async function loadSettlementPreview() {
    const masterLawsuitId = tabMasterLawsuitId;

    if (!masterLawsuitId) {
      alert("No MASTER_LAWSUIT_ID found.  Generate or connect a lawsuit before previewing settlement.");
      return;
    }

    const grossSettlementAmount = parseMoneyInput(settlementPreviewInput.grossSettlementAmount);

    if (grossSettlementAmount === null || grossSettlementAmount <= 0) {
      alert("Enter a gross settlement amount greater than zero.");
      return;
    }

    setSettlementPreviewLoading(true);
    setSettlementPreviewResult(null);

    try {
      const res = await fetch("/api/settlements/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          masterLawsuitId,
          grossSettlementAmount,
          settledWith: settlementPreviewInput.settledWith,
          settlementDate: settlementPreviewInput.settlementDate,
          paymentExpectedDate: settlementPreviewInput.paymentExpectedDate,
          allocationMode: settlementPreviewInput.allocationMode,
          principalFeePercent: parseMoneyInput(settlementPreviewInput.principalFeePercent) ?? 0,
          interestAmount: parseMoneyInput(settlementPreviewInput.interestAmount) ?? 0,
          interestFeePercent: parseMoneyInput(settlementPreviewInput.interestFeePercent) ?? 0,
          notes: settlementPreviewInput.notes,
        }),
      });

      const json = await res.json();
      setSettlementPreviewResult(json);

      if (!res.ok || !json?.ok) {
        const blockingErrors = Array.isArray(json?.validation?.blockingErrors)
          ? json.validation.blockingErrors
          : [];
        alert(
          json?.error ||
            (blockingErrors.length > 0
              ? `Settlement preview blocked:\n\n${blockingErrors.join("\n")}`
              : "Settlement preview failed.")
        );
      }
    } catch (err: any) {
      setSettlementPreviewResult({
        ok: false,
        action: "settlement-preview",
        dryRun: true,
        error: err?.message || "Settlement preview failed.",
        safety: {
          noClioRecordsChanged: true,
          noDatabaseRecordsChanged: true,
          noDocumentsGenerated: true,
          noPrintQueueRecordsChanged: true,
          noPersistentFilesCreated: true,
        },
      });
      alert(err?.message || "Settlement preview failed.");
    } finally {
      setSettlementPreviewLoading(false);
    }
  }

  async function saveMetadataEdit() {
    const masterLawsuitId = textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("This matter is not part of a lawsuit.");
      return;
    }

    setMetadataSaving(true);

    try {
      const venue =
        metadataEdit.venueSelection === "Other"
          ? metadataEdit.venueOther.trim()
          : metadataEdit.venueSelection.trim();

      const res = await fetch("/api/lawsuits/update-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterLawsuitId,
          venue,
          venueSelection: metadataEdit.venueSelection,
          venueOther: metadataEdit.venueOther,
          amountSoughtMode: metadataEdit.amountSoughtMode,
          customAmountSought:
            metadataEdit.amountSoughtMode === "custom"
              ? parseMoneyInput(metadataEdit.customAmountSought)
              : null,
          indexAaaNumber: metadataEdit.indexAaaNumber,
          lawsuitNotes: metadataEdit.lawsuitNotes,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "Failed to update lawsuit metadata.");
        return;
      }

      await fetchPacketPreview(masterLawsuitId);
      setShowMetadataModal(false);
    } catch (err: any) {
      alert(err?.message || "Failed to update lawsuit metadata.");
    } finally {
      setMetadataSaving(false);
    }
  }

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        if (!selected.includes(Number(r.id))) return acc;

        const claim = num(r.claimAmount);
        const payment = num(r.paymentVoluntary);
        const balance = claim - payment;

        acc.claim += claim;
        acc.payment += payment;
        acc.balance += balance;

        return acc;
      },
      { claim: 0, payment: 0, balance: 0 }
    );
  }, [rows, selected]);

  const displayRows = useMemo(() => {
    const sourceRows = (rows || []).filter((r: any) => {
      if (showClosed) return true;
      return !String(r.closeReason || "").trim();
    });

    const reordered: any[] = [];
    const grouped = new Map<string, any[]>();

    for (const row of sourceRows) {
      const key = String(row?.masterLawsuitId || "").trim();

      if (!key) {
        reordered.push(row);
        continue;
      }

      const group = grouped.get(key) || [];
      group.push(row);
      grouped.set(key, group);
    }

    for (const group of grouped.values()) {
      const master = group.find((row) => !!(row.isMaster || row.is_master));

      if (master) {
        reordered.push(master);
        reordered.push(...group.filter((row) => row !== master));
      } else {
        reordered.push(...group);
      }
    }

    return reordered.map((row, index) => {
      const currentMaster = String(row?.masterLawsuitId || "").trim();
      const prevMaster =
        index > 0 ? String(reordered[index - 1]?.masterLawsuitId || "").trim() : "";

      const startsNewGroup =
        index > 0 &&
        currentMaster !== prevMaster &&
        (currentMaster !== "" || prevMaster !== "");

      const showGroupLabel =
        currentMaster !== "" &&
        (index === 0 || currentMaster !== prevMaster);

      return {
        ...row,
        isLocked: !!(row.masterLawsuitId && String(row.masterLawsuitId).trim()),
        startsNewGroup,
        showGroupLabel,
      };
    });
  }, [rows, showClosed]);

  const thStyle: React.CSSProperties = {
    border: "1px solid #bfbfbf",
    padding: "8px 8px",
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: 15,
    fontWeight: 700,
    background: "#f3f3f3",
  };

  const tdStyle: React.CSSProperties = {
    border: "1px solid #bfbfbf",
    padding: "8px 8px",
    fontSize: 13,
    verticalAlign: "middle",
  };

  const alreadyAggregated = isAggregated(matter);
  const tabMasterLawsuitId =
    textValue(packetPreview?.packet?.masterLawsuitId) ||
    textValue(matter?.masterLawsuitId);


  return (
    <>

    <main
      style={{
        padding: 24,
        maxWidth: 1325,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
       }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr) 360px",
          columnGap: 24,
          alignItems: "start",
          width: "100%",
          marginBottom: 12,
         }}
      >
        <div style={{ alignSelf: "start"  }}>
          <img
            src="/brl-logo.png"
            alt="BRL Logo"
            style={{
              width: 220,
              height: "auto",
              display: "block",
              maxWidth: "100%",
              marginBottom: 12,
             }}
          />

          <button
            onClick={openLawsuitOptionsModal}
            disabled={submitting || selected.length === 0}
            style={{
              width: 220,
              textAlign: "center",
              padding: "12px 14px",
              background: submitting || selected.length === 0 ? "#999" : "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor:
                submitting || selected.length === 0
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {submitting
              ? "Generating..."
              : selected.length === 1
              ? "Generate Lawsuit"
              : selected.length > 1
              ? "Aggregate / Generate Lawsuit"
              : alreadyAggregated
              ? "Main Matter Already Aggregated"
              : "Select Matters to Generate"}
          </button>

          {alreadyAggregated && (
            <button
              onClick={deaggregateCluster}
              style={{
                width: 220,
                textAlign: "center",
                padding: "10px 14px",
                marginTop: 10,
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              De-aggregate Lawsuit
            </button>
          )}

          <button
            onClick={expandClaim}
            disabled={expanding || !matterId}
            style={{
              width: 220,
              textAlign: "center",
              padding: "10px 14px",
              marginTop: 10,
              background: expanding || !matterId ? "#999" : "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: expanding || !matterId ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {expanding ? "Refreshing..." : "Refresh Claim Cluster"}
          </button>
        </div>

        <div
          style={{
            minWidth: 0,
            fontSize: 18,
            lineHeight: 1.45,
           }}
        >
          <h1
            style={{
              margin: "0 0 12px 0",
              fontSize: 18,
              fontWeight: 700,
              whiteSpace: "nowrap",
             }}
          >
            Main Matter- {textValue(matter?.displayNumber)}
          </h1>

          <div style={{ whiteSpace: "nowrap", marginBottom: 8  }}>
            <strong>Provider:</strong> {providerValue(matter)}
          </div>
          <div style={{ whiteSpace: "nowrap", marginBottom: 8  }}>
            <strong>Insurer:</strong> {insurerValue(matter)}
          </div>
          <div style={{ whiteSpace: "nowrap", marginBottom: 8  }}>
            <strong>Claim Number:</strong> {textValue(matter?.claimNumber)}
          </div>

          {alreadyAggregated && (
            <div style={{ whiteSpace: "nowrap", color: "red", fontWeight: 700  }}>
              <strong>MASTER LAWSUIT ID:</strong> {textValue(matter?.masterLawsuitId)}
            </div>
          )}
        </div>

        <div
          style={{
            width: 360,
            border: "1px solid #bfbfbf",
            borderRadius: 4,
            padding: 18,
            background: "#fafafa",
            justifySelf: "end",
            alignSelf: "start",
           }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 14,
              textAlign: "center",
             }}
          >
            Selected Matters
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              rowGap: 12,
              columnGap: 18,
              fontSize: 15,
              alignItems: "center",
             }}
          >
            <div><strong>Claim Amount:</strong></div>
            <div style={{ textAlign: "right", minWidth: 110  }}>{money(totals.claim)}</div>

            <div><strong>Payment (Voluntary):</strong></div>
            <div style={{ textAlign: "right", minWidth: 110  }}>{money(totals.payment)}</div>

            <div
              style={{
                gridColumn: "1 / 3",
                borderTop: "1px solid #bfbfbf",
                margin: "2px 0 0 0",
               }}
            />

            <div><strong>Balance (Presuit):</strong></div>
            <div style={{ textAlign: "right", minWidth: 110  }}>{money(totals.balance)}</div>
          </div>
        </div>
      </div>

      <section
        style={{
          margin: "4px 0 18px",
          padding: 14,
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          background: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {matterWorkspaceTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveWorkspaceTab(tab.key)}
              style={matterWorkspaceTabStyle(activeWorkspaceTab === tab.key)}
              title={tab.note}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 13 }}>
          Barsh Matters workspace shell.  Existing matter workflows remain unchanged while the page is organized into workflow tabs.
        </p>
      </section>

      {activeWorkspaceTab === "lawsuit" && (
        <section style={tabPlaceholderPanelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Matter-Level Lawsuit Workspace</h2>
              <p style={tabPlaceholderTextStyle}>
                Lawsuit generation and metadata controls for this matter group.  Clio remains the source of truth,
                and Amount Sought calculations continue to exclude master matters.
              </p>
            </div>

            {tabMasterLawsuitId ? (
              <div
                style={{
                  padding: "6px 10px",
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#991b1b",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                MASTER LAWSUIT ID: {tabMasterLawsuitId}
              </div>
            ) : (
              <div
                style={{
                  padding: "6px 10px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#475569",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                No lawsuit generated yet
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Selected Matters</div>
              <div style={{ color: "#475569", fontSize: 13 }}>
                {selected.length} selected for lawsuit generation.
              </div>
            </div>

            <div
              style={{
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Claim Amount</div>
              <div style={{ color: "#475569", fontSize: 13 }}>{money(totals.claim)}</div>
            </div>

            <div
              style={{
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Balance (Presuit)</div>
              <div style={{ color: "#475569", fontSize: 13 }}>{money(totals.balance)}</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={openLawsuitOptionsModal}
              disabled={submitting || selected.length === 0}
              style={{
                padding: "8px 12px",
                border: "1px solid #0070f3",
                background: submitting || selected.length === 0 ? "#f3f4f6" : "#0070f3",
                color: submitting || selected.length === 0 ? "#666" : "#fff",
                borderRadius: 4,
                cursor: submitting || selected.length === 0 ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {submitting
                ? "Generating..."
                : selected.length === 1
                ? "Generate Lawsuit"
                : selected.length > 1
                ? "Aggregate / Generate Lawsuit"
                : "Select Matters to Generate"}
            </button>

            {alreadyAggregated && (
              <button
                type="button"
                onClick={deaggregateCluster}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #dc3545",
                  background: "#dc3545",
                  color: "#fff",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                De-aggregate Lawsuit
              </button>
            )}

            {alreadyAggregated && (
              <button
                type="button"
                onClick={openMetadataModal}
                disabled={packetLoading}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #4b5563",
                  background: packetLoading ? "#f3f4f6" : "#4b5563",
                  color: packetLoading ? "#666" : "#fff",
                  borderRadius: 4,
                  cursor: packetLoading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                Edit Lawsuit Metadata
              </button>
            )}

            {alreadyAggregated && (
              <button
                type="button"
                onClick={loadPacketPreview}
                disabled={packetLoading}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #2563eb",
                  background: packetLoading ? "#f3f4f6" : "#2563eb",
                  color: packetLoading ? "#666" : "#fff",
                  borderRadius: 4,
                  cursor: packetLoading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                {packetLoading ? "Loading..." : "Refresh Lawsuit Packet Data"}
              </button>
            )}
          </div>

          {alreadyAggregated ? (
            <div
              style={{
                padding: 10,
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                color: "#475569",
                fontSize: 13,
              }}
            >
              Existing lawsuit metadata and document packet data can be reviewed here and in the Documents tab.
              Final document upload to Clio remains explicit only.
            </div>
          ) : (
            <div
              style={{
                padding: 10,
                background: "#fffbeb",
                border: "1px solid #f59e0b",
                borderRadius: 8,
                color: "#92400e",
                fontSize: 13,
              }}
            >
              Select one or more eligible matters, then generate the lawsuit.  Single-matter lawsuit generation remains supported.
            </div>
          )}

          {packetPreview?.packet && activeWorkspaceTab === "lawsuit" && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Current Lawsuit Packet Summary</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                <div>
                  <strong>Venue:</strong>
                  <br />
                  {textValue(packetPreview.packet.metadata?.venue?.value) || "—"}
                </div>
                <div>
                  <strong>Amount Sought:</strong>
                  <br />
                  {money(packetPreview.packet.metadata?.amountSought?.amount)}
                  {" "}
                  ({textValue(packetPreview.packet.metadata?.amountSought?.mode) || "—"})
                </div>
                <div>
                  <strong>Index / AAA:</strong>
                  <br />
                  {textValue(packetPreview.packet.metadata?.indexAaaNumber?.value) || "—"}
                </div>
                <div>
                  <strong>Can Generate Docs:</strong>
                  <br />
                  {packetPreview.packet.validation?.canGenerate ? "Yes" : "No"}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {activeWorkspaceTab === "documents" && !alreadyAggregated && (
        <section style={tabPlaceholderPanelStyle}>
          <h2 style={{ marginTop: 0 }}>Documents</h2>
          <p style={tabPlaceholderTextStyle}>
            Document generation becomes available after a lawsuit is generated or the matter is connected to a
            MASTER_LAWSUIT_ID.  Preview and download actions remain non-persistent; final upload to Clio remains explicit only.
          </p>
        </section>
      )}

      {activeWorkspaceTab === "settlement" && (
        <section style={tabPlaceholderPanelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Settlement Intake / Planning</h2>
              <p style={tabPlaceholderTextStyle}>
                Read-only settlement workspace draft.  This panel does not change Clio, ClaimIndex, document records,
                finalization records, or print queue records.
              </p>
            </div>

            {tabMasterLawsuitId ? (
              <div
                style={{
                  padding: "6px 10px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                MASTER LAWSUIT ID: {tabMasterLawsuitId}
              </div>
            ) : (
              <div
                style={{
                  padding: "6px 10px",
                  border: "1px solid #fde68a",
                  background: "#fffbeb",
                  color: "#92400e",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                No lawsuit connected yet
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Provider</div>
              <div style={{ color: "#475569", fontSize: 13 }}>{providerValue(matter) || "—"}</div>
            </div>

            <div
              style={{
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Insurer</div>
              <div style={{ color: "#475569", fontSize: 13 }}>{insurerValue(matter) || "—"}</div>
            </div>

            <div
              style={{
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Claim Number</div>
              <div style={{ color: "#475569", fontSize: 13 }}>{textValue(matter?.claimNumber) || "—"}</div>
            </div>

            <div
              style={{
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Balance (Presuit)</div>
              <div style={{ color: "#475569", fontSize: 13 }}>{money(totals.balance)}</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: 12,
                border: "1px solid #dbeafe",
                borderRadius: 10,
                background: "#eff6ff",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Settlement Inputs</div>
              <ul style={{ margin: "0 0 0 18px", padding: 0, color: "#1e3a8a", fontSize: 13, lineHeight: 1.5 }}>
                <li>Gross settlement amount</li>
                <li>Settled with / adjuster or defense contact</li>
                <li>Settlement date and payment expected date</li>
                <li>Principal allocation method</li>
                <li>Interest allocation method</li>
              </ul>
            </div>

            <div
              style={{
                padding: 12,
                border: "1px solid #dcfce7",
                borderRadius: 10,
                background: "#f0fdf4",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Calculated Outputs</div>
              <ul style={{ margin: "0 0 0 18px", padding: 0, color: "#166534", fontSize: 13, lineHeight: 1.5 }}>
                <li>Allocated settlement per bill</li>
                <li>Principal fee and interest fee</li>
                <li>Total firm fee</li>
                <li>Provider principal net</li>
                <li>Provider interest net and total provider net</li>
              </ul>
            </div>

            <div
              style={{
                padding: 12,
                border: "1px solid #fef3c7",
                borderRadius: 10,
                background: "#fffbeb",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Safety Rules</div>
              <ul style={{ margin: "0 0 0 18px", padding: 0, color: "#92400e", fontSize: 13, lineHeight: 1.5 }}>
                <li>Clio remains source of truth for matter data.</li>
                <li>Settlement writeback must be explicit only.</li>
                <li>Preview calculations should be non-persistent.</li>
                <li>Provider-specific fee percentages must come from Clio contact data.</li>
              </ul>
            </div>
          </div>

          <div
            style={{
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              background: "#ffffff",
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Proposed Settlement Workflow</div>
            <ol style={{ margin: "0 0 0 20px", padding: 0, color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
              <li>Load live lawsuit/bill data from Clio and current local lawsuit context.</li>
              <li>Enter or preview gross settlement details without saving.</li>
              <li>Calculate allocation, fees, and provider net amounts per bill.</li>
              <li>Review warnings before any writeback.</li>
              <li>Explicitly save final settlement values to the appropriate child/bill matters only.</li>
              <li>Generate settlement documents and add final print-ready copies through the existing document workflow.</li>
            </ol>
          </div>

          <div
            style={{
              padding: 12,
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              background: "#f8fafc",
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Preview Settlement Calculation</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Gross Settlement Amount
                <input
                  value={settlementPreviewInput.grossSettlementAmount}
                  onChange={(e) =>
                    setSettlementPreviewInput((prev) => ({
                      ...prev,
                      grossSettlementAmount: e.target.value,
                    }))
                  }
                  placeholder="1000.00"
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                />
              </label>

              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Settled With
                <input
                  value={settlementPreviewInput.settledWith}
                  onChange={(e) =>
                    setSettlementPreviewInput((prev) => ({
                      ...prev,
                      settledWith: e.target.value,
                    }))
                  }
                  placeholder="Adjuster / defense contact"
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                />
              </label>

              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Settlement Date
                <input
                  type="date"
                  value={settlementPreviewInput.settlementDate}
                  onChange={(e) =>
                    setSettlementPreviewInput((prev) => ({
                      ...prev,
                      settlementDate: e.target.value,
                    }))
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                />
              </label>

              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Payment Expected Date
                <input
                  type="date"
                  value={settlementPreviewInput.paymentExpectedDate}
                  onChange={(e) =>
                    setSettlementPreviewInput((prev) => ({
                      ...prev,
                      paymentExpectedDate: e.target.value,
                    }))
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Allocation Mode
                <select
                  value={settlementPreviewInput.allocationMode}
                  onChange={(e) =>
                    setSettlementPreviewInput((prev) => ({
                      ...prev,
                      allocationMode: e.target.value,
                    }))
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                    background: "#fff",
                  }}
                >
                  <option value="proportional_balance_presuit">Proportional to Balance (Presuit)</option>
                  <option value="proportional_claim_amount">Proportional to Claim Amount</option>
                  <option value="equal">Equal Per Bill</option>
                </select>
              </label>

              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Principal Fee %
                <input
                  value={settlementPreviewInput.principalFeePercent}
                  onChange={(e) =>
                    setSettlementPreviewInput((prev) => ({
                      ...prev,
                      principalFeePercent: e.target.value,
                    }))
                  }
                  placeholder="0"
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                />
              </label>

              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Interest Amount
                <input
                  value={settlementPreviewInput.interestAmount}
                  onChange={(e) =>
                    setSettlementPreviewInput((prev) => ({
                      ...prev,
                      interestAmount: e.target.value,
                    }))
                  }
                  placeholder="0"
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                />
              </label>

              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Interest Fee %
                <input
                  value={settlementPreviewInput.interestFeePercent}
                  onChange={(e) =>
                    setSettlementPreviewInput((prev) => ({
                      ...prev,
                      interestFeePercent: e.target.value,
                    }))
                  }
                  placeholder="0"
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                />
              </label>
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
              Notes
              <textarea
                value={settlementPreviewInput.notes}
                onChange={(e) =>
                  setSettlementPreviewInput((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Preview notes only.  Not saved."
                rows={2}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  padding: 8,
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  resize: "vertical",
                }}
              />
            </label>

            <button
              type="button"
              onClick={loadSettlementPreview}
              disabled={settlementPreviewLoading || !tabMasterLawsuitId}
              style={{
                padding: "8px 12px",
                border: "1px solid #2563eb",
                background:
                  settlementPreviewLoading || !tabMasterLawsuitId ? "#f3f4f6" : "#2563eb",
                color: settlementPreviewLoading || !tabMasterLawsuitId ? "#666" : "#fff",
                borderRadius: 4,
                cursor:
                  settlementPreviewLoading || !tabMasterLawsuitId ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {settlementPreviewLoading ? "Previewing..." : "Preview Settlement"}
            </button>

            <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>
              Preview only.  This does not write to Clio, does not write to the database, does not generate documents,
              and does not change the print queue.
            </div>
          </div>

          {settlementPreviewResult && (
            <div
              style={{
                padding: 12,
                border: settlementPreviewResult.ok ? "1px solid #bbf7d0" : "1px solid #fecaca",
                borderRadius: 10,
                background: settlementPreviewResult.ok ? "#f0fdf4" : "#fef2f2",
                marginBottom: 14,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                Settlement Preview Result
              </div>

              {settlementPreviewResult.error && (
                <div style={{ color: "#991b1b", marginBottom: 8 }}>
                  <strong>Error:</strong> {textValue(settlementPreviewResult.error)}
                </div>
              )}

              {Array.isArray(settlementPreviewResult.validation?.blockingErrors) &&
                settlementPreviewResult.validation.blockingErrors.length > 0 && (
                  <div style={{ color: "#991b1b", marginBottom: 8 }}>
                    <strong>Blocking Errors:</strong>
                    <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                      {settlementPreviewResult.validation.blockingErrors.map((msg: string) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {Array.isArray(settlementPreviewResult.validation?.warnings) &&
                settlementPreviewResult.validation.warnings.length > 0 && (
                  <div style={{ color: "#92400e", marginBottom: 8 }}>
                    <strong>Warnings:</strong>
                    <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                      {settlementPreviewResult.validation.warnings.map((msg: string) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {settlementPreviewResult.totals && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 8,
                    marginBottom: 10,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong>Gross Settlement:</strong>
                    <br />
                    {money(settlementPreviewResult.totals.grossSettlementAmount)}
                  </div>
                  <div>
                    <strong>Total Firm Fee:</strong>
                    <br />
                    {money(settlementPreviewResult.totals.totalFeeTotal)}
                  </div>
                  <div>
                    <strong>Provider Net:</strong>
                    <br />
                    {money(settlementPreviewResult.totals.providerNetTotal)}
                  </div>
                  <div>
                    <strong>Bill Count:</strong>
                    <br />
                    {num(settlementPreviewResult.totals.childMatterCount)}
                  </div>
                </div>
              )}

              {Array.isArray(settlementPreviewResult.rows) && settlementPreviewResult.rows.length > 0 && (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Matter</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Bill</th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Allocated</th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Interest</th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Firm Fee</th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Provider Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementPreviewResult.rows.map((row: any) => (
                      <tr key={textValue(row.matterId)}>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5 }}>
                          {textValue(row.displayNumber) || textValue(row.matterId)}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5 }}>
                          {textValue(row.billNumber) || "—"}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5, textAlign: "right" }}>
                          {money(row.allocatedSettlement)}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5, textAlign: "right" }}>
                          {money(row.interestAmount)}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5, textAlign: "right" }}>
                          {money(row.totalFee)}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5, textAlign: "right" }}>
                          {money(row.providerNet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  Raw settlement preview JSON
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                    margin: "6px 0 0 0",
                    padding: 8,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {JSON.stringify(settlementPreviewResult, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <div
            style={{
              padding: 10,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              color: "#475569",
              fontSize: 13,
            }}
          >
            Next implementation step: convert this preview into an explicit final save/writeback workflow.  The save action should reuse the same calculation engine, write only after final user confirmation, target child/bill matters only, and refresh ClaimIndex after Clio writeback.
          </div>
        </section>
      )}

      {activeWorkspaceTab === "print_queue" && (
        <section style={tabPlaceholderPanelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Matter-Level Print Queue</h2>
              <p style={tabPlaceholderTextStyle}>
                Local print queue workflow for this lawsuit.  Status controls update only local print queue records;
                they do not change Clio, upload documents, create folders, or modify document contents.
              </p>
            </div>

            <a
              href="/print-queue"
              style={{
                padding: "8px 12px",
                border: "1px solid #94a3b8",
                background: "#fff",
                color: "#0f172a",
                borderRadius: 4,
                textDecoration: "none",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              Open Global Daily Print Queue
            </a>
          </div>

          {!tabMasterLawsuitId ? (
            <div style={{ marginTop: 12, color: "#475569" }}>
              No MASTER_LAWSUIT_ID is available yet.  Generate or connect a lawsuit before loading matter-level print queue records.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 14,
                  marginBottom: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => loadPrintQueuePreview(tabMasterLawsuitId)}
                  disabled={printQueuePreviewLoading}
                  style={{
                    padding: "7px 10px",
                    border: "1px solid #0f766e",
                    background: printQueuePreviewLoading ? "#f3f4f6" : "#0f766e",
                    color: printQueuePreviewLoading ? "#666" : "#fff",
                    borderRadius: 4,
                    cursor: printQueuePreviewLoading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {printQueuePreviewLoading ? "Loading..." : "Refresh Print Preview"}
                </button>

                <button
                  type="button"
                  onClick={() => loadPrintQueueList(tabMasterLawsuitId)}
                  disabled={printQueueListLoading}
                  style={{
                    padding: "7px 10px",
                    border: "1px solid #2563eb",
                    background: printQueueListLoading ? "#f3f4f6" : "#2563eb",
                    color: printQueueListLoading ? "#666" : "#fff",
                    borderRadius: 4,
                    cursor: printQueueListLoading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {printQueueListLoading ? "Loading..." : "Refresh Queue List"}
                </button>

                <button
                  type="button"
                  onClick={() => addVerifiedCandidatesToPrintQueue(tabMasterLawsuitId)}
                  disabled={
                    printQueueAddLoading ||
                    !printQueuePreview?.ok ||
                    !Array.isArray(printQueuePreview?.candidateDocuments) ||
                    printQueuePreview.candidateDocuments.length === 0
                  }
                  style={{
                    padding: "7px 10px",
                    border: "1px solid #b45309",
                    background:
                      printQueueAddLoading ||
                      !printQueuePreview?.ok ||
                      !Array.isArray(printQueuePreview?.candidateDocuments) ||
                      printQueuePreview.candidateDocuments.length === 0
                        ? "#f3f4f6"
                        : "#b45309",
                    color:
                      printQueueAddLoading ||
                      !printQueuePreview?.ok ||
                      !Array.isArray(printQueuePreview?.candidateDocuments) ||
                      printQueuePreview.candidateDocuments.length === 0
                        ? "#666"
                        : "#fff",
                    borderRadius: 4,
                    cursor:
                      printQueueAddLoading ||
                      !printQueuePreview?.ok ||
                      !Array.isArray(printQueuePreview?.candidateDocuments) ||
                      printQueuePreview.candidateDocuments.length === 0
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {printQueueAddLoading ? "Adding..." : "Add Verified Candidates"}
                </button>
              </div>

              {printQueueStatusResult && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: printQueueStatusResult.ok ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${printQueueStatusResult.ok ? "#bbf7d0" : "#fecaca"}`,
                    borderRadius: 4,
                    color: printQueueStatusResult.ok ? "#166534" : "#991b1b",
                  }}
                >
                  {printQueueStatusResult.ok ? (
                    <>Print queue status updated to {textValue(printQueueStatusResult.status) || "—"}.</>
                  ) : (
                    <>
                      <strong>Error:</strong> {textValue(printQueueStatusResult.error)}
                    </>
                  )}
                </div>
              )}

              {printQueueList?.ok && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  {([
                    ["", "All", "all"],
                    ["queued", "Queued", "queued"],
                    ["printed", "Printed", "printed"],
                    ["hold", "Hold", "hold"],
                    ["skipped", "Skipped", "skipped"],
                  ] as const).map(([value, label, countKey]) => {
                    const active = printQueueStatusFilter === value;
                    const count = num(printQueueList?.statusCounts?.[countKey]);

                    return (
                      <button
                        key={countKey}
                        type="button"
                        onClick={() => changePrintQueueStatusFilter(value)}
                        disabled={printQueueListLoading}
                        style={{
                          fontSize: 12,
                          padding: "4px 9px",
                          border: `1px solid ${active ? "#0f172a" : "#94a3b8"}`,
                          borderRadius: 999,
                          background: active ? "#e2e8f0" : "#fff",
                          cursor: printQueueListLoading ? "not-allowed" : "pointer",
                          fontWeight: active ? 800 : 500,
                        }}
                      >
                        {label}: {count}
                      </button>
                    );
                  })}
                </div>
              )}

              {printQueueListLoading && !printQueueList && (
                <div style={{ color: "#475569" }}>Loading print queue...</div>
              )}

              {printQueueList?.error && (
                <div style={{ color: "#991b1b", marginBottom: 10 }}>
                  <strong>Error:</strong> {textValue(printQueueList.error)}
                </div>
              )}

              {printQueueList?.ok && num(printQueueList.count) === 0 && (
                <div style={{ color: "#475569", marginBottom: 10 }}>
                  {printQueueStatusFilter
                    ? `No print queue items currently match status "${printQueueStatusFilter}" for this lawsuit.`
                    : "No documents are currently queued for printing for this lawsuit."}
                </div>
              )}

              {printQueueList?.ok && Array.isArray(printQueueList.rows) && printQueueList.rows.length > 0 && (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                    fontSize: 12,
                    marginBottom: 14,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Document</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Filename</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Status</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Clio Document ID</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printQueueList.rows.map((row: any) => (
                      <tr key={textValue(row.id)}>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5 }}>
                          {textValue(row.documentLabel) || textValue(row.documentKey) || "—"}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5 }}>
                          {textValue(row.filename) || "—"}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5 }}>
                          {textValue(row.status) || "—"}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5 }}>
                          {textValue(row.clioDocumentId) || "—"}
                        </td>
                        <td style={{ borderBottom: "1px solid #f1f5f9", padding: 5 }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {(["queued", "printed", "hold", "skipped"] as const).map((statusOption) => (
                              <button
                                key={statusOption}
                                type="button"
                                onClick={() => updatePrintQueueStatus(row, statusOption)}
                                disabled={
                                  printQueueStatusLoadingId === num(row.id) ||
                                  textValue(row.status) === statusOption
                                }
                                style={{
                                  fontSize: 11,
                                  padding: "2px 6px",
                                  border: "1px solid #94a3b8",
                                  borderRadius: 4,
                                  background:
                                    textValue(row.status) === statusOption ? "#e2e8f0" : "#fff",
                                  cursor:
                                    printQueueStatusLoadingId === num(row.id) ||
                                    textValue(row.status) === statusOption
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {statusOption}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {printQueuePreview?.error && (
                <div style={{ color: "#991b1b", marginBottom: 10 }}>
                  <strong>Error:</strong> {textValue(printQueuePreview.error)}
                </div>
              )}

              {printQueuePreviewLoading && !printQueuePreview && (
                <div style={{ color: "#475569" }}>Loading print candidates...</div>
              )}

              {printQueuePreview?.ok && num(printQueuePreview.candidateDocumentCount) === 0 && (
                <div style={{ color: "#475569" }}>
                  No verified print candidates are available yet.  Finalize documents before adding them to the print queue.
                </div>
              )}

              {printQueuePreview?.ok &&
                Array.isArray(printQueuePreview.candidateDocuments) &&
                printQueuePreview.candidateDocuments.length > 0 && (
                  <div
                    style={{
                      padding: 10,
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                      Verified Print Candidates: {num(printQueuePreview.candidateDocumentCount)}
                    </div>
                    <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                      {printQueuePreview.candidateDocuments.map((doc: any, index: number) => (
                        <li key={`${textValue(doc.documentKey)}-${index}`}>
                          <strong>{textValue(doc.documentLabel) || textValue(doc.documentKey)}:</strong>{" "}
                          {textValue(doc.filename) || "—"}
                          {doc.alreadyQueued ? " — already queued" : ""}
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: 8, color: "#475569" }}>
                      These are proposed print candidates only.  Each listed document has been verified against the current Clio master matter Documents tab.
                    </div>
                  </div>
                )}
            </>
          )}
        </section>
      )}

      {activeWorkspaceTab === "audit_history" && (
        <section style={tabPlaceholderPanelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Matter-Level Audit / History</h2>
              <p style={tabPlaceholderTextStyle}>
                Local finalization and workflow history for this lawsuit.  These records do not replace Clio;
                the Clio master matter Documents tab remains the record-copy source of truth.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadFinalizationHistory(tabMasterLawsuitId)}
              disabled={finalizationHistoryLoading || !tabMasterLawsuitId}
              style={{
                padding: "7px 10px",
                border: "1px solid #2563eb",
                background:
                  finalizationHistoryLoading || !tabMasterLawsuitId ? "#f3f4f6" : "#2563eb",
                color: finalizationHistoryLoading || !tabMasterLawsuitId ? "#666" : "#fff",
                borderRadius: 4,
                cursor:
                  finalizationHistoryLoading || !tabMasterLawsuitId ? "not-allowed" : "pointer",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {finalizationHistoryLoading ? "Loading..." : "Refresh History"}
            </button>
          </div>

          {!tabMasterLawsuitId ? (
            <div style={{ marginTop: 12, color: "#475569" }}>
              No MASTER_LAWSUIT_ID is available yet.  Generate or connect a lawsuit before loading audit/history records.
            </div>
          ) : (
            <>
              {finalizationHistory?.error && (
                <div style={{ marginTop: 12, color: "#991b1b" }}>
                  <strong>Error:</strong> {textValue(finalizationHistory.error)}
                </div>
              )}

              {finalizationHistoryLoading && !finalizationHistory && (
                <div style={{ marginTop: 12, color: "#475569" }}>
                  Loading finalization history...
                </div>
              )}

              {finalizationHistory?.ok &&
                Array.isArray(finalizationHistory.rows) &&
                finalizationHistory.rows.length === 0 && (
                  <div style={{ marginTop: 12, color: "#475569" }}>
                    No finalization history recorded yet.
                  </div>
                )}

              {finalizationHistory?.ok &&
                Array.isArray(finalizationHistory.rows) &&
                finalizationHistory.rows.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    {finalizationHistory.rows.map((row: any) => {
                      const uploaded = Array.isArray(row.uploaded) ? row.uploaded : [];
                      const skipped = Array.isArray(row.skipped) ? row.skipped : [];
                      const rowKey = textValue(row.id);
                      const isExpanded = expandedFinalizationId === rowKey;

                      return (
                        <div
                          key={rowKey}
                          style={{
                            marginBottom: 10,
                            padding: 12,
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: 6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "flex-start",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800 }}>
                                {row.finalizedAt
                                  ? new Date(row.finalizedAt).toLocaleString()
                                  : "Unknown date"}
                              </div>
                              <div style={{ color: "#475569", marginTop: 2, fontSize: 13 }}>
                                Audit ID {rowKey} · Status {textValue(row.status) || "unknown"} · Uploaded {uploaded.length} · Skipped {skipped.length}
                                {row.noUploadPerformed ? " · No upload performed" : ""}
                                {row.allowDuplicateUploads ? " · Duplicate override allowed" : ""}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFinalizationId(isExpanded ? null : rowKey)
                              }
                              style={{
                                fontSize: 12,
                                padding: "4px 9px",
                                border: "1px solid #94a3b8",
                                borderRadius: 4,
                                background: isExpanded ? "#e2e8f0" : "#fff",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isExpanded ? "Hide Details" : "Details"}
                            </button>
                          </div>

                          {uploaded.length > 0 && (
                            <div style={{ color: "#065f46", marginTop: 6, fontSize: 13 }}>
                              Uploaded:{" "}
                              {uploaded
                                .map((doc: any) => `${textValue(doc.label) || textValue(doc.key)}${doc.clioDocumentId ? ` (Clio ${doc.clioDocumentId})` : ""}`)
                                .join(", ")}
                            </div>
                          )}

                          {skipped.length > 0 && (
                            <div style={{ color: "#92400e", marginTop: 6, fontSize: 13 }}>
                              Skipped:{" "}
                              {skipped
                                .map((doc: any) => `${textValue(doc.label) || textValue(doc.key)}${textValue(doc.reason) ? ` (${textValue(doc.reason)})` : ""}`)
                                .join(", ")}
                            </div>
                          )}

                          {textValue(row.error) && (
                            <div style={{ color: "#991b1b", marginTop: 6, fontSize: 13 }}>
                              <strong>Error:</strong> {textValue(row.error)}
                            </div>
                          )}

                          {isExpanded && (
                            <div
                              style={{
                                marginTop: 10,
                                padding: 10,
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 4,
                                fontSize: 12,
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                  gap: 8,
                                  marginBottom: 10,
                                }}
                              >
                                <div>
                                  <strong>Master Lawsuit ID:</strong>
                                  <br />
                                  {textValue(row.masterLawsuitId) || "—"}
                                </div>
                                <div>
                                  <strong>Master Matter:</strong>
                                  <br />
                                  {textValue(row.masterDisplayNumber) || textValue(row.masterMatterId) || "—"}
                                </div>
                                <div>
                                  <strong>Requested Docs:</strong>
                                  <br />
                                  {Array.isArray(row.requestedKeys) && row.requestedKeys.length > 0
                                    ? row.requestedKeys.map(textValue).join(", ")
                                    : "—"}
                                </div>
                                <div>
                                  <strong>Audit Updated:</strong>
                                  <br />
                                  {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}
                                </div>
                              </div>

                              <details>
                                <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                                  Raw finalization audit JSON
                                </summary>
                                <pre
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    overflowX: "auto",
                                    margin: "6px 0 0 0",
                                    padding: 8,
                                    background: "#f8fafc",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 4,
                                  }}
                                >
                                  {JSON.stringify(row, null, 2)}
                                </pre>
                              </details>

                              <div style={{ marginTop: 8, color: "#475569" }}>
                                This drilldown displays local audit/history data only.  It does not verify current Clio document existence.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </>
          )}
        </section>
      )}

      {activeWorkspaceTab !== "settlement" && (
        <>
          <hr style={{ margin: "18px 0 20px 0", border: 0, borderTop: "1px solid #999"  }} />

          {activeWorkspaceTab === "documents" && alreadyAggregated && (
        <section
          style={{
            border: "1px solid #bfbfbf",
            borderRadius: 6,
            padding: 14,
            marginBottom: 16,
            background: "#fbfbfb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: packetPreviewOpen && packetPreview?.packet ? 12 : 0,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                Document Packet Preview
              </div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 3 }}>
                Read-only packet data for MASTER LAWSUIT ID {textValue(packetPreview?.packet?.masterLawsuitId) || textValue(matter?.masterLawsuitId)}.
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={openMetadataModal}
                disabled={packetLoading}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #4b5563",
                  background: packetLoading ? "#f3f4f6" : "#4b5563",
                  color: packetLoading ? "#666" : "#fff",
                  borderRadius: 4,
                  cursor: packetLoading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Edit Lawsuit Metadata
              </button>

              <button
                onClick={loadPacketPreview}
                disabled={packetLoading}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #2563eb",
                  background: packetLoading ? "#f3f4f6" : "#2563eb",
                  color: packetLoading ? "#666" : "#fff",
                  borderRadius: 4,
                  cursor: packetLoading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {packetLoading
                  ? "Loading..."
                  : packetPreviewOpen
                  ? "Refresh Packet Preview"
                  : "Load Packet Preview"}
              </button>
            </div>
          </div>

          {packetPreviewOpen && packetPreview?.packet && (
            <div
              style={{
                borderTop: "1px solid #ddd",
                paddingTop: 12,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <strong>Master Matter:</strong>
                  <br />
                  {packetPreview.packet.masterMatter?.matterId ? (
                    <a
                      href={clioMatterUrl(packetPreview.packet.masterMatter.matterId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2563eb",
                        fontWeight: 700,
                        textDecoration: "underline",
                      }}
                    >
                      {textValue(packetPreview.packet.masterMatter.displayNumber) || "Open in Clio"}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
                <div>
                  <strong>Venue:</strong>
                  <br />
                  {textValue(packetPreview.packet.metadata?.venue?.value) || "—"}
                </div>
                <div>
                  <strong>Amount Sought:</strong>
                  <br />
                  {money(packetPreview.packet.metadata?.amountSought?.amount)}
                  {" "}
                  ({textValue(packetPreview.packet.metadata?.amountSought?.mode) || "—"})
                </div>
                <div>
                  <strong>Index / AAA:</strong>
                  <br />
                  {textValue(packetPreview.packet.metadata?.indexAaaNumber?.value) || "—"}
                </div>
                <div>
                  <strong>Can Generate:</strong>
                  <br />
                  {packetPreview.packet.validation?.canGenerate ? "Yes" : "No"}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <strong>Provider:</strong>
                  <br />
                  {textValue(packetPreview.packet.metadata?.provider?.value) || "—"}
                </div>
                <div>
                  <strong>Patient:</strong>
                  <br />
                  {textValue(packetPreview.packet.metadata?.patient?.value) || "—"}
                </div>
                <div>
                  <strong>Insurer:</strong>
                  <br />
                  {textValue(packetPreview.packet.metadata?.insurer?.value) || "—"}
                </div>
                <div>
                  <strong>Claim:</strong>
                  <br />
                  {textValue(packetPreview.packet.metadata?.claimNumber?.value) || "—"}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: 10,
                  marginBottom: 12,
                  padding: 10,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                }}
              >
                <div>
                  <strong>Bills:</strong>
                  <br />
                  {num(packetPreview.packet.totals?.billCount)}
                </div>
                <div>
                  <strong>Claim Total:</strong>
                  <br />
                  {money(packetPreview.packet.totals?.claimAmountTotal)}
                </div>
                <div>
                  <strong>Voluntary Paid:</strong>
                  <br />
                  {money(packetPreview.packet.totals?.paymentVoluntaryTotal)}
                </div>
                <div>
                  <strong>Balance Presuit:</strong>
                  <br />
                  {money(packetPreview.packet.totals?.balancePresuitTotal)}
                </div>
                <div>
                  <strong>Balance:</strong>
                  <br />
                  {money(packetPreview.packet.totals?.balanceAmountTotal)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <a
                  href="/print-queue"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #94a3b8",
                    background: "#fff",
                    color: "#0f172a",
                    borderRadius: 4,
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Daily Print Queue
                </a>

                <button
                  onClick={loadDocumentGenerationPreview}
                  disabled={documentPreviewLoading}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #7c3aed",
                    background: documentPreviewLoading ? "#f3f4f6" : "#7c3aed",
                    color: documentPreviewLoading ? "#666" : "#fff",
                    borderRadius: 4,
                    cursor: documentPreviewLoading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {documentPreviewLoading ? "Checking..." : "Generate Documents Preview"}
                </button>

                <button
                  onClick={loadFinalizePreview}
                  disabled={documentPreviewLoading || finalizeUploadLoading}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #9333ea",
                    background: documentPreviewLoading ? "#f3f4f6" : "#9333ea",
                    color: documentPreviewLoading ? "#666" : "#fff",
                    borderRadius: 4,
                    cursor: documentPreviewLoading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {documentPreviewLoading ? "Checking..." : "Finalize Documents Preview"}
                </button>

                <button
                  onClick={uploadFinalDocumentsToClio}
                  disabled={
                    documentPreviewLoading ||
                    finalizeUploadLoading ||
                    documentPreview?.action !== "finalize-preview" ||
                    !documentPreview?.ok
                  }
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #b45309",
                    background:
                      documentPreviewLoading ||
                      finalizeUploadLoading ||
                      documentPreview?.action !== "finalize-preview" ||
                      !documentPreview?.ok
                        ? "#f3f4f6"
                        : "#b45309",
                    color:
                      documentPreviewLoading ||
                      finalizeUploadLoading ||
                      documentPreview?.action !== "finalize-preview" ||
                      !documentPreview?.ok
                        ? "#666"
                        : "#fff",
                    borderRadius: 4,
                    cursor:
                      documentPreviewLoading ||
                      finalizeUploadLoading ||
                      documentPreview?.action !== "finalize-preview" ||
                      !documentPreview?.ok
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 700,
                  }}
                  title="Requires a successful Finalize Documents Preview first."
                >
                  {finalizeUploadLoading ? "Uploading..." : "Upload Final Documents to Clio"}
                </button>

                <button
                  onClick={downloadBillScheduleDocx}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #0f766e",
                    background: "#0f766e",
                    color: "#fff",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Download Bill Schedule
                </button>

                <button
                  onClick={downloadPacketSummaryDocx}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #0369a1",
                    background: "#0369a1",
                    color: "#fff",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Download Packet Summary
                </button>

                <button
                  onClick={downloadSummonsComplaintDocx}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #7c3aed",
                    background: "#7c3aed",
                    color: "#fff",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Download Summons and Complaint
                </button>

                <button
                  onClick={copyFilingDemandSummary}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #047857",
                    background: "#047857",
                    color: "#fff",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Copy Filing / Demand Summary
                </button>

                <button
                  onClick={copyPacketSummary}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #111827",
                    background: "#111827",
                    color: "#fff",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Copy Packet Summary
                </button>
              </div>

              {documentPreview && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: documentPreview.ok ? "#ecfdf5" : "#fef2f2",
                    border: documentPreview.ok
                      ? "1px solid #10b981"
                      : "1px solid #dc2626",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>
                    {documentPreview.action === "finalize-preview"
                      ? "Finalize Documents Preview"
                      : "Document Generation Preview"}
                  </div>

                  {documentPreview.action === "finalize-preview" ? (
                    <>
                      <div style={{ marginBottom: 6 }}>
                        <strong>Clio Upload Target:</strong>{" "}
                        {textValue(documentPreview.clioUploadTarget?.displayNumber) || "—"}
                        {documentPreview.clioUploadTarget?.matterId
                          ? ` / Matter ID ${documentPreview.clioUploadTarget.matterId}`
                          : ""}
                      </div>

                      <div style={{ marginBottom: 6 }}>
                        <strong>Upload Destination:</strong>{" "}
                        {textValue(documentPreview.clioUploadTarget?.type) || "—"}
                      </div>
                    </>
                  ) : (
                    <div style={{ marginBottom: 6 }}>
                      <strong>Output Folder:</strong>{" "}
                      {textValue(documentPreview.folderPath) || "—"}
                    </div>
                  )}

                  <div style={{ marginBottom: 6 }}>
                    <strong>Status:</strong>{" "}
                    {documentPreview.ok ? "Ready" : "Blocked"}
                  </div>

                  {Array.isArray(documentPreview.plannedDocuments) &&
                    documentPreview.plannedDocuments.length > 0 && (
                      <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                        {documentPreview.plannedDocuments.map((doc: any) => (
                          <li key={textValue(doc.key) || textValue(doc.filename)}>
                            <strong>{textValue(doc.label)}:</strong>{" "}
                            {textValue(doc.filename)}
                            {textValue(doc.status) ? ` — ${textValue(doc.status)}` : ""}
                            {doc.alreadyUploadedToClio ? (
                              <span style={{ color: "#b45309", fontWeight: 700 }}>
                                {" "}— already uploaded to Clio
                              </span>
                            ) : null}
                            {Array.isArray(doc.existingClioDocuments) &&
                            doc.existingClioDocuments.length > 0 ? (
                              <ul style={{ margin: "4px 0 4px 18px", padding: 0 }}>
                                {doc.existingClioDocuments.map((existing: any) => (
                                  <li key={textValue(existing.id)}>
                                    Existing Clio Document ID {textValue(existing.id)}
                                    {textValue(existing.latestDocumentVersion?.receivedAt)
                                      ? ` — received ${textValue(existing.latestDocumentVersion.receivedAt)}`
                                      : ""}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}

                  {documentPreview.action === "finalize-preview" && documentPreview.ok && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 8,
                        background:
                          documentPreview.existingDocumentCheck?.matchCount > 0
                            ? "#fef2f2"
                            : "#fffbeb",
                        border:
                          documentPreview.existingDocumentCheck?.matchCount > 0
                            ? "1px solid #dc2626"
                            : "1px solid #f59e0b",
                        borderRadius: 4,
                        color:
                          documentPreview.existingDocumentCheck?.matchCount > 0
                            ? "#991b1b"
                            : "#92400e",
                        fontSize: 12,
                      }}
                    >
                      <strong>
                        {documentPreview.existingDocumentCheck?.matchCount > 0
                          ? "Existing Clio document warning:"
                          : "Final upload is explicit:"}
                      </strong>{" "}
                      {documentPreview.existingDocumentCheck?.matchCount > 0
                        ? "one or more planned final documents already exists in the Clio master matter Documents tab.  The upload endpoint skips exact filename matches by default to prevent duplicates."
                        : "click Upload Final Documents to Clio only when these are the final print-ready copies.  Repeating the action may create duplicate documents in Clio."}
                    </div>
                  )}

                  <div style={{ marginTop: 8, color: "#555", fontSize: 12 }}>
                    {textValue(documentPreview.note) ||
                      "Dry run only.  No files were created, no Clio records were changed, and no database records were changed."}
                  </div>
                </div>
              )}

              {finalizeUploadResult && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: finalizeUploadResult.ok ? "#ecfdf5" : "#fef2f2",
                    border: finalizeUploadResult.ok
                      ? "1px solid #10b981"
                      : "1px solid #dc2626",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>
                    Final Upload Result
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <strong>Status:</strong>{" "}
                    {finalizeUploadResult.ok ? "Uploaded to Clio" : "Failed"}
                  </div>

                  {textValue(finalizeUploadResult.error) && (
                    <div style={{ marginBottom: 6, color: "#991b1b" }}>
                      <strong>Error:</strong> {textValue(finalizeUploadResult.error)}
                    </div>
                  )}

                  {Array.isArray(finalizeUploadResult.uploaded) &&
                    finalizeUploadResult.uploaded.length > 0 && (
                      <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                        {finalizeUploadResult.uploaded.map((doc: any) => (
                          <li key={textValue(doc.clioDocumentId) || textValue(doc.filename)}>
                            <strong>{textValue(doc.label)}:</strong>{" "}
                            {textValue(doc.filename)}
                            {doc.clioDocumentId
                              ? ` — Clio Document ID ${doc.clioDocumentId}`
                              : ""}
                            {doc.fullyUploaded ? " — fully uploaded" : ""}
                          </li>
                        ))}
                      </ul>
                    )}

                  {Array.isArray(finalizeUploadResult.skipped) &&
                    finalizeUploadResult.skipped.some(
                      (doc: any) => textValue(doc.reason) === "already-uploaded-to-clio"
                    ) && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          background: "#fffbeb",
                          border: "1px solid #f59e0b",
                          borderRadius: 4,
                          color: "#92400e",
                          fontSize: 12,
                        }}
                      >
                        <strong>Skipped existing Clio document(s):</strong>
                        <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                          {finalizeUploadResult.skipped
                            .filter(
                              (doc: any) =>
                                textValue(doc.reason) === "already-uploaded-to-clio"
                            )
                            .map((doc: any) => (
                              <li key={textValue(doc.key) || textValue(doc.filename)}>
                                {textValue(doc.label)} was not uploaded again because an exact filename match already exists in Clio.
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                  {finalizeUploadResult.finalizationRecord && (
                    <div style={{ marginTop: 8, color: "#065f46", fontSize: 12 }}>
                      <strong>Audit Record:</strong>{" "}
                      {finalizeUploadResult.finalizationRecord.ok
                        ? `local finalization audit record ID ${finalizeUploadResult.finalizationRecord.id}`
                        : `audit record was not created: ${textValue(finalizeUploadResult.finalizationRecord.error) || "unknown error"}`}
                    </div>
                  )}

                  <div style={{ marginTop: 8, color: "#555", fontSize: 12 }}>
                    Uploaded only through the explicit finalization action.  Duplicate prevention skips exact filename matches by default.  Local database records are audit/history only, Clio remains the source of truth, and no OneDrive/SharePoint folders were created.
                  </div>
                </div>
              )}

              {packetPreview?.packet?.masterLawsuitId && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 800 }}>Finalization History</div>
                    <button
                      type="button"
                      onClick={() => loadFinalizationHistory(packetPreview.packet.masterLawsuitId)}
                      disabled={finalizationHistoryLoading}
                      style={{
                        fontSize: 12,
                        padding: "3px 8px",
                        border: "1px solid #94a3b8",
                        borderRadius: 4,
                        background: "#fff",
                        cursor: finalizationHistoryLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {finalizationHistoryLoading ? "Loading..." : "Refresh History"}
                    </button>
                  </div>

                  <div style={{ marginTop: 4, color: "#475569", fontSize: 12 }}>
                    Local audit/history only.  Clio Documents tab remains the source of truth for actual uploaded files.
                  </div>

                  {finalizationHistory?.error && (
                    <div style={{ marginTop: 8, color: "#991b1b", fontSize: 12 }}>
                      <strong>Error:</strong> {textValue(finalizationHistory.error)}
                    </div>
                  )}

                  {finalizationHistoryLoading && !finalizationHistory && (
                    <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>
                      Loading finalization history...
                    </div>
                  )}

                  {finalizationHistory?.ok && Array.isArray(finalizationHistory.rows) && finalizationHistory.rows.length === 0 && (
                    <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>
                      No finalization history recorded yet.
                    </div>
                  )}

                  {finalizationHistory?.ok && Array.isArray(finalizationHistory.rows) && finalizationHistory.rows.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      {finalizationHistory.rows.map((row: any) => {
                        const uploaded = Array.isArray(row.uploaded) ? row.uploaded : [];
                        const skipped = Array.isArray(row.skipped) ? row.skipped : [];
                        const duplicateSkips = skipped.filter(
                          (doc: any) => textValue(doc.reason) === "already-uploaded-to-clio"
                        );
                        const rowKey = textValue(row.id);
                        const isExpanded = expandedFinalizationId === rowKey;
                        const requestedKeys = Array.isArray(row.requestedKeys) ? row.requestedKeys : [];
                        const uploadTarget = row.clioUploadTarget || {};
                        const validation = row.validationSnapshot || {};
                        const packetSummary = row.packetSummarySnapshot || {};
                        const validationWarnings = Array.isArray(validation.warnings) ? validation.warnings : [];
                        const validationBlockingErrors = Array.isArray(validation.blockingErrors) ? validation.blockingErrors : [];

                        return (
                          <div
                            key={rowKey}
                            style={{
                              marginBottom: 10,
                              padding: 10,
                              background: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 4,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                                alignItems: "flex-start",
                              }}
                            >
                              <div>
                                <div>
                                  <strong>
                                    {row.finalizedAt
                                      ? new Date(row.finalizedAt).toLocaleString()
                                      : "Unknown date"}
                                  </strong>{" "}
                                  — {textValue(row.status) || "unknown status"}
                                </div>
                                <div style={{ color: "#475569", marginTop: 2 }}>
                                  Audit ID {rowKey} · Uploaded {uploaded.length} · Skipped {skipped.length}
                                  {row.noUploadPerformed ? " · No upload performed" : ""}
                                  {row.allowDuplicateUploads ? " · Duplicate override allowed" : ""}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedFinalizationId(isExpanded ? null : rowKey)
                                }
                                style={{
                                  fontSize: 12,
                                  padding: "3px 8px",
                                  border: "1px solid #94a3b8",
                                  borderRadius: 4,
                                  background: isExpanded ? "#e2e8f0" : "#fff",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {isExpanded ? "Hide Details" : "Details"}
                              </button>
                            </div>

                            {uploaded.length > 0 && (
                              <div style={{ color: "#065f46", marginTop: 4 }}>
                                Uploaded:{" "}
                                {uploaded
                                  .map((doc: any) => `${textValue(doc.label) || textValue(doc.key)}${doc.clioDocumentId ? ` (Clio ${doc.clioDocumentId})` : ""}`)
                                  .join(", ")}
                              </div>
                            )}

                            {duplicateSkips.length > 0 && (
                              <div style={{ color: "#92400e", marginTop: 4 }}>
                                Existing Clio duplicate skip:{" "}
                                {duplicateSkips
                                  .map((doc: any) => textValue(doc.label) || textValue(doc.key))
                                  .join(", ")}
                              </div>
                            )}

                            {textValue(row.error) && (
                              <div style={{ color: "#991b1b", marginTop: 4 }}>
                                <strong>Error:</strong> {textValue(row.error)}
                              </div>
                            )}

                            {isExpanded && (
                              <div
                                style={{
                                  marginTop: 10,
                                  padding: 10,
                                  background: "#f8fafc",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 4,
                                }}
                              >
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                    gap: 8,
                                    marginBottom: 10,
                                  }}
                                >
                                  <div>
                                    <strong>Master Lawsuit ID:</strong>
                                    <br />
                                    {textValue(row.masterLawsuitId) || "—"}
                                  </div>
                                  <div>
                                    <strong>Master Matter:</strong>
                                    <br />
                                    {textValue(row.masterDisplayNumber) || textValue(row.masterMatterId) || "—"}
                                  </div>
                                  <div>
                                    <strong>Requested Docs:</strong>
                                    <br />
                                    {requestedKeys.length > 0 ? requestedKeys.map(textValue).join(", ") : "—"}
                                  </div>
                                  <div>
                                    <strong>Audit Updated:</strong>
                                    <br />
                                    {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                    gap: 8,
                                    marginBottom: 10,
                                    padding: 8,
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 4,
                                  }}
                                >
                                  <div>
                                    <strong>Clio Target Type:</strong>
                                    <br />
                                    {textValue(uploadTarget.type) || "—"}
                                  </div>
                                  <div>
                                    <strong>Target Matter ID:</strong>
                                    <br />
                                    {textValue(uploadTarget.matterId) || textValue(row.masterMatterId) || "—"}
                                  </div>
                                  <div>
                                    <strong>Would Upload To Clio:</strong>
                                    <br />
                                    {uploadTarget.wouldUploadToClio ? "Yes" : "No"}
                                  </div>
                                </div>

                                <div style={{ marginBottom: 10 }}>
                                  <strong>Uploaded Documents</strong>
                                  {uploaded.length === 0 ? (
                                    <div style={{ color: "#475569", marginTop: 4 }}>
                                      No documents were uploaded in this finalization attempt.
                                    </div>
                                  ) : (
                                    <table
                                      style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        marginTop: 4,
                                        background: "#fff",
                                      }}
                                    >
                                      <thead>
                                        <tr>
                                          <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Document</th>
                                          <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Filename</th>
                                          <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Clio Document ID</th>
                                          <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Fully Uploaded</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {uploaded.map((doc: any, index: number) => (
                                          <tr key={`${textValue(doc.key) || textValue(doc.filename)}-${index}`}>
                                            <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                              {textValue(doc.label) || textValue(doc.key) || "—"}
                                            </td>
                                            <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                              {textValue(doc.filename) || "—"}
                                            </td>
                                            <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                              {textValue(doc.clioDocumentId) || "—"}
                                            </td>
                                            <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                              {doc.fullyUploaded ? "Yes" : "No"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>

                                <div style={{ marginBottom: 10 }}>
                                  <strong>Skipped Documents</strong>
                                  {skipped.length === 0 ? (
                                    <div style={{ color: "#475569", marginTop: 4 }}>
                                      No documents were skipped in this finalization attempt.
                                    </div>
                                  ) : (
                                    <table
                                      style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        marginTop: 4,
                                        background: "#fff",
                                      }}
                                    >
                                      <thead>
                                        <tr>
                                          <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Document</th>
                                          <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Reason</th>
                                          <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Filename</th>
                                          <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Existing Clio Docs</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {skipped.map((doc: any, index: number) => (
                                          <tr key={`${textValue(doc.key) || textValue(doc.filename)}-${index}`}>
                                            <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                              {textValue(doc.label) || textValue(doc.key) || "—"}
                                            </td>
                                            <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                              {textValue(doc.reason) || "—"}
                                            </td>
                                            <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                              {textValue(doc.filename) || "—"}
                                            </td>
                                            <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                              {Array.isArray(doc.existingClioDocuments)
                                                ? doc.existingClioDocuments.length
                                                : 0}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                    gap: 8,
                                    marginBottom: 10,
                                    padding: 8,
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 4,
                                  }}
                                >
                                  <div>
                                    <strong>Can Generate:</strong>
                                    <br />
                                    {validation.canGenerate ? "Yes" : "No"}
                                  </div>
                                  <div>
                                    <strong>Warnings:</strong>
                                    <br />
                                    {validationWarnings.length}
                                  </div>
                                  <div>
                                    <strong>Blocking Errors:</strong>
                                    <br />
                                    {validationBlockingErrors.length}
                                  </div>
                                  <div>
                                    <strong>Amount Mode:</strong>
                                    <br />
                                    {textValue(packetSummary.amountSoughtMode) || "—"}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                    gap: 8,
                                    marginBottom: 10,
                                    padding: 8,
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 4,
                                  }}
                                >
                                  <div>
                                    <strong>Venue:</strong>
                                    <br />
                                    {textValue(packetSummary.venue) || "—"}
                                  </div>
                                  <div>
                                    <strong>Provider:</strong>
                                    <br />
                                    {textValue(packetSummary.provider) || "—"}
                                  </div>
                                  <div>
                                    <strong>Patient:</strong>
                                    <br />
                                    {textValue(packetSummary.patient) || "—"}
                                  </div>
                                  <div>
                                    <strong>Insurer:</strong>
                                    <br />
                                    {textValue(packetSummary.insurer) || "—"}
                                  </div>
                                  <div>
                                    <strong>Claim Number:</strong>
                                    <br />
                                    {textValue(packetSummary.claimNumber) || "—"}
                                  </div>
                                  <div>
                                    <strong>Bill Count:</strong>
                                    <br />
                                    {textValue(packetSummary.billCount) || "—"}
                                  </div>
                                  <div>
                                    <strong>Amount Sought:</strong>
                                    <br />
                                    {textValue(packetSummary.amountSought) ? money(packetSummary.amountSought) : "—"}
                                  </div>
                                  <div>
                                    <strong>Index / AAA:</strong>
                                    <br />
                                    {textValue(packetSummary.indexAaaNumber) || "—"}
                                  </div>
                                </div>

                                <details style={{ marginBottom: 6 }}>
                                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                                    Raw Clio upload target JSON
                                  </summary>
                                  <pre
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      overflowX: "auto",
                                      margin: "4px 0 0 0",
                                      padding: 8,
                                      background: "#fff",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 4,
                                    }}
                                  >
                                    {JSON.stringify(uploadTarget, null, 2)}
                                  </pre>
                                </details>

                                <details style={{ marginBottom: 6 }}>
                                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                                    Raw uploaded/skipped documents JSON
                                  </summary>
                                  <pre
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      overflowX: "auto",
                                      margin: "4px 0 0 0",
                                      padding: 8,
                                      background: "#fff",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 4,
                                    }}
                                  >
                                    {JSON.stringify({ uploaded, skipped }, null, 2)}
                                  </pre>
                                </details>

                                <details style={{ marginBottom: 6 }}>
                                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                                    Raw validation snapshot JSON
                                  </summary>
                                  <pre
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      overflowX: "auto",
                                      margin: "4px 0 0 0",
                                      padding: 8,
                                      background: "#fff",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 4,
                                    }}
                                  >
                                    {JSON.stringify(validation, null, 2)}
                                  </pre>
                                </details>

                                <details>
                                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                                    Raw packet summary snapshot JSON
                                  </summary>
                                  <pre
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      overflowX: "auto",
                                      margin: "4px 0 0 0",
                                      padding: 8,
                                      background: "#fff",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 4,
                                    }}
                                  >
                                    {JSON.stringify(packetSummary, null, 2)}
                                  </pre>
                                </details>

                                <div style={{ marginTop: 8, color: "#475569" }}>
                                  This drilldown displays local audit/history data only.  It does not verify current Clio document existence.
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {packetPreview?.packet?.masterLawsuitId && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 800 }}>Print Queue Preview</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => loadPrintQueuePreview(packetPreview.packet.masterLawsuitId)}
                        disabled={printQueuePreviewLoading}
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          border: "1px solid #94a3b8",
                          borderRadius: 4,
                          background: "#fff",
                          cursor: printQueuePreviewLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {printQueuePreviewLoading ? "Loading..." : "Refresh Print Preview"}
                      </button>
                      <button
                        type="button"
                        onClick={() => loadPrintQueueList(packetPreview.packet.masterLawsuitId)}
                        disabled={printQueueListLoading}
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          border: "1px solid #94a3b8",
                          borderRadius: 4,
                          background: "#fff",
                          cursor: printQueueListLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {printQueueListLoading ? "Loading..." : "Refresh Queue List"}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: 4, color: "#475569", fontSize: 12 }}>
                    Read-only print-candidate preview from local finalization audit records, verified against the current Clio master matter Documents tab.  This does not create a print queue.
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      Existing Print Queue Items
                    </div>

                    <div style={{ color: "#475569", marginBottom: 6 }}>
                      Local print queue records for this lawsuit.  Status controls update only local print queue records; they do not change Clio, upload documents, create folders, or modify document contents.
                    </div>

                    {printQueueStatusResult && (
                      <div
                        style={{
                          marginBottom: 8,
                          padding: 8,
                          background: printQueueStatusResult.ok ? "#f0fdf4" : "#fef2f2",
                          border: `1px solid ${printQueueStatusResult.ok ? "#bbf7d0" : "#fecaca"}`,
                          borderRadius: 4,
                          color: printQueueStatusResult.ok ? "#166534" : "#991b1b",
                        }}
                      >
                        {printQueueStatusResult.ok ? (
                          <>
                            Print queue status updated to {textValue(printQueueStatusResult.status) || "—"}.
                          </>
                        ) : (
                          <>
                            <strong>Error:</strong> {textValue(printQueueStatusResult.error)}
                          </>
                        )}
                      </div>
                    )}

                    {printQueueList?.ok && (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        {([
                          ["", "All", "all"],
                          ["queued", "Queued", "queued"],
                          ["printed", "Printed", "printed"],
                          ["hold", "Hold", "hold"],
                          ["skipped", "Skipped", "skipped"],
                        ] as const).map(([value, label, countKey]) => {
                          const active = printQueueStatusFilter === value;
                          const count = num(printQueueList?.statusCounts?.[countKey]);

                          return (
                            <button
                              key={countKey}
                              type="button"
                              onClick={() => changePrintQueueStatusFilter(value)}
                              disabled={printQueueListLoading}
                              style={{
                                fontSize: 12,
                                padding: "3px 8px",
                                border: `1px solid ${active ? "#0f172a" : "#94a3b8"}`,
                                borderRadius: 999,
                                background: active ? "#e2e8f0" : "#fff",
                                cursor: printQueueListLoading ? "not-allowed" : "pointer",
                                fontWeight: active ? 800 : 500,
                              }}
                            >
                              {label}: {count}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {printQueueListLoading && !printQueueList && (
                      <div style={{ color: "#475569" }}>Loading print queue...</div>
                    )}

                    {printQueueList?.error && (
                      <div style={{ color: "#991b1b" }}>
                        <strong>Error:</strong> {textValue(printQueueList.error)}
                      </div>
                    )}

                    {printQueueList?.ok && num(printQueueList.count) === 0 && (
                      <div style={{ color: "#475569" }}>
                        {printQueueStatusFilter
                          ? `No print queue items currently match status "${printQueueStatusFilter}" for this lawsuit.`
                          : "No documents are currently queued for printing for this lawsuit."}
                      </div>
                    )}

                    {printQueueList?.ok && Array.isArray(printQueueList.rows) && printQueueList.rows.length > 0 && (
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          background: "#fff",
                        }}
                      >
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Document</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Filename</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Status</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Queued At</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Printed At</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Clio Document ID</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printQueueList.rows.map((row: any) => (
                            <tr key={textValue(row.id)}>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(row.documentLabel) || textValue(row.documentKey) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(row.filename) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(row.status) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(row.queuedAt) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(row.printedAt) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(row.clioDocumentId) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {(["printed", "hold", "skipped", "queued"] as const).map((statusOption) => (
                                    <button
                                      key={`${textValue(row.id)}-${statusOption}`}
                                      type="button"
                                      onClick={() => updatePrintQueueStatus(row, statusOption)}
                                      disabled={
                                        printQueueStatusLoadingId === Number(row.id) ||
                                        textValue(row.status).toLowerCase() === statusOption
                                      }
                                      style={{
                                        fontSize: 11,
                                        padding: "2px 6px",
                                        border: "1px solid #94a3b8",
                                        borderRadius: 4,
                                        background:
                                          textValue(row.status).toLowerCase() === statusOption
                                            ? "#e2e8f0"
                                            : "#fff",
                                        cursor:
                                          printQueueStatusLoadingId === Number(row.id) ||
                                          textValue(row.status).toLowerCase() === statusOption
                                            ? "not-allowed"
                                            : "pointer",
                                      }}
                                    >
                                      {printQueueStatusLoadingId === Number(row.id)
                                        ? "Updating..."
                                        : statusOption === "printed"
                                          ? "Printed"
                                          : statusOption === "hold"
                                            ? "Hold"
                                            : statusOption === "skipped"
                                              ? "Skipped"
                                              : "Re-Queue"}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {printQueuePreview?.error && (
                    <div style={{ marginTop: 8, color: "#991b1b", fontSize: 12 }}>
                      <strong>Error:</strong> {textValue(printQueuePreview.error)}
                    </div>
                  )}

                  {printQueuePreviewLoading && !printQueuePreview && (
                    <div style={{ marginTop: 8, color: "#475569", fontSize: 12 }}>
                      Loading print queue preview...
                    </div>
                  )}

                  {printQueuePreview?.ok && num(printQueuePreview.candidateDocumentCount) === 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 4,
                        color: "#475569",
                        fontSize: 12,
                      }}
                    >
                      No currently verified printable finalized documents are proposed for this lawsuit.  Duplicate-only, no-upload, or unverified finalization audit rows are intentionally excluded.
                    </div>
                  )}

                  {printQueuePreview?.ok && Array.isArray(printQueuePreview.candidateDocuments) && printQueuePreview.candidateDocuments.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      <div
                        style={{
                          marginBottom: 6,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "center",
                          color: "#475569",
                        }}
                      >
                        <div>
                          Candidate documents: {num(printQueuePreview.candidateDocumentCount)}
                        </div>
                        <button
                          type="button"
                          onClick={() => addVerifiedCandidatesToPrintQueue(packetPreview.packet.masterLawsuitId)}
                          disabled={printQueueAddLoading}
                          style={{
                            fontSize: 12,
                            padding: "3px 8px",
                            border: "1px solid #15803d",
                            borderRadius: 4,
                            background: "#f0fdf4",
                            color: "#166534",
                            cursor: printQueueAddLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          {printQueueAddLoading ? "Adding..." : "Add Verified Candidates to Print Queue"}
                        </button>
                      </div>

                      {printQueueAddResult && (
                        <div
                          style={{
                            marginBottom: 8,
                            padding: 8,
                            background: printQueueAddResult.ok ? "#f0fdf4" : "#fef2f2",
                            border: `1px solid ${printQueueAddResult.ok ? "#bbf7d0" : "#fecaca"}`,
                            borderRadius: 4,
                            color: printQueueAddResult.ok ? "#166534" : "#991b1b",
                          }}
                        >
                          {printQueueAddResult.ok ? (
                            <>
                              Added {num(printQueueAddResult.createdCount)} document(s) to the print queue.
                              {num(printQueueAddResult.existingCount) > 0
                                ? `  ${num(printQueueAddResult.existingCount)} duplicate queue item(s) were already present.`
                                : ""}
                            </>
                          ) : (
                            <>
                              <strong>Error:</strong> {textValue(printQueueAddResult.error)}
                            </>
                          )}
                        </div>
                      )}

                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          background: "#fff",
                        }}
                      >
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Document</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Filename</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Clio Document ID</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Audit ID</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 4 }}>Verified in Clio Now?</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printQueuePreview.candidateDocuments.map((doc: any, index: number) => (
                            <tr key={`${textValue(doc.finalizationId)}-${textValue(doc.key)}-${index}`}>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(doc.label) || textValue(doc.key) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(doc.filename) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(doc.clioDocumentId) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {textValue(doc.finalizationId) || "—"}
                              </td>
                              <td style={{ borderBottom: "1px solid #f1f5f9", padding: 4 }}>
                                {doc.currentClioExistenceVerified ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ marginTop: 8, color: "#475569" }}>
                        These are proposed print candidates only.  Each listed document has been verified against the current Clio master matter Documents tab, which remains the record-copy source of truth.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {packetPreview.packet.validation?.blockingErrors?.length > 0 && (
                <div style={{ color: "#991b1b", marginBottom: 8 }}>
                  <strong>Blocking Errors:</strong>{" "}
                  {packetPreview.packet.validation.blockingErrors.join("; ")}
                </div>
              )}

              {packetPreview.packet.validation?.warnings?.length > 0 && (
                <div style={{ color: "#92400e", marginBottom: 8 }}>
                  <strong>Warnings:</strong>{" "}
                  {packetPreview.packet.validation.warnings.join("; ")}
                </div>
              )}

              <details open style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                  Child Bill Matters
                </summary>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: 8,
                    background: "#fff",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>Matter</th>
                      <th style={thStyle}>Patient</th>
                      <th style={thStyle}>Provider</th>
                      <th style={thStyle}>DOS</th>
                      <th style={thStyle}>Claim Amount</th>
                      <th style={thStyle}>Balance Presuit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(packetPreview.packet.childMatters || []).map((child: any) => (
                      <tr key={String(child.matterId)}>
                        <td style={tdStyle}>
                          {child.matterId ? (
                            <a
                              href={clioMatterUrl(child.matterId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#2563eb",
                                fontWeight: 700,
                                textDecoration: "underline",
                              }}
                            >
                              {textValue(child.displayNumber)}
                            </a>
                          ) : (
                            textValue(child.displayNumber)
                          )}
                        </td>
                        <td style={tdStyle}>{textValue(child.patientName)}</td>
                        <td style={tdStyle}>{textValue(child.providerName)}</td>
                        <td style={tdStyle}>{formatDOS(child.dosStart, child.dosEnd)}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          {money(child.claimAmount)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          {money(child.balancePresuit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          )}
        </section>
      )}

      
<div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
  <label style={{ cursor: "pointer", fontSize: 14 }}>
    <input
      type="checkbox"
      checked={showClosed}
      onChange={(e) => setShowClosed(e.target.checked)}
      style={{ marginRight: 6 }}
    />
    Include closed matters
  </label>
</div>

<table style={{ width: "100%", borderCollapse: "collapse"  }}>
        <thead>
          <tr>
            <th style={thStyle}>Select</th>
            <th style={thStyle}>Matter</th>
            <th style={thStyle}>Patient</th>
            <th style={thStyle}>Provider</th>
            <th style={thStyle}>Insurer</th>
            <th style={thStyle}>Date of Service</th>
            <th style={thStyle}>Claim Amount</th>
            <th style={thStyle}>Payment (Voluntary)</th>
            <th style={thStyle}>Balance (Presuit)</th>
            <th style={thStyle}>Denial Reason</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Final Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {displayRows.map((r) => {
            const claim = num(r.claimAmount);
            const payment = num(r.paymentVoluntary);
            const balance = claim - payment;
            const isSelected = selected.includes(Number(r.id));
            const aggregated = isAggregated(r);
            const isMaster = !!(r.isMaster || r.is_master);
            const selectable = isSelectable(r);
            const locked = isMaster || aggregated || !selectable;
            const masterLawsuitId = textValue(r.masterLawsuitId);
            const lawsuitColor = aggregated
              ? getColorForLawsuit(String(r.masterLawsuitId))
              : "";

            return (
              <Fragment key={`row-fragment-${Number(r.id)}`}>
                {r.showGroupLabel && (
                  <tr key={`lawsuit-band-${masterLawsuitId}`}>
                    <td
                      colSpan={13}
                      style={{
                        padding: "5px 10px",
                        border: "1px solid #bfbfbf",
                        background: "#d9d9d9",
                        color: "#111827",
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: 0.2,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto 1fr",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span />

                        <div style={{ textAlign: "center" }}>
                          <span style={{ color: "#6b7280" }}>•••</span>
                          <span style={{ margin: "0 12px" }}>
                            LAWSUIT {masterLawsuitId}
                          </span>
                          <span style={{ color: "#6b7280" }}>•••</span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openMetadataModalForMaster(masterLawsuitId)}
                            disabled={packetLoading}
                            style={{
                              padding: "3px 8px",
                              border: "1px solid #4b5563",
                              background: packetLoading ? "#f3f4f6" : "#4b5563",
                              color: packetLoading ? "#666" : "#fff",
                              borderRadius: 4,
                              cursor: packetLoading ? "not-allowed" : "pointer",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Edit Metadata
                          </button>

                          <button
                            type="button"
                            onClick={() => loadPacketPreviewForMaster(masterLawsuitId)}
                            disabled={packetLoading}
                            style={{
                              padding: "3px 8px",
                              border: "1px solid #2563eb",
                              background: packetLoading ? "#f3f4f6" : "#2563eb",
                              color: packetLoading ? "#666" : "#fff",
                              borderRadius: 4,
                              cursor: packetLoading ? "not-allowed" : "pointer",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Packet Preview
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

              <tr
                key={Number(r.id)}
                style={{
                  background: isMaster
                    ? "#ffe9b3"
                    : aggregated
                    ? lawsuitColor
                    : !selectable
                    ? "#f5f5f5"
                    : isSelected
                    ? "#eaf2ff"
                    : "#ffffff",
                  opacity: locked ? 0.8 : 1,
                  borderLeft: aggregated ? `4px solid ${lawsuitColor}` : undefined,
                }}
              >
                <td
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: 46,
                      position: "relative",
                    }}
                    title={
                      aggregated
                        ? `Already aggregated under ${textValue(r.masterLawsuitId)}`
                        : !selectable
                        ? `Stage: ${r?.stage?.name || r?.matterStage?.name || "N/A"} | Status: ${r?.status || "N/A"}`
                        : ""
                    }
                  >
                    {locked ? (
                      <span style={{ fontSize: 18, lineHeight: 1 }}>🔒</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!selectable}
                        onChange={() => toggle(Number(r.id))}
                        style={{
                          width: 18,
                          height: 18,
                          cursor: selectable ? "pointer" : "not-allowed",
                          margin: 0,
                        }}
                      />
                    )}
                  </div>
                </td>

                <td style={tdStyle}>
                  {aggregated ? "🔒 " : ""}
                  <a
                    href={`/matter/${Number(r.id)}`}
                    style={{
                      color: "#0057b8",
                      textDecoration: "underline",
                      fontWeight: Number(r.id) === Number(matter?.id) ? 700 : 500,
                    }}
                  >
                    {isMaster ? "⭐ MASTER — " : ""}{textValue(r.displayNumber)}
                  </a>
                  {aggregated && r.masterLawsuitId
                    ? ` (${textValue(r.masterLawsuitId)})`
                    : ""}
                </td>
                <td style={tdStyle}>{textValue(r.patient)}</td>
                <td style={tdStyle}>{providerValue(r)}</td>
                <td style={tdStyle}>{insurerValue(r)}</td>
                <td style={tdStyle}>{formatDOS(r.dosStart, r.dosEnd)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{money(claim)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{money(payment)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{money(balance)}</td>
                <td style={tdStyle}>{denialReasonValue(r)}</td>
                <td
                  style={{
                    ...tdStyle,
                    
                    whiteSpace: "nowrap",
                  }}
                >
                  {textValue(r?.matterStage?.name)}
                </td>
                <td style={{ ...tdStyle }}>
                  {textValue(r.closeReason || "")}
                </td>
                <td style={{ ...tdStyle, textAlign: "center", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => {
                      setCloseMatterTarget(r);
                      setCloseReason("");
                      setShowCloseModal(true);
                    }}
                    disabled={!!String(r.closeReason || "").trim()}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #dc2626",
                      background: !!String(r.closeReason || "").trim()
                        ? "#f3f4f6"
                        : "#fee2e2",
                      color: !!String(r.closeReason || "").trim()
                        ? "#6b7280"
                        : "#991b1b",
                      borderRadius: 4,
                      cursor: !!String(r.closeReason || "").trim()
                        ? "not-allowed"
                        : "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Close
                  </button>
                </td>
              </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
        </>
      )}

    </main>

    {showMetadataModal && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            width: 520,
            maxWidth: "calc(100vw - 32px)",
            background: "#fff",
            borderRadius: 8,
            padding: 22,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Edit Lawsuit Metadata</h2>

          <p style={{ marginBottom: 16, color: "#444", lineHeight: 1.45 }}>
            Venue, Amount Sought, and notes are stored locally for lawsuit metadata and document packet generation.
            Index / AAA Number and lawsuit matter display numbers are written to Clio as post-filing fields.
          </p>

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Venue
          </label>
          <select
            value={metadataEdit.venueSelection}
            onChange={(e) =>
              setMetadataEdit((prev) => ({
                ...prev,
                venueSelection: e.target.value,
                venueOther: e.target.value === "Other" ? prev.venueOther : "",
              }))
            }
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              border: "1px solid #bbb",
              borderRadius: 4,
            }}
          >
            <option value="">Select Venue</option>
            {VENUE_OPTIONS.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>

          {metadataEdit.venueSelection === "Other" && (
            <input
              value={metadataEdit.venueOther}
              onChange={(e) =>
                setMetadataEdit((prev) => ({
                  ...prev,
                  venueOther: e.target.value,
                }))
              }
              placeholder="Enter venue"
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 14,
                border: "1px solid #bbb",
                borderRadius: 4,
              }}
            />
          )}

          <fieldset
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 12,
              margin: "8px 0 14px",
            }}
          >
            <legend style={{ fontWeight: 700, padding: "0 6px" }}>
              Amount Sought
            </legend>

            <label style={{ display: "block", marginBottom: 8 }}>
              <input
                type="radio"
                name="metadataAmountSoughtMode"
                value="balance_presuit"
                checked={metadataEdit.amountSoughtMode === "balance_presuit"}
                onChange={() =>
                  setMetadataEdit((prev) => ({
                    ...prev,
                    amountSoughtMode: "balance_presuit",
                    customAmountSought: "",
                  }))
                }
                style={{ marginRight: 8 }}
              />
              Balance (Presuit) — default
            </label>

            <label style={{ display: "block", marginBottom: 8 }}>
              <input
                type="radio"
                name="metadataAmountSoughtMode"
                value="claim_amount"
                checked={metadataEdit.amountSoughtMode === "claim_amount"}
                onChange={() =>
                  setMetadataEdit((prev) => ({
                    ...prev,
                    amountSoughtMode: "claim_amount",
                    customAmountSought: "",
                  }))
                }
                style={{ marginRight: 8 }}
              />
              Claim Amount
            </label>

            <label style={{ display: "block", marginBottom: 8 }}>
              <input
                type="radio"
                name="metadataAmountSoughtMode"
                value="custom"
                checked={metadataEdit.amountSoughtMode === "custom"}
                onChange={() =>
                  setMetadataEdit((prev) => ({
                    ...prev,
                    amountSoughtMode: "custom",
                  }))
                }
                style={{ marginRight: 8 }}
              />
              Custom Amount
            </label>

            {metadataEdit.amountSoughtMode === "custom" && (
              <input
                value={metadataEdit.customAmountSought}
                onChange={(e) =>
                  setMetadataEdit((prev) => ({
                    ...prev,
                    customAmountSought: e.target.value,
                  }))
                }
                placeholder="Enter total lawsuit amount sought"
                style={{
                  width: "100%",
                  padding: 10,
                  marginTop: 2,
                  border: "1px solid #bbb",
                  borderRadius: 4,
                }}
              />
            )}
          </fieldset>

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Index / AAA Number
          </label>
          <input
            value={metadataEdit.indexAaaNumber}
            onChange={(e) =>
              setMetadataEdit((prev) => ({
                ...prev,
                indexAaaNumber: e.target.value,
              }))
            }
            placeholder="Enter after filing"
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 14,
              border: "1px solid #bbb",
              borderRadius: 4,
            }}
          />

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Notes
          </label>
          <textarea
            value={metadataEdit.lawsuitNotes}
            onChange={(e) =>
              setMetadataEdit((prev) => ({
                ...prev,
                lawsuitNotes: e.target.value,
              }))
            }
            placeholder="Optional"
            rows={3}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 18,
              border: "1px solid #bbb",
              borderRadius: 4,
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setShowMetadataModal(false)}
              disabled={metadataSaving}
              style={{
                padding: "8px 12px",
                border: "1px solid #aaa",
                background: "#fff",
                borderRadius: 4,
                cursor: metadataSaving ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              onClick={saveMetadataEdit}
              disabled={
                metadataSaving ||
                (metadataEdit.amountSoughtMode === "custom" &&
                  parseMoneyInput(metadataEdit.customAmountSought) === null)
              }
              style={{
                padding: "8px 12px",
                border: "1px solid #2563eb",
                background:
                  metadataSaving ||
                  (metadataEdit.amountSoughtMode === "custom" &&
                    parseMoneyInput(metadataEdit.customAmountSought) === null)
                    ? "#f3f4f6"
                    : "#2563eb",
                color:
                  metadataSaving ||
                  (metadataEdit.amountSoughtMode === "custom" &&
                    parseMoneyInput(metadataEdit.customAmountSought) === null)
                    ? "#666"
                    : "#fff",
                borderRadius: 4,
                cursor:
                  metadataSaving ||
                  (metadataEdit.amountSoughtMode === "custom" &&
                    parseMoneyInput(metadataEdit.customAmountSought) === null)
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 700,
              }}
            >
              {metadataSaving ? "Saving..." : "Save Metadata"}
            </button>
          </div>
        </div>
      </div>
    )}

    {showLawsuitOptionsModal && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            width: 560,
            maxWidth: "calc(100vw - 32px)",
            background: "#fff",
            borderRadius: 8,
            padding: 22,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Lawsuit Generation Options</h2>

          <p style={{ marginBottom: 16, color: "#444" }}>
            These options will be stored with the lawsuit and used for amount-sought calculation,
            document packet metadata, and future document generation.
          </p>

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Venue
          </label>
          <select
            value={lawsuitOptions.venue}
            onChange={(e) =>
              setLawsuitOptions((prev) => ({
                ...prev,
                venue: e.target.value,
                venueOther: e.target.value === "Other" ? prev.venueOther : "",
              }))
            }
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              border: "1px solid #bbb",
              borderRadius: 4,
            }}
          >
            <option value="">Select Venue</option>
            {VENUE_OPTIONS.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>

          {lawsuitOptions.venue === "Other" && (
            <input
              value={lawsuitOptions.venueOther}
              onChange={(e) =>
                setLawsuitOptions((prev) => ({
                  ...prev,
                  venueOther: e.target.value,
                }))
              }
              placeholder="Enter venue"
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 14,
                border: "1px solid #bbb",
                borderRadius: 4,
              }}
            />
          )}

          <fieldset
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 12,
              margin: "8px 0 14px",
            }}
          >
            <legend style={{ fontWeight: 700, padding: "0 6px" }}>
              Amount Sought
            </legend>

            <label style={{ display: "block", marginBottom: 8 }}>
              <input
                type="radio"
                name="amountSoughtMode"
                value="balance_presuit"
                checked={lawsuitOptions.amountSoughtMode === "balance_presuit"}
                onChange={() =>
                  setLawsuitOptions((prev) => ({
                    ...prev,
                    amountSoughtMode: "balance_presuit",
                    customAmountSought: "",
                  }))
                }
                style={{ marginRight: 8 }}
              />
              Balance (Presuit) — default
            </label>

            <label style={{ display: "block", marginBottom: 8 }}>
              <input
                type="radio"
                name="amountSoughtMode"
                value="claim_amount"
                checked={lawsuitOptions.amountSoughtMode === "claim_amount"}
                onChange={() =>
                  setLawsuitOptions((prev) => ({
                    ...prev,
                    amountSoughtMode: "claim_amount",
                    customAmountSought: "",
                  }))
                }
                style={{ marginRight: 8 }}
              />
              Claim Amount
            </label>

            <label style={{ display: "block", marginBottom: 8 }}>
              <input
                type="radio"
                name="amountSoughtMode"
                value="custom"
                checked={lawsuitOptions.amountSoughtMode === "custom"}
                onChange={() =>
                  setLawsuitOptions((prev) => ({
                    ...prev,
                    amountSoughtMode: "custom",
                  }))
                }
                style={{ marginRight: 8 }}
              />
              Custom Amount
            </label>

            {lawsuitOptions.amountSoughtMode === "custom" && (
              <input
                value={lawsuitOptions.customAmountSought}
                onChange={(e) =>
                  setLawsuitOptions((prev) => ({
                    ...prev,
                    customAmountSought: e.target.value,
                  }))
                }
                placeholder="Enter total lawsuit amount sought"
                style={{
                  width: "100%",
                  padding: 10,
                  marginTop: 2,
                  border: "1px solid #bbb",
                  borderRadius: 4,
                }}
              />
            )}
          </fieldset>

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Index / AAA Number
          </label>
          <input
            value={lawsuitOptions.indexAaaNumber}
            onChange={(e) =>
              setLawsuitOptions((prev) => ({
                ...prev,
                indexAaaNumber: e.target.value,
              }))
            }
            placeholder="Optional"
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 14,
              border: "1px solid #bbb",
              borderRadius: 4,
            }}
          />

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Additional Metadata / Notes
          </label>
          <textarea
            value={lawsuitOptions.notes}
            onChange={(e) =>
              setLawsuitOptions((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            placeholder="Optional"
            rows={3}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 18,
              border: "1px solid #bbb",
              borderRadius: 4,
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setShowLawsuitOptionsModal(false)}
              disabled={submitting}
              style={{
                padding: "8px 12px",
                border: "1px solid #aaa",
                background: "#fff",
                borderRadius: 4,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              onClick={submitAggregationWithOptions}
              disabled={
                submitting ||
                (lawsuitOptions.amountSoughtMode === "custom" &&
                  parseMoneyInput(lawsuitOptions.customAmountSought) === null)
              }
              style={{
                padding: "8px 12px",
                border: "1px solid #0070f3",
                background:
                  submitting ||
                  (lawsuitOptions.amountSoughtMode === "custom" &&
                    parseMoneyInput(lawsuitOptions.customAmountSought) === null)
                    ? "#f3f4f6"
                    : "#0070f3",
                color:
                  submitting ||
                  (lawsuitOptions.amountSoughtMode === "custom" &&
                    parseMoneyInput(lawsuitOptions.customAmountSought) === null)
                    ? "#666"
                    : "#fff",
                borderRadius: 4,
                cursor:
                  submitting ||
                  (lawsuitOptions.amountSoughtMode === "custom" &&
                    parseMoneyInput(lawsuitOptions.customAmountSought) === null)
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 700,
              }}
            >
              {submitting ? "Generating..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    )}

    {showCloseModal && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            width: 460,
            background: "#fff",
            borderRadius: 8,
            padding: 22,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Close Matter in Clio</h2>

          <p style={{ marginBottom: 14 }}>
            This will close matter <strong>{textValue(closeMatterTarget?.displayNumber)}</strong> in Clio
            and write the selected Close Reason.
          </p>

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Close Reason
          </label>

          <select
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 18,
              border: "1px solid #bbb",
              borderRadius: 4,
            }}
          >
            <option value="">Select Close Reason</option>
            {VALID_CLOSE_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => {
                setShowCloseModal(false);
                setCloseMatterTarget(null);
                setCloseReason("");
              }}
              disabled={closing}
              style={{
                padding: "8px 12px",
                border: "1px solid #aaa",
                background: "#fff",
                borderRadius: 4,
                cursor: closing ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleCloseMatter}
              disabled={!closeReason || closing}
              style={{
                padding: "8px 12px",
                border: "1px solid #dc2626",
                background: !closeReason || closing ? "#f3f4f6" : "#dc2626",
                color: !closeReason || closing ? "#666" : "#fff",
                borderRadius: 4,
                cursor: !closeReason || closing ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {closing ? "Closing..." : "Close Matter"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}