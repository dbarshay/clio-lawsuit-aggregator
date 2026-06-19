# Clio Storage Refactor Phase 5 Folder-Resolution No-Create Preview

## Purpose

Phase 5 adds the non-operational folder-resolution contract for the single-master Clio storage architecture.

This phase defines what a future resolver must do, but it does not call Clio, create folders, upload documents, migrate data, or rewire document routes.

## Resolution sequence

The future operational resolver must:

1. Verify the configured master matter.
2. Find or create the computed bucket folder.
3. Find or create the computed matter folder under that bucket.
4. Return the matter folder as the document upload target.

## Current Phase 5 behavior

`lib/clioStorageFolderResolution.ts` exposes `buildClioStorageFolderResolutionPreview()`.

It returns:

- `mode: preview_only`
- `createsFolders: false`
- `callsClio: false`
- `uploadsDocuments: false`
- `mutatesDatabase: false`
- the Phase 4 target plan
- the planned future action sequence

## Safety boundary

- No Clio API calls are made.
- No Clio folders are created.
- No Clio documents are uploaded or moved.
- Existing upload/list/open routes are not rewired.
- No database migrations are added.
- Existing BM matters remain test data and are not preserved or migrated.

## Acceptance criteria

- `lib/clioStorageFolderResolution.ts` exists.
- The preview uses the Phase 4 storage target planner.
- The preview identifies all future folder-resolution actions.
- The preview explicitly reports no Clio calls, no folder creation, no uploads, and no database mutation.
- Phase 2, Phase 3, Phase 4, and Phase 5 verifiers pass.
