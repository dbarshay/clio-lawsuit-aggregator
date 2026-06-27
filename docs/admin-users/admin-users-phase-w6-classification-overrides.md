# Admin Users Phase W6 - Explicit Classification Override Plan

Status: override plan only.

No runtime enforcement is enabled.
No UI hiding is enabled.
No backend route blocking is enabled.
No database changes are made.

Based on W5 review: admin-users-phase-w5-classification-review
W5 issue count: 36
Planned overrides: 32

## Override disposition counts

- admin_card_mapping: 4
- admin_context_only: 1
- financial_settlement_sensitive: 3
- payment_sensitive: 4
- read_only_preview: 20

## Planned override paths

- app/admin/audit-history/page.tsx — admin_card_mapping
- app/admin/lawsuits/audit/page.tsx — admin_card_mapping
- app/api/admin/lawsuits/audit/route.ts — admin_card_mapping
- app/api/admin/authorize/route.ts — admin_context_only
- app/api/admin/email-automation-status/route.ts — admin_card_mapping
- app/admin/clients/[id]/page.tsx — payment_sensitive
- app/admin/clients/page.tsx — payment_sensitive
- app/api/admin/clients/[id]/route.ts — payment_sensitive
- app/api/admin/clients/route.ts — payment_sensitive
- app/api/settlements/attorney-fee-breakdown/route.ts — financial_settlement_sensitive
- app/api/settlements/local-provider-fee-defaults/route.ts — financial_settlement_sensitive
- app/api/settlements/provider-fee-defaults/route.ts — financial_settlement_sensitive
- app/api/admin/backups/restore-preview/route.ts — read_only_preview
- app/api/admin/clients/[id]/invoice/create-preview/route.ts — read_only_preview
- app/api/admin/lawsuits/cleanup-preview/route.ts — read_only_preview
- app/api/documents/clio-finalization-target-preview/route.ts — read_only_preview
- app/api/documents/clio-master-crossref-preview/route.ts — read_only_preview
- app/api/documents/clio-master-matter-preview/route.ts — read_only_preview
- app/api/documents/delivery-draft-preview/route.ts — read_only_preview
- app/api/documents/direct-finalize-preview/route.ts — read_only_preview
- app/api/documents/finalize-preview/route.ts — read_only_preview
- app/api/documents/generate-preview/route.ts — read_only_preview
- app/api/documents/preview-pdf/route.ts — read_only_preview
- app/api/documents/templates/import-preview/route.ts — read_only_preview
- app/api/graph/draft-payload-preview/route.ts — read_only_preview
- app/api/lawsuits/local-generation-preview/route.ts — read_only_preview
- app/api/reference-data/import-preview/route.ts — read_only_preview
- app/api/settlements/close-preview/route.ts — read_only_preview
- app/api/settlements/local-preview/route.ts — read_only_preview
- app/api/settlements/local-record-preview/route.ts — read_only_preview
- app/api/settlements/preview/route.ts — read_only_preview
- app/api/settlements/writeback-preview/route.ts — read_only_preview

## Next phase

Phase W7 should apply these overrides to the W2 classification builder, rebuild W2/W3/W4 outputs, and verify that simulator output reflects reviewed classification. It should still not enforce blocks.
