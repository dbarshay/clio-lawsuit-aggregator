# Phase 41D — Direct/Individual Finalize Disabled-Guard Smoke Lock

## Purpose

Phase 41D is a no-upload disabled-guard lock for the future direct/individual finalize upload path.

It proves that direct/individual finalized-document upload is still blocked unless the route is explicitly wired later and the required upload/folder/live-write controls are intentionally enabled.

## Scope

Phase 41D does not upload documents, create Clio folders, delete Clio folders, mutate the database, start a local server, call Clio, call Microsoft Graph, or change production environment variables.

## Current locked direct target input

When direct/individual finalization is later wired, the intended target input remains:

```ts
{
  storageTargetKind: "individual_matter",
  directMatterFileNumber: "BRL_YYYYNNNNN",
  bmMatterId: "BRL_YYYYNNNNN",
  displayNumber: "BRL_YYYYNNNNN"
}
```

The known live direct/individual folder branch remains:

```text
Individual Matters = 22062400790
BRL-202600001-BRL-202600999 = 22062400880
BRL_202600001 = 22062401000
```

These IDs are audit anchors only. The finalize route must not hard-code them.

## Disabled-guard result

At this lock point, direct/individual actual upload remains disabled because the existing `/api/documents/finalize` route is not yet wired to a direct/individual target-input branch.

The route may continue to support the already-locked lawsuit/master finalized upload flow. Phase 41D must not disturb that lawsuit path.

## Safety requirements

Direct/individual finalize upload must remain blocked unless all future direct wiring and live controls are explicit.

The disabled direct path must preserve:

- Clio is storage only.
- Barsh Matters owns and assigns file numbers and lawsuit numbers.
- Direct/individual file numbers use `BRL_YYYYNNNNN`.
- Lawsuit/master numbers use `YYYY.MM.NNNNN`.
- No patient/provider/insurer/claim/denial facts in Clio folder names.
- No automatic movement of existing direct matter documents when later aggregated into a lawsuit.
- No hard-coded direct live folder IDs in the finalize route.
- Duplicate detection for any future rewired direct upload must check documents under the resolved final folder, not the old matter-root document list.
