"use client";

import { use, useEffect, useMemo, useState } from "react";

const LOGO_SRC =
  "data:image/webp;base64,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";

function formatCurrency(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDenialReason(value: any) {
  const map: Record<string, string> = {
    "12497975": "Medical Necessity (IME)",
    "12498065": "Fee Schedule / Coding",
  };
  return map[String(value)] || String(value ?? "");
}

function formatDateMMDDYYYY(value: any) {
  if (!value) return "";
  const s = String(value).trim();

  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    return `${ymd[2]}/${ymd[3]}/${ymd[1]}`;
  }

  const mdy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mdy) {
    return s;
  }

  return s;
}

function formatDosRange(start: any, end: any) {
  const s = formatDateMMDDYYYY(start);
  const e = formatDateMMDDYYYY(end);

  if (s && e) return `${s} to ${e}`;
  return s || e || "";
}

function num(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function MatterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [matter, setMatter] = useState<any>(null);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      const m = await fetch(
        `/api/clio/matter-context?matterId=${id}`
      ).then((r) => r.json());

      const s = await fetch(
        `/api/aggregation/find-siblings?matterId=${id}`
      ).then((r) => r.json());

      if (m.ok) setMatter(m.matter);
      if (s.ok) setSiblings(s.siblings || []);
    }

    load();
  }, [id]);

  const currentMatterRow = useMemo(() => {
    if (!matter) return null;

    return {
      matterId: Number(matter.id),
      id: Number(matter.id),
      displayNumber: matter.displayNumber ?? "",
      patient: matter.patient?.name ?? "",
      client: matter.client?.name ?? "",
      clientName: matter.client?.name ?? "",
      insuranceCompany: matter.insurer?.name ?? "",
      billNumber: matter.billNumber ?? "",
      dosStart: matter.dosStart ?? "",
      dosEnd: matter.dosEnd ?? "",
      claimAmount: num(matter.claimAmount),
      paymentVoluntary: num(matter.paymentVoluntary),
      balancePresuit: num(matter.balancePresuit),
      denialReason: matter.denialReason ?? "",
      status: matter.status ?? "",
      masterLawsuitId: matter.masterLawsuitId ?? "",
      isCurrentMatter: true,
    };
  }, [matter]);

  const tableRows = useMemo(() => {
    if (!currentMatterRow) return siblings;
    return [currentMatterRow, ...siblings];
  }, [currentMatterRow, siblings]);

  const selectedRows = useMemo(() => {
    return tableRows.filter((row) => selected.includes(row.id));
  }, [tableRows, selected]);

  const totals = useMemo(() => {
    return selectedRows.reduce(
      (acc, row) => {
        acc.claimAmount += num(row.claimAmount);
        acc.paymentVoluntary += num(row.paymentVoluntary);
        acc.balancePresuit += num(row.balancePresuit);
        return acc;
      },
      {
        claimAmount: 0,
        paymentVoluntary: 0,
        balancePresuit: 0,
      }
    );
  }, [selectedRows]);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  async function createLawsuit() {
    const res = await fetch("/api/aggregation/create-lawsuit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baseMatterId: id,
        selectedMatterIds: selected,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(`Create failed: ${data.error || "Unknown error"}`);
      return;
    }

    const masterMatterId = String(
      data.masterMatterId || data.matter?.id || data.masterMatter?.id || ""
    );

    if (!masterMatterId) {
      alert("Master lawsuit created, but no ID returned.");
      return;
    }

    const writeBackRes = await fetch("/api/aggregation/write-master-id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        masterMatterId,
        selectedMatterIds: selected,
      }),
    });

    const writeBackData = await writeBackRes.json();

    if (!writeBackRes.ok || !writeBackData.ok) {
      alert(`Write-back failed: ${writeBackData.error || "Unknown error"}`);
      return;
    }

    alert(`Master lawsuit ${masterMatterId} created and linked successfully.`);
  }

  if (!matter) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 1440,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        color: "#222",
      }}
    >
      <div style={logoWrap}>
        <img src={LOGO_SRC} alt="BRL Attorneys logo" style={logoStyle} />
      </div>

      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          margin: 0,
          marginBottom: 24,
        }}
      >
        Aggregator - Matter {matter.displayNumber}
      </h1>

      <div
        style={{
          marginTop: 12,
          marginBottom: 28,
          lineHeight: 1.9,
          fontSize: 16,
        }}
      >
        <div>
          <strong>Status:</strong> {matter.status}
        </div>
        <div>
          <strong>Claim Number:</strong> {matter.claimNumber}
        </div>
        <div>
          <strong>Claim Amount:</strong> {formatCurrency(matter.claimAmount)}
        </div>
        <div>
          <strong>DOS Start:</strong> {formatDateMMDDYYYY(matter.dosStart)}
        </div>
        <div>
          <strong>DOS End:</strong> {formatDateMMDDYYYY(matter.dosEnd)}
        </div>
        <div>
          <strong>Denial Reason:</strong> {formatDenialReason(matter.denialReason)}
        </div>
        <div>
          <strong>Index / AAA Number:</strong> {matter.indexNumber}
        </div>
        <div>
          <strong>Settled Amount:</strong> {formatCurrency(matter.settledAmount)}
        </div>
        <div>
          <strong>Patient:</strong> {matter.patient?.name ?? ""}
        </div>
        <div>
          <strong>Insurance Company:</strong> {matter.insurer?.name ?? ""}
        </div>
        <div>
          <strong>Client:</strong> {matter.client?.name ?? ""}
        </div>
      </div>

      <hr
        style={{
          margin: "28px 0 28px 0",
          border: 0,
          borderTop: "1px solid #777",
        }}
      />

      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          margin: 0,
          marginBottom: 10,
        }}
      >
        Sibling Bills
      </h2>

      {tableRows.length === 0 ? (
        <p>No sibling bills found.</p>
      ) : (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "auto",
              fontSize: 16,
            }}
          >
            <thead>
              <tr>
                <th style={th}>Select</th>
                <th style={th}>Matter</th>
                <th style={th}>Patient</th>
                <th style={th}>Client</th>
                <th style={th}>Insurance Company</th>
                <th style={th}>DOS Range</th>
                <th style={th}>Claim Amount</th>
                <th style={th}>Payment (Voluntary)</th>
                <th style={th}>Balance (Presuit)</th>
                <th style={th}>Denial Reason</th>
                <th style={th}>Status</th>
                <th style={th}>Master Lawsuit ID</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((s) => (
                <tr
                  key={s.matterId ?? s.id}
                  style={s.isCurrentMatter ? currentMatterRowStyle : undefined}
                >
                  <td style={tdCenter}>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggle(s.id)}
                    />
                  </td>
                  <td style={td}>{s.displayNumber}</td>
                  <td style={td}>{s.patient ?? ""}</td>
                  <td style={td}>{s.client ?? s.clientName ?? ""}</td>
                  <td style={td}>{s.insuranceCompany ?? ""}</td>
                  <td style={td}>{formatDosRange(s.dosStart, s.dosEnd)}</td>
                  <td style={td}>{formatCurrency(s.claimAmount)}</td>
                  <td style={td}>{formatCurrency(s.paymentVoluntary)}</td>
                  <td style={td}>{formatCurrency(s.balancePresuit)}</td>
                  <td style={td}>{formatDenialReason(s.denialReason)}</td>
                  <td style={td}>{s.status ?? ""}</td>
                  <td style={td}>{s.masterLawsuitId ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 20,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Selected IDs: {selected.join(", ")}
          </div>

          <div style={totalsWrap}>
            <div style={totalsTitle}>Selected Totals</div>
            <div style={totalsGrid}>
              <div style={totalsLabel}>Claim Amount:</div>
              <div style={totalsValue}>{formatCurrency(totals.claimAmount)}</div>

              <div style={totalsLabel}>Payment (Voluntary):</div>
              <div style={totalsValue}>{formatCurrency(totals.paymentVoluntary)}</div>

              <div style={totalsLabel}>Balance (Presuit):</div>
              <div style={totalsValue}>{formatCurrency(totals.balancePresuit)}</div>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <button onClick={createLawsuit} style={buttonStyle}>
              Create Master Lawsuit
            </button>
          </div>
        </>
      )}
    </main>
  );
}

const logoWrap: React.CSSProperties = {
  marginBottom: 18,
};

const logoStyle: React.CSSProperties = {
  display: "block",
  width: 360,
  maxWidth: "100%",
  height: "auto",
};

const th: React.CSSProperties = {
  border: "1px solid #bfbfbf",
  padding: "10px 8px",
  background: "#efefef",
  textAlign: "left",
  fontWeight: 700,
  lineHeight: 1.35,
};

const td: React.CSSProperties = {
  border: "1px solid #bfbfbf",
  padding: "12px 8px",
  verticalAlign: "middle",
  lineHeight: 1.5,
};

const tdCenter: React.CSSProperties = {
  ...td,
  textAlign: "center",
};

const currentMatterRowStyle: React.CSSProperties = {
  background: "#f8fbff",
};

const buttonStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#2563eb",
  border: "2px solid #2563eb",
  borderRadius: 6,
  padding: "12px 18px",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};

const totalsWrap: React.CSSProperties = {
  marginTop: 22,
  padding: "14px 16px",
  border: "1px solid #bfbfbf",
  borderRadius: 6,
  background: "#fafafa",
  maxWidth: 420,
};

const totalsTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 10,
};

const totalsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  rowGap: 8,
  columnGap: 16,
  alignItems: "center",
};

const totalsLabel: React.CSSProperties = {
  fontWeight: 600,
};

const totalsValue: React.CSSProperties = {
  textAlign: "right",
};
