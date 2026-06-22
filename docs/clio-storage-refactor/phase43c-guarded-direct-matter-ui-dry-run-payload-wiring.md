# Phase 43C — Guarded Direct Matter UI Dry-Run Payload Wiring

Phase 43C wires the direct matter UI payload foundation into a dedicated dry-run/no-upload payload builder.

This phase does not attach the helper to a live upload button and does not upload anything. It creates a UI-originated payload shape that can be used by the next direct matter document button integration smoke.

The dry-run payload must always send:

- `uploadTargetMode: "direct-matter"`;
- `directMatterId`;
- `directMatterDisplayNumber`;
- `useSingleMasterClioStorage: true`;
- `confirmUpload: false`;
- `singleMasterDryRun: true`;
- `singleMasterResolveFolders: true`;
- `allowDuplicateUploads: false`;
- `workingDocumentDriveItemId`;
- `workingDocumentKey`.

Safety contract:

- no finalized PDF upload is enabled;
- no `confirmUpload: true` direct UI path is introduced;
- no `masterLawsuitId` is introduced into the direct helper block;
- duplicate prevention remains on by default;
- the next phase may connect this dry-run helper to the actual direct matter button flow and smoke it without upload.
