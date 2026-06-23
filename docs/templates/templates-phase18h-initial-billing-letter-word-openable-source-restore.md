# Templates Phase 18H — Initial Billing Letter Word-Openable Source Restore

## Reason

The Phase 18F/18G committed Initial Billing Letter DOCX contains the desired canonical token inventory, but Microsoft Word rejects that DOCX. ZIP integrity and XML parsing alone were insufficient to prove Word-openability.

Manual diagnostic showed:

- Current Phase 18G source: Word rejects.
- Phase 18F source: Word rejects.
- Phase 18E source: Word opens, but does not contain the Phase 18F canonical-token edits.

## Scope

This phase restores `templates/docx/letters/initial-billing-letter.docx` from the Word-openable Phase 18E source.

This phase intentionally does not perform another automated DOCX rewrite and does not attempt production generation.

## Required follow-up

After this restore is locked, the next step is a manual Microsoft Word edit of the restored DOCX to insert the canonical tokens:

- `{{letter.date}}`
- `{{insurer.name}}`
- `{{insurer.mailingAddress.line1}}`
- `{{insurer.mailingAddress.city}}`
- `{{insurer.mailingAddress.state}}`
- `{{insurer.mailingAddress.zip}}`
- `{{provider.name}}`
- `{{patient.name}}`
- `{{claim.number}}`
- `{{claim.amount}}`
- `{{claim.dosRange}}`
- `{{matter.fileNumber}}`

The manually edited DOCX must be opened in Word before it is committed.

## Supersession note

Phase 18F and Phase 18G remain useful as canonical-token contract documentation, but they are superseded as Word-openability proof.\n## Important status\n\nThis restored DOCX is a Word-openable baseline, not the final tokenized production template. The final Initial Billing Letter still requires manual Word editing to insert the canonical `{{...}}` tokens, followed by a Word-openability test before generation wiring.\n\n