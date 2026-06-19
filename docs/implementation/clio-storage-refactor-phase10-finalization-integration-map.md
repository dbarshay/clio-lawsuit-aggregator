# Clio Storage Refactor Phase 10 Document Finalization Integration Map

## Purpose

Phase 10 locks the non-operational integration map for future single-master document finalization.

This phase does not rewire finalization, create folders, upload documents, call Clio, or mutate the database.

## Current protected routes

- `app/api/documents/finalize/route.ts` remains on the existing upload behavior.
- `app/api/documents/finalize-preview/route.ts` remains on the existing preview behavior.
- `app/api/documents/direct-finalize-preview/route.ts` remains on the existing direct-matter preview behavior.
- `app/api/documents/clio-single-master-upload-target-preview/route.ts` is the only Phase 9 preview-only API surface.

## Future integration sequence

A later operational phase must proceed in this order:

1. Add guarded folder lookup/create primitives.
2. Add dry-run folder resolver tests.
3. Add create-folder feature flag.
4. Resolve bucket folder and matter folder under the master matter.
5. Rewire document finalization to use the resolved matter folder as the Clio upload target.
6. Preserve duplicate-prevention and finalization audit behavior.
7. Keep templates in Barsh Matters only.

## Safety boundary

- No existing document finalization route is rewired in Phase 10.
- No Clio data API write request is added.
- No Clio folder is created.
- No document is uploaded, moved, or deleted.
- No database migration is added.
- Existing BM matters remain test data and are not preserved or migrated.

## Acceptance criteria

- This integration map exists.
- The Phase 9 preview API remains present.
- `finalize/route.ts` is not rewired to the single-master preview/helper.
- `finalize-preview/route.ts` is not rewired to the single-master preview/helper.
- `direct-finalize-preview/route.ts` is not rewired to the single-master preview/helper.
- Phase 8, Phase 9, and Phase 10 verifiers pass.
