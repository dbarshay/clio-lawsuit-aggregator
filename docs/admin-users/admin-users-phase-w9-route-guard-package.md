# Admin Users Phase W9 - Route Guard Package and Rollback Plan

Status: package only.

This phase adds a future route-guard package that wraps the W8 dry-run decision helper.

No route imports or calls the W9 guard.
No runtime enforcement is enabled.
No response blocking is implemented.
No UI hiding is enabled.
No database changes are made.
No session mode is changed.

## Required future activation conditions

Before any route is wired to the guard, a later phase must include:

1. Owner no-lockout smoke proof.
2. Administrator selected-card proof.
3. Full User non-admin proof.
4. Basic User payment/billing block proof.
5. View Only mutation block proof.
6. Explicit rollback command.
7. Production kill-switch proof.
8. Local/staging smoke before production.

## Rollback plan

Future enforcement wiring must be reversible by:

1. Setting `BARSH_ADMIN_USERS_PERMISSION_ENFORCEMENT` to unset or `0`.
2. Reverting the route wiring commit.
3. Verifying `/api/auth/session` still reports `permissionsMode: "default-admin-allow-all"` unless a later approved activation phase intentionally changes it.
4. Confirming owner can still access `/admin/users`.

Phase W9 does not activate or wire the guard.
