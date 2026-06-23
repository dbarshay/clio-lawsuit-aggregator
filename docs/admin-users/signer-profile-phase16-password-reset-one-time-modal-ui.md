# Admin Users / Signer Profile Phase 16 — Password Reset One-Time Temporary Password Modal UI

## Baseline

- Phase 15 lock: `admin-users-phase15-password-reset-one-time-modal-anchors-20260623`.
- Runtime mutation: `true`.
- Target page: `app/admin/users/page.tsx`.

## Scope

- Shows a standard Barsh Matters modal when password-reset apply returns `temporaryPassword` and `temporaryPasswordOneTimeDisplay`.
- Modal title is `Temporary Password`.
- Modal warns that the temporary password is shown once.
- Modal includes a `Copy Temporary Password` button using `navigator.clipboard.writeText`.
- Done clears the client-side one-time password state.
- Does not change the password-reset route behavior.
- Does not change signer-profile route, lockout route, 2FA behavior, document-generation behavior, or DOCX templates.

