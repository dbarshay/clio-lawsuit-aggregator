# Admin Users / Signer Profile Phase 2 — Real Wiring Map and Guardrails

## Effective baseline

- Effective Phase 1 lock: `admin-users-signer-profile-phase1-security-repair-20260623`.
- This phase maps the real Users admin/API/auth/permission surfaces before mutating runtime behavior.
- This phase does not change DOCX templates.
- This phase does not wire production document-generation signer validation.

## Admin full-permission default

- Dave/the primary admin should default to access to all permissions.
- Owner-admin/bootstrap behavior should preserve full permission access unless explicitly changed.
- Future signer/security wiring must not accidentally reduce the primary admin account below all-permissions access.

## Confirmed Phase 1 foundation

- Users admin page exists: `True`.
- Schema has Phase 1 signer/security fields: `True`.
- Phase 1 UI contract comment present: `True`.

## Candidate admin pages

- `app/admin/page.tsx` — hits: admin/users, login, logout, session, audit, permissions
- `app/admin/claim-index/page.tsx` — hits: audit
- `app/admin/claim-index/audit/page.tsx` — hits: audit
- `app/admin/clients/[id]/invoice/page.tsx` — hits: audit
- `app/admin/lawsuit-cleanup/page.tsx` — hits: audit
- `app/admin/backup-restore/page.tsx` — hits: audit
- `app/admin/permissions/page.tsx` — hits: AdminUser, admin user, admin/users, assign role, create user, remove role, permission override, session
- `app/admin/ticklers/page.tsx` — hits: audit
- `app/admin/ticklers/runner/page.tsx` — hits: audit
- `app/admin/lawsuits/audit/page.tsx` — hits: audit
- `app/admin/users/page.tsx` — hits: AdminUser, admin user, admin/users, Reset Password, assign role, create user, remove role, permission override
- `app/admin/audit-history/page.tsx` — hits: admin user, audit
- `app/admin/readiness-dashboard/page.tsx` — hits: audit
- `app/admin/reference-data/page.tsx` — hits: audit
- `app/admin/document-readiness/audit/page.tsx` — hits: audit

## Candidate API routes

- `app/api/court-calendar/import-webcivil-local/route.ts` — hits: audit
- `app/api/court-calendar/events/route.ts` — hits: audit
- `app/api/auth/logout/route.ts` — hits: logout, session
- `app/api/auth/change-password/route.ts` — hits: AdminUser, admin user, login, session, audit
- `app/api/auth/login/route.ts` — hits: AdminUser, login, session, bootstrapSafe
- `app/api/auth/session/route.ts` — hits: session, permissions
- `app/api/settlements/history/route.ts` — hits: audit
- `app/api/graph/token-health/route.ts` — hits: permissions
- `app/api/admin/claim-index/audit/route.ts` — hits: audit
- `app/api/admin/clients/[id]/route.ts` — hits: audit
- `app/api/admin/clients/[id]/invoice/[invoiceId]/route.ts` — hits: audit
- `app/api/admin/clients/[id]/invoice/[invoiceId]/void/route.ts` — hits: audit
- `app/api/admin/clients/[id]/invoice/[invoiceId]/finalize/route.ts` — hits: audit
- `app/api/admin/clients/[id]/invoice/create/route.ts` — hits: audit
- `app/api/admin/permissions/route.ts` — hits: permissions
- `app/api/admin/permissions/deployment-package/route.ts` — hits: permissions
- `app/api/admin/permissions/catalog/route.ts` — hits: permissions
- `app/api/admin/permissions/activation-status/route.ts` — hits: permissions
- `app/api/admin/permissions/role-matrix/route.ts` — hits: owner_admin, permissions
- `app/api/admin/permissions/check/route.ts` — hits: permission override, permissions
- `app/api/admin/lawsuits/cleanup-preview/route.ts` — hits: audit
- `app/api/admin/lawsuits/cleanup-confirm/route.ts` — hits: audit
- `app/api/admin/lawsuits/audit/route.ts` — hits: audit
- `app/api/admin/authorize/route.ts` — hits: session
- `app/api/admin/users/remove-role/route.ts` — hits: AdminUser, admin user, admin/users, permission override, session, audit, owner_admin, permissions
- `app/api/admin/users/assign-role/route.ts` — hits: AdminUser, admin user, admin/users, permission override, session, audit, owner_admin, permissions
- `app/api/admin/users/planning/route.ts` — hits: AdminUser, admin user, admin/users, create user, permissions, bootstrapSafe
- `app/api/admin/users/password-reset/route.ts` — hits: AdminUser, admin user, admin/users, Reset Password, login, session, audit, owner_admin
- `app/api/admin/users/create/route.ts` — hits: AdminUser, admin user, admin/users, permission override, session, audit, owner_admin, permissions
- `app/api/admin/users/permission-override/route.ts` — hits: AdminUser, admin user, admin/users, permission override, session, audit, owner_admin, permissions
- `app/api/admin/users/lockout/route.ts` — hits: AdminUser, admin user, admin/users, login, session, audit, owner_admin, permissions
- `app/api/admin/document-readiness/audit/route.ts` — hits: audit
- `app/api/audit-log/route.ts` — hits: audit
- `app/api/lawsuits/close/route.ts` — hits: audit
- `app/api/documents/finalize/route.ts` — hits: session, audit
- `app/api/documents/print-queue-preview/route.ts` — hits: audit
- `app/api/reference-data/import-history/route.ts` — hits: audit
- `app/api/reference-data/import-cleanup-confirm/route.ts` — hits: audit
- `app/api/reference-data/aliases/route.ts` — hits: audit
- `app/api/reference-data/import-confirm/route.ts` — hits: audit
- `app/api/reference-data/entities/route.ts` — hits: audit
- `app/api/matters/identity-field/route.ts` — hits: audit
- `app/api/matters/apply-payment/route.ts` — hits: audit
- `app/api/matters/close/route.ts` — hits: audit
- `app/api/matters/update-direct-field/route.ts` — hits: audit

## Candidate auth/session files

- `app/api/auth/logout/route.ts` — hits: logout, session
- `app/api/auth/change-password/route.ts` — hits: AdminUser, admin user, login, session, audit
- `app/api/auth/login/route.ts` — hits: AdminUser, login, session, bootstrapSafe
- `app/api/auth/session/route.ts` — hits: session, permissions
- `app/api/admin/authorize/route.ts` — hits: session
- `app/login/page.tsx` — hits: login, logout, session
- `src/lib/auth/admin-user-session-timeout-phase1.ts` — hits: session
- `src/lib/auth/admin-user-password-security-phase1.ts` — hits: login
- `lib/adminAuth.ts` — hits: AdminUser, session, permissions
- `scripts/verify-prod-auth-admin-smoke.mjs` — hits: login, session, permissions
- `scripts/verify-admin-users-password-auth-safety-phase1.mjs` — hits: login
- `scripts/verify-admin-session-aware-action-gates-safety.mjs` — hits: login, session, audit
- `scripts/verify-admin-proxy-clean-redirect-safety.mjs` — hits: login
- `scripts/verify-admin-session-control-safety.mjs` — hits: login, logout, session, permissions
- `scripts/verify-admin-login-redirect-safety.mjs` — hits: login
- `scripts/verify-admin-login-foundation-safety.mjs` — hits: login, logout, session
- `scripts/verify-admin-auth-foundation-safety.mjs` — hits: login, session
- `scripts/verify-admin-home-login-redirect-cleanup-safety.mjs` — hits: login

## Candidate permission/role files

- `app/admin/page.tsx` — hits: admin/users, login, logout, session, audit, permissions
- `app/admin/permissions/page.tsx` — hits: AdminUser, admin user, admin/users, assign role, create user, remove role, permission override, session
- `app/admin/users/page.tsx` — hits: AdminUser, admin user, admin/users, Reset Password, assign role, create user, remove role, permission override
- `app/api/auth/session/route.ts` — hits: session, permissions
- `app/api/graph/token-health/route.ts` — hits: permissions
- `app/api/admin/permissions/route.ts` — hits: permissions
- `app/api/admin/permissions/deployment-package/route.ts` — hits: permissions
- `app/api/admin/permissions/catalog/route.ts` — hits: permissions
- `app/api/admin/permissions/activation-status/route.ts` — hits: permissions
- `app/api/admin/permissions/role-matrix/route.ts` — hits: owner_admin, permissions
- `app/api/admin/permissions/check/route.ts` — hits: permission override, permissions
- `app/api/admin/users/remove-role/route.ts` — hits: AdminUser, admin user, admin/users, permission override, session, audit, owner_admin, permissions
- `app/api/admin/users/assign-role/route.ts` — hits: AdminUser, admin user, admin/users, permission override, session, audit, owner_admin, permissions
- `app/api/admin/users/planning/route.ts` — hits: AdminUser, admin user, admin/users, create user, permissions, bootstrapSafe
- `app/api/admin/users/password-reset/route.ts` — hits: AdminUser, admin user, admin/users, Reset Password, login, session, audit, owner_admin
- `app/api/admin/users/create/route.ts` — hits: AdminUser, admin user, admin/users, permission override, session, audit, owner_admin, permissions
- `app/api/admin/users/permission-override/route.ts` — hits: AdminUser, admin user, admin/users, permission override, session, audit, owner_admin, permissions
- `app/api/admin/users/lockout/route.ts` — hits: AdminUser, admin user, admin/users, login, session, audit, owner_admin, permissions
- `lib/adminPermissions.ts` — hits: admin user, admin/users, assign role, remove role, permission override, session, audit, permissions
- `lib/adminUsersWriteContracts.ts` — hits: AdminUser, admin user, admin/users, session, audit, owner_admin, permissions, bootstrapSafe
- `lib/adminUsersPlanning.ts` — hits: AdminUser, audit, owner_admin, permissions
- `lib/adminAuth.ts` — hits: AdminUser, session, permissions
- `lib/admin-permissions/roleMatrix.ts` — hits: owner_admin, permissions
- `lib/admin-permissions/catalog.ts` — hits: admin user, admin/users, assign role, permission override, permissions
- `prisma/schema.prisma` — hits: AdminUser, admin user, login, session, audit, permissions, bootstrapSafe
- `scripts/verify-admin-users-phase4-route-map-readiness-safety.mjs` — hits: admin user, admin/users, permissions
- `scripts/verify-admin-users-phase3-create-user-ui-safety.mjs` — hits: AdminUser, admin user, admin/users, assign role, create user, permission override, session, audit
- `scripts/verify-admin-permission-lockout-safety.mjs` — hits: permissions
- `scripts/verify-prod-auth-admin-smoke.mjs` — hits: login, session, permissions
- `scripts/verify-admin-users-phase7-completion-safety.mjs` — hits: admin user, session, audit, permissions
- `scripts/verify-admin-permissions-registry-safety.mjs` — hits: audit, permissions
- `scripts/verify-admin-user-role-seed-preview-safety.mjs` — hits: admin user, permissions
- `scripts/verify-admin-users-db-preview-readonly-safety.mjs` — hits: AdminUser, admin user, admin/users, create user, permissions
- `scripts/verify-admin-page-permission-enforcement-safety.mjs` — hits: login, permissions
- `scripts/verify-admin-users-write-contract-preview-safety.mjs` — hits: AdminUser, admin user, admin/users, owner_admin, permissions, bootstrapSafe
- `scripts/verify-admin-users-phase5-simulation-completion-safety.mjs` — hits: admin user, admin/users, session, permissions
- `scripts/verify-admin-users-phase6-audit-visibility-readiness-safety.mjs` — hits: AdminUser, admin user, admin/users, audit, permissions
- `scripts/verify-admin-users-phase7-activation-planning-readiness-safety.mjs` — hits: admin user, admin/users, permission override, owner_admin, permissions, bootstrapSafe
- `scripts/verify-admin-users-phase3-completion-safety.mjs` — hits: admin user, admin/users, assign role, create user, remove role, permission override, session, audit
- `scripts/verify-admin-user-role-migration-sql-safety.mjs` — hits: AdminUser, admin user
- `scripts/verify-admin-permissions-matrix-coverage-safety.mjs` — hits: permissions
- `scripts/verify-admin-users-phase3-permission-override-ui-safety.mjs` — hits: AdminUser, admin user, admin/users, assign role, remove role, permission override, session, audit
- `scripts/verify-admin-users-phase5-enforcement-simulation-negative-path-safety.mjs` — hits: admin user, admin/users, session, permissions
- `scripts/verify-admin-users-phase3-assign-role-route-safety.mjs` — hits: AdminUser, admin user, admin/users, assign role, permission override, session, audit, owner_admin
- `scripts/verify-admin-users-planning-readonly-safety.mjs` — hits: AdminUser, admin user, admin/users, create user, permissions
- `scripts/apply-admin-user-role-seed.mjs` — hits: AdminUser, admin user, audit, owner_admin, permissions, bootstrapSafe
- `scripts/verify-admin-permission-check-endpoint-enforcement-safety.mjs` — hits: permissions
- `scripts/verify-admin-api-permission-enforcement-safety.mjs` — hits: permissions
- `scripts/verify-admin-users-phase3-remove-role-ui-safety.mjs` — hits: AdminUser, admin user, admin/users, assign role, remove role, permission override, session, audit
- `scripts/verify-admin-users-phase6-completion-safety.mjs` — hits: admin user, admin/users, permission override, session, audit, permissions
- `scripts/verify-admin-session-control-safety.mjs` — hits: login, logout, session, permissions
- `scripts/verify-admin-users-write-controls-preview-safety.mjs` — hits: admin user, admin/users, assign role, remove role, permission override, permissions
- `scripts/verify-admin-users-phase7-no-lockout-smoke-plan-readiness-safety.mjs` — hits: admin user, permission override, session, audit, permissions
- `scripts/verify-admin-users-phase6-negative-path-diagnostics-readiness-safety.mjs` — hits: admin user, admin/users, permission override, session, audit, owner_admin, permissions, bootstrapSafe
- `scripts/verify-admin-users-phase3-permission-override-route-safety.mjs` — hits: AdminUser, admin user, admin/users, assign role, remove role, permission override, session, audit
- `scripts/preview-admin-user-role-seed.mjs` — hits: AdminUser, audit, owner_admin, permissions, bootstrapSafe
- `scripts/verify-admin-users-phase3-create-user-route-safety.mjs` — hits: AdminUser, admin user, admin/users, assign role, create user, permission override, session, audit
- `scripts/verify-admin-users-phase4-dry-run-decision-path-safety.mjs` — hits: admin user, admin/users, permissions
- `scripts/verify-admin-permissions-blocked-notice-safety.mjs` — hits: permissions
- `scripts/verify-admin-users-phase7-first-target-planning-readiness-safety.mjs` — hits: admin user, session, audit, permissions
- `scripts/verify-admin-users-phase4-completion-safety.mjs` — hits: admin user, admin/users, session, permissions
- `scripts/verify-admin-users-phase5-permission-check-negative-path-safety.mjs` — hits: admin user, admin/users, permission override, session, audit, permissions
- `scripts/verify-admin-permissions-enforcement-engine-safety.mjs` — hits: permissions
- `scripts/verify-admin-permissions-readonly-page-safety.mjs` — hits: session, permissions
- `scripts/verify-admin-user-role-schema-foundation-safety.mjs` — hits: AdminUser, admin user, session, permissions, bootstrapSafe
- `scripts/verify-admin-users-phase4-env-deployment-readiness-safety.mjs` — hits: admin user, session, permissions
- `scripts/verify-admin-users-phase3-assign-role-ui-safety.mjs` — hits: AdminUser, admin user, admin/users, assign role, create user, remove role, permission override, session
- `scripts/verify-admin-permissions-dry-run-safety.mjs` — hits: session, permissions
- `scripts/verify-admin-users-phase2-completion-safety.mjs` — hits: AdminUser, admin user, admin/users, permission override, owner_admin, permissions, bootstrapSafe
- `scripts/verify-admin-user-role-seed-apply-guard-safety.mjs` — hits: AdminUser, admin user, permissions
- `scripts/verify-admin-permission-check-endpoint-safety.mjs` — hits: permissions
- `scripts/verify-admin-permissions-enforcement-flag-preview-safety.mjs` — hits: session, permissions
- `scripts/verify-admin-users-effective-permissions-readonly-safety.mjs` — hits: admin user, admin/users, permissions
- `scripts/verify-admin-permissions-config-preview-safety.mjs` — hits: permission override, session, permissions
- `scripts/verify-admin-users-phase3-remove-role-route-safety.mjs` — hits: AdminUser, admin user, admin/users, remove role, permission override, session, audit, owner_admin

## Phase 3 implementation guardrails

1. Patch real Users admin create/edit surfaces only after confirming route names and payload shapes.
2. Preserve owner/admin-only permission gates for Phase 1/2 signer-contact edits.
3. Ensure Dave/the primary admin defaults to all permissions.
4. Use normalized case-insensitive `emailNormalized` and `usernameNormalized` guards.
5. Never log plaintext passwords or 2FA codes.
6. Mask full 2FA phone numbers in routine audit display.
7. Do not change `templates/docx/base/letterhead-simple.docx`.
8. Do not change `templates/docx/letters/initial-billing-letter.docx`.
9. Do not wire production document-generation signer validation.

## Phase 3 expected lock target

`admin-users-signer-profile-phase3-real-create-edit-security-actions`
