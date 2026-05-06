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

  const totalClaimAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.claimAmount ?? 0) || 0), 0),
    [rows]
  );

  const totalBalancePresuit = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.balancePresuit ?? 0) || 0), 0),
    [rows]
  );

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

        <section style={summaryPanelStyle}>
          <div>
            <div style={eyebrowStyle}>BARSH MATTERS FILTERED RESULTS</div>
            {kind && value && <div style={filterBadgeStyle}>{filterLabel(kind)} Filter</div>}
            <h1 style={titleStyle}>{workflowTitle(workflowKind, kind, value)}</h1>
            <div style={subTitleStyle}>
              {loading ? "Loading matching matters..." : `${rows.length} matching matter${rows.length === 1 ? "" : "s"} found.`}
            </div>

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
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        {!loading && !error && rows.length === 0 && (
          <div style={emptyStyle}>No matching matters were returned for this filter.</div>
        )}

        {rows.length > 0 && (
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
  maxWidth: 1560,
  margin: "0 auto",
};

const topBarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "306px minmax(0, 1fr) 430px",
  alignItems: "start",
  gap: 24,
  marginBottom: 24,
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
  width: 430,
  height: 204,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-start",
};

const printButtonRowStyle: React.CSSProperties = {
  position: "absolute",
  top: -10,
  left: -95,
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
  width: 306,
  height: 204,
  objectFit: "contain",
  display: "block",
};

const bmLogoStyle: React.CSSProperties = {
  width: 485,
  height: 224,
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
  gap: 24,
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
