# Template Builder Phase 1 — Admin UI and Cloud Repository Readiness

## Scope

This phase resets the template work to the admin UI driven Template Builder foundation. It does not implement production DOCX upload, replacement, token mutation, or matter-side Generate Documents wiring.

## Existing foundation reused

The app already contains the Prisma template repository foundation:

- DocumentTemplate
- DocumentTemplateVersion
- DocumentTemplateMergeField

The app also already contains admin document template routes and template API route families. This phase keeps the repository-first approach and prepares the admin UI and readiness checks around that existing foundation instead of creating a separate command-side seeding workflow.

## Admin entry point

Admin → Document Templates is the required entry point. The landing page presents two choices:

- Build Template
- View Templates

The intended permission key for this workflow is templates.manage. Phase 1 treats the workflow as admin-only and documents this key for permission-registry alignment.

## Cloud repository readiness

Templates must be stored only in BM cloud storage. Templates must never be stored in Clio.

Required template object namespaces:

- templates/active/
- templates/inactive/
- templates/archived/
- templates/deleted/

Status lifecycle actions move the DOCX object between these namespaces. Lifecycle actions are audit logged but do not update Last Edited or Last Edited By. Content and metadata edits do update Last Edited and Last Edited By.

## Visibility and filename rules

The UI shows only the BM display name. Internal stored filenames, storage keys, and cloud paths stay hidden from routine admin views.

New uploaded local DOCX filenames must be unique across all template namespaces. Replacement on the same template may reuse that template filename or may use a different unused filename.

## View Templates readiness rules

The table contract is:

- Name
- Status
- Last Edited
- Last Edited By
- Default Signature
- Actions

Filters are:

- All
- Active
- Inactive
- Archived
- Deleted

All includes Active, Inactive, and Archived. All excludes Deleted. Deleted appears only under the Deleted filter.

Only Active templates that are not archived or deleted are eligible for later matter-side Generate Documents.

## Build Template readiness rules

The Build Template surface starts with a searchable merge-field library and the required starting category structure:

- Matter
- People
- People → Signature/Header
- General

General is fixed, appears last, cannot be renamed or deleted, and receives fields moved out of deleted categories.

Phase 1 includes canonical field examples, signature and header usage notes, custom manual placeholder readiness fields, and the supported token-formatting contract.

## Token scan readiness rules

Phase 1 documents and verifies the expected scan behavior but does not wire production DOCX upload or matter-side generation.

The later scanner must inspect non-header and non-footer DOCX content where practical, detect tokens split across Word runs, identify malformed or unknown tokens with approximate structure locations, and show the standard BM popup sections:

- Blocking Issues
- Warnings
- Recognized Tokens
- No Tokens Found

## Phase 1 lock criteria

This phase is locked only when the admin pages, readiness document, and focused verifier are present and TypeScript validation passes.
