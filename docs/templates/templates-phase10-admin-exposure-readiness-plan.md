# Templates Phase 10 - Combined Admin Exposure Readiness Plan

## Status

Combined design and readiness lock for future admin exposure of the layout-composition validation stack.

This phase combines the next planning steps that would otherwise have been separate phases: admin route exposure plan, read-only API exposure plan, permission and safety requirements, expected data-flow contract, and verifier coverage for future implementation.

This phase does not create routes, pages, API handlers, production UI, document-generation wiring, DOCX handling, PDF conversion, upload, or external document-storage interaction.

## Current locked foundation

The current isolated stack includes Phase 4 pure validator, Phase 5 batch validator, Phase 6 report builder, Phase 7 report runner, Phase 8 validation suite, and Phase 9 admin-readiness payload builder.

The package script is npm run verify:templates:layout-composition.

Future wiring phases must run that suite before and after changes.

## Proposed admin destination

Recommended future admin route: /admin/templates/layout-composition-validation

Recommended future read-only API route: /api/admin/templates/layout-composition-validation

Both are intentionally deferred. This phase records the contract only.

## Intended page behavior

The future admin page should be read-only.

It should show overall status, summary cards, invalid template list, error-code summary, warning-code summary, detailed error rows, detailed warning rows, generated Markdown report, source snapshot label, and a clear statement that this validates template metadata only.

It should not provide mutation controls, generate documents, upload documents, or alter template metadata.

## Intended API behavior

The future API should be read-only and deterministic.

Expected logical response fields are ok, status, generatedAt, source kind, source label, cards, sections, and markdown.

The first implementation should use a static or fixture-backed source unless a real template registry already exists and can be safely read without side effects.

## Permission requirements

The future page and API should require admin access.

Minimum acceptable behavior: non-admin users cannot access the page, non-admin users cannot access the API, owner or admin users can access the page, owner or admin users can access the API, never-block safety routes remain unaffected, and permission failure must not expose validation payload contents.

Suggested permission key: templates.layoutCompositionValidation.read

## Data-source requirements

Future implementation must explicitly declare its validation source.

Allowed source types are fixture source for initial UI smoke, static in-repo registry source, and database-backed template registry source after the registry is locked.

The API must not silently mix source types. The UI must label the active source.

## Safety guardrails

Future implementation must not call document generation, call finalization, inspect or mutate DOCX files, produce PDFs, upload files, call external document-storage services, mutate template metadata, mutate matter data, mutate user data, bypass admin auth, or weaken existing permission gates.

## Acceptance criteria for future implementation

A future admin exposure phase is acceptable only when the page is read-only, the API is read-only, admin access is enforced, the source type is disclosed, the Phase 8 suite passes, no document-generation path imports the validator stack, no upload or finalization path imports the validator stack, no external document-storage service is called, tests or verifiers prove unauthorized access is blocked or redirected, and the final proof is synced, tagged, and clean.

## Decision carried forward

Because the user asked to combine phases where possible, future work should combine compatible design, verifier, and implementation steps into larger guarded packets while still avoiding risky production wiring without proof.
