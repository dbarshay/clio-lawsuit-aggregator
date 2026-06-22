# Phase 43F — Guarded Direct Matter UI Surface Attachment

Phase 43F attaches the explicit direct matter dry-run control helper to the direct matter document UI surface, guarded off by default.

This is still not live upload enablement. The rendered control remains hidden because `directMatterSingleMasterDryRunControlEnabled = false`.

Safety contract:

- the attachment uses `renderDirectMatterSingleMasterDryRunControlForRow`;
- the row bridge passes `directMatterId` from the direct matter row;
- the row bridge passes `directMatterDisplayNumber` from the direct matter row;
- the row bridge sets `confirmUpload: false`;
- the row bridge sets `singleMasterDryRun: true`;
- the row bridge sets `singleMasterResolveFolders: true`;
- the control remains disabled by default;
- the attachment does not include `masterLawsuitId`;
- no live upload is enabled;
- no document is uploaded.
