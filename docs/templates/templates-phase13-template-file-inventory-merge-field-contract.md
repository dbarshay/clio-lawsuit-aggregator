# Templates Phase 13 — Real Template File Inventory + Merge Field Contract

## Scope

Phase 13 defines the first real template-file inventory contract for layout-composition metadata. It remains a validation-only phase. It does not wire document generation, upload files, finalize documents, mutate matters, or call external document-storage services.

## Approved template-file roots

Real production DOCX template paths must remain inside approved in-repo roots:

- `templates/docx/`
- `templates/production/`

The initial registry records use `templates/docx/` paths. These paths are metadata contracts only; Phase 13 does not require the physical DOCX files to exist yet.

## Registry contract

Every real template registry record must define:

- `templateFile.kind` — currently `docx`;
- `templateFile.path` — an approved in-repo template path;
- `templateFile.required` — whether the template file is required for production readiness;
- `expectedMergeFields` — the merge fields the real template is expected to contain.

Every `expectedMergeFields` entry must exist in `registry.mergeFieldDefinitions`. Layout-asset `requiredMergeFields` must also remain valid against the same merge-field definition registry.

## Initial real template records

- `template-letterhead-demand-letter`
- `template-pleading-summons-complaint`
- `template-fax-cover-and-letter`
- `template-pleading-with-letterhead`

## Terminology

Use “simple cover/fax page.” The simple cover/fax page, letterhead, and pleading paper are composable non-generation layout assets, not mutually exclusive wrappers.

## Safety boundary

This phase is limited to registry metadata, fixtures, documentation, and local verification. Generation remains unwired.
