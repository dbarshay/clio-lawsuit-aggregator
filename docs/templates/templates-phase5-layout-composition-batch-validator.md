# Templates Phase 5 — Layout Composition Batch Validator

## Status

Implementation lock for a pure batch validator over template layout-composition metadata.

This phase is intentionally isolated. It is not wired into production generation, document assembly, UI flows, DOCX handling, PDF conversion, upload, or external document-storage interaction.

## Scope

Phase 5 adds a batch wrapper around the Phase 4 pure validator.

The batch validator accepts:

- a template metadata collection;
- a layout asset registry snapshot;
- allowed composition rules;
- merge-field definitions;
- optional exempt template kinds; and
- optional validation mode.

It returns:

- `ok`;
- summary counts;
- per-template validation results;
- flattened errors; and
- flattened warnings.

## Source file

The pure batch validator lives at:

`src/lib/templates/layout-composition-batch-validator.mjs`

It exports:

- `validateTemplateLayoutCompositionBatch`

## Fixture file

The behavior fixture lives at:

`test/fixtures/templates/layout-composition-batch-validator-fixtures.json`

The fixture covers:

- one valid three-asset composition;
- one rejected obsolete `simpleCoverPage` alias;
- one missing pleading dependency;
- expected summary counts;
- expected error codes; and
- expected warning codes.

## Verifier

The focused verifier lives at:

`scripts/verify-templates-phase5-layout-composition-batch-validator.mjs`

It checks static guardrails and executable fixture behavior.

## Guardrails

This phase does not:

- import the batch validator into runtime document generation;
- alter template selection UI;
- alter document-generation dialogs;
- inspect or mutate DOCX files;
- produce PDFs;
- upload files;
- call external document-storage services;
- change existing production routes.

A later wiring phase may use the batch validator only after the batch behavior is independently locked.
