# Templates Phase 18J — Preferred Letter Formatting for Shared Letterhead Composition

## Scope

This phase locks the preferred formatting standard for letterhead-based letters, using the Initial Billing Letter as the first proof.

Current layout scope has only two assets:

- letterhead
- pleadings

Current work is limited to letterhead-based documents.

## Shared letterhead rule

All letter templates under review use the same shared `letterhead-simple` layout asset. Individual letter DOCX files are body/content templates only and do not own separate embedded letterheads.

## Preferred letter formatting

The Phase 18J v4 proof is locked as the preferred formatting standard for letterhead-based letters:

- shared letterhead asset required;
- first-page header required;
- following-page header behavior required;
- body font: 11 pt Times New Roman;
- body margins: 1 inch;
- header distance: 360 twips;
- date tabbed 7 times;
- Re line begins after 2 tabs, with `Re:` followed by 1 tab and `Provider: ...`;
- following Re lines are tabbed 3 times to align with Provider;
- closing/signature block tabbed 7 times;
- spacing after insurer address before Re: 285 twips;
- spacing after Re block before Dear Sir or Madam: 285 twips;
- spacing after Dear Sir or Madam before first body paragraph: 125 twips;
- spacing after body paragraphs: 145 twips;
- spacing between Very truly yours and firm name: 260 twips.

## Pending signer fields

The following letterhead fields remain pending until BM user creation/profile work supplies signer-specific values:

- `signer.extension`
- `signer.fax`
- `signer.email`

These fields must be dynamic based on the selected signer/generating user before production generation wiring.

## Non-goals

This phase does not wire app/API generation, does not upload to Clio, and does not write to storage. Generated proof output remains under ignored local output.
