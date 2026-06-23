# Phase 48A — Invoice/Remittance Template Source Inspection

## Status

Read-only inspection of where invoice/remittance templates are currently held.

## Answer

Invoice/remittance templates are not currently stored as DOCX templates in the Barsh Matters template repository.

Current repository template keys:

- `letterhead-simple`
- `lawsuit-stipulation-of-settlement`

Invoice/remittance-like repository template keys:

- None

## Current Source

Invoice/remittance output is currently app-generated/code-rendered workflow output. The app computes and stores invoice/remittance data, frozen lines, totals, printable views, CSV/XLSX/export output, and related workflow state through code and database workflow tables rather than through DOCX template records.

## Likely Current Code/Workflow Files

- `app/admin/audit-history/page.tsx`
- `app/admin/backup-restore/page.tsx`
- `app/admin/claim-index/audit/page.tsx`
- `app/admin/claim-index/page.tsx`
- `app/admin/clients/[id]/invoice/client-costs-ledger/page.tsx`
- `app/admin/clients/[id]/invoice/history/page.tsx`
- `app/admin/clients/[id]/invoice/page.tsx`
- `app/admin/clients/[id]/page.tsx`
- `app/admin/document-readiness/audit/page.tsx`
- `app/admin/document-templates/page.tsx`
- `app/admin/invoices/page.tsx`
- `app/admin/lawsuit-cleanup/page.tsx`
- `app/admin/lawsuits/audit/page.tsx`
- `app/admin/page.tsx`
- `app/admin/permissions/page.tsx`
- `app/admin/readiness-dashboard/page.tsx`
- `app/admin/reference-data/page.tsx`
- `app/admin/ticklers/page.tsx`
- `app/admin/ticklers/runner/page.tsx`
- `app/admin/users/page.tsx`
- `app/api/admin/backups/archive-error-log/route.ts`
- `app/api/admin/backups/restore-preview/route.ts`
- `app/api/admin/backups/run/route.ts`
- `app/api/admin/backups/status/route.ts`
- `app/api/admin/claim-index/audit/route.ts`
- `app/api/admin/claim-index/search/route.ts`
- `app/api/admin/clients/[id]/invoice/[invoiceId]/finalize/route.ts`
- `app/api/admin/clients/[id]/invoice/[invoiceId]/route.ts`
- `app/api/admin/clients/[id]/invoice/[invoiceId]/void/route.ts`
- `app/api/admin/clients/[id]/invoice/cost-ledger/route.ts`

## Repository Rule Going Forward

When invoice/remittance documents are converted into final templates, they should be DOCX-based templates stored in the Barsh Matters template repository.

Likely future repository keys:

- `provider-invoice-summary`
- `provider-remittance-statement`
- `attorney-fee-report`

## Safety

This phase is read-only inspection and documentation. It performs no field mapping, no document generation, no database mutation, no Clio upload, no Graph/OneDrive working document creation, no finalization, no print queue action, and no email action.


## Invoice/Remittance Repository Rule

Invoices and remittance documents will not be generated through the normal document template workflow.

They remain app-generated/code-rendered from the invoice/remittance workflow data, including calculations, frozen lines, totals, printable views, CSV/XLSX/export output, and workflow state.

If we later want to change the way they look, invoice/remittance appearance/layout reference files should be saved in the Barsh Matters template repository as DOCX-based non-generation reference assets.

Those future invoice/remittance repository assets should not appear in Generate Documents and should not be treated as selectable generation templates.
