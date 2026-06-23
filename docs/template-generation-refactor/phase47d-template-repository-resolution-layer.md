# Phase 47D — Template Repository Resolution Layer

## Status

This phase adds the central code path for resolving production DOCX templates and layout assets from the Barsh Matters template repository.

## Rule

Final templates live in the Barsh Matters template repository. Generation code should find final DOCX templates there rather than relying on code-registry fallback templates.

The code-registry fallback remains hidden by default and explicit opt-in only.

## Resolver API

The central resolver exposes:

- `resolveGenerationTemplateFromRepository`
- `resolveLayoutAssetFromRepository`
- `listSelectableGenerationTemplatesFromRepository`
- `resolveGenerationTemplateWithLayoutFromRepository`

Generation templates must resolve from `DocumentTemplate` plus current `DocumentTemplateVersion` with `storageKind: db-docx-base64`.

Layout assets must also resolve from the same repository but must not appear as normal generation templates.

## Current Repository Records

- `lawsuit-stipulation-of-settlement`
  - Kind: generation template
  - Category: lawsuit
  - Layout family: letterhead
  - Layout asset key: letterhead-simple
  - Stipulation of Settlement is not final yet
  - It requires layout adaptation and field mapping before final production use
- `letterhead-simple`
  - Kind: layout asset
  - Category/storage bucket: general
  - Non-generation asset
  - Not selectable for normal generation
  - Used by templates that declare `layoutAssetKey: letterhead-simple`

## Safety

This phase performs no field mapping.

This phase does not upload to Clio, create Graph/OneDrive working documents, finalize documents, send email, create drafts, print, create print queue items, or touch matter/lawsuit/file-number data.

## Next

After this resolver layer is locked, the next phase can inspect and propose field mappings. Any uncertain field mapping should be presented to Dave before conversion.

## Invoice and Remittance Templates

Invoice/remittance templates should also live in the Barsh Matters template repository when they are finalized as DOCX templates.

They are not imported in Phase 47D. This phase only locks the repository resolver and the current Stipulation/letterhead repository records.


Verifier token: template repository resolution layer

Verifier token: final templates live in the Barsh Matters template repository
