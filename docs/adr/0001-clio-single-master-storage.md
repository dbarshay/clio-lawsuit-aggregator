# ADR 0001: Clio Single Master Matter Storage Architecture

## Status
Accepted for implementation.

## Context
Barsh Matters currently uses Clio in a matter-centered manner. The existing test implementation creates individual Clio matters for BM files and creates additional Clio matters/file numbers upon lawsuit aggregation.

That structure is unnecessary because Clio is not the user-facing system and is not being used for billing, permissions, account/provider management, deadlines, templates, or matter-level workflows. Ordinary users do not access Clio directly. Users access documents through the Barsh Matters UI. Barsh Matters controls matter access, document visibility, templates, generated documents, scans, uploaded emails, and user permissions.

## Decision
Barsh Matters will use one manually created Clio master matter/file as the document repository for the Barsh Matters project. Barsh Matters will automatically create bucket folders under that master Clio matter. Each bucket will contain individual BM folders. Each BM matter will have one flat Clio folder containing generated documents, scans, uploaded emails, attachments, and other matter-specific documents. Templates will remain exclusively in Barsh Matters. Clio will store only generated or uploaded matter documents.

## Target Structure

```text
Clio Matter: Barsh Matters Master Repository
├── BM_000001_to_001000
│   ├── BM-000001
│   ├── BM-000002
│   └── BM-001000
├── BM_001001_to_002000
│   ├── BM-001001
│   └── BM-002000
├── BM_002001_to_003000
├── Lawsuit_Aggregations
└── Unassigned_or_QC_Hold
```

Each BM matter folder will remain flat unless a later administrative need requires subfolders.

## Rules
1. Barsh Matters generates BM matter numbers.
2. Barsh Matters generates lawsuit aggregation numbers.
3. Clio does not create individual matters for BM files.
4. Clio does not create lawsuit aggregation matters.
5. Clio does not generate the operative BM file number.
6. Clio does not store templates.
7. Barsh Matters creates Clio bucket folders.
8. Barsh Matters creates one Clio folder per BM matter.
9. Barsh Matters stores Clio folder IDs and Clio document IDs.
10. Barsh Matters remains the source of truth for document visibility and permissions.
11. Clio remains the storage backend for finished/generated/uploaded documents only.

## Lazy Folder Creation
Preferred flow: BM matter is created by Barsh Matters without a Clio folder. On first generated or uploaded document, BM resolves or creates the correct bucket folder, resolves or creates the BM matter folder, uploads the document, and stores the Clio document ID and folder ID.

## Bucket Size
Default bucket size is 1000 BM folders per bucket. Example: BM-000001 through BM-001000 go in BM_000001_to_001000. BM-001001 through BM-002000 go in BM_001001_to_002000.

## Existing Test Data
Existing BM matters and Clio mappings are test data and do not need to be preserved. A clean reset is acceptable during implementation.
