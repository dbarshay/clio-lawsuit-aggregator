import fs from "node:fs";

const page = fs.readFileSync("app/admin/users/page.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

for (const token of [
  "data-barsh-admin-users-table",
  "Display Name",
  "User Name",
  "Role",
  "Last Sign-in",
  "data-barsh-admin-users-create-top-button",
  "data-barsh-admin-users-audit-history-top-link",
  "Open Audit History",
  "data-barsh-admin-users-edit-row-button",
  "data-barsh-admin-users-signer-profile-row-button",
  "data-barsh-admin-users-reset-password-row-button",
  "data-barsh-admin-users-activate-2fa-row-button",
  "data-barsh-admin-users-2fa-enforced-label",
  "data-barsh-admin-users-lock-row-button",
  "data-barsh-admin-users-signout-row-button",
]) must(page.includes(token), "missing table/top-action token: " + token);

for (const editToken of [
  "data-barsh-admin-users-edit-panel",
  "data-barsh-admin-users-edit-first-name",
  "data-barsh-admin-users-edit-last-name",
  "data-barsh-admin-users-edit-display-name",
  "data-barsh-admin-users-edit-username",
  "data-barsh-admin-users-edit-email",
  "data-barsh-admin-users-edit-two-factor-phone",
  "data-barsh-admin-users-edit-role-assign",
  "data-barsh-admin-users-edit-role-remove",
  "data-barsh-admin-users-edit-save-button",
  "saveEditAdminUserPanel",
  "openEditAdminUserPanel",
]) must(page.includes(editToken), "missing edit panel token: " + editToken);

for (const signerToken of [
  "data-barsh-admin-users-signer-profile-row-button",
  "data-barsh-admin-users-signer-profile-modal",
  "data-barsh-admin-users-signer-profile-only-fields",
  "data-barsh-admin-users-signer-profile-email",
  "data-barsh-admin-users-signer-profile-phone-extension",
  "data-barsh-admin-users-signer-profile-fax-number",
  "data-barsh-admin-users-signer-profile-signature-name",
  "data-barsh-admin-users-signer-profile-eligible",
  "data-barsh-admin-users-signer-profile-save-button",
  "openSignerProfilePanel",
  "saveSignerProfilePanel",
]) must(page.includes(signerToken), "missing separate signer profile token: " + signerToken);

for (const promptToken of [
  "window.prompt(\"Display Name\"",
  "window.prompt(\"User Name\"",
  "Role to assign while editing. Leave blank for no assignment.",
]) must(!page.includes(promptToken), "prompt-based edit workflow must not remain: " + promptToken);

for (const route of [
  "/api/admin/users/signer-profile",
  "/api/admin/users/password-reset",
  "/api/admin/users/lockout",
  "/api/auth/signout",
  "/api/admin/users/assign-role",
  "/api/admin/users/remove-role",
  "/admin/audit-history",
]) must(page.includes(route), "required action route/link missing: " + route);

for (const removed of [
  "data-barsh-admin-users-lockout-card",
  "data-barsh-admin-users-assign-role-control",
  "data-barsh-admin-users-remove-role-control",
  "data-barsh-admin-users-permission-override-control",
  "data-barsh-admin-users-write-controls-preview",
  "data-barsh-admin-users-planning-users",
  "data-barsh-admin-users-planning-roles",
  "data-barsh-admin-users-top-actions",
  "data-barsh-admin-users-audit-visibility",
]) must(!page.includes(removed), "removed panel still present: " + removed);

must(page.includes(">Edit</button><button data-barsh-admin-users-signer-profile-row-button"), "Edit and Signer Profile buttons should be separate adjacent actions");
must(!page.includes(">Edit / Signer Profile</button>"), "combined Edit / Signer Profile button should not remain");
must(!page.includes('data-barsh-admin-users-edit-phone-extension="true"'), "full Edit panel should not include signer extension");
must(!page.includes('data-barsh-admin-users-edit-fax-number="true"'), "full Edit panel should not include signer fax");
must(!page.includes('data-barsh-admin-users-edit-signature-block-name="true"'), "full Edit panel should not include signer signature name");
must(!page.includes('data-barsh-admin-users-edit-signer-eligible="true"'), "full Edit panel should not include signer eligibility");
must(pkg.scripts?.["verify:admin-users-workflow-phase-b-table-actions"] === "node scripts/verify-admin-users-workflow-phase-b-table-actions.mjs", "package script missing for phase B verifier");

if (failures.length) {
  console.error("FAIL: Admin Users Workflow Phase C edit panel verifier failed");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("PASS: Admin Users Workflow Phase C edit panel UI locked.");
