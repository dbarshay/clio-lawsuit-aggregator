# Templates Phase 18F — Initial Billing Letter Canonical Token Migration

## Scope

This phase restarts Phase 18F cleanly after the failed legacy-token expansion path.

## Decision

The committed Initial Billing Letter DOCX now uses canonical `{{...}}` merge tokens only. Legacy chevron tokens are not expanded further for this document.

## Canonical address block

- `{{insurer.name}}`
- `{{insurer.mailingAddress.line1}}`
- `{{insurer.mailingAddress.city}}, {{insurer.mailingAddress.state}} {{insurer.mailingAddress.zip}}`

## Other canonical tokens

- `{{letter.date}}`
- `{{provider.name}}`
- `{{patient.name}}`
- `{{claim.number}}`
- `{{claim.amount}}`
- `{{claim.dosRange}}`
- `{{matter.fileNumber}}`

## Verification contract

The verifier confirms that the committed DOCX has no visible `<<...>>` tokens and contains the required canonical token inventory. The transform preview resolves those canonical tokens locally for `BRL_202600003` and writes output only under `.tmp-phase18e-output/`.

## Non-goals

This phase does not wire app/API generation, does not upload to Clio/storage, and does not mutate matter data.
