"use client";

import React, { useMemo, useState } from "react";

type SearchKind = "brl_matter" | "numeric_ambiguous" | "master" | "text";

type MatterResult = {
  id: string;
  displayNumber: string;
  patient: string;
  provider: string;
  insurer: string;
  claimNumber: string;
  masterLawsuitId: string;
  claimAmount: any;
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

function lower(v: any) {
  return clean(v).toLowerCase();
}

function compact(v: any) {
  return lower(v).replace(/[\s.\-_/]+/g, "");
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

function masterLawsuitId(m: any) {
  return clean(m?.masterLawsuitId ?? m?.master_lawsuit_id);
}

function patientName(m: any) {
  return clean(m?.patientName ?? m?.patient_name);
}

function providerName(m: any) {
  return clean(m?.clientName ?? m?.client_name ?? m?.providerName ?? m?.provider_name);
}

function insurerName(m: any) {
  return clean(m?.insurerName ?? m?.insurer_name ?? m?.insuranceCompany ?? m?.insurance_company);
}

function claimNumberFromMatter(m: any, fallbackClaimNumber = "") {
  return clean(
    m?.claimNumber ??
      m?.claim_number ??
      m?.claimNumberNormalized ??
      m?.claim_number_normalized ??
      fallbackClaimNumber
  );
}

function money(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : "$0.00";
}

function isBrlMatterInput(q: string) {
  return /^BRL\s*-?\s*\d+$/i.test(q);
}

function normalizeBrlMatterInput(q: string) {
  const m = clean(q).match(/^BRL\s*-?\s*(\d+)$/i);
  return m ? `BRL${m[1]}` : clean(q);
}

function isNumericOnly(q: string) {
  return /^\d+$/.test(clean(q));
}

function numericToBrlMatter(q: string) {
  return `BRL${clean(q)}`;
}

function isMasterLawsuitInput(q: string) {
  return /^\d{4}\.\d{2}\.\d{5}$/.test(clean(q));
}

function classifySearch(q: string): SearchKind {
  if (isBrlMatterInput(q)) return "brl_matter";
  if (isMasterLawsuitInput(q)) return "master";
  if (isNumericOnly(q)) return "numeric_ambiguous";
  return "text";
}

function exactOrContains(haystack: string, q: string) {
  const h = lower(haystack);
  const n = lower(q);
  return h === n || h.includes(n);
}

function rowMatchesText(row: any, q: string, matchedBy: string) {
  if (matchedBy === "Patient") return exactOrContains(patientName(row), q);
  if (matchedBy === "Provider") return exactOrContains(providerName(row), q);
  return exactOrContains(patientName(row), q) || exactOrContains(providerName(row), q);
}

function toMatterResult(row: any, matchedBy: string, fallbackClaimNumber = ""): MatterResult | null {
  const id = matterId(row);
  if (!id) return null;

  return {
    id,
    displayNumber: displayNumber(row),
    patient: patientName(row),
    provider: providerName(row),
    insurer: insurerName(row),
    claimNumber: claimNumberFromMatter(row, fallbackClaimNumber),
    masterLawsuitId: masterLawsuitId(row),
    claimAmount: row?.claimAmount ?? row?.claim_amount,
    matchedBy,
  };
}

function dedupeMatterResults(rows: MatterResult[]) {
  const seen = new Set<string>();
  const out: MatterResult[] = [];

  for (const row of rows) {
    if (!row.id || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }

  return out;
}

async function fetchMatterByDisplayNumber(displayNumberValue: string) {
  const res = await fetch(`/api/clio/find-matter?displayNumber=${encodeURIComponent(displayNumberValue)}`, {
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "Matter lookup failed.");
  }

  return Array.isArray(json.matters) ? json.matters : [];
}

async function fetchFastRows(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "Search failed.");
  }

  return Array.isArray(json.rows) ? json.rows : [];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MatterResult[]>([]);
  const [checkedLabel, setCheckedLabel] = useState("");

  const resultLabel = useMemo(() => {
    if (!searched || loading || error) return "";
    if (results.length === 1) return "1 matching matter found.";
    return `${results.length} matching matters found.`;
  }, [searched, loading, error, results.length]);

  async function runSearch() {
    const q = clean(query);

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel("");

    try {
      if (!q) {
        throw new Error("Enter a matter number, master lawsuit number, claim number, patient, or provider.");
      }

      const kind = classifySearch(q);
      const mapped: MatterResult[] = [];

      if (kind === "brl_matter") {
        setCheckedLabel("Matter number");
        const matterDisplay = normalizeBrlMatterInput(q);
        const matters = await fetchMatterByDisplayNumber(matterDisplay);

        for (const row of matters) {
          if (compact(displayNumber(row)) !== compact(matterDisplay)) continue;
          const mappedRow = toMatterResult(row, "Matter number");
          if (mappedRow) mapped.push(mappedRow);
        }

        setResults(dedupeMatterResults(mapped));
        return;
      }

      if (kind === "numeric_ambiguous") {
        setCheckedLabel("Matter number / Claim number");

        const matterDisplay = numericToBrlMatter(q);
        const matters = await fetchMatterByDisplayNumber(matterDisplay);

        for (const row of matters) {
          if (compact(displayNumber(row)) !== compact(matterDisplay)) continue;
          const mappedRow = toMatterResult(row, "Matter number");
          if (mappedRow) mapped.push(mappedRow);
        }

        const claimRows = await fetchFastRows(`/api/claim-index/by-claim?claimNumber=${encodeURIComponent(q)}`);
        for (const row of claimRows) {
          const mappedRow = toMatterResult(row, "Claim number", q);
          if (mappedRow) mapped.push(mappedRow);
        }

        setResults(dedupeMatterResults(mapped));
        return;
      }

      if (kind === "master") {
        setCheckedLabel("Master lawsuit number");

        const rows = await fetchFastRows(`/api/claim-index/by-master?masterLawsuitId=${encodeURIComponent(q)}`);
        for (const row of rows) {
          const mappedRow = toMatterResult(row, "Master lawsuit number");
          if (mappedRow) mapped.push(mappedRow);
        }

        setResults(dedupeMatterResults(mapped));
        return;
      }

      setCheckedLabel("Patient / Provider");

      const [patientRows, providerRows] = await Promise.all([
        fetchFastRows(`/api/claim-index/by-patient?name=${encodeURIComponent(q)}`),
        fetchFastRows(`/api/claim-index/by-provider?name=${encodeURIComponent(q)}`),
      ]);

      for (const row of patientRows) {
        if (!rowMatchesText(row, q, "Patient")) continue;
        const mappedRow = toMatterResult(row, "Patient");
        if (mappedRow) mapped.push(mappedRow);
      }

      for (const row of providerRows) {
        if (!rowMatchesText(row, q, "Provider")) continue;
        const mappedRow = toMatterResult(row, "Provider");
        if (mappedRow) mapped.push(mappedRow);
      }

      setResults(dedupeMatterResults(mapped));
    } catch (e: any) {
      setError(e?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setQuery("");
    setLoading(false);
    setSearched(false);
    setError("");
    setResults([]);
    setCheckedLabel("");
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={topBarStyle}>
          <div style={leftLogoWrapStyle}>
            <img src="/brl-logo.png" alt="BRL Logo" style={brlLogoStyle} />
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

        <section style={lookupPanelStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Enter Matter Number or Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runSearch();
              }}
              placeholder="BRL30095, 30095, 2026.05.00010, claim number, patient, or provider"
              style={inputStyle}
              autoFocus
            />
          </label>

          <div style={inlineResultAreaStyle}>
            {error && <div style={errorStyle}>{error}</div>}

            {searched && !loading && !error && (
              <div style={searchMetaStyle}>
                {resultLabel}
                {checkedLabel ? `  Checked: ${checkedLabel}.` : ""}
              </div>
            )}

            {searched && !loading && !error && results.length === 0 && (
              <div style={emptyStyle}>
                No matching matter was returned.  Try a BRL matter number, master lawsuit number, claim number,
                patient name, or provider name.
              </div>
            )}

            {results.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                {results.map((row) => (
                  <a key={row.id} href={`/matter/${row.id}`} style={resultRowStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={matterTitleStyle}>{row.displayNumber || row.id}</div>
                      <div style={matterMetaStyle}>
                        {row.patient || "No patient"} · {row.provider || "No provider"} · {row.insurer || "No insurer"}
                      </div>
                      <div style={matterSubMetaStyle}>
                        Claim: {row.claimNumber || "—"}
                        {" · "}
                        Master Lawsuit: {row.masterLawsuitId || "—"}
                        {" · "}
                        Matched by: {row.matchedBy}
                      </div>
                    </div>

                    <div style={resultAmountStyle}>
                      <span>{money(row.claimAmount)}</span>
                      <strong>Open Matter</strong>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {loading && <div style={searchMetaStyle}>Searching...</div>}
          </div>

          <div style={actionRowStyle}>
            <button type="button" onClick={runSearch} disabled={loading} style={primaryButtonStyle(loading)}>
              {loading ? "Searching..." : "Search"}
            </button>

            <button type="button" onClick={resetSearch} style={secondaryButtonStyle}>
              Clear
            </button>
          </div>
        </section>
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

const lookupPanelStyle: React.CSSProperties = {
  maxWidth: "none",
  margin: "0",
  padding: 22,
  border: "1px solid " + colors.line,
  borderRadius: 28,
  background: colors.panel,
  boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: colors.subtle,
  letterSpacing: "0.08em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "17px 18px",
  border: "1px solid #c7d2e4",
  borderRadius: 18,
  fontSize: 18,
  color: colors.ink,
  background: "#ffffff",
  outline: "none",
};

const inlineResultAreaStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 14,
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  marginTop: 18,
};

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "15px 34px",
    border: "1px solid " + (disabled ? "#cbd5e1" : colors.blue),
    borderRadius: 16,
    background: disabled ? "#dbe4f6" : colors.blue,
    color: "#ffffff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
    fontSize: 18,
    minWidth: 160,
    boxShadow: disabled ? "none" : "0 10px 18px rgba(49, 87, 213, 0.18)",
  };
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "15px 26px",
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  background: "#ffffff",
  color: colors.ink,
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 18,
};

const errorStyle: React.CSSProperties = {
  padding: 12,
  border: "1px solid " + colors.errorBorder,
  borderRadius: 14,
  background: colors.errorBg,
  color: "#991b1b",
  fontSize: 13,
  fontWeight: 750,
};

const searchMetaStyle: React.CSSProperties = {
  padding: 11,
  border: "1px solid " + colors.line,
  borderRadius: 14,
  background: "#f8fafc",
  color: colors.muted,
  fontSize: 13,
  lineHeight: 1.45,
};

const emptyStyle: React.CSSProperties = {
  padding: 14,
  border: "1px solid " + colors.line,
  borderRadius: 14,
  background: "#f8fafc",
  color: colors.muted,
  fontSize: 14,
};

const resultRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 16,
  alignItems: "center",
  padding: 14,
  border: "1px solid " + colors.lineSoft,
  borderRadius: 16,
  background: "#ffffff",
  color: colors.ink,
  textDecoration: "none",
};

const matterTitleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 950,
  color: colors.blueDark,
  marginBottom: 4,
};

const matterMetaStyle: React.CSSProperties = {
  color: colors.ink,
  fontSize: 14,
  fontWeight: 750,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const matterSubMetaStyle: React.CSSProperties = {
  marginTop: 4,
  color: colors.muted,
  fontSize: 12,
  lineHeight: 1.4,
};

const resultAmountStyle: React.CSSProperties = {
  display: "grid",
  gap: 5,
  textAlign: "right",
  color: colors.muted,
  fontSize: 13,
};
