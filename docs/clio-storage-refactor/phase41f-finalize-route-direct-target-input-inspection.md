# Phase 41F — Finalize Route Direct Target-Input Inspection Lock

## Purpose

Phase 41F is a read-only inspection lock for the actual `/api/documents/finalize` route before direct/individual target-input wiring.

It records the current code state and proves that direct/individual finalized upload remains blocked because the route still throws when `uploadTargetMode === "direct-matter"`.

## Current route finding

The current `buildSingleMasterFinalizeTargetInput()` function detects:

```ts
const isDirectMatter = params.uploadTargetMode === "direct-matter";
```

and then blocks direct/individual single-master upload with an error before a direct target input can be returned.

The route already imports and uses the single-master folder resolution primitives for the lawsuit path, and the shared planner already supports:

```text
Individual Matters
individual_matter
direct_matter
directMatterFileNumber
BRL_YYYYNNNNN
```

## Wiring implication

The next implementation phase must replace the direct-matter throw with a Barsh Matters-owned direct target input, not a Clio-derived number:

```ts
{
  storageTargetKind: "individual_matter",
  directMatterFileNumber: "BRL_YYYYNNNNN",
  bmMatterId: "BRL_YYYYNNNNN",
  displayNumber: "BRL_YYYYNNNNN"
}
```

That later phase must not use patient, provider, insurer, claim number, denial reason, Clio display number, Clio matter id, or lawsuit id to derive an individual/direct folder.

## Safety scope

Phase 41F does not upload documents, create Clio folders, delete Clio folders, mutate the database, call Clio, call Microsoft Graph, start a local server, or change production environment variables.

Phase 41F does not enable direct/individual upload. It only locks the inspected pre-wiring state.
