# Admin Users / Signer Profile Phase 12 — Users Admin UI Signer/Profile Wiring

## Baseline

- Phase 11 lock: `admin-users-phase11-dedicated-signer-profile-update-route-20260623`.
- Runtime mutation: `true`.
- Target page: `app/admin/users/page.tsx`.

## Scope

- Adds explicit Users admin page contract/helpers for create/edit signer-profile fields.
- Create-user payload target remains `/api/admin/users/create`.
- Edit-user signer/contact/status payload target is `/api/admin/users/signer-profile`.
- Edit signer-profile behavior remains separate from lockout, password reset, failed-login clear, role assignment, and permission override routes.
- Derived signer status labels are `Complete` and `Missing Fields`.
- Derived 2FA status labels are `Enabled`, `Disabled`, `Missing Phone`, and `Pending Setup`.
- Does not wire production document-generation signer validation.
- Does not change DOCX templates.

