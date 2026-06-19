# Clio Storage Refactor Phase 9 Preview-Only Upload Target API

## Purpose

Phase 9 exposes the Phase 8 single-master upload-target preview through a GET-only API route.

## Route

`GET /api/documents/clio-single-master-upload-target-preview`

Accepted query parameters include:

- `bmMatterId`
- `matterId`
- `directMatterId`
- `displayNumber`
- `directMatterDisplayNumber`
- `lawsuitId`
- `masterLawsuitId`
- `label`

## Safety boundary

- This route is preview-only.
- Existing upload/list/open/finalize routes are not rewired.
- No Clio API calls are made.
- No Clio folders are created.
- No Clio documents are uploaded, moved, or deleted.
- No database rows are written or migrated.
- Existing BM matters remain test data and are not preserved or migrated.

## Acceptance criteria

- The preview endpoint exists.
- The endpoint uses the Phase 8 upload-target preview helper.
- The endpoint is GET-only.
- The endpoint explicitly reports no route rewiring, no Clio calls, no folder creation, no document uploads, and no database mutation.
- Phase 2 through Phase 9 verifiers pass.
