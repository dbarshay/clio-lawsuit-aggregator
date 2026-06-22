# Phase 43I — Require Selected Document Fields for Direct UI Dry-Run Bridge

Phase 43I removes placeholder empty document fields from the guarded direct matter UI dry-run bridge.

The row bridge now accepts explicit selected document parameters and refuses to build a dry-run control unless there is a selected document key and saved working document identifiers.

Safety contract:

- the direct row bridge no longer hard-codes `documentKeys: []`;
- the direct row bridge no longer hard-codes `workingDocumentDriveItemId: ""`;
- the direct row bridge no longer hard-codes `workingDocumentKey: ""`;
- the bridge requires `selectedDocumentKey`;
- the bridge requires `workingDocumentDriveItemId`;
- the bridge requires `workingDocumentKey`;
- the bridge still forces `confirmUpload: false`;
- the bridge still forces `singleMasterDryRun: true`;
- the bridge still forces `singleMasterResolveFolders: true`;
- the control remains guarded off by default;
- no `masterLawsuitId` is introduced;
- no live upload is enabled;
- no document is uploaded.
