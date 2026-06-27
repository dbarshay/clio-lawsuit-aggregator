# Admin Users Phase W10 - Guard Dry-Run Smoke Tests

Status: dry-run smoke only.

No route imports or calls the W9 guard.
No runtime enforcement is enabled.
No response blocking is implemented.
No UI hiding is enabled.
No database changes are made.
No session mode is changed.

Scenarios: 10
Passed: 10
Failed: 0

## Stable routes selected from W2

- Admin Users: app/admin/users/page.tsx
- Document Templates: app/admin/document-templates/page.tsx
- Non-admin payment: app/api/matters/apply-payment/route.ts
- Non-admin read-only: app/api/aggregation/expand-claim/route.ts
- Non-admin mutation/action: app/api/advanced-search/candidates/route.ts

## Scenario results

| Scenario | Actor | Route | Expected | Actual | Pass |
|---|---|---|---:|---:|---:|
| kill-switch-off-allows-basic-admin-route | basic-user | app/admin/users/page.tsx | true | true | true |
| owner-admin-users-allowed | owner | app/admin/users/page.tsx | true | true | true |
| administrator-selected-card-allowed | administrator-selected | app/admin/document-templates/page.tsx | true | true | true |
| administrator-unselected-card-blocked | administrator-selected | app/admin/users/page.tsx | false | false | true |
| full-user-admin-blocked | full-user | app/admin/users/page.tsx | false | false | true |
| full-user-non-admin-payment-allowed | full-user | app/api/matters/apply-payment/route.ts | true | true | true |
| basic-user-payment-blocked | basic-user | app/api/matters/apply-payment/route.ts | false | false | true |
| basic-user-non-payment-view-allowed | basic-user | app/api/aggregation/expand-claim/route.ts | true | true | true |
| view-only-read-allowed | view-only | app/api/aggregation/expand-claim/route.ts | true | true | true |
| view-only-mutation-blocked | view-only | app/api/advanced-search/candidates/route.ts | false | false | true |

## Next phase

Phase W11 should add a route-wiring candidate list and activation checklist. It should still not wire the guard into routes.
