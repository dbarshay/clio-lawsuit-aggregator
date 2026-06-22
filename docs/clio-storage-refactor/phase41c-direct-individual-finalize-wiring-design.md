# Phase 41C — Direct/Individual Finalize Wiring Design Lock

## Purpose

Phase 41C is a design/readiness lock only. It does not rewire direct finalize upload behavior yet.

The direct/individual single-master storage target is now locked as:

```text
Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001
```

The verified live Clio folder IDs are:

```text
Individual Matters = 22062400790
BRL-202600001-BRL-202600999 = 22062400880
BRL_202600001 = 22062401000
```

## Non-negotiable ownership rule

Barsh Matters owns and assigns direct/individual file numbers. Clio must not assign or determine Barsh Matters file numbers.

Direct/individual matters must use Barsh Matters-owned file numbers in this format:

```text
BRL_YYYYNNNNN
```

Lawsuit/master lawsuit folders use lawsuit numbers:

```text
YYYY.MM.NNNNN
```

A direct/individual matter must not use lawsuit-format numbering unless and until it is actually aggregated into a lawsuit, and existing direct matter documents must not be moved automatically when aggregation occurs.

## Intended direct finalize mapping

When direct/individual finalization is later wired, the target input must be built from the Barsh Matters direct matter file number:

```ts
{
  storageTargetKind: "individual_matter",
  directMatterFileNumber: "BRL_YYYYNNNNN",
  bmMatterId: "BRL_YYYYNNNNN",
  displayNumber: "BRL_YYYYNNNNN"
}
```

The route must not derive the direct folder from patient name, provider name, insurer name, claim number, denial reason, Clio-assigned display number, Clio matter id, or lawsuit id unless the finalization is for a lawsuit/master flow.

## Required guard sequence before direct live upload

Before direct/individual live upload is enabled, use the same staged sequence as lawsuit finalized upload:

1. Disabled guard smoke: confirm actual direct upload is blocked when upload/folder/live flags are disabled.
2. Armed no-working-doc smoke: confirm armed direct upload path stops before upload if no saved working DOCX exists.
3. Live direct finalized PDF upload smoke: create/confirm working DOCX, convert through Graph PDF, upload exactly one PDF to the resolved direct/individual folder, and create DB audit record.
4. Read-only Clio/DB audit: verify uploaded PDF is under the exact final folder and DB finalization record references it.
5. Production no-upload smoke: verify production preview resolves the direct/individual target with no upload and no DB mutation.

## Required safety properties

Direct/individual finalize wiring must preserve:

- Clio is storage only.
- Barsh Matters owns file and lawsuit numbers.
- No patient/provider/insurer/claim/denial facts in Clio folder names.
- Existing direct matter documents are not automatically moved when the matter is later aggregated into a lawsuit.
- Lawsuit finalize flow remains unchanged.
- Legacy/non-single-master behavior remains compatible unless explicitly opted into single-master storage.
- Upload rewire requires explicit confirmation and the live upload flags.
- Duplicate detection for rewired direct uploads must check documents under the resolved folder, not the old matter-root document list.

## Current Phase 41C scope

Phase 41C only locks this design and verifies current code/readiness anchors.

It must not upload documents, create Clio folders, delete Clio folders, mutate the database, enable direct upload rewire, or change production environment flags.
