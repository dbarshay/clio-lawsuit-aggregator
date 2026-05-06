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

type AdvancedSearchFields = {
  patient: string;
  provider: string;
  insurer: string;
  claim: string;
  master: string;
  indexAaa: string;
  status: string;
  finalStatus: string;
  denialReason: string;
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

function emptyAdvancedSearchFields(): AdvancedSearchFields {
  return {
    patient: "",
    provider: "",
    insurer: "",
    claim: "",
    master: "",
    indexAaa: "",
    status: "",
    finalStatus: "",
    denialReason: "",
  };
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

function indexAaaNumberFromMatter(m: any) {
  return clean(
    m?.indexAaaNumber ??
      m?.index_aaa_number ??
      m?.indexAAANumber ??
      m?.indexNumber ??
      m?.index_number ??
      ""
  );
}

function statusFromMatter(m: any) {
  return clean(m?.status ?? m?.matterStage ?? m?.matter_stage ?? m?.stage ?? "");
}

function finalStatusFromMatter(m: any) {
  return clean(m?.closeReason ?? m?.close_reason ?? m?.finalStatus ?? m?.final_status ?? "");
}

function denialReasonFromMatter(m: any) {
  return clean(m?.denialReason ?? m?.denial_reason ?? "");
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

function uniqueSuggestionValues(values: string[], limit = 12) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const cleanValue = clean(value);
    const key = lower(cleanValue);

    if (!cleanValue || seen.has(key)) continue;

    seen.add(key);
    out.push(cleanValue);

    if (out.length >= limit) break;
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
    const mapped: MatterResult[] = [];

    try {
      const prefixRows = await fetchFastRows(
        `/api/claim-index/by-display-prefix?prefix=${encodeURIComponent(q)}&limit=8`
      );

      for (const row of prefixRows) {
        const mappedRow = toMatterResult(row, "Matter number");
        if (mappedRow) mapped.push(mappedRow);
      }
    } catch {
      // Continue to claim lookup for numeric inputs.
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
  const [brlNumberInput, setBrlNumberInput] = useState("");
  const [lawsuitNumberInput, setLawsuitNumberInput] = useState("");
  const [directPatientInput, setDirectPatientInput] = useState("");
  const [directClaimInput, setDirectClaimInput] = useState("");
  const [patientSearchInput, setPatientSearchInput] = useState("");
  const [claimSearchInput, setClaimSearchInput] = useState("");
  const [providerSearchInput, setProviderSearchInput] = useState("");
  const [directPatientSuggestions, setDirectPatientSuggestions] = useState<string[]>([]);
  const [patientSearchSuggestions, setPatientSearchSuggestions] = useState<string[]>([]);
  const [claimSearchSuggestions, setClaimSearchSuggestions] = useState<string[]>([]);
  const [providerSearchSuggestions, setProviderSearchSuggestions] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedFields, setAdvancedFields] = useState<AdvancedSearchFields>(() =>
    emptyAdvancedSearchFields()
  );
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patient = clean(params.get("patient"));
    const provider = clean(params.get("provider"));
    const claim = clean(params.get("claim"));

    if (patient) {
      void runTargetedSuggestionSearch(patient, "Patient");
    } else if (provider) {
      void runTargetedSuggestionSearch(provider, "Provider");
    } else if (claim) {
      void runTargetedSuggestionSearch(claim, "Claim number");
    }
  }, []);

  async function loadPatientSuggestions(value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
    const q = clean(value);

    if (q.length < 2) {
      setter([]);
      return;
    }

    try {
      const rows = await fetchFastRows(`/api/claim-index/by-patient?name=${encodeURIComponent(q)}`);
      setter(uniqueSuggestionValues(rows.map((row: any) => patientName(row))));
    } catch {
      setter([]);
    }
  }

  async function loadClaimSuggestions(value: string) {
    const q = clean(value);

    if (q.length < 2) {
      setClaimSearchSuggestions([]);
      return;
    }

    try {
      const rows = await fetchFastRows(`/api/claim-index/search?claim=${encodeURIComponent(q)}`);
      setterClaimSuggestionsFromRows(rows);
    } catch {
      setClaimSearchSuggestions([]);
    }
  }

  function setterClaimSuggestionsFromRows(rows: any[]) {
    setClaimSearchSuggestions(uniqueSuggestionValues(rows.map((row: any) => claimNumberFromMatter(row))));
  }

  async function loadProviderSuggestions(value: string) {
    const q = clean(value);

    if (q.length < 2) {
      setProviderSearchSuggestions([]);
      return;
    }

    try {
      const rows = await fetchFastRows(`/api/claim-index/by-provider?name=${encodeURIComponent(q)}`);
      setProviderSearchSuggestions(uniqueSuggestionValues(rows.map((row: any) => providerName(row))));
    } catch {
      setProviderSearchSuggestions([]);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const value = directPatientInput;

    const timer = window.setTimeout(() => {
      if (!cancelled) void loadPatientSuggestions(value, setDirectPatientSuggestions);
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [directPatientInput]);

  useEffect(() => {
    let cancelled = false;
    const value = patientSearchInput;

    const timer = window.setTimeout(() => {
      if (!cancelled) void loadPatientSuggestions(value, setPatientSearchSuggestions);
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [patientSearchInput]);

  useEffect(() => {
    let cancelled = false;
    const value = claimSearchInput;

    const timer = window.setTimeout(() => {
      if (!cancelled) void loadClaimSuggestions(value);
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [claimSearchInput]);

  useEffect(() => {
    let cancelled = false;
    const value = providerSearchInput;

    const timer = window.setTimeout(() => {
      if (!cancelled) void loadProviderSuggestions(value);
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [providerSearchInput]);

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
    setBrlNumberInput("");
    setLawsuitNumberInput("");
    setDirectPatientInput("");
    setDirectClaimInput("");
    setPatientSearchInput("");
    setClaimSearchInput("");
    setProviderSearchInput("");
    setAdvancedFields(emptyAdvancedSearchFields());
    setLoading(false);
    setSearched(false);
    setError("");
    setResults([]);
    setCheckedLabel("");
    setSuggestions([]);
    setDirectPatientSuggestions([]);
    setPatientSearchSuggestions([]);
    setClaimSearchSuggestions([]);
    setProviderSearchSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);
  }

  function filteredSearchUrl(
    nextQuery: string,
    target: "Patient" | "Provider" | "Insurer" | "Claim number"
  ) {
    const q = clean(nextQuery);
    const params = new URLSearchParams();

    if (target === "Patient") {
      params.set("patient", q);
    } else if (target === "Provider") {
      params.set("provider", q);
    } else if (target === "Insurer") {
      params.set("insurer", q);
    } else {
      params.set("claim", q);
    }

    return `/matters?${params.toString()}`;
  }

  async function runFilteredSearchPage(
    nextQuery: string,
    target: "Patient" | "Provider" | "Insurer" | "Claim number"
  ) {
    const q = clean(nextQuery);

    if (!q) return;

    setQuery(q);
    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel(target);
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      const mapped: MatterResult[] = [];

      if (target === "Patient") {
        const rows = await fetchFastRows(`/api/claim-index/search?patient=${encodeURIComponent(q)}`);

        for (const row of rows) {
          if (!exactOrContains(patientName(row), q)) continue;
          const mappedRow = toMatterResult(row, "Patient");
          if (mappedRow) mapped.push(mappedRow);
        }
      } else if (target === "Provider") {
        const rows = await fetchFastRows(`/api/claim-index/search?provider=${encodeURIComponent(q)}`);

        for (const row of rows) {
          if (!exactOrContains(providerName(row), q)) continue;
          const mappedRow = toMatterResult(row, "Provider");
          if (mappedRow) mapped.push(mappedRow);
        }
      } else if (target === "Insurer") {
        const rows = await fetchFastRows(`/api/claim-index/search?insurer=${encodeURIComponent(q)}`);

        for (const row of rows) {
          if (!exactOrContains(insurerName(row), q)) continue;
          const mappedRow = toMatterResult(row, "Insurer");
          if (mappedRow) mapped.push(mappedRow);
        }
      } else {
        const rows = await fetchFastRows(`/api/claim-index/search?claim=${encodeURIComponent(q)}`);

        for (const row of rows) {
          if (!exactOrContains(claimNumberFromMatter(row), q)) continue;
          const mappedRow = toMatterResult(row, "Claim number", q);
          if (mappedRow) mapped.push(mappedRow);
        }
      }

      setResults(dedupeMatterResults(mapped));
    } catch (e: any) {
      setError(e?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runTargetedSuggestionSearch(
    nextQuery: string,
    target: "Patient" | "Provider" | "Insurer" | "Claim number"
  ) {
    const q = clean(nextQuery);

    if (!q) return;

    setQuery(q);
    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel(target);
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      const mapped: MatterResult[] = [];

      if (target === "Patient") {
        const rows = await fetchFastRows(`/api/claim-index/search?patient=${encodeURIComponent(q)}`);

        for (const row of rows) {
          if (!exactOrContains(patientName(row), q)) continue;
          const mappedRow = toMatterResult(row, "Patient");
          if (mappedRow) mapped.push(mappedRow);
        }
      } else if (target === "Provider") {
        const rows = await fetchFastRows(`/api/claim-index/search?provider=${encodeURIComponent(q)}`);

        for (const row of rows) {
          if (!exactOrContains(providerName(row), q)) continue;
          const mappedRow = toMatterResult(row, "Provider");
          if (mappedRow) mapped.push(mappedRow);
        }
      } else if (target === "Insurer") {
        const rows = await fetchFastRows(`/api/claim-index/search?insurer=${encodeURIComponent(q)}`);

        for (const row of rows) {
          if (!exactOrContains(insurerName(row), q)) continue;
          const mappedRow = toMatterResult(row, "Insurer");
          if (mappedRow) mapped.push(mappedRow);
        }
      } else {
        const rows = await fetchFastRows(`/api/claim-index/search?claim=${encodeURIComponent(q)}`);

        for (const row of rows) {
          if (!exactOrContains(claimNumberFromMatter(row), q)) continue;
          const mappedRow = toMatterResult(row, "Claim number", q);
          if (mappedRow) mapped.push(mappedRow);
        }
      }

      setResults(dedupeMatterResults(mapped));
    } catch (e: any) {
      setError(e?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function targetedSearchUrl(
    nextQuery: string,
    target: "Patient" | "Provider" | "Insurer" | "Claim number"
  ) {
    const q = clean(nextQuery);
    const params = new URLSearchParams();

    if (target === "Patient") {
      params.set("patient", q);
    } else if (target === "Provider") {
      params.set("provider", q);
    } else if (target === "Insurer") {
      params.set("insurer", q);
    } else {
      params.set("claim", q);
    }

    return `/matters?${params.toString()}`;
  }

  function launchTargetedSuggestionPage(
    nextQuery: string,
    target: "Patient" | "Provider" | "Insurer" | "Claim number"
  ) {
    const q = clean(nextQuery);
    if (!q) return;

    window.location.href = targetedSearchUrl(q, target);
  }

  function normalizeBrlEntryInput(v: string) {
    const digits = clean(v).replace(/^BRL/i, "").replace(/[^0-9]/g, "");
    return digits;
  }

  function normalizeLawsuitNumberEntryInput(v: string) {
    const digits = clean(v).replace(/[^0-9]/g, "").slice(0, 11);

    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  }

  function updateAdvancedField<K extends keyof AdvancedSearchFields>(
    key: K,
    value: AdvancedSearchFields[K]
  ) {
    setAdvancedFields((prev) => ({ ...prev, [key]: value }));
  }

  function advancedFieldCount(fields: AdvancedSearchFields) {
    return Object.values(fields).filter((v) => clean(v)).length;
  }

  function rawMatterMatchesAdvanced(row: any, fields: AdvancedSearchFields) {
    const patient = clean(fields.patient);
    const provider = clean(fields.provider);
    const insurer = clean(fields.insurer);
    const claim = clean(fields.claim);
    const master = clean(fields.master);
    const indexAaa = clean(fields.indexAaa);
    const status = clean(fields.status);
    const finalStatus = clean(fields.finalStatus);
    const denialReason = clean(fields.denialReason);

    if (patient && !exactOrContains(patientName(row), patient)) return false;
    if (provider && !exactOrContains(providerName(row), provider)) return false;
    if (insurer && !exactOrContains(insurerName(row), insurer)) return false;
    if (claim && !exactOrContains(claimNumberFromMatter(row), claim)) return false;
    if (master && !exactOrContains(masterLawsuitId(row), master)) return false;
    if (indexAaa && !exactOrContains(indexAaaNumberFromMatter(row), indexAaa)) return false;
    if (status && !exactOrContains(statusFromMatter(row), status)) return false;
    if (finalStatus && !exactOrContains(finalStatusFromMatter(row), finalStatus)) return false;
    if (denialReason && !exactOrContains(denialReasonFromMatter(row), denialReason)) return false;

    return true;
  }

  async function runBrlNumberSearch() {
    const digits = normalizeBrlEntryInput(brlNumberInput);
    const display = digits ? `BRL${digits}` : "";

    setLoading(true);
    setSearched(false);
    setError("");
    setResults([]);
    setCheckedLabel("");
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      if (!display) {
        throw new Error("Enter the BRL number digits.");
      }

      const rows = await fetchMatterByDisplayNumber(display);
      const exact = rows.find((row: any) => compact(displayNumber(row)) === compact(display));

      if (!exact) {
        throw new Error(`No exact matter found for ${display}.`);
      }

      const id = matterId(exact);

      if (!id) {
        throw new Error(`Matter ${display} was found, but no matter id was returned.`);
      }

      window.location.href = `/matter/${encodeURIComponent(id)}`;
    } catch (e: any) {
      setSearched(true);
      setError(e?.message || "BRL lookup failed.");
      setLoading(false);
    }
  }

  async function runLawsuitNumberSearch() {
    const q = clean(lawsuitNumberInput);

    setLoading(true);
    setSearched(false);
    setError("");
    setResults([]);
    setCheckedLabel("");
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      if (!q) {
        throw new Error("Enter a lawsuit number.");
      }

      if (!isMasterLawsuitInput(q)) {
        throw new Error("Enter the lawsuit number in YYYY.MM.NNNNN format.");
      }

      window.location.href = `/matters?master=${encodeURIComponent(q)}`;
    } catch (e: any) {
      setSearched(true);
      setError(e?.message || "Lawsuit lookup failed.");
      setLoading(false);
    }
  }

  async function runPatientSearch() {
    const q = clean(patientSearchInput);

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel("Patient");
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      if (!q) {
        throw new Error("Enter a patient name.");
      }

      const rows = await fetchFastRows(`/api/claim-index/by-patient?name=${encodeURIComponent(q)}`);
      const mapped: MatterResult[] = [];

      for (const row of rows) {
        if (!exactOrContains(patientName(row), q)) continue;
        const mappedRow = toMatterResult(row, "Patient");
        if (mappedRow) mapped.push(mappedRow);
      }

      setResults(dedupeMatterResults(mapped));
    } catch (e: any) {
      setError(e?.message || "Patient search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runClaimNumberSearch() {
    const q = clean(claimSearchInput);

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel("Claim number");
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      if (!q) {
        throw new Error("Enter a claim number.");
      }

      const rows = await fetchFastRows(`/api/claim-index/by-claim?claimNumber=${encodeURIComponent(q)}`);
      const mapped = rows
        .map((row: any) => toMatterResult(row, "Claim number", q))
        .filter(Boolean) as MatterResult[];

      setResults(dedupeMatterResults(mapped));
    } catch (e: any) {
      setError(e?.message || "Claim search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runProviderSearch() {
    const q = clean(providerSearchInput);

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel("Provider");
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      if (!q) {
        throw new Error("Enter a provider name.");
      }

      const rows = await fetchFastRows(`/api/claim-index/by-provider?name=${encodeURIComponent(q)}`);
      const mapped: MatterResult[] = [];

      for (const row of rows) {
        if (!exactOrContains(providerName(row), q)) continue;
        const mappedRow = toMatterResult(row, "Provider");
        if (mappedRow) mapped.push(mappedRow);
      }

      setResults(dedupeMatterResults(mapped));
    } catch (e: any) {
      setError(e?.message || "Provider search failed.");
    } finally {
      setLoading(false);
    }
  }

  function launchDirectPatient() {
    const q = clean(directPatientInput);
    if (!q) return;
    window.location.href = `/matters?workflow=patient&patient=${encodeURIComponent(q)}`;
  }

  function launchDirectClaim() {
    const q = clean(directClaimInput);
    if (!q) return;
    window.location.href = `/matters?workflow=claim&claim=${encodeURIComponent(q)}`;
  }

  async function runMainCombinedSearch() {
    const patient = clean(patientSearchInput);
    const claim = clean(claimSearchInput);
    const provider = clean(providerSearchInput);

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel("Combined search");
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      if (!patient && !claim && !provider) {
        throw new Error("Enter a patient, claim number, provider, or a combination of those fields.");
      }

      let rows: any[] = [];

      if (claim) {
        rows = await fetchFastRows(`/api/claim-index/by-claim?claimNumber=${encodeURIComponent(claim)}`);
      } else if (patient) {
        rows = await fetchFastRows(`/api/claim-index/by-patient?name=${encodeURIComponent(patient)}`);
      } else {
        rows = await fetchFastRows(`/api/claim-index/by-provider?name=${encodeURIComponent(provider)}`);
      }

      const mapped: MatterResult[] = [];

      for (const row of rows) {
        if (patient && !exactOrContains(patientName(row), patient)) continue;
        if (claim && !exactOrContains(claimNumberFromMatter(row), claim)) continue;
        if (provider && !exactOrContains(providerName(row), provider)) continue;

        const mappedRow = toMatterResult(row, "Combined search", claim);
        if (mappedRow) mapped.push(mappedRow);
      }

      setResults(dedupeMatterResults(mapped));
    } catch (e: any) {
      setError(e?.message || "Combined search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runAdvancedSearch() {
    const fields = advancedFields;
    const count = advancedFieldCount(fields);

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setCheckedLabel("Advanced search");
    setSuggestions([]);
    setSuggestionLabel("");
    setSuggestionsLoading(false);

    try {
      if (count === 0) {
        throw new Error("Enter at least one advanced search field.");
      }

      let rows: any[] = [];

      if (clean(fields.master)) {
        rows = await fetchFastRows(`/api/claim-index/by-master?masterLawsuitId=${encodeURIComponent(clean(fields.master))}`);
      } else if (clean(fields.claim)) {
        rows = await fetchFastRows(`/api/claim-index/by-claim?claimNumber=${encodeURIComponent(clean(fields.claim))}`);
      } else if (clean(fields.patient)) {
        rows = await fetchFastRows(`/api/claim-index/by-patient?name=${encodeURIComponent(clean(fields.patient))}`);
      } else if (clean(fields.provider)) {
        rows = await fetchFastRows(`/api/claim-index/by-provider?name=${encodeURIComponent(clean(fields.provider))}`);
      } else if (clean(fields.insurer)) {
        rows = await fetchFastRows(`/api/claim-index/search?insurer=${encodeURIComponent(clean(fields.insurer))}`);
      } else {
        throw new Error("Advanced search needs at least one primary field: Patient, Provider, Insurance Company, Claim Number, or Lawsuit Number.");
      }

      const mapped: MatterResult[] = [];

      for (const row of rows) {
        if (!rawMatterMatchesAdvanced(row, fields)) continue;
        const mappedRow = toMatterResult(row, "Advanced search", clean(fields.claim));
        if (mappedRow) mapped.push(mappedRow);
      }

      setResults(dedupeMatterResults(mapped));
      setAdvancedOpen(false);
    } catch (e: any) {
      setError(e?.message || "Advanced search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={topBarStyle}>
          <div style={leftLogoWrapStyle}>
            <img src="/brl-logo.png" alt="BRL Logo" style={brlLogoStyle} />
          </div>

          
          <div style={centerCaricatureWrapStyle}>
            <img
              src="/header-caricature.png"
              alt="Header caricature"
              style={headerCaricatureStyle}
            />
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
            .barsh-suggestion-row:hover,
            .barsh-result-row:hover {
              background: #f8fbff !important;
              border-color: #c7d7ef !important;
              box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06) !important;
              transform: translateY(-1px);
            }

            .barsh-field-link:hover {
              color: #1e3a8a !important;
              text-decoration-thickness: 2px !important;
            }

            .barsh-open-link:hover {
              background: #eff6ff !important;
              border-color: #93b4e8 !important;
              transform: translateY(-1px);
            }
          `}</style>

        <section style={lookupPanelStyle}>
          <div
            style={{
              padding: 24,
              border: "2px solid #cbd5e1",
              borderRadius: 24,
              background: "#ffffff",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                marginBottom: 16,
                color: "#475569",
                fontSize: 13,
                fontWeight: 950,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Direct Entry
            </div>

            <div style={knownInformationGridStyle}>
              <label style={structuredFieldStyle}>
                <span style={labelStyle}>BRL Number</span>
                <div style={brlInputWrapStyle}>
                  <span style={brlPrefixStyle}>BRL</span>
                  <input
                    value={brlNumberInput}
                    onChange={(e) => setBrlNumberInput(normalizeBrlEntryInput(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void runBrlNumberSearch();
                    }}
                    placeholder="30095"
                    style={prefixedInputStyle}
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              </label>

              <label style={structuredFieldStyle}>
                <span style={labelStyle}>Lawsuit Number</span>
                <input
                  value={lawsuitNumberInput}
                  onChange={(e) => setLawsuitNumberInput(normalizeLawsuitNumberEntryInput(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runLawsuitNumberSearch();
                  }}
                  placeholder="2026.05.00010"
                  style={inputStyle}
                  inputMode="numeric"
                  maxLength={13}
                />
              </label>
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              padding: 24,
              border: "2px solid #cbd5e1",
              borderRadius: 24,
              background: "#ffffff",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 950,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Search
              </div>

              <button
                type="button"
                onClick={() => setAdvancedOpen(true)}
                style={advancedSearchButtonStyle}
              >
                Advanced Search
              </button>
            </div>

            <div style={mainPageSearchGridStyle}>
              <label style={structuredFieldStyle}>
                <span style={labelStyle}>Patient</span>
                <input
                  value={patientSearchInput}
                  onChange={(e) => setPatientSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runMainCombinedSearch();
                  }}
                  placeholder="Search patient"
                  style={inputStyle}
                  list="barsh-search-patient-suggestions"
                />
              </label>

              <label style={structuredFieldStyle}>
                <span style={labelStyle}>Claim Number</span>
                <input
                  value={claimSearchInput}
                  onChange={(e) => setClaimSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runMainCombinedSearch();
                  }}
                  placeholder="Search claim number"
                  style={inputStyle}
                  list="barsh-search-claim-suggestions"
                />
              </label>

              <label style={structuredFieldStyle}>
                <span style={labelStyle}>Provider</span>
                <input
                  value={providerSearchInput}
                  onChange={(e) => setProviderSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runMainCombinedSearch();
                  }}
                  placeholder="Search provider"
                  style={inputStyle}
                  list="barsh-search-provider-suggestions"
                />
              </label>
            </div>

            <datalist id="barsh-search-patient-suggestions">
              {patientSearchSuggestions.map((value) => (
                <option key={`search-patient-${value}`} value={value} />
              ))}
            </datalist>

            <datalist id="barsh-search-claim-suggestions">
              {claimSearchSuggestions.map((value) => (
                <option key={`search-claim-${value}`} value={value} />
              ))}
            </datalist>

            <datalist id="barsh-search-provider-suggestions">
              {providerSearchSuggestions.map((value) => (
                <option key={`search-provider-${value}`} value={value} />
              ))}
            </datalist>

            <div style={structuredButtonGridStyle}>
              <button type="button" onClick={runMainCombinedSearch} disabled={loading} style={primaryButtonStyle(loading)}>
                Search
              </button>

              <button type="button" onClick={resetSearch} style={secondaryButtonStyle}>
                Clear Results
              </button>
            </div>
          </div>

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
                No matching matter was returned.
              </div>
            )}

            {results.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                {results.map((row) => (
                  <div key={row.id} className="barsh-result-row" style={resultRowStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={resultTopLineStyle}>
                        <a href={`/matter/${row.id}`} style={matterTitleLinkStyle}>
                          {row.displayNumber || row.id}
                        </a>
                        {row.matchedBy && <span style={typeaheadMatchedBadgeStyle}>{row.matchedBy}</span>}
                      </div>

                      <div style={resultMetaGridStyle}>
                        <div style={typeaheadFieldStyle}>
                          <span style={typeaheadFieldLabelStyle}>Patient</span>
                          {row.patient ? (
                            <a href={filteredSearchUrl(row.patient, "Patient")} className="barsh-field-link" style={resultFieldLinkStyle}>
                              {row.patient}
                            </a>
                          ) : (
                            <span style={typeaheadMissingStyle}>No patient</span>
                          )}
                        </div>

                        <div style={typeaheadFieldStyle}>
                          <span style={typeaheadFieldLabelStyle}>Provider</span>
                          {row.provider ? (
                            <a href={filteredSearchUrl(row.provider, "Provider")} className="barsh-field-link" style={resultFieldLinkStyle}>
                              {row.provider}
                            </a>
                          ) : (
                            <span style={typeaheadMissingStyle}>No provider</span>
                          )}
                        </div>

                        <div style={typeaheadFieldStyle}>
                          <span style={typeaheadFieldLabelStyle}>Insurer</span>
                          {row.insurer ? (
                            <a href={filteredSearchUrl(row.insurer, "Insurer")} className="barsh-field-link" style={resultFieldLinkStyle}>
                              {row.insurer}
                            </a>
                          ) : (
                            <span style={typeaheadMissingStyle}>No insurer</span>
                          )}
                        </div>

                        <div style={typeaheadFieldStyle}>
                          <span style={typeaheadFieldLabelStyle}>Claim</span>
                          {row.claimNumber ? (
                            <a href={filteredSearchUrl(row.claimNumber, "Claim number")} className="barsh-field-link" style={resultFieldLinkStyle}>
                              {row.claimNumber}
                            </a>
                          ) : (
                            <span style={typeaheadMissingStyle}>—</span>
                          )}
                        </div>

                        <div style={typeaheadFieldStyle}>
                          <span style={typeaheadFieldLabelStyle}>Master Lawsuit</span>
                          <span>{row.masterLawsuitId || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div style={resultAmountStyle}>
                      <span style={typeaheadAmountStyle}>{money(row.claimAmount)}</span>
                      <a href={`/matter/${row.id}`} className="barsh-open-link" style={typeaheadOpenLinkStyle}>
                        Open Matter
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && <div style={searchMetaStyle}>Searching...</div>}
          </div>

          {advancedOpen && (
            <div style={advancedOverlayStyle} role="dialog" aria-modal="true">
              <div style={advancedModalStyle}>
                <div style={advancedModalHeaderStyle}>
                  <div>
                    <div style={structuredSearchKickerStyle}>Advanced Search</div>
                    <h2 style={advancedModalTitleStyle}>Combine Search Fields</h2>
                    <div style={advancedModalHelpStyle}>
                      Enter one or more fields.  Patient, Provider, Insurance Company, Claim Number, or Lawsuit Number should be used as the primary lookup field.
                    </div>
                  </div>

                  <button type="button" onClick={() => setAdvancedOpen(false)} style={advancedCloseButtonStyle}>
                    ×
                  </button>
                </div>

                <div style={advancedGridStyle}>
                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Patient</span>
                    <input value={advancedFields.patient} onChange={(e) => updateAdvancedField("patient", e.target.value)} style={inputStyle} />
                  </label>

                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Provider</span>
                    <input value={advancedFields.provider} onChange={(e) => updateAdvancedField("provider", e.target.value)} style={inputStyle} />
                  </label>

                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Insurance Company</span>
                    <input value={advancedFields.insurer} onChange={(e) => updateAdvancedField("insurer", e.target.value)} style={inputStyle} />
                  </label>

                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Claim Number</span>
                    <input value={advancedFields.claim} onChange={(e) => updateAdvancedField("claim", e.target.value)} style={inputStyle} />
                  </label>

                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Lawsuit Number</span>
                    <input value={advancedFields.master} onChange={(e) => updateAdvancedField("master", e.target.value)} placeholder="2026.05.00010" style={inputStyle} />
                  </label>

                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Index / AAA Number</span>
                    <input value={advancedFields.indexAaa} onChange={(e) => updateAdvancedField("indexAaa", e.target.value)} style={inputStyle} />
                  </label>

                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Status</span>
                    <input value={advancedFields.status} onChange={(e) => updateAdvancedField("status", e.target.value)} style={inputStyle} />
                  </label>

                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Final Status</span>
                    <input value={advancedFields.finalStatus} onChange={(e) => updateAdvancedField("finalStatus", e.target.value)} style={inputStyle} />
                  </label>

                  <label style={structuredFieldStyle}>
                    <span style={labelStyle}>Denial Reason</span>
                    <input value={advancedFields.denialReason} onChange={(e) => updateAdvancedField("denialReason", e.target.value)} style={inputStyle} />
                  </label>
                </div>

                <div style={advancedModalActionsStyle}>
                  <button type="button" onClick={runAdvancedSearch} disabled={loading} style={primaryButtonStyle(loading)}>
                    Run Advanced Search
                  </button>

                  <button type="button" onClick={() => setAdvancedFields(emptyAdvancedSearchFields())} style={secondaryButtonStyle}>
                    Clear Fields
                  </button>

                  <button type="button" onClick={() => setAdvancedOpen(false)} style={secondaryButtonStyle}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
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
  marginBottom: 14,
};

const leftLogoWrapStyle: React.CSSProperties = {
  gridColumn: "1",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
};

const centerCaricatureWrapStyle: React.CSSProperties = {
  gridColumn: "2",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
  minHeight: 218,
  padding: "0 8px",
};

const headerCaricatureStyle: React.CSSProperties = {
  width: 326,
  height: 218,
  objectFit: "contain",
  objectPosition: "center center",
  borderRadius: 18,
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
  marginTop: 18,
  padding: 0,
  border: "none",
  borderRadius: 0,
  background: "transparent",
  boxShadow: "none",
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
  transition: "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
};

const matterTitleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 950,
  color: colors.blueDark,
  marginBottom: 4,
};

const matterTitleLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  fontSize: 17,
  fontWeight: 950,
  color: colors.blueDark,
  marginBottom: 4,
  textDecoration: "none",
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
  background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
};

const typeaheadHeadingStyle: React.CSSProperties = {
  color: colors.ink,
  fontSize: 13,
  fontWeight: 950,
  letterSpacing: "0.02em",
};

const typeaheadHelpTextStyle: React.CSSProperties = {
  marginTop: 3,
  color: colors.subtle,
  fontSize: 12,
  fontWeight: 650,
};

const typeaheadStatusStyle: React.CSSProperties = {
  color: colors.subtle,
  fontSize: 12,
  fontWeight: 850,
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
  gap: 16,
  padding: "12px 14px",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#ffffff",
  color: colors.ink,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
  transition: "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
};




const typeaheadTextButtonStyle: React.CSSProperties = {
  appearance: "none",
  border: 0,
  padding: 0,
  margin: 0,
  background: "transparent",
  color: colors.ink,
  font: "inherit",
  fontWeight: 850,
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationThickness: 1,
  textUnderlineOffset: 3,
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


const typeaheadTopLineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

const resultTopLineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

const typeaheadTitleLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  color: colors.blueDark,
  fontSize: 17,
  fontWeight: 950,
  textDecoration: "none",
};

const typeaheadMatchedBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 7px",
  border: "1px solid #dbe3ee",
  borderRadius: 999,
  background: "#f8fafc",
  color: colors.subtle,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const typeaheadMetaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(120px, 0.85fr) minmax(190px, 1.2fr) minmax(160px, 1fr) minmax(95px, 0.5fr)",
  gap: 10,
  alignItems: "start",
};

const resultMetaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(120px, 0.85fr) minmax(190px, 1.2fr) minmax(160px, 1fr) minmax(95px, 0.5fr) minmax(120px, 0.65fr)",
  gap: 10,
  alignItems: "start",
};

const typeaheadFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const typeaheadFieldLabelStyle: React.CSSProperties = {
  color: colors.subtle,
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const typeaheadFieldLinkStyle: React.CSSProperties = {
  color: colors.ink,
  fontSize: 13,
  fontWeight: 850,
  textDecoration: "underline",
  textDecorationThickness: 1,
  textUnderlineOffset: 3,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const resultFieldLinkStyle: React.CSSProperties = {
  color: colors.ink,
  fontSize: 13,
  fontWeight: 850,
  textDecoration: "underline",
  textDecorationThickness: 1,
  textUnderlineOffset: 3,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const typeaheadMissingStyle: React.CSSProperties = {
  color: colors.subtle,
  fontSize: 13,
  fontWeight: 700,
};

const typeaheadAmountStyle: React.CSSProperties = {
  color: colors.muted,
  fontSize: 13,
  fontWeight: 900,
  fontVariantNumeric: "tabular-nums",
};

const typeaheadOpenLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  border: "1px solid #b6c7e3",
  borderRadius: 11,
  background: "#f8fbff",
  color: colors.blueDark,
  fontSize: 12,
  fontWeight: 950,
  textDecoration: "none",
  whiteSpace: "nowrap",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
  transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease",
};


const structuredSearchHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  marginBottom: 18,
};

const structuredSearchKickerStyle: React.CSSProperties = {
  color: colors.subtle,
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const structuredSearchTitleStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: colors.ink,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: "-0.035em",
};

const advancedSearchButtonStyle: React.CSSProperties = {
  appearance: "none",
  border: "1px solid #bfdbfe",
  borderRadius: 16,
  background: "#eff6ff",
  color: "#1e3a8a",
  padding: "12px 16px",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const structuredSearchGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 14,
  alignItems: "end",
};

const knownInformationGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
  alignItems: "end",
};

const structuredFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 7,
  minWidth: 0,
};

const brlInputWrapStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "center",
  border: "1px solid " + colors.line,
  borderRadius: 16,
  background: "#ffffff",
  overflow: "hidden",
};

const brlPrefixStyle: React.CSSProperties = {
  height: "100%",
  display: "inline-flex",
  alignItems: "center",
  padding: "0 14px",
  borderRight: "1px solid " + colors.line,
  background: "#f8fafc",
  color: colors.blueDark,
  fontSize: 16,
  fontWeight: 950,
  letterSpacing: "0.02em",
};

const prefixedInputStyle: React.CSSProperties = {
  border: "none",
  outline: "none",
  padding: "16px 18px",
  color: colors.ink,
  fontSize: 18,
  fontWeight: 850,
  background: "#ffffff",
  minWidth: 0,
};

const structuredButtonGridStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 18,
};

const advancedOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 500,
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "rgba(15, 23, 42, 0.42)",
};

const advancedModalStyle: React.CSSProperties = {
  width: "min(1120px, calc(100vw - 48px))",
  maxHeight: "calc(100vh - 70px)",
  overflow: "auto",
  border: "1px solid " + colors.line,
  borderRadius: 24,
  background: "#ffffff",
  boxShadow: "0 28px 80px rgba(15, 23, 42, 0.32)",
  padding: 22,
};

const advancedModalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  marginBottom: 18,
};

const advancedModalTitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: colors.ink,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: "-0.03em",
};

const advancedModalHelpStyle: React.CSSProperties = {
  marginTop: 6,
  color: colors.muted,
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.45,
};

const advancedCloseButtonStyle: React.CSSProperties = {
  appearance: "none",
  width: 40,
  height: 40,
  border: "1px solid " + colors.line,
  borderRadius: 14,
  background: "#ffffff",
  color: colors.ink,
  fontSize: 26,
  fontWeight: 900,
  lineHeight: 1,
  cursor: "pointer",
};

const advancedGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
};

const advancedModalActionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  justifyContent: "flex-end",
  marginTop: 20,
  paddingTop: 16,
  borderTop: "1px solid " + colors.lineSoft,
};


const mainPageSectionLabelStyle: React.CSSProperties = {
  margin: "4px 0 10px",
  color: colors.subtle,
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const mainPageDirectHelpStyle: React.CSSProperties = {
  marginTop: 10,
  color: colors.muted,
  fontSize: 12,
  fontWeight: 750,
  lineHeight: 1.4,
};

const mainPageSearchDividerStyle: React.CSSProperties = {
  height: 1,
  margin: "20px 0 16px",
  background: colors.lineSoft,
};

const mainPageSearchHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  margin: "0 0 10px",
};

const mainPageSearchGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
  alignItems: "end",
};
