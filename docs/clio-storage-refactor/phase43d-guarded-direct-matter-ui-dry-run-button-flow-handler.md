# Phase 43D — Guarded Direct Matter UI Dry-Run Button-Flow Handler

Phase 43D adds a guarded UI-originated direct matter finalize dry-run handler to `app/matters/page.tsx`.

This is not a live upload button enablement. The handler is a safe bridge between the UI payload builders and `/api/documents/finalize`, but it only uses the dry-run helper from Phase 43C.

Safety contract:

- the handler uses `buildDirectMatterSingleMasterFinalizeDryRunPayload`;
- the resulting payload has `confirmUpload: false`;
- the resulting payload has `singleMasterDryRun: true`;
- the resulting payload has `singleMasterResolveFolders: true`;
- the resulting payload has `allowDuplicateUploads: false`;
- the handler posts to `/api/documents/finalize`;
- the handler does not create a working DOCX;
- the handler does not call any live upload helper directly;
- the handler does not include `masterLawsuitId`;
- the handler does not attach to broad production live upload behavior.

The next phase can attach this handler to an explicit direct matter UI control/smoke and verify the UI-originated route shape end-to-end in no-upload mode.
