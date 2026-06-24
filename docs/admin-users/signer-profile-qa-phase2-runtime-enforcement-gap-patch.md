# Admin Users / Signer Profile QA Phase 2 — Runtime Enforcement Gap Patch

## Baseline

- QA Phase 1 lock: `admin-users-qa-phase1-runtime-smoke-gap-report-20260623`.
- Runtime mutation: `true`.

## Patched runtime gaps

- Login route now has runtime forced-password and 2FA visibility helpers outside comments.
- Login page redirects to `/forced-password-change` when login response reports `forcePasswordChange` or `passwordChangeRequired`.
- Login page initiates 2FA challenge and routes to a transient 2FA-required login URL when login response reports `twoFactorRequired`.
- Session route now has runtime visibility fields for forced-password and 2FA status outside comments.
- Admin page now uses `/api/auth/signout` instead of the legacy logout route.

## Deferred

- External SMS delivery remains known deferred. The existing 2FA challenge route still stores only a hash and does not falsely claim SMS delivery.

## Safety limits

- Does not change DOCX templates.
- Does not change production document-generation signer validation.
- Does not alter Initial Billing Letter Phase 18L behavior.

