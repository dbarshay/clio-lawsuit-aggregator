"use client";

import { useEffect, useMemo, useState } from "react";

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
  indexAaaNumber: string;
  lawsuitNotes: string;
};

function defaultLawsuitMetadataEdit(): LawsuitMetadataEdit {
  return {
    venueSelection: "",
    venueOther: "",
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
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [metadataEdit, setMetadataEdit] = useState<LawsuitMetadataEdit>(() =>
    defaultLawsuitMetadataEdit()
  );


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

    return json;
  }

  async function loadPacketPreview() {
    const masterLawsuitId = textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("This matter is not part of a lawsuit.");
      return;
    }

    setPacketLoading(true);

    try {
      await fetchPacketPreview(masterLawsuitId);
    } catch (err: any) {
      alert(err?.message || "Document packet preview failed.");
    } finally {
      setPacketLoading(false);
    }
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

  async function openMetadataModal() {
    const masterLawsuitId = textValue(matter?.masterLawsuitId);

    if (!masterLawsuitId) {
      alert("This matter is not part of a lawsuit.");
      return;
    }

    setPacketLoading(true);

    try {
      const json = packetPreview?.packet
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

      <hr style={{ margin: "18px 0 20px 0", border: 0, borderTop: "1px solid #999"  }} />

      {alreadyAggregated && (
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
                Read-only packet data for MASTER LAWSUIT ID {textValue(matter?.masterLawsuitId)}.
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

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
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
            const lawsuitColor = aggregated
              ? getColorForLawsuit(String(r.masterLawsuitId))
              : "";

            return (
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
                  borderTop: r.startsNewGroup ? "22px solid #d9d9d9" : undefined,
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
            );
          })}
        </tbody>
      </table>
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

          <p style={{ marginBottom: 16, color: "#444" }}>
            Updates are stored locally for document packet generation.  This does not write to Clio.
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
              disabled={metadataSaving}
              style={{
                padding: "8px 12px",
                border: "1px solid #2563eb",
                background: metadataSaving ? "#f3f4f6" : "#2563eb",
                color: metadataSaving ? "#666" : "#fff",
                borderRadius: 4,
                cursor: metadataSaving ? "not-allowed" : "pointer",
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