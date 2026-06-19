# Phase 34D — Clio Single-Master Folder Taxonomy Contract

Phase 34D locks the Barsh Matters-owned folder taxonomy for Clio single-master storage before planner/resolver/upload enablement.

## Core rule

Clio is storage only. Barsh Matters owns and assigns all file numbers, lawsuit numbers, display numbers, workflow identifiers, folder identifiers, and numbering conventions. Clio must not assign, control, derive, or become the source of truth for any Barsh Matters number.

## Top-level folders under `Barsh Matters Master Repository`

```text
Barsh Matters Master Repository/
├── Lawsuits/
└── Individual Matters/
```

## Lawsuit folder taxonomy

Lawsuit/master folders use the Barsh Matters lawsuit number convention.

```text
Lawsuits/YYYY-MM/YYYY.MM.NNNNN
```

Example:

```text
Lawsuits/2026-05/2026.05.00001
```

Rules:

- `YYYY.MM.NNNNN` is a lawsuit/master lawsuit number only.
- `YYYY-MM` is the lawsuit month bucket derived from the Barsh Matters lawsuit number.
- Lawsuit folders must not use Clio display numbers such as `BRL30148`.
- Lawsuit folders must not include patient, provider, insurer, claim number, denial reason, court, attorney, or other private matter facts.

## Individual/direct matter folder taxonomy

Individual/direct matters before aggregation use a separate Barsh Matters-owned file number convention.

```text
Individual Matters/BRL-YYYY00001-BRL-YYYY00999/BRL_YYYYNNNNN
```

Example:

```text
Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001
```

Rules:

- `BRL_YYYYNNNNN` is the Barsh Matters individual/direct matter file number.
- The range folder uses hyphens and no underscore: `BRL-YYYY00001-BRL-YYYY00999`.
- The matter folder uses underscore after `BRL`: `BRL_YYYYNNNNN`.
- Individual/direct matter folders must not use lawsuit-format `YYYY.MM.NNNNN`.
- Individual/direct matter folders must not use Clio-assigned numbers as folder authority.
- Individual/direct matter folders must not include patient, provider, insurer, claim number, denial reason, court, attorney, or other private matter facts.

## Aggregation rule

When individual matters are aggregated into a lawsuit, existing individual matter documents should not be moved automatically merely because of aggregation. New lawsuit-generated documents belong under the lawsuit folder. Barsh Matters should preserve relationships between individual matter folders and lawsuit folders in its own database/workflow state.

## Future implementation path

1. Update planner output to support typed, multi-segment paths.
2. Update resolver to create/reuse each required folder segment idempotently.
3. Preserve Phase 34C master-lawsuit dry-run proof with new path `Lawsuits/2026-05/2026.05.00001`.
4. Add direct-matter dry-run only after Barsh Matters can provide or derive `BRL_YYYYNNNNN`.
5. Enable upload only after folder resolution and upload-target behavior are separately verified.

## Locked examples

```text
Barsh Matters Master Repository/Lawsuits/2026-05/2026.05.00001
Barsh Matters Master Repository/Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001
```

## Non-goals

Phase 34D does not upload documents, create Clio folders, mutate the database, enable direct matter finalization, or enable live upload.
