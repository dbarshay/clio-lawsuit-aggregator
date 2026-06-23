# Templates Phase 1 — Template Layout Composition Decisions

Status: **Design/proposal locked; docs-only phase**

Starting point: reset template work numbering after Phase 48G. Do **not** use Phase 48H numbering for this work.

Previous locked baseline:

- Last locked HEAD before this phase: `9f8a8141ab39978a94fe311d67ccfb08ba729991`
- Last locked tag before this phase: `signer-profile-addressee-source-design-phase48g-20260622-212543`
- Bad empty tag previously deleted: `signer-profile-addressee-source-design-phase48g-20260622-212203`

## Phase boundary

This phase is intentionally limited to a **docs-only design/proposal lock** for layout composition decisions.

This phase does **not** mutate the database, create or alter Prisma models, convert DOCX files, map fields into DOCX templates, generate production documents, expose layout assets as Generate Documents choices, perform Clio actions, perform Microsoft Graph actions, call finalize/upload routes, or run live document upload/finalization workflows.

## Existing locked template rules

1. All production templates must be DOCX-based for Mac and Windows.
2. Final templates live in the Barsh Matters template repository.
3. Layout assets are non-generation assets and must not appear as standalone Generate Documents choices.
4. Letterhead and pleading paper are layout assets.
5. Simple cover/fax page is also a non-generation layout asset/reference unless later approved otherwise.
6. Invoices/remittance will not be generated through the normal document-template workflow; they remain app-generated/code-rendered.
7. The `lawsuit-stipulation-of-settlement` template is repository-backed but not final; it still requires layout adaptation and field mapping.
8. Merge fields must eventually cover all visible Barsh Matters UI fields and all non-viewable/internal fields in DB tables already created.

## Locked signer/addressee baseline from Phase 48G

1. Non-login signers are allowed.
2. Signer eligibility is separately enabled, but defaults to enabled.
3. Incomplete signer profiles are allowed, but generation is blocked when the selected template requires missing signer fields.
4. Addressee source defaults come from the selected template, with workflow/context override.
5. Missing addressee data warns and requires manual completion.
6. Insurer will never differ among children; on lawsuit/master matters, lawsuit matter insurer controls.
7. `settled_with_contact` resolves only from settlement contact data, with no silent fallback.

## New layout-composition requirement

Production generation templates may require a combination of layout assets. Layout assets are composable, not mutually exclusive.

A production generation template may require letterhead only, pleading paper only, simple cover/fax page only, letterhead + pleading paper, simple cover/fax page + letterhead, simple cover/fax page + pleading paper, simple cover/fax page + letterhead + pleading paper, or no layout asset.

Generate Documents must show only final production templates, not the underlying layout assets as standalone generation choices.

Layout composition should eventually be metadata-driven.

## Locked decision answers

### 1. Cover/fax asset model

Decision: **Hybrid.**

Use one generic default `simple cover/fax page` layout asset, but allow production templates to define or reference template-specific cover/fax pages when needed.

### 2. Cover page vs. fax transmittal distinction

Decision: **Hybrid.**

Treat simple cover pages and fax transmittals as separate modes under one broader `cover/fax` layout family. Metadata must distinguish `cover_page` from `fax_transmittal`.

### 3. Letterhead + pleading paper behavior

Decision: **Template-specific metadata decides.**

When a production template uses both letterhead and pleading paper, metadata declares whether letterhead is separate, merged into the first pleading-paper page, applied by section-specific behavior, or otherwise composed according to the production template's declared layout plan.

### 4. Cover/fax page numbering

Decision: **Metadata decides.**

Each production template or cover/fax mode declares whether the cover/fax page is included in page numbering and whether any page number is visibly displayed.

### 5. New page vs. same-page continuation

Decision: **Metadata decides.**

Each production template declares whether a layout asset forces a new page, permits same-page continuation, or uses section-specific behavior.

### 6. Duplicate layout roles

Decision: **Strict default, metadata exception.**

Duplicate layout roles are blocked by default, but production-template metadata may explicitly allow duplicates for a documented reason.

### 7. Layout compatibility validation

Decision: **Admin-only warnings allowed during testing.**

Admins may generate test output with warnings for layout compatibility issues during template testing, but ordinary/non-admin users should be blocked.

### 8. Layout asset versioning

Decision: **Hybrid.**

Default to the latest approved layout asset version, but allow a production template to pin a specific layout-asset version when stability, historical consistency, or template-specific QA requires it.

### 9. Layout setting overrides

Decision: **No overrides for now.**

Layout assets control their own settings completely. Production templates may attach, omit, order, and compose layout assets through metadata, but may not override individual asset settings at this stage. Disallowed for now: margin overrides, footer-text overrides, fax-field overrides, page-numbering overrides at the asset-setting level, section-break overrides at the asset-setting level, and ad hoc per-template mutation of protected layout behavior.

### 10. Metadata location

Decision: **Repository first, database later if needed.**

Layout composition metadata should live first in repository JSON/front matter. Database modeling can come later after the template system stabilizes.

### 11. Admin/template-management UI

Decision: **View in UI eventually, edit in repository.**

The app should eventually expose layout composition for admin visibility and QA, but edits should remain repository-controlled unless later approved.

### 12. Fax-specific fields

Decision: **Include fax-specific fields in the cover/fax standard.**

The broader `cover/fax` layout family should include fax-specific fields, but those fields should be required only when metadata mode is `fax_transmittal`.

Standard fax-capable field set includes recipient fax number, recipient phone number, sender fax number, sender phone/extension, total pages, date, Re, comments, and confidentiality notice.

## Proposed initial metadata shape

This is illustrative only. It is not an implementation contract yet.

- templateId: example-production-template
- templateStatus: draft
- layoutComposition.assets may include roles `cover_fax`, `letterhead`, and `pleading_paper`
- cover/fax mode may be `cover_page` or `fax_transmittal`
- version may be `latest_approved` or pinned
- duplicateRoles.default should be `blocked`
- compatibility.ordinaryUsers should be `block`
- compatibility.adminTesting should be `warn_allowed`
- templateOverridesLayoutAssetSettings should be false

## Verifier expectations for future implementation

Future implementation verifiers should confirm that layout assets remain non-generation assets; Generate Documents shows only final production templates; layout composition supports zero, one, or multiple layout assets; letterhead, pleading paper, and cover/fax assets can be composed; `cover_page` and `fax_transmittal` are distinguishable modes; fax fields are required only for `fax_transmittal` mode; duplicate roles are blocked unless metadata contains an explicit exception; ordinary users are blocked from incompatible layouts; admin test workflows may warn instead of block; latest-approved asset resolution and version pinning are both representable; production templates cannot override internal layout asset settings at this stage; metadata starts repository-side, not database-side; and any future UI exposure is read/QA first, not edit-first.

## Open follow-up work

Future phases may address repository metadata schema and validation, layout asset inventory normalization, DOCX section-break strategy, page-numbering implementation, fax transmittal page-count calculation, admin/template QA readout screen, eventual database modeling, Stipulation of Settlement layout adaptation, and comprehensive merge-field mapping into production templates.
