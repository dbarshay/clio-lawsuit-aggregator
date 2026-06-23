# Templates Phase 12 - Real Template Registry Source

## Status

Implementation lock for the first real in-repo template layout-composition registry source.

This phase moves the read-only admin validation page and API away from test fixtures and onto src/lib/templates/template-layout-composition-registry-source.mjs.

## Registry contents

The registry includes canonical layout assets for letterhead, pleading paper, and simple cover/fax page.

The registry includes initial real template metadata records for a letter template, pleading template, fax-letter template, and pleading packet template.

## Guardrails

This phase does not generate documents, upload files, mutate templates, inspect or mutate DOCX files, produce PDFs, call external document-storage services, or connect to live database template data.

The admin page and API remain read-only.
