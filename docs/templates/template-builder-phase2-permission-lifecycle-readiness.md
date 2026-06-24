# Template Builder Phase 2 — Permission Gate and Repository Lifecycle Readiness

## Scope

Phase 2 adds a small shared readiness contract for the Template Builder admin workflow. It does not implement production DOCX upload, cloud object writes, DOCX replacement, token mutation, or matter-side Generate Documents.

## Permission

The workflow permission key is:

- templates.manage

The full Template Builder and template repository maintenance workflow is admin-only. Later write routes must use this permission before allowing template creation, DOCX replacement, status changes, custom-placeholder changes, category changes, or token auto-update.

## Repository namespaces

The BM cloud repository namespaces are fixed:

- templates/active/
- templates/inactive/
- templates/archived/
- templates/deleted/

Templates are never stored in Clio.

## Status lifecycle

Supported statuses:

- Active
- Inactive
- Archived
- Deleted

Supported lifecycle actions:

- create
- editMetadata
- replaceDocx
- makeActive
- deactivate
- archive
- delete
- restore

Status lifecycle actions move DOCX objects between the fixed template namespaces where applicable and are audit logged. They do not update Last Edited or Last Edited By except where the action is a content or metadata edit.

## Last Edited rules

Updates Last Edited / Last Edited By:

- create
- editMetadata
- replaceDocx

Does not update Last Edited / Last Edited By:

- makeActive
- deactivate
- archive
- delete
- restore

## Scan and confirmation rules

Requires token scan:

- create
- replaceDocx
- makeActive

Requires confirmation:

- delete
- restore

Requires strong confirmation:

- delete

Archive and deactivate do not require confirmation. Restore skips token scan and returns the template to Inactive.

## Listing and generation eligibility

All filter includes Active, Inactive, and Archived. All excludes Deleted. Deleted is visible only under the Deleted filter.

Only Active templates are eligible for later matter-side Generate Documents.

## UI safety

Routine admin UI must show BM display names only. It must not show internal storage paths, cloud object keys, stored DOCX filenames, or raw file blobs.

## Phase 2 lock criteria

This phase is locked when the shared readiness contract, admin UI references, focused verifier, and TypeScript validation all pass.
