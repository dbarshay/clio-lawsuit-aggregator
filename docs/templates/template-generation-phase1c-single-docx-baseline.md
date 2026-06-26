# Template Generation Phase 1C — Fresh Local DOCX Baseline

This phase resets Template Generation to a fresh user-created DOCX workflow.

## Current baseline

Barsh Matters is not using prior saved/legacy DOCX files as the active template source.

The active source workflow is:

1. The user creates a local Word DOCX outside the repository.
2. The user copies canonical merge fields from the Template Builder UI into that DOCX.
3. The fresh DOCX is then imported or inspected as the selected template source.
4. Generation/rendering uses only canonical Template Builder tokens.

## Removed from active source baseline

The following legacy saved DOCX files are intentionally absent from the active repo baseline:

- `templates/docx/base/letterhead-simple.docx`
- `templates/docx/incoming/Initial Billing Letter.docx`
- `templates/docx/letters/initial-billing-letter.docx`
- `templates/docx/letters/vr-response.docx`

## Preserved

The Template Builder canonical token library remains the source for merge fields, including:

- `{{matter.fileNumber}}`
- `{{matter.providerName}}`
- `{{matter.patientName}}`
- `{{matter.billedAmount}}`
- `{{claim.number}}`
- `{{claim.dateOfLoss}}`
- `{{claim.dateOfService}}`
- `{{claim.denialReason}}`
- `{{claim.balance}}`
- `{{insurer.fullAddressBlock}}`
- `{{adversary.fullAddressBlock}}`

Address-block rendering remains locked to:

```text
Street
City, State Zip

## Phase 1D explicit out-of-scope locks

- Do not restore letterhead-simple architecture.
- Do not restore pleading-paper architecture.
- Do not build legacy-token compatibility.
- Do not import a DOCX into the database.
- Do not upload to Clio.
- Do not call Microsoft Graph.
- Do not print or queue documents.
