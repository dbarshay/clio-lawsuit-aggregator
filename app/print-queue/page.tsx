"use client";

import { useEffect, useMemo, useState } from "react";
import BarshHeaderQuickNav from "@/app/components/BarshHeaderQuickNav";

type PrintQueueStatus = "" | "queued" | "printed" | "hold" | "skipped";

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
  }

  return "";
}

function num(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function shortDateTime(v: any): string {
  const raw = textValue(v);
  if (!raw) return "—";

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  return d.toLocaleString();
}

function clioMatterUrl(matterId: any): string {
  const id = textValue(matterId);
  return id ? `https://app.clio.com/nc/#/matters/${id}` : "";
}

const statusOptions: Array<{ value: PrintQueueStatus; label: string; countKey: string }> = [
  { value: "", label: "All", countKey: "all" },
  { value: "queued", label: "Queued", countKey: "queued" },
  { value: "printed", label: "Printed", countKey: "printed" },
  { value: "hold", label: "Hold", countKey: "hold" },
  { value: "skipped", label: "Skipped", countKey: "skipped" },
];

export default function PrintQueuePage() {
  const [statusFilter, setStatusFilter] = useState<PrintQueueStatus>("queued");
  const [masterLawsuitId, setMasterLawsuitId] = useState("");
  const [limit, setLimit] = useState(100);
  const [queue, setQueue] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    return Array.isArray(queue?.rows) ? queue.rows : [];
  }, [queue]);

  async function loadQueue(nextStatusFilter = statusFilter) {
    setLoading(true);
    setError("");

    try {
      const url = new URL("/api/documents/print-queue", window.location.origin);
      url.searchParams.set("limit", String(limit));

      const cleanMaster = masterLawsuitId.trim();
      if (cleanMaster) {
        url.searchParams.set("masterLawsuitId", cleanMaster);
      }

      if (nextStatusFilter) {
        url.searchParams.set("status", nextStatusFilter);
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not load print queue.");
      }

      setQueue(json);
    } catch (err: any) {
      setError(err?.message || "Could not load print queue.");
      setQueue(null);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatusFilter(nextStatusFilter: PrintQueueStatus) {
    setStatusFilter(nextStatusFilter);
    await loadQueue(nextStatusFilter);
  }

  async function updatePrintQueueStatus(row: any, status: "queued" | "printed" | "hold" | "skipped") {
    const id = Number(row?.id);

    if (!Number.isFinite(id) || id <= 0) {
      setStatusResult({
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

    setStatusLoadingId(id);
    setStatusResult(null);

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
      setStatusResult(json);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not update print queue status.");
      }

      await loadQueue(statusFilter);
    } catch (err: any) {
      setStatusResult({
        ok: false,
        error: err?.message || "Could not update print queue status.",
      });
    } finally {
      setStatusLoadingId(null);
    }
  }

  useEffect(() => {
    loadQueue("queued");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 16, width: "100vw", maxWidth: "none", marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10000,
          isolation: "isolate",
          display: "grid",
          gridTemplateColumns: "500px minmax(0, 1fr) 330px",
          alignItems: "start",
          gap: 16,
          marginBottom: 14,
          padding: "8px 0 10px",
          background: "#f8fafc",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
          borderBottom: "1px solid rgba(203, 213, 225, 0.9)",
        }}
      >
        <div style={{ gridColumn: "1", display: "flex", justifyContent: "flex-start", alignItems: "flex-start", gap: 12 }}>
          <img
            src="/brl-logo.png"
            alt="BRL Logo"
            style={{ width: 216, height: 144, objectFit: "contain", display: "block" }}
          />
          <div style={{ paddingTop: 8 }}>
            <BarshHeaderQuickNav />
          </div>
        </div>
<div
          style={{
            gridColumn: "3",
            justifySelf: "end",
            position: "relative",
            width: 330,
            height: 152,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: -86,
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Print Queue access is locked unless the user has print-queue rights."
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "7px 11px",
                border: "1px solid #cbd5e1",
                borderRadius: 999,
                background: "#f8fafc",
                color: "#475569",
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: "nowrap",
                cursor: "not-allowed",
                opacity: 0.9,
              }}
            >
              <span aria-hidden="true">🔒</span>
              <span>Print Queue</span>
            </button>
          </div>

          <a href="/" title="Return to Barsh Matters entry screen" style={{ display: "inline-flex", textDecoration: "none" }}>
            <img
              src="/barsh-matters-cropped-transparent.png"
              alt="Barsh Matters Logo"
              style={{
                width: 330,
                height: 152,
                objectFit: "contain",
                objectPosition: "right top",
                display: "block",
              }}
            />
          </a>
        </div>
      </div>


<div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: "0 0 6px 0" }}>Daily Print Queue</h1>
          <div style={{ color: "#475569", fontSize: 13 }}>
            Local workflow list only.  This page does not change Clio documents, upload files, create folders, or modify document contents.
          </div>
        </div>

        <a
          href="/lawsuits"
          style={{
            fontSize: 13,
            padding: "6px 10px",
            border: "1px solid #94a3b8",
            borderRadius: 6,
            color: "#0f172a",
            textDecoration: "none",
            background: "#fff",
          }}
        >
          Lawsuit Search
        </a>
      </div>

      <section
        style={{
          marginBottom: 12,
          padding: 12,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          background: "#f8fafc",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 120px auto", gap: 8, alignItems: "center" }}>
          <input
            value={masterLawsuitId}
            onChange={(e) => setMasterLawsuitId(e.target.value)}
            placeholder="Optional MASTER_LAWSUIT_ID filter, e.g., 2026.05.00010"
            style={inputStyle}
          />

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={inputStyle}
          >
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={200}>200 rows</option>
          </select>

          <button
            type="button"
            onClick={() => loadQueue(statusFilter)}
            disabled={loading}
            style={primaryButtonStyle}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
          {statusOptions.map((option) => {
            const active = statusFilter === option.value;
            const count = num(queue?.statusCounts?.[option.countKey]);

            return (
              <button
                key={option.countKey}
                type="button"
                onClick={() => changeStatusFilter(option.value)}
                disabled={loading}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  border: `1px solid ${active ? "#0f172a" : "#94a3b8"}`,
                  borderRadius: 999,
                  background: active ? "#e2e8f0" : "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: active ? 800 : 500,
                }}
              >
                {option.label}: {count}
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <div style={errorBoxStyle}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {statusResult && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            background: statusResult.ok ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${statusResult.ok ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 6,
            color: statusResult.ok ? "#166534" : "#991b1b",
            fontSize: 13,
          }}
        >
          {statusResult.ok ? (
            <>Print queue status updated to {textValue(statusResult.status) || "—"}.</>
          ) : (
            <>
              <strong>Error:</strong> {textValue(statusResult.error)}
            </>
          )}
        </div>
      )}

      <section
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div
          style={{
            padding: 10,
            borderBottom: "1px solid #e5e7eb",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 800 }}>
            Print Queue Items
          </div>
          <div style={{ color: "#475569", fontSize: 12 }}>
            Showing {num(queue?.count)} row(s)
            {queue?.status ? ` with status "${queue.status}"` : ""}
            {queue?.masterLawsuitId ? ` for ${queue.masterLawsuitId}` : ""}
          </div>
        </div>

        {loading && !queue && (
          <div style={{ padding: 12, color: "#475569" }}>Loading print queue...</div>
        )}

        {queue?.ok && rows.length === 0 && (
          <div style={{ padding: 12, color: "#475569" }}>
            No print queue items match the current filters.
          </div>
        )}

        {queue?.ok && rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Master Lawsuit</th>
                  <th style={thStyle}>Master Matter</th>
                  <th style={thStyle}>Document</th>
                  <th style={thStyle}>Filename</th>
                  <th style={thStyle}>Queued At</th>
                  <th style={thStyle}>Printed At</th>
                  <th style={thStyle}>Clio Document ID</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={textValue(row.id)}>
                    <td style={tdStyle}>{textValue(row.status) || "—"}</td>
                    <td style={tdStyle}>{textValue(row.masterLawsuitId) || "—"}</td>
                    <td style={tdStyle}>
                      {row.masterMatterId ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <a href={`/matter/${row.masterMatterId}`}>
                            {textValue(row.masterDisplayNumber) || textValue(row.masterMatterId)}
                          </a>
                          <a
                            href={clioMatterUrl(row.masterMatterId)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#475569", fontSize: 11 }}
                          >
                            Open in Clio
                          </a>
                        </div>
                      ) : (
                        textValue(row.masterDisplayNumber) || "—"
                      )}
                    </td>
                    <td style={tdStyle}>{textValue(row.documentLabel) || textValue(row.documentKey) || "—"}</td>
                    <td style={{ ...tdStyle, minWidth: 360 }}>{textValue(row.filename) || "—"}</td>
                    <td style={tdStyle}>{shortDateTime(row.queuedAt)}</td>
                    <td style={tdStyle}>{shortDateTime(row.printedAt)}</td>
                    <td style={tdStyle}>{textValue(row.clioDocumentId) || "—"}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(["printed", "hold", "skipped", "queued"] as const).map((statusOption) => (
                          <button
                            key={`${textValue(row.id)}-${statusOption}`}
                            type="button"
                            onClick={() => updatePrintQueueStatus(row, statusOption)}
                            disabled={
                              statusLoadingId === Number(row.id) ||
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
                                statusLoadingId === Number(row.id) ||
                                textValue(row.status).toLowerCase() === statusOption
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {statusLoadingId === Number(row.id)
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
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#fff",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #0f172a",
  borderRadius: 6,
  background: "#0f172a",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const errorBoxStyle: React.CSSProperties = {
  marginBottom: 12,
  padding: 10,
  border: "1px solid #fecaca",
  borderRadius: 6,
  background: "#fef2f2",
  color: "#991b1b",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: 6,
  background: "#f8fafc",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
  padding: 6,
  verticalAlign: "top",
};
