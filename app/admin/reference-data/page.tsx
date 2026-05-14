"use client";

import React, { useEffect, useMemo, useState } from "react";

type ReferenceTypeOption = {
  value: string;
  label: string;
};

type ReferenceAlias = {
  id: string;
  entityId: string;
  alias: string;
  normalizedAlias: string;
  createdAt: string;
  updatedAt: string;
};

type ReferenceEntity = {
  id: string;
  type: string;
  displayName: string;
  normalizedName: string;
  active: boolean;
  notes: string | null;
  details: any | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  aliases?: ReferenceAlias[];
};

const DEFAULT_TYPES: ReferenceTypeOption[] = [
  { value: "individual", label: "Individuals" },
  { value: "adversary_attorney", label: "Adversary Attorneys" },
  { value: "insurer_company", label: "Insurers / Companies" },
  { value: "provider_client", label: "Providers / Clients" },
  { value: "patient", label: "Patients" },
  { value: "court_venue", label: "Courts / Venues" },
  { value: "service_type", label: "Service Types" },
  { value: "denial_reason", label: "Denial Reasons" },
  { value: "transaction_type", label: "Transaction Types" },
  { value: "transaction_status", label: "Transaction Statuses" },
  { value: "other", label: "Other" },
];

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function formatDate(value: unknown): string {
  const raw = text(value);
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString();
}

function prettyJson(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseJsonInput(value: string): any {
  const cleaned = text(value);
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Additional Details must be valid JSON.");
  }
}

function activeLabel(value: boolean): string {
  return value ? "Active" : "Inactive";
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 800,
    background: active ? "#dcfce7" : "#fee2e2",
    color: active ? "#166534" : "#991b1b",
    border: `1px solid ${active ? "#86efac" : "#fecaca"}`,
  };
}

export default function AdminReferenceDataPage() {
  const [typeOptions, setTypeOptions] = useState<ReferenceTypeOption[]>(DEFAULT_TYPES);
  const [selectedType, setSelectedType] = useState("individual");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [rows, setRows] = useState<ReferenceEntity[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [newDisplayName, setNewDisplayName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDetailsJson, setNewDetailsJson] = useState("");

  const [editDisplayName, setEditDisplayName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDetailsJson, setEditDetailsJson] = useState("");
  const [newAlias, setNewAlias] = useState("");

  const selectedTypeLabel = useMemo(
    () => typeOptions.find((option) => option.value === selectedType)?.label || selectedType,
    [selectedType, typeOptions]
  );

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) || null,
    [rows, selectedRowId]
  );

  function resetMessages() {
    setStatusMessage("");
    setErrorMessage("");
  }

  async function loadRows(nextType = selectedType, nextQuery = query, nextActive = activeFilter) {
    try {
      setLoading(true);
      resetMessages();

      const params = new URLSearchParams({
        type: nextType,
        q: nextQuery,
        active: nextActive,
        limit: "100",
      });

      const res = await fetch(`/api/reference-data/entities?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Reference data search failed.");
      }

      setRows(Array.isArray(json.entities) ? json.entities : []);
      if (Array.isArray(json.typeOptions) && json.typeOptions.length) {
        setTypeOptions(json.typeOptions);
      }

      setStatusMessage(
        `Loaded ${json.count ?? 0} ${json.count === 1 ? "record" : "records"} from local Barsh Matters reference data.`
      );
    } catch (err: any) {
      setRows([]);
      setErrorMessage(err?.message || "Reference data search failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows(selectedType, query, activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, activeFilter]);

  useEffect(() => {
    if (!selectedRow) {
      setEditDisplayName("");
      setEditNotes("");
      setNewAlias("");
      return;
    }

    setEditDisplayName(selectedRow.displayName || "");
    setEditNotes(selectedRow.notes || "");
    setEditDetailsJson(prettyJson(selectedRow.details));
    setNewAlias("");
  }, [selectedRow]);

  async function createRecord() {
    try {
      setSaving(true);
      resetMessages();

      if (!text(newDisplayName)) {
        throw new Error("Display name is required.");
      }

      const res = await fetch("/api/reference-data/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          displayName: newDisplayName,
          notes: newNotes,
          details: parseJsonInput(newDetailsJson),
          actorName: "Barsh Matters User",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not create reference record.");
      }

      setNewDisplayName("");
      setNewNotes("");
      setNewDetailsJson("");
      setSelectedRowId(json.entity?.id || "");
      setStatusMessage("Created local reference record.  No Clio data was changed.");
      await loadRows(selectedType, query, activeFilter);
      setSelectedRowId(json.entity?.id || "");
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not create reference record.");
    } finally {
      setSaving(false);
    }
  }

  async function updateRecord(operation = "update") {
    try {
      setSaving(true);
      resetMessages();

      if (!selectedRow) {
        throw new Error("Select a reference record first.");
      }

      const body: any = {
        id: selectedRow.id,
        operation,
        actorName: "Barsh Matters User",
      };

      if (operation === "update") {
        body.displayName = editDisplayName;
        body.notes = editNotes;
        body.details = parseJsonInput(editDetailsJson);
      }

      const res = await fetch("/api/reference-data/entities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not update reference record.");
      }

      setStatusMessage(
        operation === "deactivate"
          ? "Deactivated local reference record.  The record was not hard-deleted."
          : operation === "reactivate"
            ? "Reactivated local reference record."
            : "Updated local reference record.  No Clio data was changed."
      );

      await loadRows(selectedType, query, activeFilter);
      setSelectedRowId(json.entity?.id || selectedRow.id);
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not update reference record.");
    } finally {
      setSaving(false);
    }
  }

  async function addAlias() {
    try {
      setSaving(true);
      resetMessages();

      if (!selectedRow) {
        throw new Error("Select a reference record first.");
      }

      if (!text(newAlias)) {
        throw new Error("Alias is required.");
      }

      const res = await fetch("/api/reference-data/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: selectedRow.id,
          alias: newAlias,
          actorName: "Barsh Matters User",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not add alias.");
      }

      setNewAlias("");
      setStatusMessage("Added local search alias.  No Clio data was changed.");
      await loadRows(selectedType, query, activeFilter);
      setSelectedRowId(selectedRow.id);
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not add alias.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #dbeafe 0%, #f8fafc 42%, #eff6ff 100%)",
        padding: 28,
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "flex-start",
            marginBottom: 22,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.6, color: "#1d4ed8" }}>
              BARSH MATTERS ADMIN
            </div>
            <h1 style={{ margin: "4px 0 8px", fontSize: 34, lineHeight: 1.1 }}>
              Reference Data
            </h1>
            <p style={{ margin: 0, maxWidth: 820, color: "#475569", fontSize: 15, lineHeight: 1.5 }}>
              Manage targeted local Barsh Matters reference lists.  These records are stored in the
              local PostgreSQL database, not in Clio.  Clio should remain the document vault and external shell.
            </p>
          </div>

          <a
            href="/"
            style={{
              textDecoration: "none",
              border: "1px solid #bfdbfe",
              background: "#ffffff",
              color: "#1d4ed8",
              fontWeight: 900,
              borderRadius: 14,
              padding: "11px 14px",
              boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
              whiteSpace: "nowrap",
            }}
          >
            Return Home
          </a>
        </header>

        <section
          style={{
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
            borderRadius: 20,
            padding: 18,
            marginBottom: 18,
            boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>Local-first reference-data rules</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {[
              "Targeted list per field",
              "Active/inactive, no hard delete",
              "Aliases for messy search terms",
              "All changes are audit logged",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "#ffffff",
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  padding: 12,
                  fontWeight: 800,
                  color: "#1e3a8a",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "360px minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 22,
              padding: 18,
              boxShadow: "0 18px 42px rgba(15, 23, 42, 0.10)",
            }}
          >
            <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Search Lists</h2>

            <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
              List Type
            </label>
            <select
              value={selectedType}
              onChange={(event) => {
                setSelectedType(event.target.value);
                setSelectedRowId("");
              }}
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
              Search
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void loadRows();
                }
              }}
              placeholder="Name or alias"
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                marginBottom: 12,
              }}
            />

            <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
              Status
            </label>
            <select
              value={activeFilter}
              onChange={(event) => {
                setActiveFilter(event.target.value);
                setSelectedRowId("");
              }}
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                fontWeight: 800,
                marginBottom: 14,
              }}
            >
              <option value="all">Show Active + Inactive</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <button
              onClick={() => loadRows()}
              disabled={loading}
              style={{
                width: "100%",
                border: 0,
                background: loading ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                borderRadius: 14,
                padding: "12px 14px",
                fontWeight: 900,
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "Searching..." : "Search Local List"}
            </button>

            <div style={{ marginTop: 22, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Add Record</h2>

              <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
                Display Name
              </label>
              <input
                value={newDisplayName}
                onChange={(event) => setNewDisplayName(event.target.value)}
                placeholder={`New ${selectedTypeLabel} record`}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  marginBottom: 10,
                }}
              />

              <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
                Notes
              </label>
              <textarea
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
                placeholder="Optional local notes"
                rows={4}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  resize: "vertical",
                  marginBottom: 12,
                }}
              />

              <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
                Additional Details JSON
              </label>
              <textarea
                value={newDetailsJson}
                onChange={(event) => setNewDetailsJson(event.target.value)}
                placeholder={'Optional structured details, e.g. {"phone":"","address":{}}'}
                rows={5}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  resize: "vertical",
                  marginBottom: 12,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 12,
                }}
              />

              <button
                onClick={createRecord}
                disabled={saving}
                style={{
                  width: "100%",
                  border: 0,
                  background: saving ? "#94a3b8" : "#16a34a",
                  color: "#ffffff",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontWeight: 900,
                  cursor: saving ? "default" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Add Local Record"}
              </button>
            </div>
          </aside>

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 22,
              padding: 18,
              boxShadow: "0 18px 42px rgba(15, 23, 42, 0.10)",
              minHeight: 640,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>{selectedTypeLabel}</h2>
                <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 13 }}>
                  Local Barsh Matters data.  Not a Clio contact search.
                </p>
              </div>

              <button
                onClick={() => loadRows()}
                disabled={loading}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontWeight: 900,
                  cursor: loading ? "default" : "pointer",
                }}
              >
                Refresh
              </button>
            </div>

            {statusMessage && (
              <div
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 12,
                  fontWeight: 700,
                }}
              >
                {statusMessage}
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 12,
                  fontWeight: 700,
                }}
              >
                {errorMessage}
              </div>
            )}

            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#334155" }}>
                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e2e8f0" }}>Name</th>
                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e2e8f0" }}>Status</th>
                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e2e8f0" }}>Aliases</th>
                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e2e8f0" }}>Source</th>
                    <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e2e8f0" }}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 22, color: "#64748b", textAlign: "center" }}>
                        No records found.  Add records when you are ready to populate this local list.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRowId(row.id)}
                        style={{
                          cursor: "pointer",
                          background: row.id === selectedRowId ? "#eff6ff" : "#ffffff",
                        }}
                      >
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", fontWeight: 900 }}>
                          {row.displayName}
                          <div style={{ marginTop: 4, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                            {row.normalizedName}
                          </div>
                        </td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
                          <span style={pillStyle(row.active)}>{activeLabel(row.active)}</span>
                        </td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#334155" }}>
                          {row.aliases?.length ? row.aliases.map((alias) => alias.alias).join(", ") : "—"}
                        </td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#334155" }}>
                          {row.source || "barsh-matters-local"}
                        </td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#334155" }}>
                          {formatDate(row.updatedAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: 18,
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 16,
                background: selectedRow ? "#f8fafc" : "#ffffff",
              }}
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>Selected Record</h2>

              {!selectedRow ? (
                <p style={{ color: "#64748b", margin: 0 }}>
                  Select a row to edit its display name, notes, status, or aliases.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <strong>{selectedRow.displayName}</strong>
                      <span style={pillStyle(selectedRow.active)}>{activeLabel(selectedRow.active)}</span>
                    </div>

                    <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
                      Display Name
                    </label>
                    <input
                      value={editDisplayName}
                      onChange={(event) => setEditDisplayName(event.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        borderRadius: 12,
                        border: "1px solid #cbd5e1",
                        marginBottom: 10,
                      }}
                    />

                    <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
                      Notes
                    </label>
                    <textarea
                      value={editNotes}
                      onChange={(event) => setEditNotes(event.target.value)}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        borderRadius: 12,
                        border: "1px solid #cbd5e1",
                        resize: "vertical",
                        marginBottom: 12,
                      }}
                    />

                    <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
                      Additional Details JSON
                    </label>
                    <textarea
                      value={editDetailsJson}
                      onChange={(event) => setEditDetailsJson(event.target.value)}
                      rows={8}
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        borderRadius: 12,
                        border: "1px solid #cbd5e1",
                        resize: "vertical",
                        marginBottom: 12,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: 12,
                      }}
                    />

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => updateRecord("update")}
                        disabled={saving}
                        style={{
                          border: 0,
                          background: saving ? "#94a3b8" : "#2563eb",
                          color: "#ffffff",
                          borderRadius: 12,
                          padding: "10px 13px",
                          fontWeight: 900,
                          cursor: saving ? "default" : "pointer",
                        }}
                      >
                        Save Edit
                      </button>

                      {selectedRow.active ? (
                        <button
                          onClick={() => updateRecord("deactivate")}
                          disabled={saving}
                          style={{
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#991b1b",
                            borderRadius: 12,
                            padding: "10px 13px",
                            fontWeight: 900,
                            cursor: saving ? "default" : "pointer",
                          }}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => updateRecord("reactivate")}
                          disabled={saving}
                          style={{
                            border: "1px solid #bbf7d0",
                            background: "#ecfdf5",
                            color: "#166534",
                            borderRadius: 12,
                            padding: "10px 13px",
                            fontWeight: 900,
                            cursor: saving ? "default" : "pointer",
                          }}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 14,
                      background: "#ffffff",
                    }}
                  >
                    <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Aliases / Search Terms</h3>
                    <div style={{ marginBottom: 12, color: "#475569", fontSize: 13, lineHeight: 1.4 }}>
                      Add messy names, abbreviations, or alternate spellings without changing the canonical display name.
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <input
                        value={newAlias}
                        onChange={(event) => setNewAlias(event.target.value)}
                        placeholder="Add alias"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: "10px 11px",
                          borderRadius: 12,
                          border: "1px solid #cbd5e1",
                        }}
                      />
                      <button
                        onClick={addAlias}
                        disabled={saving}
                        style={{
                          border: 0,
                          background: saving ? "#94a3b8" : "#0f172a",
                          color: "#ffffff",
                          borderRadius: 12,
                          padding: "10px 12px",
                          fontWeight: 900,
                          cursor: saving ? "default" : "pointer",
                        }}
                      >
                        Add
                      </button>
                    </div>

                    {selectedRow.aliases?.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedRow.aliases.map((alias) => (
                          <div
                            key={alias.id}
                            style={{
                              border: "1px solid #e2e8f0",
                              borderRadius: 12,
                              padding: 10,
                              background: "#f8fafc",
                            }}
                          >
                            <strong>{alias.alias}</strong>
                            <div style={{ marginTop: 3, fontSize: 12, color: "#64748b" }}>
                              {alias.normalizedAlias}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#64748b", fontSize: 13 }}>No aliases yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
