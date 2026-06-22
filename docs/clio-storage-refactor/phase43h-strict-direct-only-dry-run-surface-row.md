# Phase 43H — Strict Direct-Only Dry-Run Surface Row

Phase 43H removes the temporary fallback from the guarded direct matter dry-run surface row resolver.

The resolver now returns only the first non-master direct matter row, or `null` if no direct row is available. It no longer falls back to a master/lawsuit row.

Safety contract:

- `directMatterSingleMasterDryRunSurfaceRow()` returns `directRows[0] || null`;
- master/lawsuit rows are excluded with `!row.isMaster` and `!row.is_master`;
- no `rows[0]` fallback remains in the resolver;
- the dry-run control remains guarded off by default;
- `confirmUpload: false` remains enforced;
- `singleMasterDryRun: true` remains enforced;
- `singleMasterResolveFolders: true` remains enforced;
- no `masterLawsuitId` is introduced;
- no live upload is enabled;
- no document is uploaded.
