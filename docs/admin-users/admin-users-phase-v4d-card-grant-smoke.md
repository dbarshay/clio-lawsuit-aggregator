# Admin Users Phase V4D - Administrator Card Grant Smoke

Status: guarded DB smoke test.

This phase smoke-tests that a non-owner test user can be assigned the final `administrator` role and selected Admin-card grants can be persisted as `AdminUserPermissionOverride` allow rows.

Test target:

- `jane.doe.limited@example.com`

Selected smoke grants:

- `admin.card.auditHistory`
- `admin.card.documentTemplates`
- `admin.card.referenceData`

Safety guarantees:

- Owner user remains protected.
- No users are created or deleted.
- No roles are deleted.
- Runtime permission enforcement remains disabled.
- Session behavior is unchanged.
- Passwords and 2FA are unchanged.
- Clio, documents, email, and print queue are unchanged.

Next phase: optionally run a browser/UI smoke test in Admin Users to confirm the edit-panel checkboxes show the saved grants.
