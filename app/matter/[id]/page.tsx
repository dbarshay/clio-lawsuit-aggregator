"use client";

import { use, useEffect, useMemo, useState } from "react";

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

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [matterId, setMatterId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setMatterId(p.id));
  }, [params]);

  const [matter, setMatter] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (!matterId) return;

    async function load() {
      const m = await fetch(`/api/clio/matter-context?matterId=${matterId}`).then((r) => r.json());
      const s = await fetch(`/api/aggregation/find-siblings?matterId=${matterId}`).then((r) => r.json());

      const base = m.matter;
      const siblings = Array.isArray(s.siblings) ? s.siblings : [];

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
          ...sib,
          id: idNum,
        });
        seen.add(idNum);
      }

      setMatter(base || null);
      setRows(all);
    }

    load();
  }, [matterId]);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

  return (
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
          marginBottom: 18,
        }}
      >
        <div style={{ alignSelf: "start" }}>
          <img
            src="/brl-logo.png"
            alt="BRL Logo"
            style={{
              width: 220,
              height: "auto",
              display: "block",
              maxWidth: "100%",
            }}
          />
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

          <div style={{ whiteSpace: "nowrap", marginBottom: 8 }}>
            <strong>Provider:</strong> {providerValue(matter)}
          </div>
          <div style={{ whiteSpace: "nowrap", marginBottom: 8 }}>
            <strong>Insurer:</strong> {insurerValue(matter)}
          </div>
          <div style={{ whiteSpace: "nowrap" }}>
            <strong>Claim Number:</strong> {textValue(matter?.claimNumber)}
          </div>
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
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>
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
            <div style={{ textAlign: "right", minWidth: 110 }}>{money(totals.claim)}</div>

            <div><strong>Payment (Voluntary):</strong></div>
            <div style={{ textAlign: "right", minWidth: 110 }}>{money(totals.payment)}</div>

            <div
              style={{
                gridColumn: "1 / 3",
                borderTop: "1px solid #bfbfbf",
                margin: "2px 0 0 0",
              }}
            />

            <div><strong>Balance (Presuit):</strong></div>
            <div style={{ textAlign: "right", minWidth: 110 }}>{money(totals.balance)}</div>
          </div>
        </div>
      </div>

      <hr style={{ margin: "18px 0 20px 0", border: 0, borderTop: "1px solid #999" }} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const claim = num(r.claimAmount);
            const payment = num(r.paymentVoluntary);
            const balance = claim - payment;
            const isSelected = selected.includes(Number(r.id));

            return (
              <tr
                key={Number(r.id)}
                style={{
                  background: isSelected ? "#eaf2ff" : "#ffffff",
                }}
              >
                <td
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    padding: 0,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: 46,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(Number(r.id))}
                      style={{
                        width: 18,
                        height: 18,
                        cursor: "pointer",
                        margin: 0,
                      }}
                    />
                  </label>
                </td>

                <td style={tdStyle}>{textValue(r.displayNumber)}</td>
                <td style={tdStyle}>{textValue(r.patient)}</td>
                <td style={tdStyle}>{providerValue(r)}</td>
                <td style={tdStyle}>{insurerValue(r)}</td>
                <td style={tdStyle}>{formatDOS(r.dosStart, r.dosEnd)}</td>
                <td style={{ ...tdStyle, textAlign: "left" }}>{money(claim)}</td>
                <td style={{ ...tdStyle, textAlign: "left" }}>{money(payment)}</td>
                <td style={{ ...tdStyle, textAlign: "left" }}>{money(balance)}</td>
                <td style={tdStyle}>{denialReasonValue(r)}</td>
                <td style={tdStyle}>{textValue(r.status)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
