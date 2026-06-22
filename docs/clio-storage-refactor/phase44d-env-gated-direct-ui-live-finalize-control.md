# Phase 44D — Env-Gated Direct UI Live Finalize Control

Phase 44D exposes a live-capable direct-matter finalize UI control, but keeps it default-off behind an explicit public environment flag.

This phase does not run a live upload smoke and does not upload any document.

Control contract:

- the live-capable direct UI control is hidden unless `NEXT_PUBLIC_BARSH_DIRECT_MATTER_CLIO_LIVE_FINALIZE_ENABLED=1`;
- the control sends `uploadTargetMode: "direct-matter"`;
- the control sends `confirmUpload: true`;
- the control sends `singleMasterDryRun: false`;
- the control sends `singleMasterResolveFolders: true`;
- the control sends `allowDuplicateUploads: false`;
- the control requires:
  - `selectedDocumentKey`;
  - `workingDocumentDriveItemId`;
  - `workingDocumentKey`;
- the control does not include `masterLawsuitId`;
- server-side Phase 44C admin authorization remains required for direct live finalize;
- lawsuit/master finalize remains separate;
- no live smoke/upload is run in this phase.
