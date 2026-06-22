# Phase 43A — Direct Matter UI Finalize Integration Inspection and Plan

Phase 43A starts the post-proof product integration work after Phase 42A–42D proved the direct/individual single-master storage path.

This phase is inspection/planning only. It does not create a working DOCX, does not call finalize with `confirmUpload: true`, does not upload to Clio, does not create/delete Clio folders, and does not mutate production environment variables.

Scope inspected:

- direct matter UI document actions;
- working DOCX creation/opening path;
- finalize button payload shape;
- direct-vs-master route branching;
- duplicate prevention location;
- success/destination language;
- feature-flag/guard requirements for production enablement.

Phase 43A locked plan:

1. Direct matter UI finalize must use the proven direct single-master route shape:
   - `uploadTargetMode: "direct-matter"`;
   - `directMatterId`;
   - Barsh Matters direct file number as the single-master storage target;
   - `useSingleMasterClioStorage: true`;
   - saved `workingDocumentDriveItemId`;
   - `workingDocumentKey`.

2. Direct individual storage must not depend on `masterLawsuitId` unless the workflow is actually a lawsuit/master finalize flow.

3. Duplicate prevention must check the resolved single-master folder, not the old direct Clio matter Documents tab.

4. UI success language must identify the destination as the single-master folder path:
   `Individual Matters / BRL-YYYY00001-BRL-YYYY00999 / BRL_YYYYNNNNN`.

5. Production enablement should remain guarded:
   - owner/admin first;
   - direct matters only;
   - duplicate prevention on by default;
   - no automatic movement of existing direct documents when later aggregated into a lawsuit.

## Current UI gap found

The current `app/matters/page.tsx` document finalize UI is still master/lawsuit-oriented. It contains the working document and finalize anchors, but it does not yet send `directMatterId` or `directMatterDisplayNumber` from the UI finalize payload. That gap is the intended target for the next implementation phase.

The current UI also does not yet send `directMatterDisplayNumber` from the direct finalize payload.
