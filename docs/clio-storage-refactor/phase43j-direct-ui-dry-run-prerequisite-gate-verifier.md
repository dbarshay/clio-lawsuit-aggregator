# Phase 43J — Direct UI Dry-Run Prerequisite Gate Verifier

Phase 43J locks a static safety verifier proving the guarded direct matter UI dry-run control cannot render unless all selected-document and saved-working-DOCX prerequisites are present.

No app behavior is changed in this phase.

Safety contract:

- the direct row bridge requires `selectedDocumentKey`;
- the direct row bridge requires `workingDocumentDriveItemId`;
- the direct row bridge requires `workingDocumentKey`;
- the bridge returns `null` unless all three values are present;
- the attachment passes selected document state from `masterSelectedDocumentTemplateKey`;
- the attachment passes working document state from `masterDocumentFinalizationResult`;
- the control remains guarded off by default;
- `confirmUpload: false` remains enforced;
- `singleMasterDryRun: true` remains enforced;
- `singleMasterResolveFolders: true` remains enforced;
- no `masterLawsuitId` is introduced;
- no live upload is enabled;
- no document is uploaded.
