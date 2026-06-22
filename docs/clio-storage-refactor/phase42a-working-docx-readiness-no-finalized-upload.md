# Phase 42A — Macro Working-DOCX Readiness No Finalized Upload

Phase 42A starts the macro-step track. It creates or confirms the saved working DOCX prerequisite for a direct/individual matter while still avoiding finalized PDF upload.

The local smoke uses existing direct matter id `1881278195` as the real local ClaimIndex row and preserves `BRL_202600001` as the Barsh Matters single-master direct storage target.

This phase may call the app working-DOCX route and Microsoft Graph to create a Word working document. It must not call `/api/documents/finalize` for a finalized upload, must not convert to final PDF, must not upload a finalized PDF to Clio, must not create Clio folders, must not delete Clio folders, and must not change production environment variables.

The output must capture a `workingDocument.driveItemId` but redact it from logs. That drive item is the prerequisite for the next macro phase.

Phase 42A-R repair adds direct-matter working-DOCX support for single-master direct storage by preserving the explicit `BRL_202600001` storage target and requiring `confirmCreate: true` for the working-DOCX creation route.
