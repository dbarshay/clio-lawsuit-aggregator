# Clio Storage Refactor Phase 33 — Finalization Rewire Design Lock

## Scope

Phase 33 is a design/contract lock only.

It does not:
- upload documents,
- create Clio folders,
- mutate the database,
- rewire `/api/documents/finalize`,
- change finalize preview routes,
- stage env/secrets.

## Current locked state

Production no-write preview route is live:

- route: `/api/documents/clio-finalization-target-preview`
- production smoke: passed in Phase 32
- sample mapped path: `2026-05 Matters/2026.05.00001`
- production fallback may report `configFallbackUsed: true` when live single-master storage env is disabled
- response must remain no-write:
  - `previewOnly: true`
  - `uploadRewired: false`
  - `databaseMutation: false`
  - `clioWrite: false`
  - `finalizeRewired: false`
  - `currentRequestAllowsWrite: false`

## Future finalization rewire path

When finalization is later rewired, the intended pipeline is:

1. `/api/documents/finalize` receives the existing finalization request.
2. Finalization derives a `ClioStorageTargetInput` from the finalized matter/lawsuit context.
3. Folder naming must use only privacy-safe fields:
   - `displayNumber`
   - `bmMatterId`
   - `lawsuitId`
4. Folder naming must not use:
   - patient name,
   - provider name,
   - insurer name,
   - claim number,
   - claim details,
   - denial reason,
   - document contents.
5. Planner computes:
   - bucket folder: `YYYY-MM Matters`
   - matter folder: `YYYY.MM.NNNNN`
   - path: `YYYY-MM Matters/YYYY.MM.NNNNN`
6. Before any live folder resolution, future finalization must satisfy all live-write guards:
   - `CLIO_SINGLE_MASTER_LIVE_WRITE_COMMAND=RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE`
   - `CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED=1`
   - `CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED=1`
7. Folder resolution must use the guarded resolver path:
   - `resolveClioMatterFolderWithGuard`
   - `createClioFolderWithGuard`
8. Folder creation must remain idempotent:
   - existing folders must be reused,
   - duplicate folder creation must not occur when the expected bucket/matter folders already exist.
9. Document upload may only occur after target folder resolution succeeds.
10. Finalization database writes may only occur after upload/finalization status is known and must preserve existing finalization audit fields.

## Required future implementation guardrails

A future implementation phase must prove, before live upload:

- `/api/documents/finalize` imports and calls the target planner/resolver intentionally.
- No live smoke folder constants or IDs are hard-coded into finalization.
- The route does not derive Clio folder names from patient/provider/insurer/claim details.
- The write guards are enforced before any Clio folder creation.
- Upload still has a disabled/dry-run path until a separate live upload smoke phase is approved.
- Existing Phase 27/32 no-write preview behavior remains intact.
- A production build passes.

## Current live Clio folders from prior smoke

Under master matter `Barsh Matters Master Repository` / `1885821245`:

- bucket folder `2026-05 Matters` id `22059999515`
- matter folder `2026.05.00001` id `22059999545`

These IDs are proof artifacts only. They must not be hard-coded into finalization logic.
