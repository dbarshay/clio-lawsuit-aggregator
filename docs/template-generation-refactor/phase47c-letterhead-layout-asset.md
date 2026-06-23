# Phase 47C — Letterhead Simple DOCX Layout Asset

## Status

Guarded production import for the first reusable DOCX layout asset.

## Decisions

- Layout label: `Letterhead Simple`
- Layout key: `letterhead-simple`
- Layout kind: non-generation layout asset
- Category/storage bucket: `general`
- User-facing layout family: `letterhead`
- Format: DOCX-based, available to Mac and Windows users
- Normal generation selection: disabled; this is not a user-selectable document template
- Import method: guarded script
- Template/layout creation permission: owner-admin only
- Field mapping: not performed in this phase

## Letterhead Rules

- Page 1 uses the full BRL letterhead header.
- Page 2 and all additional pages use the continuation-page header.
- Verifier token: page 2 and all additional pages
- The date is dynamic and aligned tabbed once to the right.
- Verifier token: dynamic date
- Letterhead documents close with `Very truly yours,`.
- `Very truly yours,` uses the same tabbed alignment as the date.
- There is blank signature space under `Very truly yours,`.
- The signer/user name appears under the blank space as `{{userName}}`.

## Relationship to Generation Templates

Generation templates should declare a layout family, for example:

- `layoutFamily: letterhead`
- `layoutAssetKey: letterhead-simple`

The layout asset is not a normal document template and should not appear as a selectable generation document.

## Safety

The import script writes only Barsh Matters local template repository rows:

- `DocumentTemplate`
- `DocumentTemplateVersion`

It stores the uploaded DOCX file as `db-docx-base64` in the current `DocumentTemplateVersion`.

The import does not upload to Clio, create Graph/OneDrive working documents, finalize documents, send email, create drafts, print, create print queue items, perform field mapping, or touch matter/lawsuit/file-number data.

## Stipulation of Settlement

The existing `lawsuit-stipulation-of-settlement` DOCX template imported in Phase 47B is preserved. Layout adaptation for that template will be handled in a later phase after the layout standard is locked.
