# Templates Phase 6 — Layout Composition Validation Report Builder

## Status

Implementation lock for a pure validation report builder over the Phase 5 batch validator.

This phase is intentionally isolated. It is not wired into production generation, document assembly, UI flows, DOCX handling, PDF conversion, upload, or external document-storage interaction.

## Scope

Phase 6 adds a deterministic report builder that converts batch validation results into an admin-readable summary.

The report builder returns:

- overall pass/fail status;
- summary counts;
- error counts grouped by code;
- warning counts grouped by code;
- invalid template summaries;
- warning template summaries;
- sorted flattened errors;
- sorted flattened warnings; and
- a deterministic Markdown report string.

## Source file

The pure report builder lives at:

`src/lib/templates/layout-composition-validation-report.mjs`

It exports:

- `buildTemplateLayoutCompositionValidationReport`

## Fixture file

The behavior fixture lives at:

`test/fixtures/templates/layout-composition-validation-report-fixtures.json`

The fixture verifies deterministic report output using the Phase 5 batch fixture.

## Verifier

The focused verifier lives at:

`scripts/verify-templates-phase6-layout-composition-validation-report-builder.mjs`

It checks static guardrails and executable report behavior.

## Guardrails

This phase does not:

- import the report builder into runtime document generation;
- alter template selection UI;
- alter document-generation dialogs;
- inspect or mutate DOCX files;
- produce PDFs;
- upload files;
- call external document-storage services;
- change existing production routes.

A later admin-readiness phase may expose this report only after the report behavior is independently locked.
