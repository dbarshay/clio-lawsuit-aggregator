# Templates Phase 8 — Layout Composition Validation Suite

## Status

Implementation lock for a repo-level validation suite covering the isolated layout-composition validation stack, including admin-readiness payload checks.

This phase is tooling-only. It is not wired into production generation, document assembly, UI flows, DOCX handling, PDF conversion, upload, or external document-storage interaction.

## Scope

Phase 8 adds a single suite command that runs the locked validators and report utilities from Phases 4 through 7.

The suite verifies:

- Phase 4 pure layout-composition validator behavior;
- Phase 5 batch validator behavior;
- Phase 6 validation report builder behavior;
- Phase 7 report runner behavior;
- Phase 9 admin-readiness payload behavior;
- package script availability; and
- continued isolation from production paths.

## Source file

The suite verifier lives at:

`scripts/verify-templates-layout-composition-validation-suite.mjs`

## Package script

The package script is:

`verify:templates:layout-composition`

It runs:

`node scripts/verify-templates-layout-composition-validation-suite.mjs`

## Guardrails

This phase does not:

- import validators into runtime document generation;
- alter template selection UI;
- alter document-generation dialogs;
- inspect or mutate DOCX files;
- produce PDFs;
- upload files;
- call external document-storage services;
- change existing production routes.

Future phases should run this suite before any admin-readiness or production-wiring work.
