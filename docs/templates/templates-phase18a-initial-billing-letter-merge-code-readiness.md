# Templates Phase 18A - Initial Billing Letter Merge-Code Readiness

This phase is limited to the Initial Billing Letter.

The template is a letter-based document that depends on the locked letterhead-simple layout asset.

This document is for individual Barsh Matters only. The named later dry-run test matter is BRL_202600003.

Non-goals: no pleading paper work; no DOCX import in this phase; no generation wiring; no Clio or storage calls; no matter mutation; no broad template readiness sweep.

Confirmed legacy token inventory:
- <<BALANCE_AMOUNT>>
- <<CASE_ID>>
- <<DOS_END>>
- <<DOS_START>>
- <<INJUREDPARTY_NAME>>
- <<INSURANCECOMPANY_LOCAL_CITY>>
- <<INSURANCECOMPANY_LOCAL_STATE>>
- <<INSURANCECOMPANY_LOCAL_ZIP>>
- <<INS_CLAIM_NUMBER>>
- <<NOWDT>>
- <<PROVIDER_SUITNAME>>

Confirmed replacement surface:
- <<NOWDT>> -> letter.date
- <<INSURANCECOMPANY_LOCAL_CITY>>, <<INSURANCECOMPANY_LOCAL_STATE>> <<INSURANCECOMPANY_LOCAL_ZIP>> -> insurer.name + insurer.mailingAddress
- <<PROVIDER_SUITNAME>> -> provider.name
- <<INJUREDPARTY_NAME>> -> patient.name
- <<INS_CLAIM_NUMBER>> -> claim.number
- <<BALANCE_AMOUNT>> -> claim.amount
- <<DOS_START>> - <<DOS_END>> -> claim.dosRange
- <<CASE_ID>> -> matter.fileNumber

Required standard merge-code surface:
- letter.date
- insurer.name
- insurer.mailingAddress
- provider.name
- patient.name
- claim.number
- claim.amount
- claim.dosRange
- matter.fileNumber

Phase 18B should add the DOCX import gate for the locally placed Initial Billing Letter.docx.
Phase 18C should run a local dry-run against BRL_202600003 and confirm that no legacy chevron tokens remain.
