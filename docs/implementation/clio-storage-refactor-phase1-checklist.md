# Phase 1 Checklist

## Architecture
- [ ] One master Clio matter will be created manually by admin.
- [ ] BM will create bucket folders under the master Clio matter.
- [ ] BM will create one folder per BM matter.
- [ ] Each BM folder will be flat.
- [ ] Templates remain exclusively in BM.
- [ ] Clio stores generated documents, scans, uploaded emails, attachments, and other uploaded matter documents only.
- [ ] BM remains source of truth for document visibility and permissions.
- [ ] Ordinary users do not access Clio directly.
- [ ] Existing BM test matters do not need to be preserved.

## Code Inventory
- [ ] Identify where BM currently creates Clio matters.
- [ ] Identify where BM currently uses Clio-generated file numbers.
- [ ] Identify where lawsuit aggregation creates a Clio matter.
- [ ] Identify where documents are uploaded to Clio.
- [ ] Identify where documents are retrieved from Clio.
- [ ] Identify current database fields storing Clio matter/file-number references.
- [ ] Identify tests expecting Clio matter creation.

## Phase 1 Exit Criteria
- [ ] ADR created.
- [ ] Code inventory created.
- [ ] No application behavior changed.
- [ ] No database reset performed.
- [ ] No production data modified.
