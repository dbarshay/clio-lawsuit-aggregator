# Barsh Matters Admin Permissions — Phase 10G Activation / Rollback Runbook

## Current locked state

- First planned target: `/admin/audit-history`
- Permission: `admin.auditHistory.view`
- Exactly one route has `enforcementPlanned: true`
- Persistent enforcement remains disabled
- Sole configured user must retain full access:
  - email: `dbarshay15@gmail.com`
  - status: active
  - bootstrapSafe: true
  - role: owner_admin
  - full effective owner_admin permissions
  - no block overrides

## Required proofs before any persistent activation

1. Repository is clean and synced to origin/main.
2. Phase 10B planned-target verifiers pass.
3. Phase 10E activation-readiness guardrails pass.
4. Phase 10F ephemeral activation simulation passes.
5. DB-backed sole-user full-access proof passes.
6. Never-block routes remain available:
   - `/admin`
   - `/admin/permissions`
   - `/api/admin/permissions`
   - `/api/admin/permissions/check`
7. `/api/auth/session` remains available as rollback/session diagnostic path.

## Persistent activation rule

Persistent activation may occur only in a separate final activation phase, by setting the admin permissions enforcement environment variable to the enabled value in the target runtime environment. Do not commit a source-code assignment, package-script assignment, or checked-in environment file that enables enforcement.

## Immediate rollback rule

Rollback is removal or disabling of the admin permissions enforcement environment value from the target runtime, followed by redeploy/restart and verification that `/api/auth/session` reports permissions enforcement disabled.

## Mandatory post-activation smoke

Immediately after any future persistent activation, run authenticated smoke proving:

- `/api/auth/session` returns authenticated session diagnostics.
- `/admin/audit-history` returns 200 for the sole owner_admin user.
- Never-block routes remain reachable.
- Rollback route remains reachable.
- Working tree remains clean.
- Persistent source contains no assignment of the enforcement environment variable.

## Do not proceed if

- More than one route is enforcement-planned.
- Any route other than `/admin/audit-history` is enforcement-planned.
- Sole user is not active, bootstrapSafe, owner_admin, or full effective permission coverage.
- Any explicit block override exists for the sole user.
- Any never-block route fails.
- Rollback/session diagnostics fail.
