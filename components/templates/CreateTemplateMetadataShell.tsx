"use client";

import { useMemo, useState } from "react";
import {
  TEMPLATE_CONTACT_DISPLAY_DEFAULT_OPTIONS_PHASE1H,
  type TemplateContactDisplayDefaultPhase1H,
} from "@/src/lib/templates/template-contact-display-default-phase1h";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "14px",
  background: "#ffffff",
  color: "#111827",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: "6px",
};

const helperStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.45,
};

type DefaultSignerMode = "signed_in_user" | "select_at_generation";

const DEFAULT_SIGNER_OPTIONS: Array<{ value: DefaultSignerMode; label: string; description: string }> = [
  {
    value: "signed_in_user",
    label: "Signed-in generating user",
    description: "Default signer is the user generating the document. Other eligible signers remain selectable later.",
  },
  {
    value: "select_at_generation",
    label: "No fixed default / select during generation",
    description: "The template does not lock a default signer. The generating workflow must ask the user to select an eligible signer.",
  },
];

type CreateTemplateMetadataShellProps = {
  file: File;
  tokens: string[];
  partCount: number;
  onCancel: () => void;
};

type SaveStatus = "idle" | "previewing" | "saving" | "saved" | "error";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\.docx$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function tokenKey(token: string) {
  return token.replace(/^\{\{/, "").replace(/\}\}$/, "").replace(/\|.+$/, "");
}

function tokenLabel(token: string) {
  const key = tokenKey(token);
  return key
    .split(".")
    .map((part) => part.replace(/([a-z])([A-Z])/g, "$1 $2"))
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readFileBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read selected DOCX file."));
    reader.onload = () => {
      const value = String(reader.result || "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.readAsDataURL(file);
  });
}

export default function CreateTemplateMetadataShell({ file, tokens, partCount, onCancel }: CreateTemplateMetadataShellProps) {
  const defaultDisplayName = useMemo(() => file.name.replace(/\.docx$/i, "").replace(/[-_]+/g, " ").trim(), [file.name]);
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [templateKey, setTemplateKey] = useState(slugify(defaultDisplayName || file.name));
  const [category, setCategory] = useState("general");
  const [defaultContactDisplayMode, setDefaultContactDisplayMode] =
    useState<TemplateContactDisplayDefaultPhase1H>("signer");
  const [defaultSignerMode, setDefaultSignerMode] = useState<DefaultSignerMode>("signed_in_user");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [responsePreview, setResponsePreview] = useState<any>(null);

  const trimmedDisplayName = displayName.trim();
  const trimmedKey = slugify(templateKey);
  const canSave = status !== "previewing" && status !== "saving" && trimmedDisplayName.length > 0 && trimmedKey.length > 0;

  const row = useMemo(() => ({
    key: trimmedKey,
    label: trimmedDisplayName,
    category,
    description: "Created from a fresh local DOCX through the Template Builder UI.",
    defaultFilenameSuffix: trimmedKey,
    outputFormat: "docx",
    sourceOfTruth: "barsh-matters-local",
    enabled: true,
    editableInRepository: true,
    mergeFieldSet: "template-builder-canonical-ui",
    repositorySource: "barsh-matters-template-builder-ui",
    repositoryStatus: "ui-created-template",
    productionTemplateReady: false,
    finalProductionDocument: false,
    metadata: {
      templateSource: "fresh-local-docx-template-builder-ui",
      defaultContactDisplayMode,
      defaultSignerMode,
      selectedSignerRule: defaultSignerMode === "signed_in_user"
        ? "defaults to signed-in generating user; other eligible signers remain selectable"
        : "no fixed default signer; select eligible signer during generation",
      signerTokenRule: "signer.* tokens resolve from selected signer",
      noAdminUserSignerProfileFieldsAdded: true,
      noDocumentGenerationExpansion: true,
      scannedFileName: file.name,
      scannedDocxPartCount: partCount,
      discoveredTokens: tokens,
    },
    mergeFields: tokens.map((token) => ({
      key: tokenKey(token),
      label: tokenLabel(token),
      source: "template-builder-ui-docx-scan",
      required: true,
      exampleValue: "",
      visibility: "visible_ui",
      metadata: {
        token,
        source: "template-builder-ui-docx-scan",
        visibility: "visible_ui",
      },
    })),
  }), [trimmedKey, trimmedDisplayName, category, defaultContactDisplayMode, defaultSignerMode, file.name, partCount, tokens]);

  async function createTemplate() {
    if (!canSave) return;

    setStatus("previewing");
    setMessage("Validating template import preview…");
    setResponsePreview(null);

    try {
      const previewResponse = await fetch("/api/documents/templates/import-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ mode: "rows", rows: [row] }),
      });
      const previewPayload = await previewResponse.json();
      setResponsePreview(previewPayload);

      if (!previewResponse.ok || previewPayload?.ok === false) {
        throw new Error(previewPayload?.error || "Template import preview failed.");
      }

      setStatus("saving");
      setMessage("Saving DOCX template to the local Barsh Matters repository…");

      const contentBase64 = await readFileBase64(file);
      const confirmRow = {
        ...row,
        metadata: {
          ...row.metadata,
          uploadedTemplateFile: {
            name: file.name,
            type: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: file.size,
            lastModified: file.lastModified,
            lastModifiedIso: file.lastModified ? new Date(file.lastModified).toISOString() : null,
            contentBase64,
          },
        },
      };

      const confirmResponse = await fetch("/api/documents/templates/import-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ confirm: true, mode: "rows", rows: [confirmRow] }),
      });
      const confirmPayload = await confirmResponse.json();
      setResponsePreview(confirmPayload);

      if (!confirmResponse.ok || confirmPayload?.ok === false) {
        throw new Error(confirmPayload?.error || "Template import confirm failed.");
      }

      setStatus("saved");
      setMessage("Template created in the local Barsh Matters repository. It remains draft/not production-ready.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Template creation failed.");
    }
  }

  return (
    <section
      data-template-create-metadata-shell="phase1i"
      aria-label="Create Template metadata setup"
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: "12px",
        padding: "16px",
        margin: "0",
        background: "#eff6ff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: "18px", color: "#111827" }}>
            Create Template
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.45 }}>
            Save this fresh local DOCX as a draft template in the local Barsh Matters repository. This does not generate documents, write Clio, print, queue, draft email, add Admin User signer fields, or create legacy-token compatibility.
          </p>
        </div>
        <span
          style={{
            border: "1px solid #93c5fd",
            borderRadius: "999px",
            background: "#ffffff",
            color: "#1e3a8a",
            fontSize: "12px",
            fontWeight: 900,
            padding: "6px 10px",
          }}
        >
          Local repository draft
        </span>
      </div>

      <div style={{ marginTop: "14px", border: "1px solid #dbeafe", borderRadius: "10px", background: "#ffffff", padding: "12px" }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{file.name}</div>
        <div style={{ marginTop: "4px", color: "#475569", fontSize: "13px" }}>
          DOCX package parts inspected: {partCount}. Merge fields found: {tokens.length}.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginTop: "16px" }}>
        <div>
          <label style={labelStyle} htmlFor="template-display-name-phase1i">
            Template display name
          </label>
          <input
            id="template-display-name-phase1i"
            data-template-create-display-name="phase1i"
            value={displayName}
            onChange={(event) => {
              const next = event.target.value;
              setDisplayName(next);
              setTemplateKey((current) => current ? current : slugify(next));
            }}
            placeholder="Example: Initial Billing Letter"
            style={inputStyle}
          />
          <p style={helperStyle}>User-facing BM display name. This is not a storage filename.</p>
        </div>

        <div>
          <label style={labelStyle} htmlFor="template-key-phase1i">
            Template key
          </label>
          <input
            id="template-key-phase1i"
            data-template-create-key="phase1i"
            value={templateKey}
            onChange={(event) => setTemplateKey(slugify(event.target.value))}
            placeholder="example-initial-billing-letter"
            style={inputStyle}
          />
          <p style={helperStyle}>Repository identifier. Use a clean lowercase key with hyphens.</p>
        </div>

        <div>
          <label style={labelStyle} htmlFor="template-category-phase1i">
            Template category
          </label>
          <select
            id="template-category-phase1i"
            data-template-create-category="phase1i"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={inputStyle}
          >
            <option value="correspondence">Correspondence</option>
            <option value="pleadings">Pleadings</option>
            <option value="discovery">Discovery</option>
            <option value="general">General</option>
          </select>
          <p style={helperStyle}>Used later for filtering and generation availability.</p>
        </div>
      </div>

      <fieldset
        data-template-create-default-signer="phase1i"
        style={{
          margin: "16px 0 0",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
          padding: "14px",
          background: "#ffffff",
        }}
      >
        <legend style={{ padding: "0 6px", fontWeight: 900, color: "#0f172a" }}>
          Default signer
        </legend>

        <p style={{ margin: "0 0 12px", color: "#475569", lineHeight: 1.45 }}>
          Choose the default signer rule for this template. This stores template metadata only; it does not add Admin User signer/profile fields.
        </p>

        <div style={{ display: "grid", gap: "10px" }}>
          {DEFAULT_SIGNER_OPTIONS.map((option) => (
            <label
              key={option.value}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "10px",
                alignItems: "start",
                border: "1px solid " + (defaultSignerMode === option.value ? "#1e3a8a" : "#e2e8f0"),
                borderRadius: "10px",
                padding: "12px",
                background: defaultSignerMode === option.value ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="defaultSignerMode"
                value={option.value}
                checked={defaultSignerMode === option.value}
                onChange={() => setDefaultSignerMode(option.value)}
                style={{ marginTop: "3px" }}
              />
              <span>
                <span style={{ display: "block", fontWeight: 900, color: "#111827" }}>{option.label}</span>
                <span style={{ display: "block", marginTop: "3px", color: "#475569", lineHeight: 1.45 }}>
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset
        data-template-create-default-contact-display="phase1i"
        style={{
          margin: "16px 0 0",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
          padding: "14px",
          background: "#ffffff",
        }}
      >
        <legend style={{ padding: "0 6px", fontWeight: 900, color: "#0f172a" }}>
          Default generation contact display
        </legend>

        <p style={{ margin: "0 0 12px", color: "#475569", lineHeight: 1.45 }}>
          Choose what the user sees by default when generating this template. Eligible signers remain selectable.
        </p>

        <div style={{ display: "grid", gap: "10px" }}>
          {TEMPLATE_CONTACT_DISPLAY_DEFAULT_OPTIONS_PHASE1H.map((option) => (
            <label
              key={option.value}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "10px",
                alignItems: "start",
                border: "1px solid " + (defaultContactDisplayMode === option.value ? "#1e3a8a" : "#e2e8f0"),
                borderRadius: "10px",
                padding: "12px",
                background: defaultContactDisplayMode === option.value ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="defaultContactDisplayMode"
                value={option.value}
                checked={defaultContactDisplayMode === option.value}
                onChange={() => setDefaultContactDisplayMode(option.value)}
                style={{ marginTop: "3px" }}
              />
              <span>
                <span style={{ display: "block", fontWeight: 900, color: "#111827" }}>{option.label}</span>
                <span style={{ display: "block", marginTop: "3px", color: "#475569", lineHeight: 1.45 }}>
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div
        data-template-create-metadata-preview="phase1i"
        style={{
          marginTop: "14px",
          border: "1px solid #dbeafe",
          borderRadius: "10px",
          background: "#f8fafc",
          padding: "12px",
        }}
      >
        <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: "6px" }}>Import preview payload</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "12px", color: "#334155", maxHeight: "180px", overflow: "auto" }}>
{JSON.stringify(
  {
    key: row.key,
    label: row.label,
    category: row.category,
    defaultSignerMode,
    defaultContactDisplayMode,
    productionTemplateReady: false,
    finalProductionDocument: false,
    mergeFields: row.mergeFields,
    uploadedTemplateFile: {
      name: file.name,
      size: file.size,
      storedOnConfirm: true,
    },
  },
  null,
  2
)}
        </pre>
      </div>

      {message && (
        <div
          data-template-create-status="phase1i"
          style={{
            marginTop: "14px",
            border: "1px solid " + (status === "error" ? "#dc2626" : status === "saved" ? "#16a34a" : "#cbd5e1"),
            borderRadius: "10px",
            background: status === "error" ? "#fef2f2" : status === "saved" ? "#f0fdf4" : "#ffffff",
            color: "#111827",
            padding: "12px",
            fontWeight: 800,
          }}
        >
          {message}
        </div>
      )}

      {responsePreview && (
        <pre
          data-template-create-response-preview="phase1i"
          style={{
            marginTop: "12px",
            whiteSpace: "pre-wrap",
            fontSize: "12px",
            color: "#334155",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "12px",
            maxHeight: "220px",
            overflow: "auto",
          }}
        >
{JSON.stringify(responsePreview, null, 2)}
        </pre>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
        <button type="button" onClick={onCancel} disabled={status === "previewing" || status === "saving"} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", background: "#ffffff", color: "#0f172a", fontWeight: 900, padding: "10px 14px", cursor: "pointer" }}>
          Cancel
        </button>
        <button type="button" onClick={createTemplate} disabled={!canSave} data-template-create-confirm-button="phase1i" style={{ border: "1px solid #1e3a8a", borderRadius: "8px", background: canSave ? "#1e3a8a" : "#94a3b8", color: "#ffffff", fontWeight: 900, padding: "10px 14px", cursor: canSave ? "pointer" : "not-allowed" }}>
          {status === "previewing" ? "Previewing…" : status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Create Template"}
        </button>
      </div>
    </section>
  );
}
