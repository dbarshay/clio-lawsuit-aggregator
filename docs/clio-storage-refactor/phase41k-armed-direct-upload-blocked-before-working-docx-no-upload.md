# Phase 41K — Armed Direct/Individual Upload Blocked Before Working-DOCX/Graph No-Upload Route Smoke

Phase 41K locks an actual local route smoke for the armed direct/individual finalize upload path while all upload/folder/live-write flags remain disabled.

The request uses `confirmUpload: true`, `useSingleMasterClioStorage: true`, `singleMasterDryRun: false`, `singleMasterResolveFolders: true`, `uploadTargetMode: direct-matter`, and `directMatterDisplayNumber: BRL_202600001`.

The local environment enables only target-input construction with `CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED=1` and single-master storage configuration. It intentionally keeps live write controls disabled: `CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED=0`, `CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED=0`, and `CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED=0`.

Expected response: the route returns a blocked response before working-DOCX conversion, Microsoft Graph PDF conversion, Clio document upload, folder creation, or DocumentFinalization DB mutation. The response must preserve `uploadRewired: false`, `noUploadPerformed: true`, and the Barsh Matters-owned direct target input: `storageTargetKind: individual_matter`, `directMatterFileNumber: BRL_202600001`, `bmMatterId: BRL_202600001`, and `displayNumber: BRL_202600001`.

This is not a live upload. This phase must not upload documents, create Clio folders, delete Clio folders, mutate the database, call Microsoft Graph conversion, or change production environment variables.\n\nThis Phase 41K lock is before working-DOCX/Graph.\n\n\nThis Phase 41K lock is no-upload.\n