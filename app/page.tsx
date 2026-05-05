"use client";

import React, { useEffect, useMemo, useState } from "react";

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

function patientName(m: any) {
  return nameLike(
    m?.patientName ??
      m?.patient_name ??
      m?.patient
  );
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

async function hydrateMatterResultFromContext(
  base: MatterResult,
  matchedBy: string,
  fallbackClaimNumber = ""
): Promise<MatterResult> {
  if (!base?.id) return base;

  try {
    const res = await fetch(`/api/clio/matter-context?matterId=${encodeURIComponent(base.id)}`, {
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok || !json?.ok) return base;

    const contextMatter = json?.matter ?? json;
    const hydrated = toMatterResult(
      {
        ...contextMatter,
        matterId: contextMatter?.id ?? base.id,
        displayNumber: contextMatter?.displayNumber ?? contextMatter?.display_number ?? base.displayNumber,
        patientName: contextMatter?.patient?.name ?? contextMatter?.patientName ?? contextMatter?.patient_name,
        providerName:
          contextMatter?.client?.name ??
          contextMatter?.providerName ??
          contextMatter?.provider_name ??
          base.provider,
        insurerName: contextMatter?.insurer?.name ?? contextMatter?.insurerName ?? contextMatter?.insurer_name,
        claimNumber: contextMatter?.claimNumber ?? contextMatter?.claim_number ?? base.claimNumber,
        masterLawsuitId:
          contextMatter?.masterLawsuitId ?? contextMatter?.master_lawsuit_id ?? base.masterLawsuitId,
        claimAmount: contextMatter?.claimAmount ?? contextMatter?.claim_amount ?? base.claimAmount,
      },
      matchedBy,
      fallbackClaimNumber
    );
    return hydrated || base;
  } catch {
    return base;
  }
}

async function getEntrySearchResults(qInput: string): Promise<{
  checkedLabel: string;
  results: MatterResult[];
}> {
  const q = clean(qInput);

  if (!q) {
    return { checkedLabel: "", results: [] };
  }

  const kind = classifySearch(q);
  const mapped: MatterResult[] = [];

  if (kind === "brl_matter") {
    const matterDisplay = normalizeBrlMatterInput(q);
    const matters = await fetchMatterByDisplayNumber(matterDisplay);

    for (const row of matters) {
      if (compact(displayNumber(row)) !== compact(matterDisplay)) continue;
      const mappedRow = toMatterResult(row, "Matter number");
      if (mappedRow) mapped.push(await hydrateMatterResultFromContext(mappedRow, "Matter number"));
    }

    return { checkedLabel: "Matter number", results: dedupeMatterResults(mapped) };
  }

  if (kind === "numeric_ambiguous") {
    const matterDisplay = numericToBrlMatter(q);
    const matters = await fetchMatterByDisplayNumber(matterDisplay);

    for (const row of matters) {
      if (compact(displayNumber(row)) !== compact(matterDisplay)) continue;
      const mappedRow = toMatterResult(row, "Matter number");
      if (mappedRow) mapped.push(await hydrateMatterResultFromContext(mappedRow, "Matter number"));
    }

    const claimRows = await fetchFastRows(`/api/claim-index/by-claim?claimNumber=${encodeURIComponent(q)}`);
    for (const row of claimRows) {
      const mappedRow = toMatterResult(row, "Claim number", q);
      if (mappedRow) mapped.push(mappedRow);
    }

    return { checkedLabel: "Matter number / Claim number", results: dedupeMatterResults(mapped) };
  }

  if (kind === "master") {
    const rows = await fetchFastRows(`/api/claim-index/by-master?masterLawsuitId=${encodeURIComponent(q)}`);
    for (const row of rows) {
      const mappedRow = toMatterResult(row, "Master lawsuit number");
      if (mappedRow) mapped.push(mappedRow);
    }

    return { checkedLabel: "Master lawsuit number", results: dedupeMatterResults(mapped) };
  }

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

  return { checkedLabel: "Patient / Provider", results: dedupeMatterResults(mapped) };
}


async function getEntryTypeaheadResults(qInput: string): Promise<{
  checkedLabel: string;
  results: MatterResult[];
}> {
  const q = clean(qInput);

  if (!q) {
    return { checkedLabel: "", results: [] };
  }

  const kind = classifySearch(q);

  if (kind === "brl_matter" || kind === "numeric_ambiguous") {
    const matterDisplay = kind === "brl_matter" ? normalizeBrlMatterInput(q) : numericToBrlMatter(q);
    const matterPrefix = compact(matterDisplay);
    const matters = await fetchMatterByDisplayNumber(matterDisplay);
    const mapped: MatterResult[] = [];

    for (const row of matters) {
      const rowDisplay = compact(displayNumber(row));
      if (!rowDisplay.startsWith(matterPrefix)) continue;

      const mappedRow = toMatterResult(row, "Matter number");
      if (mappedRow) mapped.push(await hydrateMatterResultFromContext(mappedRow, "Matter number"));
    }

    if (kind === "numeric_ambiguous") {
      try {
        const claimRows = await fetchFastRows(`/api/claim-index/search?claim=${encodeURIComponent(q)}`);

        for (const row of claimRows) {
          const mappedRow = toMatterResult(row, "Claim number", q);
          if (mappedRow) mapped.push(mappedRow);
        }
      } catch {
        // Keep matter-number prefix suggestions even if claim lookup is unavailable.
      }
    }

    return {
      checkedLabel: kind === "brl_matter" ? "Matter number" : "Matter number / Claim number",
      results: dedupeMatterResults(mapped),
    };
  }

  return getEntrySearchResults(q);
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MatterResult[]>([]);
  const [checkedLabel, setCheckedLabel] = useState("");
  const [suggestions, setSuggestions] = useState<MatterResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionLabel, setSuggestionLabel] = useState("");

  const resultLabel = useMemo(() => {
    if (!searched || loading || error) return "";
    if (results.length === 1) return "1 matching matter found.";
    return `${results.length} matching matters found.`;
  }, [searched, loading, error, results.length]);

  useEffect(() => {
    const q = clean(query);

    if (q.length < 2) {
      setSuggestions([]);
      setSuggestionLabel("");
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);

      try {
        const quick = await getEntryTypeaheadResults(q);

        if (cancelled) return;

        setSuggestions(quick.results.slice(0, 6));
        setSuggestionLabel(quick.checkedLabel);
      } catch {
        if (cancelled) return;

        setSuggestions([]);
        setSuggestionLabel("");
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function runSearch() {
    const q = clean(query);

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel("");
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      if (!q) {
        throw new Error("Enter a matter number, master lawsuit number, claim number, patient, or provider.");
      }

      const search = await getEntrySearchResults(q);
      setCheckedLabel(search.checkedLabel);
      setResults(search.results);
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
            {clean(query).length >= 2 && !searched && (
              <div style={typeaheadSuggestionBoxStyle}>
                <div style={typeaheadHeaderStyle}>
                  <span>Suggestions</span>
                  <span>
                    {suggestionsLoading
                      ? "Searching..."
                      : suggestionLabel
                        ? `Checked: ${suggestionLabel}.`
                        : "Type to search."}
                  </span>
                </div>

                {!suggestionsLoading && suggestions.length === 0 && (
                  <div style={typeaheadEmptyStyle}>No quick suggestions yet.</div>
                )}

                {suggestions.length > 0 && (
                  <div style={typeaheadListStyle}>
                    {suggestions.map((row) => (
                      <a key={`suggestion-${row.id}`} href={`/matter/${row.id}`} style={typeaheadRowStyle}>
                        <div style={{ minWidth: 0 }}>
                          <div style={typeaheadTitleStyle}>{row.displayNumber || row.id}</div>
                          <div style={typeaheadMetaStyle}>
                            {row.patient || "No patient"} · {row.provider || "No provider"} · {row.insurer || "No insurer"}
                          </div>
                        </div>
                        <div style={typeaheadRightStyle}>
                          <span>{money(row.claimAmount)}</span>
                          <strong>Open</strong>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

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


const typeaheadSuggestionBoxStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 12,
  border: "1px solid #dbe3ee",
  borderRadius: 18,
  background: "#f8fafc",
};

const typeaheadHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  color: colors.subtle,
  fontSize: 12,
  fontWeight: 800,
};

const typeaheadEmptyStyle: React.CSSProperties = {
  padding: "8px 10px",
  color: colors.muted,
  fontSize: 13,
};

const typeaheadListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const typeaheadRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#ffffff",
  color: colors.ink,
  textDecoration: "none",
};

const typeaheadTitleStyle: React.CSSProperties = {
  color: colors.blueDark,
  fontSize: 16,
  fontWeight: 950,
  marginBottom: 3,
};

const typeaheadMetaStyle: React.CSSProperties = {
  color: colors.ink,
  fontSize: 13,
  fontWeight: 750,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const typeaheadRightStyle: React.CSSProperties = {
  display: "grid",
  justifyItems: "end",
  gap: 4,
  color: colors.muted,
  fontSize: 12,
  fontWeight: 800,
};
