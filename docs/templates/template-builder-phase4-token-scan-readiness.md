# Template Builder Phase 4 — Token Scan Readiness Contract

## Scope

Phase 4 adds the shared token scan readiness contract for Template Builder. It does not implement production DOCX upload, BM cloud object writes, DOCX replacement, template activation, token mutation inside DOCX files, or matter-side Generate Documents.

## DOCX scan boundary

Later production scanning must inspect DOCX content except headers and footers.

Required scan boundary:

- Include body paragraphs.
- Include tables.
- Include text boxes if detectable.
- Ignore headers.
- Ignore footers.
- Detect tokens split across Word runs.
- Warn, but do not block, when a token is split across differently styled Word runs.

## Location contract

Locations are approximate structure locations, not page numbers.

Supported location examples:

- Body paragraph 4
- Table 2, row 3, cell 1
- Text box
- Unknown document location

Duplicate token occurrences are shown separately by location.

## Popup contract

Token scan popup uses the standard BM modal style:

- navy header
- centered white title
- no X
- white body
- visible action buttons
- Esc cancels when appropriate

Sections:

- Blocking Issues
- Warnings
- Recognized Tokens
- No Tokens Found

Warnings-only buttons:

- Cancel
- Continue Anyway

Blocking-errors button:

- Close

No copyable error report.

## Seeding/edit-time rules

Unknown but well-formed tokens are warning-only.

No tokens found is warning-only.

Malformed tokens are blocking.

Invalid modifier syntax is blocking.

Incompatible field-type modifiers are blocking.

Anything that will not merge properly should be caught.

Suggested corrections should be shown where possible with a Copy Suggested Token button.

## Recognized-token display

Recognized tokens show:

- found token
- recognized field label
- applied formats
- location

## Generation-later rule

Generate Documents later must scan the selected DOCX and block generation on unknown, undefined, malformed, invalid, or incompatible tokens. Tokens must never be exposed in generated documents.

## Phase 4 lock criteria

This phase is locked when the shared token-scan readiness contract, docs, admin UI readiness note, Phase 1 through Phase 4 focused verifiers, and TypeScript validation all pass.
