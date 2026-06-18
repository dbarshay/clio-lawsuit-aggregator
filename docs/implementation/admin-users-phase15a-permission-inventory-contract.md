# Admin Users Phase 15A Permission Inventory Contract

Date: 2026-06-18

## Scope

Phase 15A is an inventory and contract phase only.

It defines the first named permission-key map for future page-level and function/API-level enforcement.

## Hard Safety Rule

Phase 15A must not change runtime enforcement.

Current locked runtime behavior remains:

- Owner/admin may access administrator pages and administrator APIs.
- Jane Doe / read_only_admin may access regular non-admin application routes.
- Jane Doe / read_only_admin is blocked from administrator pages and administrator APIs.
- Enforcement scope remains admin-functions-only.
- No password viewing.
- No impersonation.

## Current Enforcement Baseline

Already locked:

- `/admin` and `/admin/*` are administrator pages.
- `/api/admin` and `/api/admin/*` are administrator APIs.
- Signed non-owner identities are blocked from administrator functions.
- Owner identity remains allowed.
- Generic/legacy owner recovery remains available.
- Non-admin surfaces are not blocked by the Phase 14 proxy matcher.

## First Permission-Key Inventory

These keys are inventory names only in Phase 15A.

They are not yet enforced unless already covered by the locked admin-functions-only rule.

### Administrator

| Permission Key | Intended Scope | Phase 15A Enforcement |
|---|---|---|
| `admin.access` | Access administrator pages/APIs | Already enforced by Phase 14 admin-functions-only block |
| `admin.users.manage` | Create/update/lock/reset admin users | Not newly changed |
| `admin.permissions.manage` | Edit roles/permission overrides | Not newly changed |
| `admin.referenceData.manage` | Admin reference data management | Not newly changed |
| `admin.backups.manage` | Backup/restore controls | Not newly changed |
| `admin.audit.view` | Admin audit/readiness viewers | Not newly changed |

### Matters

| Permission Key | Intended Scope | Phase 15A Enforcement |
|---|---|---|
| `matters.view` | View matter lists and individual matter pages | Not enforced yet |
| `matters.edit` | Edit matter fields/status/metadata | Not enforced yet |
| `matters.close` | Close/reopen direct matters | Not enforced yet |
| `matters.payments.post` | Post direct matter payments | Not enforced yet |
| `matters.payments.void` | Void direct matter payments | Not enforced yet |

### Lawsuits

| Permission Key | Intended Scope | Phase 15A Enforcement |
|---|---|---|
| `lawsuits.view` | View lawsuit list and master lawsuit pages | Not enforced yet |
| `lawsuits.create` | Create/start lawsuits | Not enforced yet |
| `lawsuits.edit` | Edit lawsuit metadata/options | Not enforced yet |
| `lawsuits.close` | Close/reopen lawsuits | Not enforced yet |
| `lawsuits.payments.post` | Post lawsuit/master payments | Not enforced yet |
| `lawsuits.payments.void` | Void lawsuit/master receipts | Not enforced yet |

### Documents

| Permission Key | Intended Scope | Phase 15A Enforcement |
|---|---|---|
| `documents.view` | View document status/history/packets | Not enforced yet |
| `documents.generate` | Generate draft documents/previews | Not enforced yet |
| `documents.finalize` | Finalize documents | Not enforced yet |
| `documents.printQueue.manage` | Send/manage print queue actions | Not enforced yet |
| `documents.templates.manage` | Manage templates | Not newly changed; admin route remains covered by admin block |

### Settlements

| Permission Key | Intended Scope | Phase 15A Enforcement |
|---|---|---|
| `settlements.view` | View settlement values/history | Not enforced yet |
| `settlements.edit` | Create/update settlement records | Not enforced yet |
| `settlements.close` | Settlement close workflows | Not enforced yet |
| `settlements.void` | Void settlement records | Not enforced yet |

### Court Calendar

| Permission Key | Intended Scope | Phase 15A Enforcement |
|---|---|---|
| `courtCalendar.view` | View court calendar page/events | Not enforced yet |
| `courtCalendar.edit` | Import/update court calendar events | Not enforced yet |
| `courtCalendar.reports` | Generate court calendar reports | Not enforced yet |

### Print Queue

| Permission Key | Intended Scope | Phase 15A Enforcement |
|---|---|---|
| `printQueue.view` | View print queue | Not enforced yet |
| `printQueue.manage` | Print/finalize/manage queue actions | Not enforced yet |

### Claim Index / Search

| Permission Key | Intended Scope | Phase 15A Enforcement |
|---|---|---|
| `claimIndex.search` | Use matter/lawsuit/search APIs | Not enforced yet |
| `claimIndex.rebuild` | Rebuild/refresh claim index | Not enforced yet |

## Route Group Inventory

### Administrator route groups

- `/admin`
- `/admin/*`
- `/api/admin`
- `/api/admin/*`

### Non-admin page route groups

- `/`
- `/matters`
- `/matter/[id]`
- `/lawsuits`
- `/court-calendar`
- `/print-queue`
- `/login`
- `/change-password`

### Non-admin API route groups for later permission review

- `/api/matters/*`
- `/api/lawsuits/*`
- `/api/documents/*`
- `/api/settlements/*`
- `/api/court-calendar/*`
- `/api/claim-index/*`
- `/api/advanced-search/*`
- `/api/aggregation/*`
- `/api/reference-data/*`
- `/api/ticklers/*`

## Proposed Read-Only Admin Baseline For Later Phase

This is planning only.

For Jane Doe / read_only_admin, likely future baseline:

Allowed:

- `matters.view`
- `lawsuits.view`
- `documents.view`
- `settlements.view`
- `courtCalendar.view`
- `printQueue.view`
- `claimIndex.search`

Blocked:

- `admin.access`
- `admin.users.manage`
- `admin.permissions.manage`
- `matters.edit`
- `matters.close`
- `matters.payments.post`
- `matters.payments.void`
- `lawsuits.create`
- `lawsuits.edit`
- `lawsuits.close`
- `lawsuits.payments.post`
- `lawsuits.payments.void`
- `documents.generate`
- `documents.finalize`
- `documents.printQueue.manage`
- `settlements.edit`
- `settlements.close`
- `settlements.void`
- `courtCalendar.edit`
- `printQueue.manage`
- `claimIndex.rebuild`

## Phase 15A Completion Criteria

Phase 15A is complete only if:

- This inventory document exists.
- A verifier confirms the inventory markers.
- Existing Phase 13C/14A/14B safety verifiers still pass.
- Full build passes.
- Runtime behavior is not changed.
