# Admin Users / Signer Profile Phase 7 — Create/Edit Payload Normalization Contract

## Baseline

- Phase 6 lock: `admin-users-phase6-real-create-edit-signer-profile-anchors-20260623`.
- Runtime Users admin page/API mutation: `false`.
- DOCX mutation: `false`.
- Production document-generation signer validation wiring: `false`.

## Purpose

This phase introduces the reusable create/edit payload contract for signer/contact/status fields before wiring the live Users admin page or API routes.

## Required behaviors

1. Store `firstName` and `lastName` separately.
2. Auto-suggest `displayName` and `username` as first initial plus last name when omitted.
3. Normalize `emailNormalized` and `usernameNormalized` case-insensitively.
4. Preserve phone extension and fax number exactly as typed except blank-to-null conversion.
5. Derive signer completeness from required fields; do not store it manually.
6. Derive 2FA status from per-user 2FA fields.
7. Keep `locked` and `inactive` as separate booleans.
8. Preserve Phase 5 owner-admin all-permissions behavior.
9. Do not wire production document-generation signer validation.
10. Do not change DOCX templates.

## Next phase

Phase 8 should wire this contract into the real Users admin create/edit API routes and page form, with audit logging and owner/admin permission gates.
