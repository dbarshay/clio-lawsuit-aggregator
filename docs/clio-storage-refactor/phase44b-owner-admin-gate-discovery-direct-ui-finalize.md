# Phase 44B — Owner/Admin Gate Discovery for Direct UI Finalize

Phase 44B discovers and locks the existing owner/admin gating primitives before a live-capable direct UI finalize control is exposed.

This phase does not change app behavior. It does not enable live upload, does not start a server, does not call Clio, and does not upload anything.

Discovery contract:

- identify current admin/permission/session helpers available to `app/matters/page.tsx`;
- identify current UI flags around direct-matter single-master finalize controls;
- identify whether the direct UI finalize control can be safely gated by existing owner/admin checks;
- prove direct prerequisites remain required:
  - `selectedDocumentKey`;
  - `workingDocumentDriveItemId`;
  - `workingDocumentKey`;
- prove duplicate prevention remains required through `allowDuplicateUploads: false`;
- prove dry-run remains the only direct UI control currently wired;
- prove `confirmUpload: true` is not exposed by the current direct UI control;
- preserve lawsuit/master separation.
