"use client";

import React, { useEffect, useMemo, useState } from "react";

type FilterKind = "patient" | "provider" | "insurer" | "claim" | "master";

type MatterRow = {
  id: string;
  displayNumber: string;
  patient: string;
  provider: string;
  insurer: string;
  claimNumber: string;
  masterLawsuitId: string;
  claimAmount: any;
  balancePresuit: any;
  matchedBy: string;
};

const colors = {
  ink: "#0f172a",
  muted: "#475569",
  subtle: "#64748b",
  line: "#d7dee9",
  lineSoft: "#e5e7eb",
  page: "#eef2f7",
  panel: "#ffffff",
  blue: "#3157d5",
  blueDark: "#1e3a8a",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
};

function clean(v: any) {
  return String(v || "").trim();
}

function nameLike(v: any) {
  if (v == null) return "";
  if (typeof v === "object") {
    return clean(
      v.name ??
        v.displayName ??
        v.display_name ??
        v.fullName ??
        v.full_name ??
        v.value ??
        ""
    );
  }

  return clean(v);
}

function matterId(m: any) {
  return clean(m?.matterId ?? m?.matter_id ?? m?.id);
}

function displayNumber(m: any) {
  return (
    clean(m?.displayNumber) ||
    clean(m?.display_number) ||
    clean(m?.matterNumber) ||
    clean(m?.matter_number) ||
    matterId(m)
  );
}

function patientName(m: any) {
  return nameLike(m?.patientName ?? m?.patient_name ?? m?.patient);
}

function providerName(m: any) {
  return nameLike(
    m?.clientName ??
      m?.client_name ??
      m?.providerName ??
      m?.provider_name ??
      m?.provider ??
      m?.client
  );
}

function insurerName(m: any) {
  return nameLike(
    m?.insurerName ??
      m?.insurer_name ??
      m?.insuranceCompany ??
      m?.insurance_company ??
      m?.insurer
  );
}

function claimNumberFromMatter(m: any) {
  return clean(
    m?.claimNumber ??
      m?.claim_number ??
      m?.claimNumberNormalized ??
      m?.claim_number_normalized
  );
}

function masterLawsuitId(m: any) {
  return clean(m?.masterLawsuitId ?? m?.master_lawsuit_id);
}

function money(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : "$0.00";
}

function parseMoneyDraft(v: any) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function moneyDraft(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function exactOrContains(haystack: string, q: string) {
  const h = clean(haystack).toLowerCase();
  const n = clean(q).toLowerCase();
  return h === n || h.includes(n);
}

function toMatterRow(row: any, matchedBy: string): MatterRow | null {
  const id = matterId(row);
  if (!id) return null;

  return {
    id,
    displayNumber: displayNumber(row),
    patient: patientName(row),
    provider: providerName(row),
    insurer: insurerName(row),
    claimNumber: claimNumberFromMatter(row),
    masterLawsuitId: masterLawsuitId(row),
    claimAmount: row?.claimAmount ?? row?.claim_amount,
    balancePresuit: row?.balancePresuit ?? row?.balance_presuit,
    matchedBy,
  };
}

function dedupe(rows: MatterRow[]) {
  const seen = new Set<string>();
  const out: MatterRow[] = [];

  for (const row of rows) {
    if (!row.id || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }

  return out;
}

async function fetchRows(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "Filtered matters lookup failed.");
  }

  return Array.isArray(json.rows) ? json.rows : [];
}

function getFilterFromUrl(): { kind: FilterKind | ""; value: string } {
  const params = new URLSearchParams(window.location.search);

  const patient = clean(params.get("patient"));
  const provider = clean(params.get("provider"));
  const insurer = clean(params.get("insurer"));
  const claim = clean(params.get("claim"));
  const master = clean(params.get("master"));

  if (patient) return { kind: "patient", value: patient };
  if (provider) return { kind: "provider", value: provider };
  if (insurer) return { kind: "insurer", value: insurer };
  if (claim) return { kind: "claim", value: claim };
  if (master) return { kind: "master", value: master };

  return { kind: "", value: "" };
}

function filterTitle(kind: FilterKind | "", value: string) {
  if (!kind || !value) return "Filtered Matters";
  if (kind === "patient") return `Matters for Patient: ${value}`;
  if (kind === "provider") return `Matters for Provider: ${value}`;
  if (kind === "insurer") return `Matters for Insurer: ${value}`;
  if (kind === "master") return `Matters for Master Lawsuit: ${value}`;
  return `Matters for Claim: ${value}`;
}

function filterLabel(kind: FilterKind | "") {
  if (kind === "patient") return "Patient";
  if (kind === "provider") return "Provider";
  if (kind === "insurer") return "Insurer";
  if (kind === "claim") return "Claim Number";
  if (kind === "master") return "Master Lawsuit";
  return "Filter";
}

function filteredUrl(kind: FilterKind, value: string) {
  const params = new URLSearchParams();
  params.set(kind, value);
  return `/matters?${params.toString()}`;
}

type WorkflowKind = "patient" | "claim" | "";
type MasterWorkspaceTab = "documents" | "settlement" | "close_paid_settlements";

function getWorkflowFromUrl(): WorkflowKind {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const workflow = String(params.get("workflow") || "").trim().toLowerCase();

  if (workflow === "patient") return "patient";
  if (workflow === "claim") return "claim";

  return "";
}

function workflowTitle(workflowKind: WorkflowKind, kind: FilterKind | "", value: string) {
  if (workflowKind === "patient") return `Patient Workflow: ${value}`;
  if (workflowKind === "claim") return `Claim Workflow: ${value}`;
  return filterTitle(kind, value);
}

function workflowNote(workflowKind: WorkflowKind) {
  if (workflowKind === "patient") {
    return "Patient-level working view.  Use this screen to review all matching patient matters without cluttering the direct matter workspace.";
  }

  if (workflowKind === "claim") {
    return "Claim-level working view.  Use this screen to review all matching claim matters and open the appropriate direct matter, patient view, claim view, or lawsuit group.";
  }

  return "";
}

export default function FilteredMattersPage() {
  const [kind, setKind] = useState<FilterKind | "">("");
  const [workflowKind, setWorkflowKind] = useState<WorkflowKind>("");
  const [value, setValue] = useState("");
  const [rows, setRows] = useState<MatterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMasterWorkspaceTab, setActiveMasterWorkspaceTab] = useState<MasterWorkspaceTab>("documents");
  const [masterSettlementDraft, setMasterSettlementDraft] = useState({
    settlementBasedOn: "lawsuit_amount",
    feeScheduleAmount: "",
    customAmount: "",
    settledWith: "",
    settlementPercent: "100.00",
    interestPercent: "0.00",
    attorneyFeeMode: "auto",
    customAttorneyFee: "",
    startDate: "",
    endDate: new Date().toISOString().slice(0, 10),
    settlementType: "",
    discontinuanceReason: "",
    notes: "",
  });
  const [masterSettlementBillDrafts, setMasterSettlementBillDrafts] = useState<Record<string, {
    settlementAmount?: string;
    interest?: string;
    attorneyFee?: string;
    filingFee?: string;
  }>>({});

  const totalClaimAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.claimAmount ?? 0) || 0), 0),
    [rows]
  );

  const totalBalancePresuit = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.balancePresuit ?? 0) || 0), 0),
    [rows]
  );

  const masterSettlementPercentNumber = Number(masterSettlementDraft.settlementPercent || 0) || 0;
  const masterInterestPercentNumber = Number(masterSettlementDraft.interestPercent || 0) || 0;

  const masterSettlementSelectedBaseAmount = useMemo(() => {
    if (masterSettlementDraft.settlementBasedOn === "fee_schedule_amount") {
      return parseMoneyDraft(masterSettlementDraft.feeScheduleAmount);
    }

    if (masterSettlementDraft.settlementBasedOn === "custom_amount") {
      return parseMoneyDraft(masterSettlementDraft.customAmount);
    }

    return totalBalancePresuit;
  }, [
    masterSettlementDraft.settlementBasedOn,
    masterSettlementDraft.feeScheduleAmount,
    masterSettlementDraft.customAmount,
    totalBalancePresuit,
  ]);

  const masterSettlementInterestDays = useMemo(() => {
    if (!masterSettlementDraft.startDate || !masterSettlementDraft.endDate) return 0;

    const start = new Date(`${masterSettlementDraft.startDate}T00:00:00`);
    const end = new Date(`${masterSettlementDraft.endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [masterSettlementDraft.startDate, masterSettlementDraft.endDate]);

  const masterAttorneyFeeMaxAmount = 1360;
  const masterAttorneyFeeAmount =
    masterSettlementDraft.attorneyFeeMode === "custom"
      ? parseMoneyDraft(masterSettlementDraft.customAttorneyFee)
      : masterAttorneyFeeMaxAmount;

  const masterSettlementDetailRows = useMemo(() => {
    return rows.map((row, index) => {
      const id = clean(row.id);
      const claimAmount = Number(row.claimAmount ?? 0) || 0;
      const balancePresuit = Number(row.balancePresuit ?? 0) || 0;
      const allocationRatio = totalBalancePresuit > 0 ? balancePresuit / totalBalancePresuit : 0;
      const isFirstSettlementBill = index === 0;
      const baseAmount =
        masterSettlementDraft.settlementBasedOn === "lawsuit_amount"
          ? balancePresuit
          : masterSettlementSelectedBaseAmount * allocationRatio;

      const defaultSettlementAmount = (baseAmount * masterSettlementPercentNumber) / 100;
      const defaultInterest = (defaultSettlementAmount * masterInterestPercentNumber) / 100;
      const draft = masterSettlementBillDrafts[id] || {};

      const settlementAmount =
        draft.settlementAmount !== undefined
          ? parseMoneyDraft(draft.settlementAmount)
          : defaultSettlementAmount;
      const interest =
        draft.interest !== undefined
          ? parseMoneyDraft(draft.interest)
          : defaultInterest;
      const attorneyFee = isFirstSettlementBill
        ? draft.attorneyFee !== undefined
          ? parseMoneyDraft(draft.attorneyFee)
          : masterAttorneyFeeAmount
        : 0;
      const filingFee = isFirstSettlementBill
        ? draft.filingFee !== undefined
          ? parseMoneyDraft(draft.filingFee)
          : 0
        : 0;
      const settlementTotal = settlementAmount + interest + attorneyFee + filingFee;

      return {
        ...row,
        billAmount: balancePresuit,
        claimAmount,
        baseAmount,
        settlementAmount,
        interest,
        attorneyFee,
        filingFee,
        settlementTotal,
        isFirstSettlementBill,
      };
    });
  }, [
    rows,
    totalBalancePresuit,
    masterSettlementDraft.settlementBasedOn,
    masterSettlementSelectedBaseAmount,
    masterSettlementPercentNumber,
    masterInterestPercentNumber,
    masterSettlementBillDrafts,
    masterAttorneyFeeAmount,
  ]);

  const masterSettlementSummary = useMemo(() => {
    return masterSettlementDetailRows.reduce(
      (acc, row: any) => {
        acc.baseAmount += Number(row.baseAmount ?? 0) || 0;
        acc.settlementAmount += Number(row.settlementAmount ?? 0) || 0;
        acc.interest += Number(row.interest ?? 0) || 0;
        acc.attorneyFee += Number(row.attorneyFee ?? 0) || 0;
        acc.filingFee += Number(row.filingFee ?? 0) || 0;
        acc.settlementTotal += Number(row.settlementTotal ?? 0) || 0;
        return acc;
      },
      {
        baseAmount: 0,
        settlementAmount: 0,
        interest: 0,
        attorneyFee: 0,
        filingFee: 0,
        settlementTotal: 0,
      }
    );
  }, [masterSettlementDetailRows]);

  const masterInsurerSummary = useMemo(() => {
    const insurers = Array.from(
      new Set(rows.map((row) => clean(row.insurer)).filter(Boolean))
    );

    if (insurers.length === 0) return "—";
    if (insurers.length === 1) return insurers[0];

    return `${insurers[0]} + ${insurers.length - 1} more`;
  }, [rows]);

  const masterClaimSummary = useMemo(() => {
    const claims = Array.from(
      new Set(rows.map((row) => clean(row.claimNumber)).filter(Boolean))
    );

    if (claims.length === 0) {
      return { label: "—", href: "" };
    }

    return {
      label: claims.length === 1 ? claims[0] : `${claims[0]} + ${claims.length - 1} more`,
      href: filteredUrl("claim", claims[0]),
    };
  }, [rows]);

  const masterServiceTypeSummary = useMemo(() => {
    const serviceTypes = Array.from(
      new Set(rows.map((row: any) => clean(row.serviceType || row.service_type)).filter(Boolean))
    );

    if (serviceTypes.length === 0) return "—";
    if (serviceTypes.length === 1) return serviceTypes[0];

    return `${serviceTypes[0]} + ${serviceTypes.length - 1} more`;
  }, [rows]);

  const masterTreatingProviderSummary = useMemo(() => {
    const treatingProviders = Array.from(
      new Set(rows.map((row: any) => clean(row.treatingProvider || row.treating_provider)).filter(Boolean))
    );

    if (treatingProviders.length === 0) return "—";
    if (treatingProviders.length === 1) return treatingProviders[0];

    return `${treatingProviders[0]} + ${treatingProviders.length - 1} more`;
  }, [rows]);

  const masterDateOfLossSummary = useMemo(() => {
    const datesOfLoss = Array.from(
      new Set(rows.map((row: any) => clean(row.dateOfLoss || row.date_of_loss || row.lossDate || row.loss_date)).filter(Boolean))
    );

    if (datesOfLoss.length === 0) return "—";
    if (datesOfLoss.length === 1) return datesOfLoss[0];

    return `${datesOfLoss[0]} + ${datesOfLoss.length - 1} more`;
  }, [rows]);

  function updateMasterSettlementBillDraft(rowId: string, field: "settlementAmount" | "interest" | "attorneyFee" | "filingFee", value: string) {
    setMasterSettlementBillDrafts((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [field]: value,
      },
    }));
  }

  useEffect(() => {
    async function load() {
      const filter = getFilterFromUrl();
      const workflow = getWorkflowFromUrl();

      setKind(filter.kind);
      setWorkflowKind(workflow);
      setValue(filter.value);
      setLoading(true);
      setError("");
      setRows([]);

      try {
        if (!filter.kind || !filter.value) {
          throw new Error("Missing patient, provider, or claim filter.");
        }

        const url =
          filter.kind === "patient"
            ? `/api/claim-index/search?patient=${encodeURIComponent(filter.value)}`
            : filter.kind === "provider"
              ? `/api/claim-index/search?provider=${encodeURIComponent(filter.value)}`
              : filter.kind === "insurer"
                ? `/api/claim-index/search?insurer=${encodeURIComponent(filter.value)}`
                : filter.kind === "master"
                  ? `/api/claim-index/by-master?masterLawsuitId=${encodeURIComponent(filter.value)}`
                  : `/api/claim-index/search?claim=${encodeURIComponent(filter.value)}`;

        const rawRows = await fetchRows(url);
        const mapped: MatterRow[] = [];

        for (const row of rawRows) {
          if (filter.kind === "patient" && !exactOrContains(patientName(row), filter.value)) continue;
          if (filter.kind === "provider" && !exactOrContains(providerName(row), filter.value)) continue;
          if (filter.kind === "insurer" && !exactOrContains(insurerName(row), filter.value)) continue;
          if (filter.kind === "claim" && !exactOrContains(claimNumberFromMatter(row), filter.value)) continue;

          const mappedRow = toMatterRow(row, filterLabel(filter.kind));
          if (mappedRow) mapped.push(mappedRow);
        }

        setRows(dedupe(mapped));
      } catch (e: any) {
        setError(e?.message || "Filtered matters lookup failed.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={topBarStyle}>
          <div style={leftLogoWrapStyle}>
            <a href="/" title="Return to Barsh Matters entry screen" style={{ display: "inline-flex" }}>
              <img src="/brl-logo.png" alt="BRL Logo" style={brlLogoStyle} />
            </a>
          </div>

          <div style={rightTopWrapStyle}>
            <div style={printButtonRowStyle}>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Print Queue access is locked unless the user has print-queue rights."
                style={lockedPrintQueueButtonStyle}
              >
                <span aria-hidden="true">🔒</span>
                <span>Print Queue</span>
              </button>
            </div>

            <a href="/" style={bmLogoLinkStyle} title="Return to Barsh Matters entry screen">
              <img src="/barsh-matters-cropped-transparent.png" alt="Barsh Matters Logo" style={bmLogoStyle} />
            </a>
          </div>
        </section>

        <style jsx global>{`
          .barsh-filter-row:hover td {
            background: #f8fbff !important;
          }

          .barsh-filter-field-link:hover {
            color: #1e3a8a !important;
            text-decoration-thickness: 2px !important;
          }

          .barsh-filter-open-link:hover,
          .barsh-filter-new-search:hover {
            background: #eff6ff !important;
            border-color: #93b4e8 !important;
            transform: translateY(-1px);
          }
        `}</style>

        {kind === "master" && (
          <section style={masterHeroStyle}>
            <div style={masterHeroCenterStyle}>
              <div style={masterHeroPillStyle}>LAWSUIT ID: {value}</div>
            </div>
          </section>
        )}

        <section style={summaryPanelStyle}>
          <div>
            <div style={eyebrowStyle}>
              {kind === "master" ? "BARSH MATTERS MASTER LAWSUIT SUMMARY" : "BARSH MATTERS FILTERED RESULTS"}
            </div>
            {kind && value && (
              <div
                style={
                  kind === "master"
                    ? {
                        ...filterBadgeStyle,
                        borderColor: "#bfdbfe",
                        background: "#eff6ff",
                        color: "#1e3a8a",
                      }
                    : filterBadgeStyle
                }
              >
                {kind === "master" ? "Master Lawsuit Workspace" : `${filterLabel(kind)} Filter`}
              </div>
            )}
            {kind === "master" ? (
              <div style={masterSummaryGridStyle}>
                <div style={masterSummaryItemStyle}>
                  <span>Insurer</span>
                  <strong>{masterInsurerSummary}</strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Claim Number</span>
                  <strong>
                    {masterClaimSummary.href ? (
                      <a
                        href={masterClaimSummary.href}
                        className="barsh-filter-field-link"
                        style={fieldLinkStyle}
                      >
                        {masterClaimSummary.label}
                      </a>
                    ) : (
                      "—"
                    )}
                  </strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Service Type</span>
                  <strong>{masterServiceTypeSummary}</strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Treating Provider</span>
                  <strong>{masterTreatingProviderSummary}</strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Date of Loss</span>
                  <strong>{masterDateOfLossSummary}</strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Index / AAA Number</span>
                  <strong>—</strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Court</span>
                  <strong>—</strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Date Filed</span>
                  <strong>—</strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Lawsuit Amount</span>
                  <strong>{money(totalBalancePresuit)}</strong>
                </div>
                <div style={masterSummaryItemStyle}>
                  <span>Court Costs</span>
                  <strong>$0.00</strong>
                </div>
              </div>
            ) : (
              <>
                <h1 style={titleStyle}>{workflowTitle(workflowKind, kind, value)}</h1>
                <div style={subTitleStyle}>
                  {loading ? "Loading matching matters..." : `${rows.length} matching matter${rows.length === 1 ? "" : "s"} found.`}
                </div>
              </>
            )}

            {kind === "master" && (
              <div style={masterWorkflowRowStyle}>
                <button
                  type="button"
                  onClick={() => setActiveMasterWorkspaceTab("documents")}
                  style={activeMasterWorkspaceTab === "documents" ? masterWorkflowActiveButtonStyle : masterWorkflowButtonStyle}
                >
                  Documents
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMasterWorkspaceTab("settlement")}
                  style={activeMasterWorkspaceTab === "settlement" ? masterWorkflowActiveButtonStyle : masterWorkflowButtonStyle}
                >
                  Settlement
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMasterWorkspaceTab("close_paid_settlements")}
                  style={activeMasterWorkspaceTab === "close_paid_settlements" ? masterWorkflowActiveButtonStyle : masterWorkflowButtonStyle}
                >
                  Close Paid Settlements
                </button>
                <button
                  type="button"
                  disabled
                  style={{ ...masterWorkflowLockedButtonStyle, marginLeft: "auto" }}
                >
                  🔒 Audit / History
                </button>
              </div>
            )}

            {workflowKind && (
              <div style={workflowBannerStyle}>
                <div>
                  <div style={workflowBannerEyebrowStyle}>
                    {workflowKind === "patient" ? "Launched Patient Workflow" : "Launched Claim Workflow"}
                  </div>
                  <div style={workflowBannerTextStyle}>{workflowNote(workflowKind)}</div>
                </div>
                <div style={workflowBannerPillStyle}>
                  Review · Open · Route
                </div>
              </div>
            )}
          </div>

          {kind !== "master" && (
            <div style={summaryStatsStyle}>
              <div style={statBoxStyle}>
                <span style={statLabelStyle}>Claim Amount</span>
                <strong>{money(totalClaimAmount)}</strong>
              </div>
              <div style={statBoxStyle}>
                <span style={statLabelStyle}>Balance (Presuit)</span>
                <strong>{money(totalBalancePresuit)}</strong>
              </div>
              <a href="/" className="barsh-filter-new-search" style={backButtonStyle}>New Search</a>
            </div>
          )}
        </section>

        {kind === "master" && activeMasterWorkspaceTab === "settlement" && (
          <section style={masterSettlementPanelStyle}>
            <div style={masterSettlementTopStripStyle}>
              <div style={masterSettlementBasisGroupStyle}>
                <div style={masterSettlementRadioLineStyle}>
                  <span style={masterSettlementRadioLabelStyle}>Settlement Based On:</span>

                  <label style={masterSettlementInlineOptionStyle}>
                    <input
                      type="radio"
                      name="master-settlement-based-on"
                      checked={masterSettlementDraft.settlementBasedOn === "lawsuit_amount"}
                      onChange={() => {
                        setMasterSettlementDraft((prev) => ({ ...prev, settlementBasedOn: "lawsuit_amount" }));
                        setMasterSettlementBillDrafts({});
                      }}
                    />
                    <span>Lawsuit Amount ({money(totalBalancePresuit)})</span>
                  </label>

                  <label style={masterSettlementInlineOptionStyle}>
                    <input
                      type="radio"
                      name="master-settlement-based-on"
                      checked={masterSettlementDraft.settlementBasedOn === "fee_schedule_amount"}
                      onChange={() => {
                        setMasterSettlementDraft((prev) => ({ ...prev, settlementBasedOn: "fee_schedule_amount" }));
                        setMasterSettlementBillDrafts({});
                      }}
                    />
                    <span>Fee Schedule Amount</span>
                  </label>

                  <input
                    type="text"
                    value={masterSettlementDraft.feeScheduleAmount}
                    onChange={(e) => {
                      setMasterSettlementDraft((prev) => ({
                        ...prev,
                        feeScheduleAmount: e.target.value,
                        settlementBasedOn: "fee_schedule_amount",
                      }));
                      setMasterSettlementBillDrafts({});
                    }}
                    placeholder="$0.00"
                    style={masterSettlementBasisAmountInputStyle}
                  />

                  <label style={masterSettlementInlineOptionStyle}>
                    <input
                      type="radio"
                      name="master-settlement-based-on"
                      checked={masterSettlementDraft.settlementBasedOn === "custom_amount"}
                      onChange={() => {
                        setMasterSettlementDraft((prev) => ({ ...prev, settlementBasedOn: "custom_amount" }));
                        setMasterSettlementBillDrafts({});
                      }}
                    />
                    <span>Custom Amount</span>
                  </label>

                  <input
                    type="text"
                    value={masterSettlementDraft.customAmount}
                    onChange={(e) => {
                      setMasterSettlementDraft((prev) => ({
                        ...prev,
                        customAmount: e.target.value,
                        settlementBasedOn: "custom_amount",
                      }));
                      setMasterSettlementBillDrafts({});
                    }}
                    placeholder="$0.00"
                    style={masterSettlementBasisAmountInputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={masterSettlementTermBoxStyle}>
              <div style={masterSettlementTermTitleStyle}>Settlement Terms</div>

              <div style={masterSettlementTermGridStyle}>
                <div style={masterSettlementFieldStyle}>
                  <label style={masterSettlementFieldLabelStyle}>Settled With</label>
                  <select
                    value={masterSettlementDraft.settledWith}
                    onChange={(e) => setMasterSettlementDraft((prev) => ({ ...prev, settledWith: e.target.value }))}
                    style={masterSettlementSelectStyle}
                  >
                    <option value="">Please select</option>
                    <option value="placeholder-person-contact">Clio Person Contact — to be wired</option>
                  </select>
                </div>

                <div style={masterSettlementFieldStyle}>
                  <label style={masterSettlementFieldLabelStyle}>Settlement %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={masterSettlementDraft.settlementPercent}
                    onChange={(e) => {
                      setMasterSettlementDraft((prev) => ({ ...prev, settlementPercent: e.target.value }));
                      setMasterSettlementBillDrafts({});
                    }}
                    style={masterSettlementInputStyle}
                  />
                </div>

                <div style={masterSettlementFieldStyle}>
                  <label style={masterSettlementFieldLabelStyle}>Interest %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={masterSettlementDraft.interestPercent}
                    onChange={(e) => {
                      setMasterSettlementDraft((prev) => ({ ...prev, interestPercent: e.target.value }));
                      setMasterSettlementBillDrafts({});
                    }}
                    style={masterSettlementInputStyle}
                  />
                </div>

                <div style={masterSettlementFieldStyle}>
                  <label style={masterSettlementFieldLabelStyle}>Start Date</label>
                  <input
                    type="date"
                    value={masterSettlementDraft.startDate}
                    onChange={(e) => setMasterSettlementDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                    style={masterSettlementInputStyle}
                  />
                </div>

                <div style={masterSettlementFieldStyle}>
                  <label style={masterSettlementFieldLabelStyle}>End Date</label>
                  <input
                    type="date"
                    value={masterSettlementDraft.endDate}
                    onChange={(e) => setMasterSettlementDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                    style={masterSettlementInputStyle}
                  />
                </div>

                <div style={masterSettlementFieldStyle}>
                  <label style={masterSettlementFieldLabelStyle}>Interest Days</label>
                  <div style={masterSettlementReadOnlyFieldStyle}>
                    {masterSettlementInterestDays.toLocaleString("en-US")}
                  </div>
                </div>

                <div style={masterSettlementFieldStyle}>
                  <label style={masterSettlementFieldLabelStyle}>Settlement Type</label>
                  <select
                    value={masterSettlementDraft.settlementType}
                    onChange={(e) => setMasterSettlementDraft((prev) => ({ ...prev, settlementType: e.target.value }))}
                    style={masterSettlementSelectStyle}
                  >
                    <option value="">Select...</option>
                    <option value="bulk">Bulk</option>
                    <option value="lien">Lien</option>
                  </select>
                </div>

                <div style={masterSettlementFieldStyle}>
                  <label style={masterSettlementFieldLabelStyle}>Discontinuance Reason</label>
                  <select
                    value={masterSettlementDraft.discontinuanceReason}
                    onChange={(e) => setMasterSettlementDraft((prev) => ({ ...prev, discontinuanceReason: e.target.value }))}
                    style={masterSettlementSelectStyle}
                  >
                    <option value="">Select...</option>
                    <option value="duplicate-lawsuit">Duplicate lawsuit</option>
                    <option value="fraud">Fraud</option>
                    <option value="ime-no-show">IME No-Show</option>
                    <option value="incorrect-carrier">Incorrect carrier</option>
                    <option value="material-misrepresentation">Material Misrepresentation</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="paid-in-full">Paid in full</option>
                    <option value="paid-per-fee-schedule">Paid per fee schedule</option>
                    <option value="policy-canceled">Policy canceled</option>
                    <option value="policy-exhausted">Policy exhausted</option>
                  </select>
                </div>

                <div style={{ ...masterSettlementFieldStyle, gridColumn: "span 2" }}>
                  <label style={masterSettlementFieldLabelStyle}>Notes</label>
                  <textarea
                    value={masterSettlementDraft.notes}
                    onChange={(e) => setMasterSettlementDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    style={masterSettlementTextareaStyle}
                  />
                </div>
              </div>

              <div style={masterSettlementTermFootnoteStyle}>
                Start Date will default to the lawsuit filing date once that metadata is wired.  End Date currently defaults to today.  All fields on this shell are local-only.
              </div>
            </div>

            <div style={masterSettlementDetailsBoxStyle}>
              <div style={masterSettlementSummaryPanelStyle}>
                <div style={masterSettlementSummaryHeaderStyle}>
                  <div style={masterSettlementSummaryPillStyle}>
                    {masterSettlementDetailRows.length.toLocaleString("en-US")} Bill{masterSettlementDetailRows.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div style={masterSettlementSummaryGridStyle}>
                  <div style={masterSettlementSummaryItemStyle}>
                    <span>Lawsuit Amount</span>
                    <strong style={masterSettlementSummaryValueStyle}>{money(totalBalancePresuit)}</strong>
                  </div>
                  <div style={masterSettlementSummaryItemStyle}>
                    <span>Settled Principal</span>
                    <strong style={masterSettlementSummaryValueStyle}>{money(masterSettlementSummary.settlementAmount)}</strong>
                  </div>
                  <div style={masterSettlementSummaryItemStyle}>
                    <span>Settled Interest</span>
                    <strong style={masterSettlementSummaryValueStyle}>{money(masterSettlementSummary.interest)}</strong>
                  </div>
                  <div style={masterSettlementSummaryItemStyle}>
                    <span>Attorney Fee</span>
                    <strong style={masterSettlementSummaryValueStyle}>{money(masterSettlementSummary.attorneyFee)}</strong>
                    <div style={masterSettlementAttorneyFeeControlStyle}>
                      <label style={masterSettlementSmallRadioStyle}>
                        <input
                          type="radio"
                          name="master-attorney-fee-mode"
                          checked={masterSettlementDraft.attorneyFeeMode === "max"}
                          onChange={() => {
                            setMasterSettlementDraft((prev) => ({
                              ...prev,
                              attorneyFeeMode: "max",
                            }));
                            setMasterSettlementBillDrafts({});
                          }}
                        />
                        <span>Max ({money(masterAttorneyFeeMaxAmount)})</span>
                      </label>

                      <label style={masterSettlementSmallRadioStyle}>
                        <input
                          type="radio"
                          name="master-attorney-fee-mode"
                          checked={masterSettlementDraft.attorneyFeeMode === "custom"}
                          onChange={() => {
                            setMasterSettlementDraft((prev) => ({
                              ...prev,
                              attorneyFeeMode: "custom",
                            }));
                            setMasterSettlementBillDrafts({});
                          }}
                        />
                        <span>Custom</span>
                        <input
                          type="text"
                          value={masterSettlementDraft.customAttorneyFee}
                          onChange={(e) => {
                            setMasterSettlementDraft((prev) => ({
                              ...prev,
                              customAttorneyFee: e.target.value,
                              attorneyFeeMode: "custom",
                            }));
                            setMasterSettlementBillDrafts({});
                          }}
                          placeholder="$0.00"
                          style={masterSettlementAttorneyFeeInputStyle}
                        />
                      </label>
                    </div>
                  </div>
                  <div style={masterSettlementSummaryItemStyle}>
                    <span>Filing Fee</span>
                    <strong style={masterSettlementSummaryValueStyle}>{money(masterSettlementSummary.filingFee)}</strong>
                  </div>
                  <div style={masterSettlementSummaryItemStyle}>
                    <span>Settlement Total</span>
                    <strong style={masterSettlementSummaryValueStyle}>{money(masterSettlementSummary.settlementTotal)}</strong>
                  </div>
                </div>
              </div>

              <div style={masterSettlementDetailsTitleStyle}>Settlement Details</div>

              <div style={masterSettlementTableWrapStyle}>
                <table style={masterSettlementTableStyle}>
                  <thead>
                    <tr>
                      <th style={masterSettlementThStyle}>Matter</th>
                      <th style={masterSettlementThStyle}>Provider</th>
                      <th style={masterSettlementThStyle}>Patient</th>
                      <th style={masterSettlementRightThStyle}>Bill Amount</th>
                      <th style={masterSettlementRightThStyle}>Settled Principal</th>
                      <th style={masterSettlementRightThStyle}>Settled Interest</th>
                      <th style={masterSettlementRightThStyle}>Attorney Fee</th>
                      <th style={masterSettlementRightThStyle}>Filing Fee</th>
                      <th style={masterSettlementRightThStyle}>Settlement Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterSettlementDetailRows.map((row: any) => {
                      const rowId = clean(row.id);
                      const rowDraft = masterSettlementBillDrafts[rowId] || {};

                      return (
                        <tr key={rowId}>
                          <td style={masterSettlementTdStyle}>
                            <a href={`/matter/${rowId}`} style={matterLinkStyle}>
                              {clean(row.displayNumber) || rowId}
                            </a>
                          </td>
                          <td style={masterSettlementTdStyle}>
                            {clean(row.provider) ? (
                              <a
                                href={filteredUrl("provider", row.provider)}
                                className="barsh-filter-field-link"
                                style={fieldLinkStyle}
                              >
                                {clean(row.provider)}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={masterSettlementTdStyle}>
                            {clean(row.patient) ? (
                              <a
                                href={filteredUrl("patient", row.patient)}
                                className="barsh-filter-field-link"
                                style={fieldLinkStyle}
                              >
                                {clean(row.patient)}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={masterSettlementMoneyTdStyle}>{money(row.billAmount)}</td>
                          <td style={masterSettlementInputTdStyle}>
                            <input
                              value={rowDraft.settlementAmount ?? moneyDraft(row.settlementAmount)}
                              onChange={(e) => updateMasterSettlementBillDraft(rowId, "settlementAmount", e.target.value)}
                              style={masterSettlementMoneyInputStyle}
                            />
                          </td>
                          <td style={masterSettlementInputTdStyle}>
                            <input
                              value={rowDraft.interest ?? moneyDraft(row.interest)}
                              onChange={(e) => updateMasterSettlementBillDraft(rowId, "interest", e.target.value)}
                              style={masterSettlementMoneyInputStyle}
                            />
                          </td>
                          <td style={masterSettlementInputTdStyle}>
                            {row.isFirstSettlementBill ? (
                              <input
                                value={rowDraft.attorneyFee ?? moneyDraft(row.attorneyFee)}
                                onChange={(e) => updateMasterSettlementBillDraft(rowId, "attorneyFee", e.target.value)}
                                style={masterSettlementMoneyInputStyle}
                              />
                            ) : (
                              <span style={masterSettlementNotAppliedStyle}>--</span>
                            )}
                          </td>
                          <td style={masterSettlementInputTdStyle}>
                            {row.isFirstSettlementBill ? (
                              <input
                                value={rowDraft.filingFee ?? moneyDraft(row.filingFee)}
                                onChange={(e) => updateMasterSettlementBillDraft(rowId, "filingFee", e.target.value)}
                                style={masterSettlementMoneyInputStyle}
                              />
                            ) : (
                              <span style={masterSettlementNotAppliedStyle}>--</span>
                            )}
                          </td>
                          <td style={masterSettlementMoneyTdStyle}>{money(row.settlementTotal)}</td>
                        </tr>
                      );
                    })}

                    <tr style={masterSettlementTotalRowStyle}>
                      <td style={masterSettlementTdStyle}>Total</td>
                      <td style={masterSettlementTdStyle}></td>
                      <td style={masterSettlementTdStyle}></td>
                      <td style={masterSettlementMoneyTdStyle}>{money(totalBalancePresuit)}</td>
                      <td style={masterSettlementMoneyTdStyle}>{money(masterSettlementSummary.settlementAmount)}</td>
                      <td style={masterSettlementMoneyTdStyle}>{money(masterSettlementSummary.interest)}</td>
                      <td style={masterSettlementMoneyTdStyle}>{money(masterSettlementSummary.attorneyFee)}</td>
                      <td style={masterSettlementMoneyTdStyle}>{money(masterSettlementSummary.filingFee)}</td>
                      <td style={masterSettlementMoneyTdStyle}>{money(masterSettlementSummary.settlementTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={masterSettlementActionRowStyle}>
                <button type="button" disabled style={masterSettlementGhostButtonStyle}>
                  Calculate Simple Interest
                </button>
                <button type="button" disabled style={masterSettlementGhostButtonStyle}>
                  Calculate Compound Interest
                </button>
                <button type="button" disabled style={masterSettlementPrimaryButtonStyle}>
                  Finalize Settlement
                </button>
              </div>

              <div style={masterSettlementTermFootnoteStyle}>
                This is a visual/local draft only.  It does not run Clio contact search, settlement preview, writeback, document generation, or Close Paid Settlements.
              </div>
            </div>
          </section>
        )}

        {kind === "master" && activeMasterWorkspaceTab !== "settlement" && (
          <section style={masterWorkspacePanelStyle}>
            <div style={masterWorkspacePanelHeaderStyle}>
              <div>
                <div style={masterWorkspacePanelEyebrowStyle}>Active Workspace</div>
                <h2 style={masterWorkspacePanelTitleStyle}>
                  {activeMasterWorkspaceTab === "documents" ? "Documents" : "Close Paid Settlements"}
                </h2>
              </div>
              <div style={masterWorkspacePanelPillStyle}>Read-only preview shell</div>
            </div>

            <div style={masterWorkspaceCardsStyle}>
              <div style={masterWorkspaceCardStyle}>
                <div style={masterWorkspaceCardLabelStyle}>Purpose</div>
                <div style={masterWorkspaceCardTextStyle}>
                  {activeMasterWorkspaceTab === "documents"
                    ? "Centralize Master Lawsuit packet preview, finalization, Clio upload, and print-queue controls."
                    : "Review paid settlement eligibility and close only confirmed paid settlement matters from the Master Lawsuit screen."}
                </div>
              </div>

              <div style={masterWorkspaceCardStyle}>
                <div style={masterWorkspaceCardLabelStyle}>Safety</div>
                <div style={masterWorkspaceCardTextStyle}>
                  {activeMasterWorkspaceTab === "documents"
                    ? "Document controls will stay separated between preview, finalization, Clio upload, and print queue."
                    : "Close actions will remain payment-confirmed only, preview-first, and limited to eligible child/bill matters."}
                </div>
              </div>

              <div style={masterWorkspaceCardStyle}>
                <div style={masterWorkspaceCardLabelStyle}>Next UI Step</div>
                <div style={masterWorkspaceCardTextStyle}>
                  {activeMasterWorkspaceTab === "documents"
                    ? "Move the existing read-only packet preview shell into this Documents workspace."
                    : "Move settlement close preview into this Close Paid Settlements workspace."}
                </div>
              </div>
            </div>

            <div style={masterWorkspaceBillListStyle}>
              <div style={masterSettlementDetailsTitleStyle}>
                {activeMasterWorkspaceTab === "documents" ? "Lawsuit Bills" : "Close Review Bills"}
              </div>

              <div style={masterSettlementTableWrapStyle}>
                <table style={masterSettlementTableStyle}>
                  <thead>
                    <tr>
                      <th style={masterSettlementThStyle}>Matter</th>
                      <th style={masterSettlementThStyle}>Provider</th>
                      <th style={masterSettlementThStyle}>Patient</th>
                      <th style={masterSettlementRightThStyle}>Bill Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterSettlementDetailRows.map((row: any) => {
                      const rowId = clean(row.id);

                      return (
                        <tr key={rowId}>
                          <td style={masterSettlementTdStyle}>
                            <a href={`/matter/${rowId}`} style={matterLinkStyle}>
                              {clean(row.displayNumber) || rowId}
                            </a>
                          </td>
                          <td style={masterSettlementTdStyle}>
                            {clean(row.provider) ? (
                              <a
                                href={filteredUrl("provider", row.provider)}
                                className="barsh-filter-field-link"
                                style={fieldLinkStyle}
                              >
                                {clean(row.provider)}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={masterSettlementTdStyle}>
                            {clean(row.patient) ? (
                              <a
                                href={filteredUrl("patient", row.patient)}
                                className="barsh-filter-field-link"
                                style={fieldLinkStyle}
                              >
                                {clean(row.patient)}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={masterSettlementMoneyTdStyle}>{money(row.billAmount)}</td>
                        </tr>
                      );
                    })}
                    <tr style={masterSettlementTotalRowStyle}>
                      <td style={masterSettlementTdStyle}>Total</td>
                      <td style={masterSettlementTdStyle}></td>
                      <td style={masterSettlementTdStyle}></td>
                      <td style={masterSettlementMoneyTdStyle}>{money(totalBalancePresuit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        {!loading && !error && rows.length === 0 && (
          <div style={emptyStyle}>No matching matters were returned for this filter.</div>
        )}

        {kind !== "master" && rows.length > 0 && (
          <section style={tablePanelStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Matter</th>
                  <th style={thStyle}>Patient</th>
                  <th style={thStyle}>Provider</th>
                  <th style={thStyle}>Insurer</th>
                  <th style={thStyle}>Claim</th>
                  <th style={thStyle}>Master Lawsuit</th>
                  <th style={rightThStyle}>Claim Amount</th>
                  <th style={rightThStyle}>Balance</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="barsh-filter-row">
                    <td style={tdStyle}>
                      <a href={`/matter/${row.id}`} style={matterLinkStyle}>
                        {row.displayNumber || row.id}
                      </a>
                    </td>
                    <td style={tdStyle}>
                      {row.patient ? (
                        <a
                          href={filteredUrl("patient", row.patient)}
                          className="barsh-filter-field-link"
                          style={fieldLinkStyle}
                        >
                          {row.patient}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={tdStyle}>
                      {row.provider ? (
                        <a
                          href={filteredUrl("provider", row.provider)}
                          className="barsh-filter-field-link"
                          style={fieldLinkStyle}
                        >
                          {row.provider}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={tdStyle}>
                      {row.insurer ? (
                        <a
                          href={filteredUrl("insurer", row.insurer)}
                          className="barsh-filter-field-link"
                          style={fieldLinkStyle}
                        >
                          {row.insurer}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={tdStyle}>
                      {row.claimNumber ? (
                        <a
                          href={filteredUrl("claim", row.claimNumber)}
                          className="barsh-filter-field-link"
                          style={fieldLinkStyle}
                        >
                          {row.claimNumber}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={tdStyle}>{row.masterLawsuitId || "—"}</td>
                    <td style={rightTdStyle}>{money(row.claimAmount)}</td>
                    <td style={rightTdStyle}>{money(row.balancePresuit)}</td>
                    <td style={tdStyle}>
                      <div style={actionStackStyle}>
                        <a href={`/matter/${row.id}`} className="barsh-filter-open-link" style={openLinkStyle}>
                          Open Matter
                        </a>

                        {row.patient && (
                          <a href={`/matters?workflow=patient&patient=${encodeURIComponent(row.patient)}&fromMatter=${encodeURIComponent(String(row.id))}`} style={secondaryActionLinkStyle}>
                            Launch Patient
                          </a>
                        )}

                        {row.claimNumber && (
                          <a href={`/matters?workflow=claim&claim=${encodeURIComponent(row.claimNumber)}&fromMatter=${encodeURIComponent(String(row.id))}`} style={secondaryActionLinkStyle}>
                            Launch Claim
                          </a>
                        )}

                        {row.masterLawsuitId && (
                          <a href={filteredUrl("master", row.masterLawsuitId)} style={secondaryActionLinkStyle}>
                            Open Lawsuit
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "28px 24px 44px",
  background: colors.page,
  color: colors.ink,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shellStyle: React.CSSProperties = {
  maxWidth: "none",
  margin: "0 auto",
};

const topBarStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10000,
  isolation: "isolate",
  display: "grid",
  gridTemplateColumns: "216px minmax(0, 1fr) 330px",
  alignItems: "start",
  gap: 16,
  marginBottom: 14,
  padding: "8px 0 10px",
  background: "#f8fafc",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
  borderBottom: "1px solid rgba(203, 213, 225, 0.9)",
};

const leftLogoWrapStyle: React.CSSProperties = {
  gridColumn: "1",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
};

const rightTopWrapStyle: React.CSSProperties = {
  gridColumn: "3",
  justifySelf: "end",
  position: "relative",
  width: 330,
  height: 144,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-start",
};

const printButtonRowStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: -86,
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
};

const bmLogoLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  textDecoration: "none",
};

const brlLogoStyle: React.CSSProperties = {
  width: 216,
  height: 144,
  objectFit: "contain",
  display: "block",
};

const bmLogoStyle: React.CSSProperties = {
  width: 330,
  height: 152,
  objectFit: "contain",
  objectPosition: "right top",
  display: "block",
};

const lockedPrintQueueButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "7px 11px",
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  background: "#f8fafc",
  color: colors.muted,
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
  cursor: "not-allowed",
  opacity: 0.9,
  marginTop: 0,
};

const summaryPanelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 16,
  alignItems: "center",
  padding: 24,
  border: "1px solid " + colors.line,
  borderRadius: 28,
  background: colors.panel,
  boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
  marginBottom: 18,
};

const eyebrowStyle: React.CSSProperties = {
  color: colors.subtle,
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: "0.12em",
  marginBottom: 8,
};

const filterBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  padding: "4px 9px",
  border: "1px solid #dbe3ee",
  borderRadius: 999,
  background: "#f8fafc",
  color: colors.subtle,
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  lineHeight: 1.15,
  letterSpacing: "-0.04em",
};

const subTitleStyle: React.CSSProperties = {
  marginTop: 8,
  color: colors.muted,
  fontSize: 14,
  fontWeight: 750,
};

const summaryStatsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: 12,
};

const statBoxStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  minWidth: 145,
  padding: "12px 14px",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#f8fafc",
};

const statLabelStyle: React.CSSProperties = {
  color: colors.subtle,
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.06em",
};

const backButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  border: "1px solid #b6c7e3",
  borderRadius: 16,
  background: "#f8fbff",
  color: colors.blueDark,
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 14,
  transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease",
};

const tablePanelStyle: React.CSSProperties = {
  border: "1px solid " + colors.line,
  borderRadius: 20,
  overflow: "hidden",
  background: "#ffffff",
  boxShadow: "0 10px 26px rgba(15, 23, 42, 0.04)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #cbd5e1",
  background: "#eef4fb",
  textAlign: "left",
  color: colors.ink,
  fontWeight: 900,
};

const rightThStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: "right",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 10px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "middle",
  color: colors.ink,
};

const rightTdStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const matterLinkStyle: React.CSSProperties = {
  color: colors.blueDark,
  fontWeight: 900,
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

const openLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "8px 11px",
  border: "1px solid #b6c7e3",
  borderRadius: 10,
  color: colors.blueDark,
  textDecoration: "none",
  fontWeight: 900,
  background: "#f8fbff",
  whiteSpace: "nowrap",
  transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease",
};

const errorStyle: React.CSSProperties = {
  padding: 14,
  border: "1px solid " + colors.errorBorder,
  borderRadius: 14,
  background: colors.errorBg,
  color: "#991b1b",
  fontSize: 14,
  fontWeight: 750,
};

const emptyStyle: React.CSSProperties = {
  padding: 16,
  border: "1px solid " + colors.line,
  borderRadius: 16,
  background: "#f8fafc",
  color: colors.muted,
  fontSize: 14,
};

const fieldLinkStyle: React.CSSProperties = {
  color: colors.ink,
  fontWeight: 800,
  textDecoration: "underline",
  textDecorationThickness: 1,
  textUnderlineOffset: 3,
};


const masterHeroStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginTop: -78,
  marginBottom: 26,
};

const masterHeroCenterStyle: React.CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: 8,
  textAlign: "center",
};

const masterHeroPillStyle: React.CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 999,
  background: "#fff5f5",
  color: "#991b1b",
  padding: "10px 18px",
  fontSize: 20,
  fontWeight: 900,
  letterSpacing: "0.02em",
};

const masterSummaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 10,
  marginTop: 10,
  maxWidth: "none",
};

const masterSummaryItemStyle: React.CSSProperties = {
  display: "grid",
  gap: 5,
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  background: "#f8fafc",
  padding: 12,
  color: "#334155",
  fontSize: 12,
};

const masterWorkflowRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 16,
  alignItems: "center",
};

const masterWorkflowButtonStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#93b4e8",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#1e3a8a",
  padding: "8px 13px",
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
  opacity: 0.9,
};

const masterWorkflowLockedButtonStyle: React.CSSProperties = {
  ...masterWorkflowButtonStyle,
  borderColor: "#cbd5e1",
  background: "#f8fafc",
  color: "#475569",
};

const masterWorkflowActiveButtonStyle: React.CSSProperties = {
  ...masterWorkflowButtonStyle,
  background: "#1e3a8a",
  borderColor: "#1e3a8a",
  color: "#ffffff",
  opacity: 1,
};

const masterWorkspacePanelStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d7dee9",
  borderRadius: 20,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
};

const masterWorkspacePanelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  marginBottom: 10,
};

const masterWorkspacePanelEyebrowStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  marginBottom: 4,
};

const masterWorkspacePanelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: 20,
};

const masterWorkspacePanelPillStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  background: "#f8fafc",
  color: "#475569",
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const masterWorkspacePanelTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.5,
  maxWidth: "none",
};

const masterWorkspaceCardsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

const masterWorkspaceCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 14,
};

const masterWorkspaceCardLabelStyle: React.CSSProperties = {
  color: "#1e3a8a",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 6,
};

const masterWorkspaceCardTextStyle: React.CSSProperties = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.45,
};

const masterSettlementPanelStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d7dee9",
  borderRadius: 18,
  padding: 0,
  marginBottom: 18,
  overflow: "hidden",
  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
};

const masterSettlementTopStripStyle: React.CSSProperties = {
  display: "block",
  padding: "14px 16px",
  background: "#eef2f7",
  borderBottom: "1px solid #d7dee9",
};

const masterSettlementModeGroupStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};

const masterSettlementBasisGroupStyle: React.CSSProperties = {
  display: "grid",
  gap: 9,
};

const masterSettlementRadioLineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const masterSettlementRadioLabelStyle: React.CSSProperties = {
  color: "#334155",
  fontSize: 13,
  fontWeight: 900,
};

const masterSettlementInlineOptionStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "#334155",
  fontSize: 13,
  whiteSpace: "nowrap",
};

const masterSettlementTermBoxStyle: React.CSSProperties = {
  padding: "12px 16px 14px",
  borderBottom: "1px solid #e5e7eb",
};

const masterSettlementTermTitleStyle: React.CSSProperties = {
  color: "#334155",
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 10,
};

const masterSettlementTermGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.25fr 0.75fr 0.75fr 0.85fr 0.85fr 0.75fr 1fr 1.25fr 1.2fr",
  gap: 12,
  alignItems: "start",
};

const masterSettlementFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 5,
};

const masterSettlementFieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#475569",
};

const masterSettlementInputStyle: React.CSSProperties = {
  width: "100%",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 4,
  padding: "7px 8px",
  fontSize: 13,
  background: "#ffffff",
  color: "#0f172a",
};

const masterSettlementSelectStyle: React.CSSProperties = {
  ...masterSettlementInputStyle,
};

const masterSettlementBasisAmountInputStyle: React.CSSProperties = {
  width: 110,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 4,
  padding: "6px 8px",
  fontSize: 13,
  background: "#ffffff",
  color: "#0f172a",
};

const masterSettlementReadOnlyFieldStyle: React.CSSProperties = {
  width: "100%",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 4,
  padding: "7px 8px",
  fontSize: 13,
  background: "#f8fafc",
  color: "#0f172a",
  fontWeight: 800,
};

const masterSettlementTextareaStyle: React.CSSProperties = {
  ...masterSettlementInputStyle,
  minHeight: 54,
  resize: "vertical",
};

const masterSettlementTermFootnoteStyle: React.CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.4,
};

const masterSettlementDetailsBoxStyle: React.CSSProperties = {
  padding: "10px 16px 16px",
};

const masterSettlementSummaryPanelStyle: React.CSSProperties = {
  border: "1px solid #d7dee9",
  background: "#f8fafc",
  borderRadius: 10,
  padding: 12,
  marginBottom: 14,
};

const masterSettlementSummaryHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

const masterSettlementSummaryEyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#64748b",
};

const masterSettlementSummaryTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
};

const masterSettlementSummaryPillStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1e3a8a",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const masterSettlementSummaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 8,
};

const masterSettlementSummaryItemStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
  color: "#334155",
  fontSize: 12,
  minHeight: 156,
};

const masterSettlementSummaryValueStyle: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  fontSize: 30,
  fontWeight: 900,
  lineHeight: 1.1,
  color: "#334155",
  marginTop: "auto",
  marginBottom: "auto",
};

const masterSettlementAttorneyFeeControlStyle: React.CSSProperties = {
  display: "grid",
  gap: 5,
};

const masterSettlementAutoCalculationLabelStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 900,
};

const masterSettlementSmallRadioStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  color: "#334155",
};

const masterSettlementAttorneyFeeInputStyle: React.CSSProperties = {
  width: 110,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 4,
  padding: "5px 7px",
  fontSize: 12,
  background: "#ffffff",
  color: "#0f172a",
};

const masterSettlementNotAppliedStyle: React.CSSProperties = {
  color: "#64748b",
  fontWeight: 800,
};

const masterWorkspaceBillListStyle: React.CSSProperties = {
  marginTop: 16,
};

const masterSettlementDetailsTitleStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#334155",
  fontSize: 24,
  fontWeight: 900,
  margin: "0 0 10px",
};

const masterSettlementTableWrapStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  overflowX: "auto",
};

const masterSettlementTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#ffffff",
  fontSize: 12,
};

const masterSettlementThStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  background: "#9aa6b2",
  color: "#203040",
  borderRight: "1px solid #d7dee9",
  borderBottom: "1px solid #d7dee9",
  whiteSpace: "nowrap",
  fontWeight: 900,
};

const masterSettlementRightThStyle: React.CSSProperties = {
  ...masterSettlementThStyle,
  textAlign: "right",
};

const masterSettlementTdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRight: "1px solid #e5e7eb",
  borderBottom: "1px solid #e5e7eb",
  color: "#334155",
  whiteSpace: "nowrap",
};

const masterSettlementInputTdStyle: React.CSSProperties = {
  ...masterSettlementTdStyle,
  textAlign: "right",
};

const masterSettlementMoneyTdStyle: React.CSSProperties = {
  ...masterSettlementTdStyle,
  textAlign: "right",
  fontWeight: 800,
};

const masterSettlementMoneyInputStyle: React.CSSProperties = {
  width: 150,
  maxWidth: "100%",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#aeb7c2",
  borderRadius: 3,
  padding: "4px 6px",
  fontSize: 12,
  textAlign: "right",
  fontWeight: 800,
  color: "#0f172a",
  background: "#ffffff",
};

const masterSettlementMasterRowStyle: React.CSSProperties = {
  background: "#f8fafc",
  fontWeight: 800,
};

const masterSettlementTotalRowStyle: React.CSSProperties = {
  background: "#e8edf3",
  fontWeight: 900,
};

const masterSettlementActionRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 14,
};

const masterSettlementGhostButtonStyle: React.CSSProperties = {
  border: "1px solid #3f7cf8",
  background: "#3f7cf8",
  color: "#ffffff",
  borderRadius: 4,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 800,
  opacity: 0.65,
  cursor: "not-allowed",
};

const masterSettlementPrimaryButtonStyle: React.CSSProperties = {
  ...masterSettlementGhostButtonStyle,
  background: "#2563eb",
  borderColor: "#2563eb",
  opacity: 0.65,
};

const workflowBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginTop: 14,
  padding: "14px 16px",
  border: "1px solid #bfdbfe",
  borderRadius: 18,
  background: "#eff6ff",
  color: "#0f172a",
};

const workflowBannerEyebrowStyle: React.CSSProperties = {
  marginBottom: 4,
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const workflowBannerTextStyle: React.CSSProperties = {
  color: "#334155",
  fontSize: 13,
  fontWeight: 650,
  lineHeight: 1.45,
};

const workflowBannerPillStyle: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "7px 11px",
  borderRadius: 999,
  background: "#ffffff",
  border: "1px solid #bfdbfe",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const actionStackStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
};

const secondaryActionLinkStyle: React.CSSProperties = {
  color: "#1d4ed8",
  textDecoration: "none",
  fontWeight: 850,
  fontSize: 12,
};
