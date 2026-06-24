"use client";

import { useMemo, useState } from "react";

const fields = [
  { category: "Matter", label: "Matter File Number", token: "{{matter.fileNumber}}", example: "BRL_202600003", aliases: "file number matter id" },
  { category: "Matter", label: "Provider Name", token: "{{matter.providerName}}", example: "Atlantic Medical & Diagnostic, P.C.", aliases: "provider client" },
  { category: "Matter", label: "Claim Number", token: "{{matter.claimNumber}}", example: "123456", aliases: "claim insurer claim" },
  { category: "People → Signature/Header", label: "Signature Phone Line", token: "{{signature.phoneLine}}", example: "Usage note: DOCX hard-codes Tel:. Token renders firm main number plus selected signer extension when present.", aliases: "phone tel extension header" },
  { category: "People → Signature/Header", label: "Signature Fax Number", token: "{{signature.faxNumber}}", example: "Usage note: DOCX hard-codes Fax:. Token renders selected signer fax, or firm default.", aliases: "fax header" },
  { category: "People → Signature/Header", label: "Signature Email", token: "{{signature.email}}", example: "Usage note: DOCX hard-codes Email:. Token renders selected signer email, or firm default.", aliases: "email header" },
  { category: "People → Signature/Header", label: "Signature Image", token: "{{signature.image}}", example: "Usage note: renders the selected signer PNG signature image when available and otherwise removes token text.", aliases: "signature image png" },
  { category: "People → Signature/Header", label: "Signature Name", token: "{{signature.name}}", example: "Usage note: renders selected signer signatureBlockName, or Barshay, Rizzo & Lopez, PLLC for Firm.", aliases: "signature name signer" },
  { category: "People → Signature/Header", label: "Signature Block", token: "{{signature.block}}", example: "Usage note: renders image if available followed by signature name. Spacing is controlled by the Word template.", aliases: "signature block combined" },
  { category: "General", label: "Custom Manual Placeholder", token: "{{custom.settlementDeadline}}", example: "Admin-defined example value shown here. Matter users supply instance values later only when the selected template contains the token.", aliases: "custom manual prompt placeholder" }
];

const formats = [
  "As Stored",
  "upper",
  "lower",
  "title",
  "date:MM/DD/YYYY",
  "date:Month D, YYYY",
  "currency",
  "bold",
  "italic",
  "underline"
];

export default function BuildTemplatePage() {
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("As Stored");

  const visibleFields = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return fields;
    return fields.filter((field) => [field.category, field.label, field.token, field.example, field.aliases].join(" ").toLowerCase().includes(q));
  }, [query]);

  const withFormat = (token: string) => {
    if (format === "As Stored") return token;
    return token.replace("}}", "|" + format + "}}");
  };

  return (
    <main style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto" }}>
      <a href="/admin/document-templates" style={{ color: "#1e3a8a", fontWeight: 700 }}>Back to Document Templates</a>
      <h1 style={{ margin: "18px 0 10px", fontSize: "30px", color: "#0f172a" }}>Build Template</h1>
      <p style={{ margin: "0 0 22px", color: "#334155", lineHeight: 1.6 }}>
        Phase 1 exposes the searchable merge-field library and formatting contract. Production DOCX upload and token scanning are intentionally not wired in this phase.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 260px", gap: "14px", marginBottom: "18px" }}>
        <label style={{ display: "grid", gap: "6px", fontWeight: 700, color: "#0f172a" }}>
          Search merge fields
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search category, label, token, example output, or aliases" style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "10px" }} />
        </label>
        <label style={{ display: "grid", gap: "6px", fontWeight: 700, color: "#0f172a" }}>
          Format for copy
          <select value={format} onChange={(event) => setFormat(event.target.value)} style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "10px", background: "#ffffff" }}>
            {formats.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </section>

      <div style={{ overflowX: "auto", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff" }}>
          <thead style={{ background: "#1e3a8a", color: "#ffffff" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left" }}>Category</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Field Label</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Merge Field</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Example Output</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Copy</th>
            </tr>
          </thead>
          <tbody>
            {visibleFields.map((field) => (
              <tr key={field.token} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px", verticalAlign: "top" }}>{field.category}</td>
                <td style={{ padding: "12px", verticalAlign: "top" }}>{field.label}</td>
                <td style={{ padding: "12px", verticalAlign: "top", fontFamily: "monospace" }}>{withFormat(field.token)}</td>
                <td style={{ padding: "12px", verticalAlign: "top", color: "#334155" }}>{field.example}</td>
                <td style={{ padding: "12px", verticalAlign: "top" }}>
                  <button type="button" style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #1e3a8a", background: "#1e3a8a", color: "#ffffff", fontWeight: 700 }}>
                    Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
