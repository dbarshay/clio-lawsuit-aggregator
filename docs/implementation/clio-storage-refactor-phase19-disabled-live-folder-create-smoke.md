# Clio Storage Refactor Phase 19 Disabled Live Folder-Create Smoke Harness

## Purpose

Phase 19 adds a disabled-by-default live folder-create smoke harness.

## Safety boundary

- The harness does not call Clio unless the Phase 18 readiness gate passes.
- The default command path exits before any Clio call.
- This phase does not create folders.
- This phase does not upload documents.
- This phase does not mutate the database.
- This phase does not rewire finalization.

## Required future live-write conditions

- `CLIO_SINGLE_MASTER_LIVE_WRITE_COMMAND=RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE`
- `CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED=1`
- `CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED=1`

## Acceptance criteria

- The disabled smoke harness exists.
- The default harness run is blocked before any Clio call.
- Finalization remains unrevised.
- No env/secrets are staged.
