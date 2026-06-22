# Phase 41I — Direct/Individual Finalize Route Dry-Run No-Upload Lock

## Purpose

Phase 41I locks an actual local route dry-run smoke for `/api/documents/finalize` after the guarded direct/individual target-input branch was inspected in Phase 41H.

This phase does not perform a live upload. It does not create Clio folders, delete Clio folders, mutate the database, call Microsoft Graph PDF conversion, or change production environment variables.

## Assertions

The route smoke proves:

1. With `CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED` disabled, a direct/individual single-master dry-run is blocked before any upload.
2. With `CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED=1`, the route can produce the direct/individual target input in dry-run mode only.
3. The dry-run response preserves `uploadRewired: false`, `databaseMutation: false`, and `noUploadPerformed: true`.
4. The dry-run response returns `storageTargetKind: "individual_matter"`, `directMatterFileNumber`, `bmMatterId`, and `displayNumber` all based on the Barsh Matters direct matter file number.
5. `singleMasterResolveFolders` remains `false`, so the dry-run uses `preview-only-no-clio-call` and does not call Clio folder resolution.

## Direct test target

The smoke uses the locked direct/individual test file number:

```text
BRL_202600001
```

It also uses the known master lawsuit id only as a stable preview context for the existing preview route. The direct/individual folder identity is not derived from the lawsuit id.

## Safety

Phase 41I is still no-upload/no-write. Actual live direct upload remains blocked unless all later live upload controls are explicitly enabled and separately smoked.

This is not a live upload.
