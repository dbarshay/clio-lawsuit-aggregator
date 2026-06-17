"use client";

import { useEffect, useMemo, useState } from "react";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 18,
} as const;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
  color: "#0f172a",
} as const;

const primaryButtonStyle = {
  border: "1px solid #1e3a8a",
  background: "#1e3a8a",
  color: "#ffffff",
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 950,
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  border: "1px solid #64748b",
  background: "#f8fafc",
  color: "#334155",
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 950,
  cursor: "pointer",
} as const;

function cleanEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

export default function AdminUsersPlanningPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createStatus, setCreateStatus] = useState("active");
  const [createNotes, setCreateNotes] = useState("");
  const [createActorEmail, setCreateActorEmail] = useState("dbarshay15@gmail.com");
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createResult, setCreateResult] = useState<any>(null);

  async function loadAdminUsersPlanning() {
    try {
      setError("");
      const response = await fetch("/api/admin/users/planning", { cache: "no-store" });
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Admin users planning lookup failed.");
    }
  }

  useEffect(() => {
    void loadAdminUsersPlanning();
  }, []);

  const roles = Array.isArray(data?.roles) ? data.roles : [];
  const users = Array.isArray(data?.users) ? data.users : [];
  const dbUsers = Array.isArray(data?.databasePreview?.users) ? data.databasePreview.users : [];
  const dbRoles = Array.isArray(data?.databasePreview?.roles) ? data.databasePreview.roles : [];
  const enforcementLabel = useMemo(() => (data?.enforcementEnabled ? "Yes" : "No"), [data?.enforcementEnabled]);
  const previewReady = Boolean(createResult?.ok && createResult?.mode === "preview" && createResult?.wouldCreate?.email === cleanEmail(createEmail));

  async function submitCreateAdminUser(apply: boolean) {
    try {
      setCreateBusy(true);
      setCreateMessage(apply ? "Applying guarded create-admin-user request..." : "Previewing guarded create-admin-user request...");
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          apply,
          email: createEmail,
          displayName: createDisplayName,
          status: createStatus,
          notes: createNotes,
          actorEmail: createActorEmail,
        }),
      });
      const json = await response.json().catch(() => ({ ok: false, error: "Create admin user route did not return JSON." }));
      setCreateResult({ ...json, httpStatus: response.status });
      if (!response.ok || !json?.ok) {
        setCreateMessage(json?.error || `Create admin user request failed with HTTP ${response.status}.`);
        return;
      }
      if (apply) {
        setCreateMessage("Admin user created. Roles were not assigned and enforcement remains disabled.");
        setCreateEmail("");
        setCreateDisplayName("");
        setCreateNotes("");
        setCreateStatus("active");
        await loadAdminUsersPlanning();
      } else {
        setCreateMessage("Preview complete. No AdminUser row was created. Review the result before Apply.");
      }
    } catch (err: any) {
      setCreateMessage(err?.message || "Create admin user request failed.");
      setCreateResult({ ok: false, error: err?.message || "Create admin user request failed." });
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <main data-barsh-admin-users-planning-page="phase3-guarded" style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: 30, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto", display: "grid", gap: 18 }}>
        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 24, padding: 22 }}>
          <p style={{ margin: "0 0 8px", color: "#64748b", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontSize: 12 }}>Phase 3 Guarded Write Controls</p>
          <h1 style={{ margin: 0, fontSize: 30 }}>Admin Users / Roles</h1>
          <p style={{ margin: "10px 0 0", color: "#475569", lineHeight: 1.5 }}>Guarded administrator user management surface. The only active write control in this phase is Create Admin User, which uses preview/apply mode, requires an authenticated administrator session, requires an active owner_admin actor, prevents duplicate emails, validates active/inactive status, and does not assign roles or enable enforcement.</p>
        </section>

        {error ? <section data-barsh-admin-users-planning-error="true" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 18, padding: 16 }}>{error}</section> : null}

        <section data-barsh-admin-users-planning-summary="true" style={cardStyle}>
          <strong>Mode:</strong> {data?.mode || "loading"} | <strong>Enforcement Enabled:</strong> {enforcementLabel} | <strong>Planning Roles:</strong> {roles.length} | <strong>Planning Users:</strong> {users.length} | <strong>DB Roles:</strong> {data?.databasePreview?.roleCount ?? 0} | <strong>DB Users:</strong> {data?.databasePreview?.userCount ?? 0}
        </section>

        <section data-barsh-admin-users-enforcement-banner="disabled" style={{ background: "#fefce8", border: "1px solid #fde68a", color: "#713f12", borderRadius: 18, padding: 16, lineHeight: 1.5 }}>
          <strong>Enforcement Disabled:</strong> persisted users, roles, role permissions, and effective permissions are still displayed for review only. They are not used to block pages or API functions in this phase.
        </section>

        <section data-barsh-admin-users-create-user-control="phase3-guarded" style={{ ...cardStyle, border: "1px solid #bfdbfe", boxShadow: "0 12px 26px rgba(30, 58, 138, 0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0 }}>Create Admin User</h2>
              <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.5 }}>Phase 3 guarded route. Preview is the default. Apply creates only an AdminUser row; it does not assign roles, create permission overrides, enable enforcement, write Clio, send email, generate documents, or change the print queue.</p>
            </div>
            <span data-barsh-admin-users-create-user-enforcement-disabled="true" style={{ border: "1px solid #fde68a", background: "#fefce8", color: "#713f12", borderRadius: 999, padding: "7px 10px", fontWeight: 950, fontSize: 12 }}>Enforcement Disabled</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
            <label style={{ display: "grid", gap: 6, fontWeight: 850 }}>
              Email
              <input data-barsh-admin-users-create-email="true" value={createEmail} onChange={(event) => { setCreateEmail(event.target.value); setCreateResult(null); }} style={inputStyle} placeholder="new-admin@example.com" />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 850 }}>
              Display Name
              <input data-barsh-admin-users-create-display-name="true" value={createDisplayName} onChange={(event) => setCreateDisplayName(event.target.value)} style={inputStyle} placeholder="New Admin User" />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 850 }}>
              Status
              <select data-barsh-admin-users-create-status="true" value={createStatus} onChange={(event) => setCreateStatus(event.target.value)} style={inputStyle}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 850 }}>
              Owner Admin Actor Email
              <input data-barsh-admin-users-create-actor-email="true" value={createActorEmail} onChange={(event) => setCreateActorEmail(event.target.value)} style={inputStyle} placeholder="owner_admin email" />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 850, gridColumn: "1 / -1" }}>
              Notes
              <textarea data-barsh-admin-users-create-notes="true" value={createNotes} onChange={(event) => setCreateNotes(event.target.value)} style={{ ...inputStyle, minHeight: 76, resize: "vertical" }} placeholder="Optional internal notes" />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <button data-barsh-admin-users-create-preview-button="true" type="button" onClick={() => void submitCreateAdminUser(false)} disabled={createBusy} style={{ ...secondaryButtonStyle, opacity: createBusy ? 0.7 : 1 }}>
              {createBusy ? "Working..." : "Preview Create Admin User"}
            </button>
            <button data-barsh-admin-users-create-apply-button="true" type="button" onClick={() => void submitCreateAdminUser(true)} disabled={createBusy || !previewReady} style={{ ...primaryButtonStyle, opacity: createBusy || !previewReady ? 0.55 : 1, cursor: createBusy || !previewReady ? "not-allowed" : "pointer" }}>
              Apply Create Admin User
            </button>
          </div>

          <div data-barsh-admin-users-create-result="true" style={{ marginTop: 14, background: createResult?.ok ? "#f0fdf4" : createResult ? "#fef2f2" : "#f8fafc", border: `1px solid ${createResult?.ok ? "#bbf7d0" : createResult ? "#fecaca" : "#e2e8f0"}`, borderRadius: 14, padding: 12 }}>
            <div style={{ fontWeight: 950, color: createResult?.ok ? "#166534" : createResult ? "#991b1b" : "#475569" }}>{createMessage || "Preview the request before applying. Apply remains disabled until a matching preview succeeds."}</div>
            {createResult ? <pre style={{ margin: "10px 0 0", whiteSpace: "pre-wrap", fontSize: 12, fontFamily: "monospace" }}>{JSON.stringify(createResult, null, 2)}</pre> : null}
          </div>
        </section>

        <section data-barsh-admin-users-db-preview="read-only" style={{ ...cardStyle, overflowX: "auto" }}>
          <h2 style={{ marginTop: 0 }}>Database-Backed Preview</h2>
          <p style={{ color: "#475569" }}>Preview of persisted admin users and roles. These records are not used for enforcement yet.</p>
          <h3>DB Users</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Name", "Email", "Status", "Bootstrap Safe", "Roles", "Overrides"].map((header) => <th key={header} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{header}</th>)}</tr></thead>
            <tbody>{dbUsers.length ? dbUsers.map((user: any) => <tr key={user.id}><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontWeight: 900 }}>{user.displayName || ""}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace" }}>{user.email}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{user.status}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{user.bootstrapSafe ? "Yes" : "No"}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{(user.roleKeys || []).join(", ") || "None"}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{user.effectivePermissionCount ?? 0}</td></tr>) : <tr><td colSpan={6} style={{ padding: 10, borderBottom: "1px solid #e5e7eb", color: "#64748b" }}>No persisted admin users yet.</td></tr>}</tbody>
          </table>
          <h3>DB Roles</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Key", "Label", "Status", "System Role", "Permission Count"].map((header) => <th key={header} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{header}</th>)}</tr></thead>
            <tbody>{dbRoles.length ? dbRoles.map((role: any) => <tr key={role.id}><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace", fontWeight: 900 }}>{role.key}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{role.label}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{role.status}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{role.systemRole ? "Yes" : "No"}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{role.permissionCount ?? (role.permissionKeys || []).length}</td></tr>) : <tr><td colSpan={5} style={{ padding: 10, borderBottom: "1px solid #e5e7eb", color: "#64748b" }}>No persisted admin roles yet.</td></tr>}</tbody>
          </table>
        </section>

        <section data-barsh-admin-users-effective-permissions="read-only" style={{ ...cardStyle, overflowX: "auto" }}>
          <h2 style={{ marginTop: 0 }}>Effective Permissions Preview</h2>
          <p style={{ color: "#475569" }}>Read-only effective permission calculation from persisted DB roles and overrides. Enforcement remains disabled.</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["User", "Roles", "Effective Permission Count", "Effective Permissions"].map((header) => <th key={header} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{header}</th>)}</tr></thead>
            <tbody>{dbUsers.length ? dbUsers.map((user: any) => <tr key={user.id}><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace", fontWeight: 900 }}>{user.email}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{(user.roleKeys || []).join(", ") || "None"}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{user.effectivePermissionCount ?? 0}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace" }}>{(user.effectivePermissionKeys || []).join(", ")}</td></tr>) : <tr><td colSpan={4} style={{ padding: 10, borderBottom: "1px solid #e5e7eb", color: "#64748b" }}>No persisted admin users yet.</td></tr>}</tbody>
          </table>
        </section>

        <section data-barsh-admin-users-write-controls-preview="phase3-mixed" style={{ ...cardStyle, overflowX: "auto" }}>
          <h2 style={{ marginTop: 0 }}>Write Controls Roadmap</h2>
          <p style={{ color: "#475569", lineHeight: 1.5 }}>Create Admin User is active in guarded preview/apply mode. All other controls remain planning only and do not write records.</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Action", "Guardrail", "Status"].map((header) => <th key={header} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Create Admin User", "Requires active admin session, active owner_admin actor, duplicate-email check, active/inactive status validation, preview/apply, and audit logging on apply.", "Active guarded route"],
                ["Assign Role", "Require owner_admin role, preserve at least one bootstrapSafe owner_admin user, and audit every change.", "Preview only"],
                ["Remove Role", "Block removal if it would leave no active bootstrapSafe owner_admin user.", "Preview only"],
                ["Permission Override", "Require explicit allow/block reason, never permit blocking /admin or /admin/permissions safety routes.", "Preview only"],
                ["Enable Enforcement", "Separate phase only after persisted permissions are verified and lockout simulations pass.", "Not available"],
              ].map((row) => <tr key={row[0]}><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontWeight: 900 }}>{row[0]}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{row[1]}</td><td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", color: row[2].startsWith("Active") ? "#166534" : "#92400e", fontWeight: 900 }}>{row[2]}</td></tr>)}
            </tbody>
          </table>
        </section>

        <section data-barsh-admin-users-planning-users="true" style={{ ...cardStyle, overflowX: "auto" }}>
          <h2 style={{ marginTop: 0 }}>Planned Users</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Name", "Email", "Roles", "Explicit Allow", "Explicit Block", "Effective Permissions", "Source"].map((header) => <th key={header} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.email}>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontWeight: 900 }}>{user.displayName}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace" }}>{user.email}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{(user.plannedRoles || []).join(", ")}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{(user.explicitAllow || []).join(", ") || "None"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{(user.explicitBlock || []).join(", ") || "None"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{user.effectivePermissionCount}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{user.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "#475569" }}>Effective permissions are calculated for review only. They are not enforced and are not persisted.</p>
        </section>

        <section data-barsh-admin-users-planning-roles="true" style={{ ...cardStyle, overflowX: "auto" }}>
          <h2 style={{ marginTop: 0 }}>Planned Roles</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Role", "Description", "Write Capable", "Permission Count", "Permissions"].map((header) => <th key={header} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {roles.map((role: any) => (
                <tr key={role.key}>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace", fontWeight: 900 }}>{role.label}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{role.description}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{role.writeCapable ? "Yes" : "No"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{role.permissionCount}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace" }}>{(role.permissions || []).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
