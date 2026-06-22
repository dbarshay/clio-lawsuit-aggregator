# Phase 45B Finalized Storage Identity Filenames

Date: Mon Jun 22 15:03:33 EDT 2026

## Scope

- Finalized Clio PDF filenames now use the Barsh Matters-owned storage identity as the first filename token.
- Direct/individual matters use `BRL_YYYYNNNNN`.
- Lawsuit/master matters use `YYYY.MM.NNNNN`.
- Legacy leading filename tokens such as `BRL30236`, `BRL_YYYYNNNNN`, or lawsuit ids are stripped from the document body before the storage identity is prepended.

## Intentional regeneration

- Duplicate prevention remains exact-filename based by default.
- If no generation label is supplied, or the generation label is `Original`, no generation suffix is added.
- If a non-original generation label is supplied through `documentGenerationLabel`, `generationLabel`, or `generationType`, the finalized PDF filename receives a deterministic generation suffix: `- <label> - Generated <timestamp>`.
- This allows intended second generations such as Revised, Corrected, Supplemental, or Amended without disabling duplicate prevention.

## Safety

- No production env variables were changed.
- No deployment was performed.
- No Clio upload was performed.
- The existing exact-filename duplicate prevention path remains intact.
- The direct live finalize kill switch and admin gate verifiers passed.
