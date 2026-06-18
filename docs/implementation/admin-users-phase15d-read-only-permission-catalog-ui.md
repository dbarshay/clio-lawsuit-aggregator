# Admin Users Phase 15D Read-Only Permission Catalog UI

Date: 2026-06-18

## Scope

Phase 15D displays the Phase 15C static permission catalog on `/admin/permissions`.

## Hard Safety Rule

Phase 15D must not broaden runtime enforcement.

Current locked runtime behavior remains:

- Owner/admin may access administrator pages and administrator APIs.
- Jane Doe / read_only_admin may access regular non-admin application routes.
- Jane Doe / read_only_admin is blocked from administrator pages and administrator APIs.
- Enforcement scope remains admin-functions-only.
- No password viewing.
- No impersonation.

## UI Change

`/admin/permissions` now fetches:

- `/api/admin/permissions`
- `/api/admin/permissions/catalog`

The page displays:

- Static permission catalog.
- Catalog group.
- Permission key.
- Label.
- Risk level.
- Enforcement status.
- Route scopes.
- Function scopes.
- Description.
- Runtime enforcement changed flag.

## Enforcement

No new non-admin route is blocked in Phase 15D.

The UI is read-only and does not edit roles, users, password fields, overrides, or enforcement flags.
