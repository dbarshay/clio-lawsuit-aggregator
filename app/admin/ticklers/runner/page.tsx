"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type RunnerResponse = {
  ok?: boolean;
  mode?: string;
  writePerformed?: boolean;
  count?: number;
  completedCount?: number;
  criteria?: Record<string, unknown>;
  ticklers?: any[];
  error?: string;
};

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function displayKind(kind: string): string {
  if (kind === "settlement_payment_due_followup") return "Settlement: Follow-Up for Payment";
  if (kind === "settlement_signed_agreement_followup") return "Settlement: Follow-Up for Signed Agreement";
  return kind || "—";
}

function cell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function dueDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  return value.slice(0, 10);
}

export default function AdminTicklerRunnerPage() {
  const [kind, setKind] = useState("all");
  const [dueThrough, setDueThrough] = useState(todayInputValue());
  const [limit, setLimit] = useState("100");
  const [completedNote, setCompletedNote] = useState("Completed by Administrator bulk tickler runner.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunnerResponse | null>(null);

  const ticklers = useMemo(() => result?.ticklers || [], [result]);

  async function run(mode: "preview" | "complete") {
    if (mode === "complete") {
      const ok = window.confirm(
        "Complete all listed open ticklers matching these filters?  This changes only LocalWorkflowTickler status/completion fields.",
      );
      if (!ok) return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/ticklers/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          kind,
          dueThrough,
          limit: Number(limit),
          completedBy: "admin-bulk-tickler-runner",
          completedNote,
        }),
      });

      const json = await response.json().catch(() => ({}));
      setResult({ ...json, httpStatus: response.status });
    } catch (error: any) {
      setResult({ ok: false, error: error?.message || "Unable to run tickler bulk runner." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0 }}>Admin Tickler Bulk Runner</h1>
          <p style={{ marginTop: 8, color: "#475569", maxWidth: 880 }}>
            Administrator action screen for bulk processing open ticklers.  Preview is read-only.  Complete updates only local
            LocalWorkflowTickler status/completion fields; it does not post payments, close matters, change settlement records,
            update Clio, generate documents, email, print, or queue anything.
          </p>
        </div>
        <Link
          href="/admin/ticklers"
          style={{
            border: "1px solid #1f4f73",
            color: "#1f4f73",
            borderRadius: 10,
            padding: "9px 14px",
            textDecoration: "none",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Back to Admin Ticklers
        </Link>
      </div>

      <section
        data-barsh-admin-tickler-bulk-runner-controls="true"
        style={{
          marginTop: 18,
          border: "1px solid #d7e0ec",
          borderRadius: 14,
          padding: 18,
          background: "#f8fbff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Runner Filters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Type / Kind
            <select value={kind} onChange={(event) => setKind(event.target.value)} style={{ padding: 9 }}>
              <option value="all">All open ticklers</option>
              <option value="settlement_payment_due_followup">Settlement: Follow-Up for Payment</option>
              <option value="settlement_signed_agreement_followup">Settlement: Follow-Up for Signed Agreement</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Due Through
            <input type="date" value={dueThrough} onChange={(event) => setDueThrough(event.target.value)} style={{ padding: 9 }} />
          </label>

          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Limit
            <input value={limit} onChange={(event) => setLimit(event.target.value)} style={{ padding: 9 }} />
          </label>

          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Completion Note
            <input value={completedNote} onChange={(event) => setCompletedNote(event.target.value)} style={{ padding: 9 }} />
          </label>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            data-barsh-admin-tickler-bulk-runner-preview="true"
            disabled={loading}
            onClick={() => run("preview")}
            style={{
              border: "1px solid #1f4f73",
              background: "#ffffff",
              color: "#1f4f73",
              borderRadius: 10,
              padding: "9px 16px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Preview Matching Open Ticklers
          </button>

          <button
            type="button"
            data-barsh-admin-tickler-bulk-runner-complete="true"
            disabled={loading}
            onClick={() => run("complete")}
            style={{
              border: "1px solid #7f1d1d",
              background: "#7f1d1d",
              color: "#ffffff",
              borderRadius: 10,
              padding: "9px 16px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Complete Previewed Filter Set
          </button>
        </div>
      </section>

      {result ? (
        <section
          data-barsh-admin-tickler-bulk-runner-results="true"
          style={{ marginTop: 18, border: "1px solid #d7e0ec", borderRadius: 14, padding: 18, background: "#ffffff" }}
        >
          <h2 style={{ marginTop: 0 }}>Runner Result</h2>
          {!result.ok ? (
            <p style={{ color: "#991b1b", fontWeight: 700 }}>{result.error || "Runner failed."}</p>
          ) : (
            <>
              <p style={{ marginTop: 0, color: result.writePerformed ? "#7f1d1d" : "#166534", fontWeight: 800 }}>
                {result.writePerformed
                  ? `Completed ${result.completedCount || 0} open tickler(s).`
                  : `Preview found ${result.count || 0} open tickler(s). No write performed.`}
              </p>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #d7e0ec" }}>
                      <th style={{ padding: 8 }}>Due</th>
                      <th style={{ padding: 8 }}>Type</th>
                      <th style={{ padding: 8 }}>Matter</th>
                      <th style={{ padding: 8 }}>Master Lawsuit</th>
                      <th style={{ padding: 8 }}>Provider</th>
                      <th style={{ padding: 8 }}>Patient</th>
                      <th style={{ padding: 8 }}>Insurer</th>
                      <th style={{ padding: 8 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticklers.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 12, color: "#64748b" }}>
                          No matching ticklers.
                        </td>
                      </tr>
                    ) : (
                      ticklers.map((tickler) => (
                        <tr key={tickler.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: 8 }}>{dueDate(tickler.dueAt)}</td>
                          <td style={{ padding: 8 }}>{displayKind(tickler.kind)}</td>
                          <td style={{ padding: 8 }}>{cell(tickler.caseData?.matter || tickler.displayNumber || tickler.matterId)}</td>
                          <td style={{ padding: 8 }}>{cell(tickler.caseData?.masterLawsuit || tickler.masterLawsuitId)}</td>
                          <td style={{ padding: 8 }}>{cell(tickler.caseData?.provider)}</td>
                          <td style={{ padding: 8 }}>{cell(tickler.caseData?.patient)}</td>
                          <td style={{ padding: 8 }}>{cell(tickler.caseData?.insurer)}</td>
                          <td style={{ padding: 8, fontWeight: 800 }}>{cell(tickler.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}
