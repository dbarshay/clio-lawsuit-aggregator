"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DetailResponse = {
  client?: any;
  remittance?: {
    receiptError?: string;
    count: number;
    activeTotal: number;
    voidedTotal: number;
    totalsByType: { transactionType: string; amount: number }[];
    rows: any[];
  };
  costsExpended?: {
    count: number;
    total: number;
    rows: any[];
  };
  error?: string;
};

const pageStyle: React.CSSProperties = {
  maxWidth: 1500,
  margin: "0 auto",
  padding: "32px 24px 80px",
  fontFamily: "var(--font-geist-sans)",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#fff",
  padding: 18,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "10px 8px",
  fontSize: 12,
  color: "#475569",
  background: "#f8fafc",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
  padding: "10px 8px",
  verticalAlign: "top",
  fontSize: 13,
};

const invoiceThStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: "center",
  border: "1px solid #e2e8f0",
  padding: "6px 5px",
  fontSize: 11,
  lineHeight: 1.15,
  whiteSpace: "normal",
  overflowWrap: "break-word",
};

const invoiceTdStyle: React.CSSProperties = {
  ...tdStyle,
  border: "1px solid #e2e8f0",
  padding: "6px 5px",
  fontSize: 11,
  lineHeight: 1.15,
  whiteSpace: "normal",
  overflowWrap: "break-word",
};

const invoiceTotalTdStyle: React.CSSProperties = {
  ...invoiceTdStyle,
  background: "#f8fafc",
  fontWeight: 950,
};

function money(value: unknown) {
  const numeric = Number(value || 0);
  return numeric.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function numberFromPercent(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return 0;

  const normalized = text.replace("%", "").trim();
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return 0;

  return numeric / 100;
}


function dateOnly(value: unknown) {
  if (!value) return "";
  const text = String(value).trim();

  const isoDateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    return `${Number(month)}/${Number(day)}/${year}`;
  }

  const isoDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoDateTime) {
    const [, year, month, day] = isoDateTime;
    return `${Number(month)}/${Number(day)}/${year}`;
  }

  const dotted = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dotted) {
    const [, month, day, year] = dotted;
    return `${Number(month)}/${Number(day)}/${year}`;
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString();
}

function percentNumber(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const numeric = Number(text.replace(/[$,%\s,]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  return numeric / 100;
}

function asPlainObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function detailEntries(details: unknown): { field: string; value: string; source: string }[] {
  const root = asPlainObject(details);
  const hidden = asPlainObject(root._hiddenImportFields);
  const rows: { field: string; value: string; source: string }[] = [];

  for (const [key, value] of Object.entries(root)) {
    if (key === "_hiddenImportFields") continue;
    const text = String(value ?? "").trim();
    if (!text) continue;
    rows.push({ field: key, value: text, source: "Imported" });
  }

  for (const [key, value] of Object.entries(hidden)) {
    const text = String(value ?? "").trim();
    if (!text) continue;
    rows.push({ field: key, value: text, source: "Hidden Import" });
  }

  return rows;
}

function findDetailValue(details: unknown, keys: string[]) {
  const entries = detailEntries(details);
  const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const wanted = keys.map(compact);

  for (const key of wanted) {
    const exact = entries.find((entry) => compact(entry.field) === key);
    if (exact) return exact.value;
  }

  for (const key of wanted) {
    const fuzzy = entries.find((entry) => compact(entry.field).includes(key));
    if (fuzzy) return fuzzy.value;
  }

  return "";
}

function isFeeRecoveryTransactionType(value: unknown) {
  const type = String(value ?? "").toLowerCase();  


  return (
    type.includes("filing fee") ||
    type.includes("court fee") ||
    type.includes("court fees") ||
    type.includes("other court fees")
  );
}

function retainerFeeForReceipt(row: any, client: any) {
  if (isFeeRecoveryTransactionType(row?.transactionType)) return 0;

  const amount = Number(row?.amount || 0);
  const type = String(row?.transactionType || "").toLowerCase();
  const rate = type.includes("interest")
    ? numberFromPercent(client?.retainerNfInterest)
    : numberFromPercent(client?.retainerNfPrincipal);

  return amount * rate;
}

function displayDate(value: unknown) {
  return dateOnly(value) || "—";
}

function displayDateRange(start: unknown, end: unknown) {
  const startText = dateOnly(start);
  const endText = dateOnly(end);
  if (!startText && !endText) return "—";
  if (!endText || startText === endText) return startText || "—";
  return `${startText} - ${endText}`;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminClientInvoicePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [id, setId] = useState("");
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("posted");
  const [transactionType, setTransactionType] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [sortField, setSortField] = useState("datePosted");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    Promise.resolve(params).then((resolved) => setId(resolved.id));
  }, [params]);

  async function loadDetail(clientId: string) {
    if (!clientId) return;
    setError("");
    const query = new URLSearchParams();
    query.set("status", statusFilter);
    if (transactionType.trim() && transactionType !== "All") query.set("transactionType", transactionType.trim());
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);

    const res = await fetch(`/api/admin/clients/${encodeURIComponent(clientId)}?${query.toString()}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Could not load invoice screen.");
    setData(json);
  }

  useEffect(() => {
    if (!id) return;
    loadDetail(id).catch((err) => setError(err?.message || "Could not load invoice screen."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setHasPreviewed(false);
  }, [statusFilter, transactionType, dateFrom, dateTo]);

  const client = data?.client;
  const remittanceRows = data?.remittance?.rows || [];
  const costsExpendedRows = data?.costsExpended?.rows || [];

  function isFilingFeePayment(row: any) {
    return isFeeRecoveryTransactionType(row?.transactionType);
  }

  function totalsForRows(rows: any[]) {
    return rows.reduce(
      (totals: { billedAmount: number; paymentAmount: number; retainerFee: number }, row: any) => ({
        billedAmount: totals.billedAmount + Number(row?.billedAmount || 0),
        paymentAmount: totals.paymentAmount + Number(row?.amount || 0),
        retainerFee: totals.retainerFee + retainerFeeForReceipt(row, client),
      }),
      { billedAmount: 0, paymentAmount: 0, retainerFee: 0 }
    );
  }

  const sortedRemittanceRows = useMemo(() => {
    const valueForSort = (row: any) => {
      switch (sortField) {
        case "matter":
          return String(row?.matter ?? "");
        case "patient":
          return String(row?.patient ?? "");
        case "dateOfLoss":
          return String(row?.dateOfLoss ?? "");
        case "dateOfService":
          return `${String(row?.dateOfService ?? "")} ${String(row?.dateOfServiceEnd ?? "")}`;
        case "insurer":
          return String(row?.insurer ?? "");
        case "caseType":
          return String(row?.caseType ?? "NF");
        case "type":
          return String(row?.transactionType ?? "");
        case "datePosted":
          return String(row?.transactionDate ?? "");
        case "checkDate":
          return String(row?.checkDate ?? "");
        case "checkNumber":
          return String(row?.checkNumber ?? "");
        case "billedAmount":
          return Number(row?.billedAmount || 0);
        case "paymentAmount":
          return Number(row?.amount || 0);
        case "retainerFee":
          return retainerFeeForReceipt(row, client);
        default:
          return String(row?.matter ?? "");
      }
    };

    return [...remittanceRows].sort((a: any, b: any) => {
      const aValue = valueForSort(a);
      const bValue = valueForSort(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const compare = String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? compare : -compare;
    });
  }, [remittanceRows, sortField, sortDirection, client]);

  const principalInterestRows = useMemo(
    () => sortedRemittanceRows.filter((row: any) => !isFilingFeePayment(row)),
    [sortedRemittanceRows]
  );

  const filingFeeRows = useMemo(
    () => sortedRemittanceRows.filter((row: any) => isFilingFeePayment(row)),
    [sortedRemittanceRows]
  );

  const principalInterestTotals = useMemo(
    () => totalsForRows(principalInterestRows),
    [principalInterestRows, client]
  );

  const filingFeeTotals = useMemo(
    () => totalsForRows(filingFeeRows),
    [filingFeeRows, client]
  );

  const sortedCostsExpendedRows = useMemo(() => {
    const valueForSort = (row: any) => {
      switch (sortField) {
        case "matter":
          return String(row?.matter ?? "");
        case "patient":
          return String(row?.patient ?? "");
        case "dateOfLoss":
          return String(row?.dateOfLoss ?? "");
        case "dateOfService":
          return `${String(row?.dateOfService ?? "")} ${String(row?.dateOfServiceEnd ?? "")}`;
        case "insurer":
          return String(row?.insurer ?? "");
        case "caseType":
          return String(row?.caseType ?? "NF");
        case "type":
          return String(row?.costType ?? "");
        case "datePosted":
          return String(row?.dateEntered ?? "");
        case "paymentAmount":
          return Number(row?.amount || 0);
        default:
          return String(row?.matter ?? "");
      }
    };

    return [...costsExpendedRows].sort((a: any, b: any) => {
      const aValue = valueForSort(a);
      const bValue = valueForSort(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const compare = String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? compare : -compare;
    });
  }, [costsExpendedRows, sortField, sortDirection]);

  const costsExpendedTotal = useMemo(
    () => sortedCostsExpendedRows.reduce((sum: number, row: any) => sum + Number(row?.amount || 0), 0),
    [sortedCostsExpendedRows]
  );

  const costsExpendedCsvRows = useMemo(
    () =>
      sortedCostsExpendedRows.map((row: any) => ({
        Matter: row.matter,
        Patient: row.patient,
        "Date of Loss": row.dateOfLoss,
        "Date of Service": displayDateRange(row.dateOfService, row.dateOfServiceEnd),
        Insurer: row.insurer,
        "Case Type": row.caseType || "NF",
        "Cost/Fee Type": row.costType,
        "Date Entered": row.dateEntered,
        Amount: row.amount,
        Source: row.source,
      })),
    [sortedCostsExpendedRows]
  );

  const remittanceCsvRows = useMemo(
    () =>
      sortedRemittanceRows.map((row: any) => ({
        Matter: row.matter,
        Patient: row.patient,
        "Date of Loss": row.dateOfLoss,
        "Date of Service": displayDateRange(row.dateOfService, row.dateOfServiceEnd),
        Insurer: row.insurer,
        "Case Type": row.caseType || "NF",
        Type: row.transactionType,
        "Date Posted": row.transactionDate,
        "Check Date": row.checkDate,
        "Check Number": row.checkNumber,
        "Billed Amount": row.billedAmount,
        "Payment Amount": row.amount,
        "Retainer Fee": retainerFeeForReceipt(row, client),
      })),
    [sortedRemittanceRows, client]
  );

  function changeSort(field: string) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  function sortableHeader(label: string, field: string, extraStyle?: React.CSSProperties) {
    const active = sortField === field;
    return (
      <button
        type="button"
        onClick={() => changeSort(field)}
        style={{
          width: "100%",
          border: 0,
          background: "transparent",
          padding: 0,
          margin: 0,
          textAlign: extraStyle?.textAlign || "center",
          color: "inherit",
          font: "inherit",
          fontWeight: 950,
          cursor: "pointer",
        }}
        title={`Sort by ${label}`}
      >
        {label}{active ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
      </button>
    );
  }

  function paymentRowsTable(
    title: string,
    rows: any[],
    totals: { billedAmount: number; paymentAmount: number; retainerFee: number },
    emptyText: string,
    options?: { feeRecovery?: boolean }
  ) {
    const feeRecovery = Boolean(options?.feeRecovery);

    return (
      <section style={{ ...cardStyle, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <div style={{ overflowX: "visible", maxHeight: 560 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={invoiceThStyle}>{sortableHeader("Matter", "matter")}</th>
                <th style={invoiceThStyle}>{sortableHeader("Patient", "patient")}</th>
                <th style={invoiceThStyle}>{sortableHeader("Date of Loss", "dateOfLoss")}</th>
                <th style={invoiceThStyle}>{sortableHeader("Date of Service", "dateOfService")}</th>
                <th style={invoiceThStyle}>{sortableHeader("Insurer", "insurer")}</th>
                <th style={{ ...invoiceThStyle, width: 42, textAlign: "center" }}>{sortableHeader("Case Type", "caseType", { textAlign: "center" })}</th>
                <th style={invoiceThStyle}>{sortableHeader("Type", "type")}</th>
                <th style={invoiceThStyle}>{sortableHeader("Date Posted", "datePosted")}</th>
                <th style={invoiceThStyle}>{sortableHeader("Check Date", "checkDate")}</th>
                <th style={invoiceThStyle}>{sortableHeader("Check Number", "checkNumber")}</th>
                {!feeRecovery && <th style={invoiceThStyle}>{sortableHeader("Billed Amount", "billedAmount")}</th>}
                <th style={invoiceThStyle}>{sortableHeader("Payment Amount", "paymentAmount")}</th>
                {!feeRecovery && <th style={invoiceThStyle}>{sortableHeader("Retainer Fee", "retainerFee")}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id || `${row.matter}-${row.createdAt}-${row.amount}`}>
                  <td style={invoiceTdStyle}>{row.matter}</td>
                  <td style={invoiceTdStyle}>{row.patient}</td>
                  <td style={invoiceTdStyle}>{displayDate(row.dateOfLoss)}</td>
                  <td style={invoiceTdStyle}>{displayDateRange(row.dateOfService, row.dateOfServiceEnd)}</td>
                  <td style={invoiceTdStyle}>{row.insurer}</td>
                  <td style={{ ...invoiceTdStyle, width: 42, textAlign: "center", whiteSpace: "nowrap" }}>{row.caseType || "NF"}</td>
                  <td style={invoiceTdStyle}>{row.transactionType}</td>
                  <td style={invoiceTdStyle}>{displayDate(row.transactionDate)}</td>
                  <td style={invoiceTdStyle}>{displayDate(row.checkDate)}</td>
                  <td style={invoiceTdStyle}>{row.checkNumber}</td>
                  {!feeRecovery && <td style={invoiceTdStyle}>{money(row.billedAmount)}</td>}
                  <td style={invoiceTdStyle}>{money(row.amount)}</td>
                  {!feeRecovery && <td style={invoiceTdStyle}>{money(retainerFeeForReceipt(row, client))}</td>}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td style={invoiceTdStyle} colSpan={feeRecovery ? 11 : 13}>
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  {feeRecovery ? (
                    <>
                      <td style={invoiceTotalTdStyle} colSpan={10}>
                        Totals
                      </td>
                      <td style={invoiceTotalTdStyle}>{money(totals.paymentAmount)}</td>
                    </>
                  ) : (
                    <>
                      <td style={invoiceTotalTdStyle} colSpan={10}>
                        Totals
                      </td>
                      <td style={invoiceTotalTdStyle}>{money(totals.billedAmount)}</td>
                      <td style={invoiceTotalTdStyle}>{money(totals.paymentAmount)}</td>
                      <td style={invoiceTotalTdStyle}>{money(totals.retainerFee)}</td>
                    </>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    );
  }


  function costsExpendedTable() {
      return (
        <section style={{ ...cardStyle, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>Filing Fee and Costs Expended</h2>
          <div style={{ overflowX: "visible", maxHeight: 560 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={invoiceThStyle}>{sortableHeader("Matter", "matter")}</th>
                  <th style={invoiceThStyle}>{sortableHeader("Patient", "patient")}</th>
                  <th style={invoiceThStyle}>{sortableHeader("Date of Loss", "dateOfLoss")}</th>
                  <th style={invoiceThStyle}>{sortableHeader("Date of Service", "dateOfService")}</th>
                  <th style={invoiceThStyle}>{sortableHeader("Insurer", "insurer")}</th>
                  <th style={{ ...invoiceThStyle, width: 42, textAlign: "center" }}>{sortableHeader("Case Type", "caseType", { textAlign: "center" })}</th>
                  <th style={invoiceThStyle}>{sortableHeader("Cost/Fee Type", "type")}</th>
                  <th style={invoiceThStyle}>{sortableHeader("Date Entered", "datePosted")}</th>
                  <th style={invoiceThStyle}>{sortableHeader("Amount", "paymentAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedCostsExpendedRows.map((row: any) => (
                  <tr key={row.id || `${row.matter}-${row.costType}-${row.amount}`}>
                    <td style={invoiceTdStyle}>{row.matter}</td>
                    <td style={invoiceTdStyle}>{row.patient}</td>
                    <td style={invoiceTdStyle}>{displayDate(row.dateOfLoss)}</td>
                    <td style={invoiceTdStyle}>{displayDateRange(row.dateOfService, row.dateOfServiceEnd)}</td>
                    <td style={invoiceTdStyle}>{row.insurer}</td>
                    <td style={{ ...invoiceTdStyle, width: 42, textAlign: "center", whiteSpace: "nowrap" }}>{row.caseType || "NF"}</td>
                    <td style={invoiceTdStyle}>{row.costType}</td>
                    <td style={invoiceTdStyle}>{displayDate(row.dateEntered)}</td>
                    <td style={invoiceTdStyle}>{money(row.amount)}</td>
                  </tr>
                ))}
                {!sortedCostsExpendedRows.length && (
                  <tr>
                    <td style={invoiceTdStyle} colSpan={9}>
                      No filing fees or costs expended found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
              {sortedCostsExpendedRows.length > 0 && (
                <tfoot>
                  <tr>
                    <td style={invoiceTotalTdStyle} colSpan={8}>
                      Totals
                    </td>
                    <td style={invoiceTotalTdStyle}>{money(costsExpendedTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      );
    }

  return (
    <main style={pageStyle}>
      <div style={{ marginBottom: 18, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href={`/admin/clients/${encodeURIComponent(id)}`} style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
          ← Provider Hub
        </Link>
        <Link href="/admin/clients" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
          Clients
        </Link>
        <Link href="/admin" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
          Admin Home
        </Link>
      </div>

      {error && (
        <section style={{ ...cardStyle, borderColor: "#fecaca", color: "#b91c1c", marginBottom: 18 }}>
          {error}
        </section>
      )}

      <section style={{ marginBottom: 22 }}>
        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900, textTransform: "uppercase" }}>
          Provider Client Invoice Workflow
        </div>
        <h1 style={{ margin: "6px 0 8px", fontSize: 34 }}>{client?.displayName || "Loading client..."}</h1>
      </section>

      <section style={{ ...cardStyle, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Invoicing / Remittance</h2>
        {/*
          Safety contract: Child-matter-based local payment reporting.
          Lawsuit-page payments appear here only through allocated child MatterPaymentReceipt rows.
          This screen previews invoice/remittance data only.
          It does not create invoices, write remittances, or update Clio.
        */}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 12, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 10 }}>
              <option value="posted">Posted only</option>
              <option value="voided">Voided only</option>
              <option value="all">All</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Transaction Type
            <select value={transactionType} onChange={(event) => setTransactionType(event.target.value)} style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff" }}>
              <option value="All">All</option>
              <option value="Direct Pay">Direct Pay</option>
              <option value="Voluntary">Voluntary</option>
              <option value="Collection">Collection</option>
              <option value="Interest">Interest</option>
              <option value="Attorney Fee">Attorney Fee</option>
              <option value="Filing Fee">Filing Fee</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Date From
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 10 }} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
            Date To
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 10 }} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() =>
              id &&
              loadDetail(id)
                .then(() => setHasPreviewed(true))
                .catch((err) => setError(err?.message || "Could not refresh invoice screen."))
            }
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #0f172a", background: "#0f172a", color: "#fff", fontWeight: 800 }}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(`${client?.displayName || "Client"} - Remittance Preview.csv`, [...remittanceCsvRows, ...costsExpendedCsvRows])}
            disabled={![...remittanceCsvRows, ...costsExpendedCsvRows].length}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", background: [...remittanceCsvRows, ...costsExpendedCsvRows].length ? "#fff" : "#f1f5f9", fontWeight: 800 }}
          >
            Export CSV
          </button>
        </div>
      </section>

      {hasPreviewed && (
      <section style={{ ...cardStyle, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Transaction Type Totals</h2>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, minWidth: 180 }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 900 }}>Active Total</div>
            <div style={{ fontSize: 24, fontWeight: 950 }}>{money(data?.remittance?.activeTotal)}</div>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, minWidth: 180 }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 900 }}>Voided Total</div>
            <div style={{ fontSize: 24, fontWeight: 950 }}>{money(data?.remittance?.voidedTotal)}</div>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, minWidth: 180 }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 900 }}>Receipt Rows</div>
            <div style={{ fontSize: 24, fontWeight: 950 }}>{data?.remittance?.count ?? 0}</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr>
                <th style={thStyle}>Transaction Type</th>
                <th style={thStyle}>Active Amount</th>
              </tr>
            </thead>
            <tbody>
              {(data?.remittance?.totalsByType || []).map((row) => (
                <tr key={row.transactionType}>
                  <td style={tdStyle}>{row.transactionType}</td>
                  <td style={tdStyle}>{money(row.amount)}</td>
                </tr>
              ))}
              {!data?.remittance?.totalsByType?.length && (
                <tr>
                  <td style={tdStyle} colSpan={2}>
                    No active receipt totals found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {hasPreviewed && (
        <>
          {paymentRowsTable(
            "Principal and Interest Payments",
            principalInterestRows,
            principalInterestTotals,
            "No principal or interest payment rows found for the selected filters."
          )}
          {paymentRowsTable(
            "Filing Fee Payments",
            filingFeeRows,
            filingFeeTotals,
            "No filing fee payment rows found for the selected filters.",
            { feeRecovery: true }
          )}
          {costsExpendedTable()}
        </>
      )}
    </main>
  );
}
