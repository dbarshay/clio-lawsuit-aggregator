# Phase 43L — Local Route-Level Direct UI Dry-Run Smoke

Phase 43L adds a controlled local route-level smoke for the direct UI dry-run finalize payload.

This phase posts a representative direct-matter UI payload to local `/api/documents/finalize` with upload disabled. It is intended to prove the route can accept the UI-originated direct payload shape while preserving the no-upload contract.

Safety contract:

- local server only;
- no browser automation;
- `confirmUpload: false`;
- `singleMasterDryRun: true`;
- `singleMasterResolveFolders: true`;
- `allowDuplicateUploads: false`;
- representative direct matter payload uses `uploadTargetMode: "direct-matter"`;
- representative direct matter payload uses `directMatterId`;
- representative direct matter payload uses `directMatterDisplayNumber`;
- representative direct matter payload uses selected document and working document fields;
- route response must not report a performed upload;
- route response must not report a database mutation;
- no live upload is enabled;
- no document is uploaded.
