# Phase 41H — Guarded Direct Finalize Branch Inspection Lock

## Purpose

Phase 41H locks a read-only inspection of the guarded direct/individual finalize branch after Phase 41G.

This phase does not upload documents, create Clio folders, delete Clio folders, mutate the database, start a local server, call Clio, call Microsoft Graph, or change production environment variables.

## Inspected current state

The direct/individual branch in `app/api/documents/finalize/route.ts` is now present inside `buildSingleMasterFinalizeTargetInput` and is default-off unless:

```text
CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED=1
```

The branch builds only Barsh Matters-owned direct/individual target input:

```ts
{
  storageTargetKind: "individual_matter",
  directMatterFileNumber,
  bmMatterId: directMatterFileNumber,
  displayNumber: directMatterFileNumber,
}
```

It rejects non-`BRL_YYYYNNNNN` direct numbers through the `BRL_\\d{9}` guard.

## Guarded behavior

Direct/individual target-input construction is only the first gate. It still does not enable upload by itself.

Actual upload remains blocked unless the later upload path also satisfies the existing single-master upload/folder/live controls:

```text
CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED=1
CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED=1
CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED=1
```

Dry-run mode can return a no-upload target/folder-resolution preview. That response must preserve:

```text
uploadRewired: false
databaseMutation: false
noUploadPerformed: true
```

## Safety requirements preserved

- Clio is storage only.
- Barsh Matters owns and assigns direct file numbers and lawsuit numbers.
- Direct/individual file numbers use `BRL_YYYYNNNNN`.
- Lawsuit/master numbers use `YYYY.MM.NNNNN`.
- Direct/individual folder names must not derive from patient, provider, insurer, claim number, denial reason, Clio display number, or Clio matter id.
- Existing direct matter documents must not be automatically moved when later aggregated into a lawsuit.
- The finalize route must not hard-code the live direct audit folder IDs `22062400790`, `22062400880`, or `22062401000`.
- Duplicate detection for rewired direct uploads must check `listClioFolderDocuments` under the resolved final folder, not the old matter-root list.

## Next phase guidance

The next safe phase is a no-upload direct finalize dry-run smoke against the route, not a live upload. It should prove default-off failure and enabled dry-run target-input behavior without folder creation, document upload, or DB mutation.
