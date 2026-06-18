# Phase 1 Inventory: Clio Matter/File Number Usage

This report inventories code paths that may need to change for the Clio single-master-matter storage refactor.


## Clio references

```text
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:4:- Preserve current runtime safety while retiring old Clio-era ClaimIndex rebuild/cache concepts.
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:9:- ClaimIndexRebuildState is legacy status/accounting terminology from the prior Clio rebuild era.
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:11:- app/api/claim-index/rebuild is a quarantined legacy Clio operational route and must remain blocked.
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:12:- app/api/advanced-search/hydrate is a quarantined legacy Clio hydration route and must remain blocked.
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:16:- Local status inspection must not query Clio.
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:21:- Rebuilding ClaimIndex from Clio.
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:22:- Hydrating matter/search/lawsuit data from Clio.
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:23:- Calling Clio matter-context for search/display/local matter edits.
./CLAIMINDEX_LEGACY_DEPRECATION_CONTRACT.txt:26:- Zero-result search fallback to Clio.
./CLAIMCLUSTER_CACHE_CONTRACT.txt:7:- ClaimClusterCache must not be rebuilt from Clio or hydrated from Clio.
./CLAIMCLUSTER_CACHE_CONTRACT.txt:8:- Clio must not be queried to fill or refresh ClaimClusterCache.
./CLAIMCLUSTER_CACHE_CONTRACT.txt:18:- Zero-result search must not fallback to Clio or ClaimClusterCache as a substitute for local database truth.
./CLAIMCLUSTER_CACHE_CONTRACT.txt:21:- ClaimClusterCache must not import or call Clio helpers.
./CLAIMCLUSTER_CACHE_CONTRACT.txt:22:- ClaimClusterCache must not contain Clio custom-field logic.
./app/lawsuits/page.tsx:156:function clioMasterMatterId(m: Matter) {
./app/lawsuits/page.tsx:157:  return val(m, "clioMasterMatterId", "clio_master_matter_id") || "";
./app/lawsuits/page.tsx:160:function clioMasterDisplayNumber(m: Matter) {
./app/lawsuits/page.tsx:161:  return val(m, "clioMasterDisplayNumber", "clio_master_display_number") || "";
./app/lawsuits/page.tsx:1231:                                    title={`Open master lawsuit ${masterId(m)}${clioMasterDisplayNumber(m) ? ` / ${clioMasterDisplayNumber(m)}` : ""}`}
./CLAIMINDEX_LOCAL_SOURCE_CONTRACT.txt:3:- ClaimIndex is not a Clio cache.
./CLAIMINDEX_LOCAL_SOURCE_CONTRACT.txt:4:- ClaimIndex is not hydrated from Clio.
./CLAIMINDEX_LOCAL_SOURCE_CONTRACT.txt:6:- Clio may be used only for explicit document vault/storage/access, MailDrop/document delivery support, and explicit BRL/document shell workflows.
./CLAIMINDEX_LOCAL_SOURCE_CONTRACT.txt:8:- Backup/restore policy must protect ClaimIndex, local matter data, local lawsuit data, lawsuit/sibling links, reference data, and all current/future local PostgreSQL database tables/indexes without querying Clio.
./CLAIMINDEX_LOCAL_SOURCE_CONTRACT.txt:9:- Backup/restore policy does not copy actual document folders and does not pull document files from Clio.  Clio remains the document vault.
./CLAIMINDEX_LOCAL_SOURCE_CONTRACT.txt:11:- Microsoft Graph email sync UI copy is allowed where it expressly says the operation writes only local email metadata and does not write Clio.
./app/print-queue/page.tsx:45:function clioMatterUrl(matterId: any): string {
./app/print-queue/page.tsx:47:  return id ? `https://app.clio.com/nc/#/matters/${id}` : "";
./app/print-queue/page.tsx:50:function clioDocumentOpenUrl(row: any, mode: "inline" | "download" = "inline"): string {
./app/print-queue/page.tsx:51:  const documentId = textValue(row?.clioDocumentId);
./app/print-queue/page.tsx:52:  const filename = textValue(row?.filename) || textValue(row?.clioDocumentName) || "document.pdf";
./app/print-queue/page.tsx:61:  return "/api/documents/clio-document-open?" + params.toString();
./app/print-queue/page.tsx:110:  dedupeClioDocumentId: boolean;
./app/print-queue/page.tsx:125:      dedupeClioDocumentId: true,
./app/print-queue/page.tsx:137:    dedupeClioDocumentId: params.get("dedupeClioDocumentId") !== "false",
./app/print-queue/page.tsx:148:  if (!state.dedupeClioDocumentId) params.set("dedupeClioDocumentId", "false");
./app/print-queue/page.tsx:160:  const [dedupeClioDocumentId, setDedupeClioDocumentId] = useState(initialPrintQueueUrlState.dedupeClioDocumentId);
./app/print-queue/page.tsx:179:      dedupeClioDocumentId: Object.prototype.hasOwnProperty.call(nextState, "dedupeClioDocumentId") ? Boolean(nextState.dedupeClioDocumentId) : dedupeClioDocumentId,
./app/print-queue/page.tsx:186:    setDedupeClioDocumentId(effectiveState.dedupeClioDocumentId);
./app/print-queue/page.tsx:195:      url.searchParams.set("dedupeClioDocumentId", effectiveState.dedupeClioDocumentId ? "true" : "false");
./app/print-queue/page.tsx:264:        `This updates only the local print queue record.  It will not change Clio, upload documents, create folders, or modify document contents.\n\n` +
./app/print-queue/page.tsx:293:      await loadQueue({ status: statusFilter, masterLawsuitId, limit, finalizedPdfOnly, dedupeClioDocumentId }, { replaceUrl: true });
./app/print-queue/page.tsx:305:    const url = clioDocumentOpenUrl(row, mode);
./app/print-queue/page.tsx:308:      alert("This print queue row does not have a Clio document ID available to open.");
./app/print-queue/page.tsx:316:    const url = clioDocumentOpenUrl(row, "inline");
./app/print-queue/page.tsx:319:      alert("This print queue row does not have a Clio document ID available to print.");
./app/print-queue/page.tsx:480:            onClick={() => loadQueue({ status: statusFilter, masterLawsuitId, limit, finalizedPdfOnly, dedupeClioDocumentId })}
./app/print-queue/page.tsx:500:              checked={dedupeClioDocumentId}
./app/print-queue/page.tsx:501:              onChange={(event) => setDedupeClioDocumentId(event.target.checked)}
./app/print-queue/page.tsx:503:            Hide duplicate Clio documents
./app/print-queue/page.tsx:590:            {queue?.dedupeClioDocumentId ? " · duplicates hidden" : ""}
./app/print-queue/page.tsx:613:                  <th style={thStyle}>Matter / Clio</th>
./app/print-queue/page.tsx:618:                  <th style={thStyle}>Clio Document ID</th>
./app/print-queue/page.tsx:626:                  const clioDocUrl = clioDocumentOpenUrl(row, "inline");
./app/print-queue/page.tsx:665:                              href={clioMatterUrl(row.masterMatterId)}
./app/print-queue/page.tsx:670:                              Open in Clio
./app/print-queue/page.tsx:686:                      <td style={tdStyle}>{textValue(row.clioDocumentId) || "—"}</td>
./app/print-queue/page.tsx:692:                            disabled={!clioDocUrl}
./app/print-queue/page.tsx:700:                            disabled={!clioDocUrl}
./CLAIMINDEX_CLEANUP_PLAN.txt:5:- ClaimIndex is not a Clio cache, not hydrated from Clio, and not rebuilt from Clio.
./CLAIMINDEX_CLEANUP_PLAN.txt:6:- Clio is permitted only for explicit document vault/storage/access, MailDrop/document delivery support, and explicit BRL/document shell workflows.
./CLAIMINDEX_CLEANUP_PLAN.txt:31:- Clio operational field hydration.
./CLAIMINDEX_CLEANUP_PLAN.txt:41:- Search must not fallback to Clio.
./CLAIMINDEX_CLEANUP_PLAN.txt:42:- Zero-result searches must not query Clio.
./CLAIMINDEX_CLEANUP_PLAN.txt:43:- UI matter/lawsuit display must not call Clio matter-context or custom-field hydration.
./CLAIMINDEX_CLEANUP_PLAN.txt:44:- noClioRead/noClioWrite/noClioHydration markers should remain on local search/API routes where practical.
./CLAIMINDEX_CLEANUP_PLAN.txt:49:3. Remove or quarantine old Clio rebuild/hydration concepts after review.
./app/api/graph/config-health/route.ts:24:    clioRecordsChanged: false,
./app/api/graph/config-health/route.ts:64:      "clioMatterId",
./app/api/graph/config-health/route.ts:65:      "clioDisplayNumber",
./app/api/graph/config-health/route.ts:66:      "clioMaildropEmail",
./app/api/matters/update-direct-field/route.ts:307:            noClioWrite: true,
./app/api/matters/update-direct-field/route.ts:308:            noClioRead: true,
./app/api/matters/update-direct-field/route.ts:328:      noClioWrite: true,
./app/api/matters/update-direct-field/route.ts:329:      noClioRead: true,
./app/api/matters/update-direct-field/route.ts:337:        clioWriteback: false,
./app/api/matters/update-direct-field/route.ts:338:        clioRead: false,
./package.json:2:  "name": "clio-lawsuit-aggregator",
./package.json:23:    "smoke:workflow:prod": "bash scripts/smoke-workflow.sh https://clio-lawsuit-aggregator.vercel.app",
./package.json:26:    "verify:active-operational-clio-routes-removed": "node scripts/verify-active-operational-clio-routes-removed.mjs",
./package.json:94:    "verify:clio-document-list-readonly-safety": "node scripts/verify-clio-document-list-readonly-safety.mjs",
./package.json:95:    "verify:clio-document-list-ui-safety": "node scripts/verify-clio-document-list-ui-safety.mjs",
./package.json:96:    "verify:clio-maildrop-delivery-safety": "node scripts/verify-clio-maildrop-delivery-safety.mjs",
./package.json:97:    "verify:clio-maildrop-inspection-safety": "node scripts/verify-clio-maildrop-inspection-safety.mjs",
./package.json:98:    "verify:clio-maildrop-resolve-source-scope-safety": "node scripts/verify-clio-maildrop-resolve-source-scope-safety.mjs",
./package.json:99:    "verify:clio-master-crossref-confirm-safety": "node scripts/verify-clio-master-crossref-confirm-safety.mjs",
./package.json:100:    "verify:clio-master-crossref-preview-safety": "node scripts/verify-clio-master-crossref-preview-safety.mjs",
./package.json:101:    "verify:clio-master-mapping-schema-safety": "node scripts/verify-clio-master-mapping-schema-safety.mjs",
./package.json:102:    "verify:clio-master-matter-confirm-safety": "node scripts/verify-clio-master-matter-confirm-safety.mjs",
./package.json:103:    "verify:clio-master-matter-preview-safety": "node scripts/verify-clio-master-matter-preview-safety.mjs",
./package.json:104:    "verify:clio-operational-routes-quarantined": "node scripts/verify-clio-operational-routes-quarantined.mjs",
./package.json:106:    "verify:create-lawsuit-clio-shell-contract": "node scripts/verify-create-lawsuit-clio-shell-contract.mjs",
./package.json:122:    "verify:direct-matter-clio-operational-callers-removed": "node scripts/verify-direct-matter-clio-operational-callers-removed.mjs",
./package.json:173:    "verify:legacy-clio-settlement-routes-disabled-safety": "node scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs",
./package.json:174:    "verify:legacy-operational-clio-modules-deleted": "node scripts/verify-legacy-operational-clio-modules-deleted.mjs",
./package.json:208:    "verify:no-operational-clio-hydration-regression": "node scripts/verify-no-operational-clio-hydration-regression.mjs",
./package.json:210:    "verify:packet-clio-master-mapping-safety": "node scripts/verify-packet-clio-master-mapping-safety.mjs",
./package.json:216:    "verify:prod": "bash scripts/verify-prod.sh && npm run verify:document-delivery-draft-preview-safety && npm run verify:document-delivery-preview-ui-safety && npm run verify:email-maildrop-unified-ui-safety && npm run verify:graph-background-thread-sync-safety && npm run verify:vercel-background-email-cron-safety && npm run verify:graph-maildrop-discovery-safety && npm run verify:maildrop-address-registry-safety && npm run verify:email-automation-status-safety && npm run verify:clio-maildrop-resolve-source-scope-safety && npm run verify:master-email-strict-display-filter-safety && npm run verify:administrator-header-opens-admin-home-only && npm run verify:settlement-history-display-contract && npm run verify:settlement-payment-due-tickler-open-only-safety && npm run verify:settlement-finalized-email-safety && npm run verify:settlement-void-safety && npm run verify:settlement-percent-normalization-safety && npm run verify:verifier-contract-locks && npm run verify:settlement-edit-word-web-hash-sync-safety && npm run verify:settlement-save-finalized-pdf-safety && npm run verify:settlement-delivery-green-info-box-removed && npm run verify:settlement-finalization-record-green-box-removed && npm run verify:settlement-delivery-void-notice-hidden-email-purple && npm run verify:settlement-document-popup-copy-simplified && npm run verify:settlement-tickler-auto-create-display-only-page-safety && npm run verify:settlement-recorded-panel-copy-simplified && npm run verify:settlement-void-deletes-payment-due-tickler-safety && npm run verify:settlement-payment-due-followup-date-label-safety && npm run verify:admin-generic-tickler-search-route-safety && npm run verify:admin-tickler-search-ui-safety && npm run verify:admin-tickler-advanced-search-fields-safety && npm run verify:admin-tickler-search-criteria-layout-safety && npm run verify:admin-tickler-reference-dropdowns-safety && npm run verify:admin-tickler-xls-export-safety && npm run verify:lawsuit-search-xls-export-safety && npm run verify:standard-xls-export-columns-safety && npm run verify:settlement-tickler-lawsuit-level-context-safety && npm run verify:admin-tickler-lawsuit-level-display-dedupe-safety && npm run verify:tickler-own-context-enrichment-safety && npm run verify:admin-tickler-no-autoload-simplified-results-safety && npm run verify:admin-tickler-result-links-safety && npm run verify:admin-tickler-enter-search-safety && npm run verify:create-lawsuit-clio-shell-contract && npm run verify:create-lawsuit-success-notice-history-safety && npm run verify:admin-lawsuit-cleanup-preview-safety && npm run verify:admin-lawsuit-cleanup-confirm-safety && npm run verify:admin-lawsuit-cleanup-history-safety",
./package.json:232:    "verify:settlement-close-preview-clio-eliminated-safety": "node scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs",
./package.json:335:    "verify:clio-rule1-boundary-safety": "node scripts/verify-clio-rule1-boundary-safety.mjs",
./package.json:336:    "verify:golden-rule-clio-boundary-safety": "node scripts/verify-clio-rule1-boundary-safety.mjs",
./package.json:337:    "verify:guarded-clio-close-sync-safety": "node scripts/verify-guarded-clio-close-sync-safety.mjs",
./app/api/graph/maildrop-discovery/route.ts:28:      clioRecordsChanged: false,
./app/api/graph/maildrop-discovery/route.ts:185:    clioMatterId: numberOrNull(record.clioMatterId),
./app/api/graph/maildrop-discovery/route.ts:186:    clioDisplayNumber: clean(record.clioDisplayNumber),
./app/api/graph/maildrop-discovery/route.ts:187:    clioMaildropEmail: clean(record.clioMaildropEmail),
./app/api/graph/maildrop-discovery/route.ts:188:    clioMaildropLabel: clean(record.clioMaildropLabel),
./app/api/graph/maildrop-discovery/route.ts:210:    clioRecordsChanged: false,
./app/api/graph/maildrop-discovery/route.ts:219:      "MailDrop discovery scans recent Microsoft Graph mailbox messages and matches only locally known Clio MailDrop recipient addresses.",
./app/api/graph/maildrop-discovery/route.ts:224:      "Does not write Clio.",
./app/api/graph/maildrop-discovery/route.ts:258:    const email = lowerEmail(record.clioMaildropEmail);
./app/api/graph/maildrop-discovery/route.ts:280:        "No locally known Clio MailDrop addresses were available for discovery.  Resolve or create at least one MailDrop-linked thread first.",
./app/api/graph/maildrop-discovery/route.ts:320:    clioMaildropEmail: email,
./app/api/graph/maildrop-discovery/route.ts:321:    clioMaildropLabel: clean(record?.clioMaildropLabel),
./app/api/graph/maildrop-discovery/route.ts:325:    clioMatterId: record?.clioMatterId ?? null,
./app/api/graph/maildrop-discovery/route.ts:326:    clioDisplayNumber: clean(record?.clioDisplayNumber),
./app/api/graph/maildrop-discovery/route.ts:357:    clioMaildropLabel: clean(match.maildrop.clioMaildropLabel),
./app/api/graph/maildrop-discovery/route.ts:361:    clioMatterId: match.maildrop.clioMatterId,
./app/api/graph/maildrop-discovery/route.ts:362:    clioDisplayNumber: clean(match.maildrop.clioDisplayNumber),
./app/api/graph/maildrop-discovery/route.ts:370:    clioMaildropLabel: match.clioMaildropLabel,
./app/api/graph/maildrop-discovery/route.ts:374:    clioMatterId: match.clioMatterId ?? null,
./app/api/graph/maildrop-discovery/route.ts:375:    clioDisplayNumber: match.clioDisplayNumber,
./app/api/graph/maildrop-discovery/route.ts:485:      "Confirmed MailDrop discovery completed.  This route read recent Microsoft Graph messages, matched locally known MailDrop recipients, and persisted local Barsh Matters email metadata only.  It did not create drafts, send email, write Clio, upload documents, or use local Outlook automation.",
./prisma/schema.prisma:36:  clioMasterMatterId          Int?
./prisma/schema.prisma:37:  clioMasterDisplayNumber     String?
./prisma/schema.prisma:38:  clioMasterMatterDescription String?
./prisma/schema.prisma:39:  clioMasterMappedAt          DateTime?
./prisma/schema.prisma:40:  clioMasterMappingSource     String?
./prisma/schema.prisma:44:  @@index([clioMasterMatterId])
./prisma/schema.prisma:45:  @@index([clioMasterDisplayNumber])
./prisma/schema.prisma:48:model ClioToken {
./prisma/schema.prisma:138:  clioUploadTarget      Json?
./prisma/schema.prisma:164:  clioDocumentId             String?
./prisma/schema.prisma:165:  clioDocumentName           String?
./prisma/schema.prisma:166:  clioDocumentVersionUuid    String?
./prisma/schema.prisma:181:  @@index([clioDocumentId])
./prisma/schema.prisma:321:  clioReadback           Json?
./prisma/schema.prisma:573:  clioMatterId        Int?
./prisma/schema.prisma:574:  clioDisplayNumber   String?
./prisma/schema.prisma:575:  clioMaildropEmail   String    @unique
./prisma/schema.prisma:576:  clioMaildropLabel   String?
./prisma/schema.prisma:587:  @@index([clioMatterId])
./prisma/schema.prisma:588:  @@index([clioDisplayNumber])
./prisma/schema.prisma:608:  clioMatterId             Int?
./prisma/schema.prisma:609:  clioDisplayNumber        String?
./prisma/schema.prisma:610:  clioMaildropEmail        String?
./prisma/schema.prisma:611:  clioMaildropLabel        String?
./prisma/schema.prisma:625:  @@index([clioMatterId])
./prisma/schema.prisma:626:  @@index([clioDisplayNumber])
./prisma/schema.prisma:689:  clioDocumentId          String?
./prisma/schema.prisma:690:  clioDocumentName        String?
./prisma/schema.prisma:691:  clioDocumentVersionUuid String?
./prisma/schema.prisma:699:  @@index([clioDocumentId])
./prisma/schema.prisma:736:  clioMatterId        Int?
./prisma/schema.prisma:737:  clioDisplayNumber   String?
./prisma/schema.prisma:749:  @@index([clioMatterId])
./prisma/schema.prisma:750:  @@index([clioDisplayNumber])
./prisma/schema.prisma:758:  targetSystem       String   @default("clio")
./prisma/schema.prisma:764:  clioRecordsChanged Boolean  @default(false)
./docs/implementation/clio-storage-refactor-phase1-checklist.md:4:- [ ] One master Clio matter will be created manually by admin.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:5:- [ ] BM will create bucket folders under the master Clio matter.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:9:- [ ] Clio stores generated documents, scans, uploaded emails, attachments, and other uploaded matter documents only.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:11:- [ ] Ordinary users do not access Clio directly.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:15:- [ ] Identify where BM currently creates Clio matters.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:16:- [ ] Identify where BM currently uses Clio-generated file numbers.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:17:- [ ] Identify where lawsuit aggregation creates a Clio matter.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:18:- [ ] Identify where documents are uploaded to Clio.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:19:- [ ] Identify where documents are retrieved from Clio.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:20:- [ ] Identify current database fields storing Clio matter/file-number references.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:21:- [ ] Identify tests expecting Clio matter creation.
./app/api/graph/background-thread-sync/route.ts:139:    clioMatterId: numberOrNull(thread.clioMatterId),
./app/api/graph/background-thread-sync/route.ts:140:    clioDisplayNumber: clean(thread.clioDisplayNumber),
./app/api/graph/background-thread-sync/route.ts:141:    clioMaildropEmail: clean(thread.clioMaildropEmail),
./app/api/graph/background-thread-sync/route.ts:142:    clioMaildropLabel: clean(thread.clioMaildropLabel),
./app/api/graph/background-thread-sync/route.ts:163:    clioRecordsChanged: false,
./app/api/graph/background-thread-sync/route.ts:177:      "Does not write Clio.",
./app/api/graph/background-thread-sync/route.ts:228:      clioMatterId: true,
./app/api/graph/background-thread-sync/route.ts:229:      clioDisplayNumber: true,
./app/api/graph/background-thread-sync/route.ts:230:      clioMaildropEmail: true,
./app/api/graph/background-thread-sync/route.ts:231:      clioMaildropLabel: true,
./app/api/graph/background-thread-sync/route.ts:330:      "Background known-thread sync completed.  This route read Microsoft Graph for locally stored conversationId values and persisted local Barsh Matters email metadata only.  It did not create drafts, send email, write Clio, upload documents, or use local Outlook automation.",
./app/page.tsx:871:  // Do not call legacy Clio hydration.  ClaimIndex/local Barsh Matters is the operational source of truth.
./app/api/aggregate/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/aggregate/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/aggregate");
./lib/claimIndexLawsuitMetadata.ts:66:      clioMasterMatterId: true,
./lib/claimIndexLawsuitMetadata.ts:67:      clioMasterDisplayNumber: true,
./lib/claimIndexLawsuitMetadata.ts:68:      clioMasterMatterDescription: true,
./lib/claimIndexLawsuitMetadata.ts:109:      clioMasterMatterId: row.clioMasterMatterId || lawsuit.clioMasterMatterId || null,
./lib/claimIndexLawsuitMetadata.ts:110:      clio_master_matter_id: row.clio_master_matter_id || lawsuit.clioMasterMatterId || null,
./lib/claimIndexLawsuitMetadata.ts:111:      clioMasterDisplayNumber: row.clioMasterDisplayNumber || lawsuit.clioMasterDisplayNumber || null,
./lib/claimIndexLawsuitMetadata.ts:112:      clio_master_display_number: row.clio_master_display_number || lawsuit.clioMasterDisplayNumber || null,
./lib/claimIndexLawsuitMetadata.ts:113:      clioMasterMatterDescription:
./lib/claimIndexLawsuitMetadata.ts:114:        row.clioMasterMatterDescription || lawsuit.clioMasterMatterDescription || null,
./lib/claimIndexLawsuitMetadata.ts:115:      clio_master_matter_description:
./lib/claimIndexLawsuitMetadata.ts:116:        row.clio_master_matter_description || lawsuit.clioMasterMatterDescription || null,
./app/api/matters/close/route.ts:3:import { syncClioMatterClosed } from "@/lib/clioCloseSync";
./app/api/matters/close/route.ts:23:function clioCloseSyncAuditSummary(result: {
./app/api/matters/close/route.ts:81:    const clioCloseSync = await syncClioMatterClosed({
./app/api/matters/close/route.ts:87:    if (!clioCloseSync.ok) {
./app/api/matters/close/route.ts:88:      return jsonError("Clio close sync failed. Local matter close was not committed.", 502, {
./app/api/matters/close/route.ts:91:        clioCloseSync,
./app/api/matters/close/route.ts:93:          clioCloseSyncAttempted: true,
./app/api/matters/close/route.ts:94:          clioClosed: false,
./app/api/matters/close/route.ts:128:          summary: `Closed matter ${claimIndex.display_number || claimIndex.matter_id} locally and in Clio with reason ${closeReason}.`,
./app/api/matters/close/route.ts:141:            storage: "ClaimIndex + Clio matter status",
./app/api/matters/close/route.ts:142:            clioCloseSyncRequired: true,
./app/api/matters/close/route.ts:143:            clioCloseSyncReadOnly: false,
./app/api/matters/close/route.ts:144:            clioCloseSync: clioCloseSyncAuditSummary(clioCloseSync),
./app/api/matters/close/route.ts:163:      source: "claimindex-and-clio",
./app/api/matters/close/route.ts:164:      clioCloseSyncRequired: true,
./app/api/matters/close/route.ts:165:      clioCloseSyncReadOnly: false,
./app/api/matters/close/route.ts:182:      clioCloseSync,
./app/api/matters/close/route.ts:184:        clioCloseSyncAttempted: true,
./app/api/matters/close/route.ts:185:        clioClosed: true,
./app/api/matters/close/route.ts:186:        clioWrite: true,
./app/api/matters/close/route.ts:187:        clioRead: false,
./app/api/graph/live-token-test/route.ts:27:        clioRecordsChanged: false,
./app/api/graph/live-token-test/route.ts:52:        clioRecordsChanged: false,
./app/api/graph/live-token-test/route.ts:78:      clioRecordsChanged: false,
./app/matter/[id]/page.tsx.bak.guardrails:163:        `/api/clio/matter-context?matterId=${matterId}`
./app/matter/[id]/page.tsx.bak.guardrails:184:            `/api/clio/matter-context?matterId=${id}`
./app/api/settlements/local-provider-fee-defaults/route.ts:115:            clioRecordsChanged: false,
./app/api/settlements/local-provider-fee-defaults/route.ts:216:        clioRecordsChanged: false,
./app/api/settlements/local-provider-fee-defaults/route.ts:232:          clioRecordsChanged: false,
./app/matters/page.tsx:1246:  const [masterClioDocumentsLoading, setMasterClioDocumentsLoading] = useState(false);
./app/matters/page.tsx:1247:  const [masterClioDocumentsResult, setMasterClioDocumentsResult] = useState<any>(null);
./app/matters/page.tsx:1321:  async function loadMasterClioDocuments() {
./app/matters/page.tsx:1325:      setMasterClioDocumentsResult({
./app/matters/page.tsx:1327:        error: "No Lawsuit ID is available for Clio document lookup.",
./app/matters/page.tsx:1334:      setMasterClioDocumentsLoading(true);
./app/matters/page.tsx:1337:        `/api/documents/clio-matter-documents?masterLawsuitId=${encodeURIComponent(masterId)}`,
./app/matters/page.tsx:1342:      setMasterClioDocumentsResult(
./app/matters/page.tsx:1345:          error: "Could not parse Clio document list response.",
./app/matters/page.tsx:1350:      setMasterClioDocumentsResult({
./app/matters/page.tsx:1356:      setMasterClioDocumentsLoading(false);
./app/matters/page.tsx:1361:    const raw = masterDocumentPreviewText(doc?.latestDocumentVersion?.filename) || masterDocumentPreviewText(doc?.clioDocumentFilename) || masterDocumentPreviewText(doc?.clioDocumentName);
./app/matters/page.tsx:1381:  function masterClioDocumentsArray(): any[] {
./app/matters/page.tsx:1382:    return Array.isArray(masterClioDocumentsResult?.documents)
./app/matters/page.tsx:1383:      ? masterClioDocumentsResult.documents
./app/matters/page.tsx:1388:    return masterClioDocumentsArray().find((doc: any) => masterDocumentPreviewText(doc.clioDocumentId) === masterSelectedViewDocumentId) || null;
./app/matters/page.tsx:1395:    if (!masterClioDocumentsResult && !masterClioDocumentsLoading) {
./app/matters/page.tsx:1396:      await loadMasterClioDocuments();
./app/matters/page.tsx:1408:    const docs = masterClioDocumentsArray();
./app/matters/page.tsx:1447:            {masterClioDocumentsResult?.ok === false && (
./app/matters/page.tsx:1449:                {masterDocumentPreviewText(masterClioDocumentsResult.error) || "Could not load Clio documents."}
./app/matters/page.tsx:1453:            {masterClioDocumentsLoading && (
./app/matters/page.tsx:1454:              <div style={{ padding: 12, border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc", color: "#475569", fontWeight: 800 }}>Loading documents from Clio...</div>
./app/matters/page.tsx:1457:            {masterClioDocumentsResult?.ok && docs.length === 0 && (
./app/matters/page.tsx:1458:              <div style={{ padding: 12, border: "1px dashed #cbd5e1", borderRadius: 10, background: "#f8fafc", color: "#64748b", fontWeight: 800 }}>No documents are currently listed in the mapped Clio master matter Documents tab.</div>
./app/matters/page.tsx:1464:                  const id = masterDocumentPreviewText(doc.clioDocumentId);
./app/matters/page.tsx:1472:                    <button key={id || masterDocumentPreviewText(doc.clioDocumentName)} type="button" title={opensInline ? "Select and open PDF in a new tab." : opensEmail ? "Select and open email as PDF." : opensWord ? "Select and open document in Word." : "Select document."} onClick={() => { if (!id) return; setMasterSelectedViewDocumentId(id); const params = new URLSearchParams(); params.set("documentId", id); params.set("filename", displayName); if (opensInline) { params.set("mode", "inline"); window.open("/api/documents/clio-document-open?" + params.toString(), "_blank", "noopener,noreferrer"); return; } if (opensEmail) { params.set("mode", "email-pdf"); window.open("/api/documents/clio-document-open?" + params.toString(), "_blank", "noopener,noreferrer"); return; } if (opensWord) { params.set("mode", "edit"); const editUrl = window.location.origin + "/api/documents/clio-document-open?" + params.toString(); window.location.href = "ms-word:ofe|u|" + editUrl; return; } }} style={{ display: "block", width: "100%", textAlign: "left", border: 0, borderBottom: "1px solid #e5e7eb", background: selected ? "#eff6ff" : "#ffffff", color: "#0f172a", padding: 12, cursor: id ? "pointer" : "not-allowed", opacity: id ? 1 : 0.6 }}>
./app/matters/page.tsx:1478:                        Source: {masterDocumentPreviewText(doc.sourceLabel) || masterDocumentPreviewText(doc.sourceClioDisplayNumber) || "—"}
./app/matters/page.tsx:1491:                  <div><strong>Source Matter:</strong> {masterDocumentPreviewText(selectedDoc.sourceClioDisplayNumber) || "—"}</div>
./app/matters/page.tsx:1496:                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>Select a document to view its stored Clio source metadata.</div>
./app/matters/page.tsx:1502:            <button type="button" onClick={closeMasterViewDocumentsPopup} disabled={masterClioDocumentsLoading} style={{ minWidth: 96, height: 38, border: "1px solid #cbd5e1", borderRadius: 10, background: masterClioDocumentsLoading ? "#f3f4f6" : "#f8fafc", color: masterClioDocumentsLoading ? "#94a3b8" : "#334155", fontWeight: 900, cursor: masterClioDocumentsLoading ? "not-allowed" : "pointer" }}>Close</button>
./app/matters/page.tsx:1503:            <button type="button" onClick={() => void loadMasterClioDocuments()} disabled={masterClioDocumentsLoading} style={{ minWidth: 148, height: 38, border: "1px solid #1e3a8a", borderRadius: 10, background: masterClioDocumentsLoading ? "#93c5fd" : "#1e3a8a", color: "#ffffff", fontWeight: 900, cursor: masterClioDocumentsLoading ? "not-allowed" : "pointer" }}>{masterClioDocumentsLoading ? "Refreshing..." : "Refresh Documents"}</button>
./app/matters/page.tsx:2362:        clioWriteAttempted: false,
./app/matters/page.tsx:2961:          "VOID SETTLEMENT\n\nThis will void the active local settlement record and restore the Record Settlement workflow.  It will not delete Clio documents, print queue records, email records, or local settlement rows.\n\nEnter a reason for voiding this settlement:"
./app/matters/page.tsx:4964:    const response = await fetch(`/api/documents/clio-maildrop-resolve?source=master_lawsuit&masterLawsuitId=${queryMasterLawsuitId}`);
./app/matters/page.tsx:4968:      throw new Error(json?.error || "Could not resolve the master lawsuit Clio Maildrop address.");
./app/matters/page.tsx:4973:      clioMaildropEmail: json.maildropEmail || context.clioMaildropEmail,
./app/matters/page.tsx:4974:      clioMaildropLabel: json.maildropLabel || context.clioMaildropLabel,
./app/matters/page.tsx:5040:    const clioDocumentId =
./app/matters/page.tsx:5041:      source.clioDocumentId ||
./app/matters/page.tsx:5042:      source.existingClioDocumentId ||
./app/matters/page.tsx:5047:    const clioDocumentVersionUuid =
./app/matters/page.tsx:5048:      source.clioDocumentVersionUuid ||
./app/matters/page.tsx:5050:      source.existingClioDocumentVersionUuid ||
./app/matters/page.tsx:5056:      source.clioDocumentName ||
./app/matters/page.tsx:5057:      source.existingClioDocumentName ||
./app/matters/page.tsx:5062:    const clioDisplayNumber =
./app/matters/page.tsx:5063:      result.clioUploadTarget?.displayNumber ||
./app/matters/page.tsx:5064:      source.clioDisplayNumber ||
./app/matters/page.tsx:5065:      source.clioUploadTargetDisplayNumber ||
./app/matters/page.tsx:5068:    const clioMatterId =
./app/matters/page.tsx:5069:      result.clioUploadTarget?.id ||
./app/matters/page.tsx:5070:      result.clioUploadTarget?.matterId ||
./app/matters/page.tsx:5071:      result.clioUploadTarget?.clioMatterId ||
./app/matters/page.tsx:5072:      source.clioMatterId ||
./app/matters/page.tsx:5073:      source.clioUploadTargetMatterId ||
./app/matters/page.tsx:5074:      masterClioDocumentsResult?.clioMatterId ||
./app/matters/page.tsx:5079:      id: clioDocumentId,
./app/matters/page.tsx:5080:      clioDocumentId,
./app/matters/page.tsx:5081:      clioDocumentVersionUuid,
./app/matters/page.tsx:5083:      clioDocumentName: filename,
./app/matters/page.tsx:5090:      masterDisplayNumber: clioDisplayNumber,
./app/matters/page.tsx:5091:      clioDisplayNumber,
./app/matters/page.tsx:5092:      clioMatterId,
./app/matters/page.tsx:5093:      clioUploadTargetMatterId: clioMatterId,
./app/matters/page.tsx:5110:    if (!selectedCandidate?.clioDocumentId) {
./app/matters/page.tsx:5113:      setMasterSettlementEmailNotice("Finalize the settlement document first.  The email workflow requires a finalized PDF from the mapped master Clio matter Documents tab.");
./app/matters/page.tsx:5116:        error: "Finalize the settlement document first.  The email workflow requires a finalized PDF from the mapped master Clio matter Documents tab.",
./app/matters/page.tsx:5138:        clioDocumentId:
./app/matters/page.tsx:5139:          selectedCandidate.clioDocumentId ||
./app/matters/page.tsx:5140:          selectedCandidate.existingClioDocumentId ||
./app/matters/page.tsx:5144:        existingClioDocumentId: selectedCandidate.existingClioDocumentId || selectedCandidate.id || "",
./app/matters/page.tsx:5145:        clioMatterId:
./app/matters/page.tsx:5146:          selectedCandidate.clioMatterId ||
./app/matters/page.tsx:5147:          selectedCandidate.clioUploadTargetMatterId ||
./app/matters/page.tsx:5148:          masterDocumentFinalizationResult?.clioUploadTarget?.id ||
./app/matters/page.tsx:5149:          masterDocumentFinalizationResult?.clioUploadTarget?.matterId ||
./app/matters/page.tsx:5150:          masterDocumentFinalizationResult?.clioUploadTarget?.clioMatterId ||
./app/matters/page.tsx:5151:          masterClioDocumentsResult?.clioMatterId ||
./app/matters/page.tsx:5153:        clioUploadTargetMatterId:
./app/matters/page.tsx:5154:          selectedCandidate.clioUploadTargetMatterId ||
./app/matters/page.tsx:5155:          selectedCandidate.clioMatterId ||
./app/matters/page.tsx:5156:          masterDocumentFinalizationResult?.clioUploadTarget?.id ||
./app/matters/page.tsx:5157:          masterDocumentFinalizationResult?.clioUploadTarget?.matterId ||
./app/matters/page.tsx:5158:          masterDocumentFinalizationResult?.clioUploadTarget?.clioMatterId ||
./app/matters/page.tsx:5159:          masterClioDocumentsResult?.clioMatterId ||
./app/matters/page.tsx:5161:        clioDisplayNumber:
./app/matters/page.tsx:5162:          selectedCandidate.clioDisplayNumber ||
./app/matters/page.tsx:5164:          masterDocumentFinalizationResult?.clioUploadTarget?.displayNumber ||
./app/matters/page.tsx:5165:          masterClioDocumentsResult?.clioDisplayNumber ||
./app/matters/page.tsx:5167:        clioDocumentVersionUuid: selectedCandidate.clioDocumentVersionUuid || selectedCandidate.existingClioDocumentVersionUuid || "",
./app/matters/page.tsx:5168:        existingClioDocumentVersionUuid: selectedCandidate.existingClioDocumentVersionUuid || selectedCandidate.clioDocumentVersionUuid || "",
./app/matters/page.tsx:5241:        pdfFilename: selectedCandidate?.filename || selectedCandidate?.clioDocumentName || baseContext.documentLabel,
./app/matters/page.tsx:5242:        clioDocumentId: selectedCandidate?.clioDocumentId || selectedCandidate?.id || "",
./app/matters/page.tsx:5243:        clioDocumentVersionUuid: selectedCandidate?.clioDocumentVersionUuid || selectedCandidate?.latestDocumentVersion?.uuid || "",
./app/matters/page.tsx:5249:          error: "Finalize the document before preparing an email draft.  The email workflow requires a finalized PDF from the mapped master Clio matter Documents tab.",
./app/matters/page.tsx:5328:            `Cc / MailDrop: ${context.clioMaildropLabel || "MailDrop"} ${context.clioMaildropEmail ? "<" + context.clioMaildropEmail + ">" : "not resolved"}\n` +
./app/matters/page.tsx:5339:                      item?.clioDocumentId ? "Clio Document ID: " + item.clioDocumentId : "",
./app/matters/page.tsx:5399:      candidate?.clioDocumentUrl ||
./app/matters/page.tsx:5405:    const clioDocumentId =
./app/matters/page.tsx:5406:      candidate?.clioDocumentId ||
./app/matters/page.tsx:5407:      candidate?.existingClioDocumentId ||
./app/matters/page.tsx:5412:    if (clioDocumentId) {
./app/matters/page.tsx:5414:      params.set("documentId", String(clioDocumentId));
./app/matters/page.tsx:5416:      const filename = String(candidate?.filename || candidate?.clioDocumentName || candidate?.name || "").trim();
./app/matters/page.tsx:5418:      return `/api/documents/clio-document-open?${params.toString()}`;
./app/matters/page.tsx:5425:    const filename = String(candidate?.filename || candidate?.clioDocumentName || "").toLowerCase();
./app/matters/page.tsx:5431:    const filename = String(candidate?.filename || candidate?.clioDocumentName || "").toLowerCase();
./app/matters/page.tsx:5459:      throw new Error("No finalized Clio-verified documents are available.  Upload final documents to Clio first.");
./app/matters/page.tsx:5466:      String(json?.clioUploadTarget?.displayNumber || json?.masterDisplayNumber || "").trim().toLowerCase();
./app/matters/page.tsx:5485:      const filename = String(candidate?.filename || candidate?.clioDocumentName || "").trim().toLowerCase();
./app/matters/page.tsx:5487:        String(candidate?.masterDisplayNumber || candidate?.clioDisplayNumber || candidate?.displayNumber || "").trim().toLowerCase();
./app/matters/page.tsx:5531:      const filename = String(selectedCandidate?.filename || selectedCandidate?.clioDocumentName || selectedTemplate?.label || "Document");
./app/matters/page.tsx:5571:        currentClioExistenceVerified: json?.verification?.currentClioExistenceVerified === true,
./app/matters/page.tsx:5574:        clioDocumentsTabRemainsSourceOfTruth: true,
./app/matters/page.tsx:5696:    const settlementFinalizedPdfSaveLocalSuccessCopy = "The finalized settlement PDF from the mapped master Clio matter Documents tab was opened for local saving.";
./app/matters/page.tsx:5730:        selectedCandidate?.clioDocumentName ||
./app/matters/page.tsx:5731:        selectedCandidate?.existingClioDocumentName ||
./app/matters/page.tsx:5754:        clioRecordsChanged: false,
./app/matters/page.tsx:5782:      if (!selectedCandidate?.clioDocumentId && !selectedCandidate?.clioDocumentVersionUuid && !selectedCandidate?.downloadUrl) {
./app/matters/page.tsx:5783:        alert("Finalize the settlement document first.  The print workflow requires a finalized PDF from the mapped master Clio matter Documents tab.");
./app/matters/page.tsx:5813:          selectedCandidate.clioDocumentName ||
./app/matters/page.tsx:5818:        clioDocumentId: selectedCandidate.clioDocumentId || "",
./app/matters/page.tsx:5819:        clioDocumentVersionUuid: selectedCandidate.clioDocumentVersionUuid || "",
./app/matters/page.tsx:5822:        clioRecordsChanged: false,
./app/matters/page.tsx:5824:        note: "Opened the finalized settlement PDF from the mapped master Clio matter Documents tab for printing.",
./app/matters/page.tsx:5845:        throw new Error("Barsh Matters found a current Clio-verified finalized document, but the preview contract did not expose an openable file URL.");
./app/matters/page.tsx:5879:        filename: selectedCandidate?.filename || selectedCandidate?.clioDocumentName || "",
./app/matters/page.tsx:5883:        currentClioExistenceVerified: json?.verification?.currentClioExistenceVerified === true,
./app/matters/page.tsx:5885:        clioDocumentsTabRemainsSourceOfTruth: true,
./app/matters/page.tsx:5944:  async function uploadMasterFinalDocumentsToClio() {
./app/matters/page.tsx:5955:      alert("Run Master Finalization Preview successfully before uploading final documents to Clio.");
./app/matters/page.tsx:5963:    const uploadableDocuments = plannedDocuments.filter((doc: any) => doc?.wouldGenerate && doc?.wouldUploadToClio);
./app/matters/page.tsx:5971:      masterDocumentPreviewText(masterFinalizePreview?.clioUploadTarget?.displayNumber) || "the mapped master Clio matter";
./app/matters/page.tsx:5972:    const targetMatterId = masterDocumentPreviewText(masterFinalizePreview?.clioUploadTarget?.matterId);
./app/matters/page.tsx:5979:      `FINALIZE AND UPLOAD MASTER/LAWSUIT DOCUMENTS TO CLIO\n\n` +
./app/matters/page.tsx:5981:        `This will upload the following final document copy/copies to the mapped master Clio matter Documents tab:\n\n` +
./app/matters/page.tsx:5984:        `WARNING: Running this again may create duplicate uploaded documents in Clio.\n\n` +
./app/matters/page.tsx:6018:      await loadMasterClioDocuments();
./app/matters/page.tsx:6021:      alert(`Master final upload complete.\n\nUploaded to Clio: ${uploadedCount} document(s).`);
./app/matters/page.tsx:6343:      await loadMasterClioDocuments();
./app/matters/page.tsx:6408:      setMasterSettlementUploadNotice("Uploading finalized PDF to Clio matter BRL30148");
./app/matters/page.tsx:6441:      const settlementClioDisplayNumber = json?.clioUploadTarget?.displayNumber || "BRL30148";
./app/matters/page.tsx:6444:          ? `Uploaded finalized PDF to Clio matter ${settlementClioDisplayNumber}`
./app/matters/page.tsx:6445:          : `Finalized PDF already exists in Clio matter ${settlementClioDisplayNumber}; duplicate upload skipped`;
./app/matters/page.tsx:6528:        "Barsh Matters will add currently Clio-verified finalized document file(s) to the print queue.  Existing queue records are skipped.\n\n" +
./app/matters/page.tsx:6624:      clioDisplayNumber: clean(matchingThread?.clioDisplayNumber),
./app/matters/page.tsx:6625:      clioMaildropLabel: clean(matchingThread?.clioMaildropLabel),
./app/matters/page.tsx:6730:      "Sync this Microsoft Graph thread to this Master Lawsuit in Barsh Matters?\n\nThis will read Microsoft Graph and update local EmailThread / EmailMessage metadata only.  It will not create a draft, send email, write Clio, upload documents, or use local Outlook automation."
./app/matters/page.tsx:6779:              Unified Master Lawsuit email area.  Graph-synced messages and MailDrop-linked thread records appear here together from local Barsh Matters email metadata.  Opening this panel reads local records only; it does not create drafts, send email, write Clio, or change database records.
./app/matters/page.tsx:6976:                  Confirmed sync persists local Barsh Matters email metadata only.  It does not send email, create drafts, write Clio, upload documents, or use local Outlook automation.
./app/matters/page.tsx:7020:                        {formatMasterEmailThreadTimestamp(thread.latestMessageAt)} · {messages.length} message{messages.length === 1 ? "" : "s"} · {clean(thread.clioMaildropLabel) || "No MailDrop label"}
./app/matters/page.tsx:7114:                    <div><div style={{ fontSize: 11, color: colors.subtle, fontWeight: 900, textTransform: "uppercase" }}>MailDrop Present</div><div style={{ marginTop: 3, fontSize: 13, fontWeight: 850, color: thread.clioMaildropEmailPresent ? "#16a34a" : "#dc2626" }}>{thread.clioMaildropEmailPresent ? "Yes" : "No"}</div></div>
./app/matters/page.tsx:7688:                  !displayedSelectedTemplate ? "Select a document first." : "Finalize and upload the selected document to Clio."
./app/matters/page.tsx:7880:                  Run the finalization preview first.  If the mapped master Clio matter is resolved and the document plan is generation-ready, Upload Final Documents to Clio becomes available.
./app/matters/page.tsx:7889:                  "Preview the mapped master Clio upload target and planned final documents before uploading."
./app/matters/page.tsx:7893:                  masterFinalizeUploadLoading ? "Uploading..." : "Upload Final Documents to Clio",
./app/matters/page.tsx:7894:                  uploadMasterFinalDocumentsToClio,
./app/matters/page.tsx:7914:                  <strong>Finalize step:</strong> This is the final review step.  Use the delivery buttons below after reviewing the selected document data.  PDF finalization, Clio document-vault upload, and persistent Barsh Matters document records will be wired in the backend finalization phase.
./app/matters/page.tsx:7936:                  Preview only.  No files were persisted, no documents were uploaded to Clio, no Clio records were changed, and no database records were changed.
./app/matters/page.tsx:7941:                    <strong>Clio Upload Target:</strong><br />
./app/matters/page.tsx:7942:                    {masterDocumentPreviewText(masterFinalizePreview?.clioUploadTarget?.displayNumber) || "—"}
./app/matters/page.tsx:7943:                    {masterFinalizePreview?.clioUploadTarget?.matterId
./app/matters/page.tsx:7944:                      ? ` / Matter ID ${masterFinalizePreview.clioUploadTarget.matterId}`
./app/matters/page.tsx:7949:                    {masterDocumentPreviewText(masterFinalizePreview?.clioUploadTarget?.type) || "—"}
./app/matters/page.tsx:7985:                    Existing Clio document warning: one or more planned final documents already exists in the mapped master Clio matter Documents tab.  The upload endpoint skips exact filename matches by default to prevent duplicates.
./app/matters/page.tsx:8057:                        title="Create an Outlook draft with the finalized settlement PDF attached from the mapped master Clio matter."
./app/matters/page.tsx:8189:                    ? `Print queue item ID ${masterDocumentPrintQueueResult.printQueueItem?.id || "created"} was saved locally.  No PDF was generated, no Clio upload occurred, no Outlook draft was created, and no email was sent.`
./app/matters/page.tsx:8222:                  Read-only local data available for future Master Lawsuit templates.  It does not generate documents, upload documents, write to Clio, or change the print queue.
./app/matters/page.tsx:8383:                        <li key={`${attachment?.clioDocumentId || attachment?.name || "attachment"}-${index}`}>
./app/matters/page.tsx:8643:                Use this delivery popup after Master/Lawsuit final upload completes or is safely processed with duplicate-file skipping.  Email prepares an Outlook draft preview, Print opens a current Clio-verified finalized document, and Queue adds current Clio-verified finalized document records to the Barsh Matters print queue.
./app/matters/page.tsx:8677:                  Choose how to deliver the finalized document.  Email prepares an Outlook draft preview; Edit opens DOCX files through Word when available; Print opens PDFs inline and DOCX files as a browser-controlled file; Queue adds finalized Clio-verified files to the Barsh Matters print queue.
./app/matters/page.tsx:8749:              const maildropDisplay = context?.clioMaildropEmail
./app/matters/page.tsx:8750:                ? `${context?.clioMaildropLabel || "MailDrop"} <${context.clioMaildropEmail}>`
./app/matters/page.tsx:8774:                      Preview only.  No Outlook draft is created unless Create Outlook Draft is clicked.  This does not send email, write Clio, upload documents, print, or queue anything.
./app/matters/page.tsx:8821:                          Use this only when local contact/reference data has not supplied a recipient.  Enter a valid email address such as name@example.com.  It affects the draft creation request only; it does not write Clio or update reference data.
./app/matters/page.tsx:8844:                        <div>Writes Clio: No</div>
./app/matters/page.tsx:8945:              This is a read-only review of the data available for future Master Lawsuit templates.  It reads local Lawsuit metadata, ClaimIndex, and local reference data only.  It does not generate documents, upload documents, write to Clio, or change the print queue.
./app/matters/page.tsx:8997:                <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Clio Correctness Dependency</div>
./app/matters/page.tsx:8998:                <div style={{ fontWeight: 900 }}>{documentData.clioCorrectnessDependency ? "Yes" : "No"}</div>
./app/matters/page.tsx:9465:                    <option value="placeholder-person-contact">Clio Person Contact — to be wired</option>
./app/matters/page.tsx:10574:                          <button type="button" title="Open the Master Lawsuit Clio document picker." onClick={() => void openMasterViewDocumentsPopup()} style={{ minHeight: 36, border: "1px solid #8b5e3c", borderRadius: 999, background: "#f8efe7", color: "#7c4a22", fontSize: 12, fontWeight: 950, cursor: "pointer", padding: "0 14px" }} data-barsh-master-view-documents-button="true">View Documents</button>
./app/matters/page.tsx:12471:                        Preview only.  This reads Barsh Matters ClaimIndex data and does not write Clio, write the database, generate documents, print, queue, or close matters.
./app/matters/page.tsx:12536:                            Local save result.  This saves to Barsh Matters local settlement tables only and does not write Clio, generate documents, print, queue, or close matters.
./app/matters/page.tsx:12633:                        "Calculate and record the settlement in Barsh Matters, then open the settlement document workflow.  This does not write Clio, print, queue, or close matters."
./app/api/matters/apply-payment/route.ts:364:        clioWriteConfirmed: false,
./app/api/matters/apply-payment/route.ts:365:        clioWriteAttempted: false,
./app/api/matters/apply-payment/route.ts:514:        clioReadback: Prisma.JsonNull,
./app/api/matters/apply-payment/route.ts:520:          clioWriteConfirmed: false,
./app/api/matters/apply-payment/route.ts:521:          clioWriteAttempted: false,
./app/api/matters/apply-payment/route.ts:571:        clioWriteAttempted: false,
./app/api/matters/apply-payment/route.ts:586:      clioWriteConfirmed: false,
./app/api/matters/apply-payment/route.ts:587:      clioReadback: Prisma.JsonNull,
./app/api/matters/apply-payment/route.ts:591:        reason: "local-first-payment-posting-no-clio-refresh",
./app/api/matters/apply-payment/route.ts:597:        clioWriteConfirmed: false,
./app/api/matters/apply-payment/route.ts:598:        clioWriteAttempted: false,
./app/api/matters/apply-payment/route.ts:712:        clioReadback: Prisma.JsonNull,
./app/api/matters/apply-payment/route.ts:717:          clioWriteConfirmed: false,
./app/api/matters/apply-payment/route.ts:718:          clioWriteAttempted: false,
./app/api/matters/apply-payment/route.ts:754:        clioWriteAttempted: false,
./app/api/matters/apply-payment/route.ts:768:      clioWriteConfirmed: false,
./app/api/matters/apply-payment/route.ts:769:      clioReadback: Prisma.JsonNull,
./app/api/matters/apply-payment/route.ts:773:        reason: "local-first-payment-void-no-clio-refresh",
./app/api/matters/apply-payment/route.ts:779:        clioWriteConfirmed: false,
./app/api/matters/apply-payment/route.ts:780:        clioWriteAttempted: false,
./app/api/court-calendar/events/route.ts:72:        clioRecordsChanged: false,
./app/api/court-calendar/events/route.ts:319:        clioRecordsChanged: false,
./app/api/court-calendar/events/route.ts:480:          clioRecordsChanged: false,
./app/api/court-calendar/events/route.ts:569:        clioRecordsChanged: false,
./package-lock.json:2:  "name": "clio-lawsuit-aggregator",
./package-lock.json:8:      "name": "clio-lawsuit-aggregator",
./app/api/graph/create-draft/route.ts:3:import { clioFetch } from "@/lib/clio";
./app/api/graph/create-draft/route.ts:4:import { listClioMatterDocuments } from "@/lib/clioDocumentUpload";
./app/api/graph/create-draft/route.ts:28:async function resolveClioMatterIdForAttachment(attachment: any): Promise<number | null> {
./app/api/graph/create-draft/route.ts:30:    clean(attachment?.clioMatterId || attachment?.clioUploadTargetMatterId || attachment?.matterId)
./app/api/graph/create-draft/route.ts:35:    attachment?.clioDisplayNumber ||
./app/api/graph/create-draft/route.ts:38:    attachment?.clioUploadTargetDisplayNumber
./app/api/graph/create-draft/route.ts:54:    const res = await clioFetch(path);
./app/api/graph/create-draft/route.ts:71:async function resolveClioDocumentIdForAttachment(attachment: any, filename: string): Promise<string> {
./app/api/graph/create-draft/route.ts:73:    clean(attachment?.clioDocumentId) ||
./app/api/graph/create-draft/route.ts:74:    clean(attachment?.existingClioDocumentId) ||
./app/api/graph/create-draft/route.ts:80:  const matterId = await resolveClioMatterIdForAttachment(attachment);
./app/api/graph/create-draft/route.ts:87:    attachment?.clioDocumentName ||
./app/api/graph/create-draft/route.ts:88:    attachment?.existingClioDocumentName ||
./app/api/graph/create-draft/route.ts:95:  const documents = await listClioMatterDocuments(matterId);
./app/api/graph/create-draft/route.ts:98:      clean(doc?.name || doc?.filename || doc?.clioDocumentName).toLowerCase() === targetName
./app/api/graph/create-draft/route.ts:101:      const candidate = clean(doc?.name || doc?.filename || doc?.clioDocumentName).toLowerCase();
./app/api/graph/create-draft/route.ts:118:  let clioDocumentId =
./app/api/graph/create-draft/route.ts:119:    clean(attachment?.clioDocumentId) ||
./app/api/graph/create-draft/route.ts:120:    clean(attachment?.existingClioDocumentId) ||
./app/api/graph/create-draft/route.ts:124:  clioDocumentId = clioDocumentId || await resolveClioDocumentIdForAttachment(attachment, name);
./app/api/graph/create-draft/route.ts:126:  const clioDocumentVersionUuid =
./app/api/graph/create-draft/route.ts:127:    clean(attachment?.clioDocumentVersionUuid) ||
./app/api/graph/create-draft/route.ts:128:    clean(attachment?.existingClioDocumentVersionUuid) ||
./app/api/graph/create-draft/route.ts:131:  if (clioDocumentId || clioDocumentVersionUuid) {
./app/api/graph/create-draft/route.ts:132:    const downloadPath = clioDocumentId
./app/api/graph/create-draft/route.ts:133:      ? `/api/v4/documents/${encodeURIComponent(clioDocumentId)}/download`
./app/api/graph/create-draft/route.ts:134:      : `/api/v4/document_versions/${encodeURIComponent(clioDocumentVersionUuid)}/download`;
./app/api/graph/create-draft/route.ts:136:    const downloadLabel = clioDocumentId || clioDocumentVersionUuid;
./app/api/graph/create-draft/route.ts:137:    const downloadSource = clioDocumentId ? "clio-document-download" : "clio-document-version-download";
./app/api/graph/create-draft/route.ts:139:    const downloadRes = await clioFetch(downloadPath);
./app/api/graph/create-draft/route.ts:144:        `Could not download finalized Clio document ${downloadLabel} for attachment: ${downloadRes.status} ${downloadRes.statusText}${text ? ` ${text.slice(0, 500)}` : ""}`
./app/api/graph/create-draft/route.ts:151:      throw new Error(`Finalized Clio document ${downloadLabel} downloaded as an empty file.`);
./app/api/graph/create-draft/route.ts:240:    !clean(context.clioMaildropEmail) && body?.matterId
./app/api/graph/create-draft/route.ts:244:  if (resolvedMaildrop?.clioMaildropEmail) {
./app/api/graph/create-draft/route.ts:247:      clioMaildropEmail: resolvedMaildrop.clioMaildropEmail,
./app/api/graph/create-draft/route.ts:248:      clioMaildropLabel: resolvedMaildrop.clioMaildropLabel,
./app/api/graph/create-draft/route.ts:256:      (context.clioMaildropEmail
./app/api/graph/create-draft/route.ts:257:        ? [{ name: context.clioMaildropLabel || "MailDrop", email: context.clioMaildropEmail }]
./app/api/graph/create-draft/route.ts:262:  if (resolvedMaildrop?.clioMaildropEmail) {
./app/api/graph/create-draft/route.ts:265:        name: resolvedMaildrop.clioMaildropLabel,
./app/api/graph/create-draft/route.ts:266:        email: resolvedMaildrop.clioMaildropEmail,
./app/api/graph/create-draft/route.ts:287:    clean(context.matterDisplayNumber || context.clioDisplayNumber) ||
./app/api/graph/create-draft/route.ts:309:            clioMatterId: context.clioMatterId,
./app/api/graph/create-draft/route.ts:310:            clioDisplayNumber: clean(context.clioDisplayNumber),
./app/api/graph/create-draft/route.ts:311:            clioMaildropEmail: clean(context.clioMaildropEmail),
./app/api/graph/create-draft/route.ts:312:            clioMaildropLabel: clean(context.clioMaildropLabel),
./app/api/graph/create-draft/route.ts:327:    clioRecordsChanged: false,
./app/api/graph/create-draft/route.ts:375:    const clioDocumentId =
./app/api/graph/create-draft/route.ts:376:      clean(attachment?.clioDocumentId) ||
./app/api/graph/create-draft/route.ts:377:      clean(attachment?.existingClioDocumentId) ||
./app/api/graph/create-draft/route.ts:381:    const clioDocumentVersionUuid =
./app/api/graph/create-draft/route.ts:382:      clean(attachment?.clioDocumentVersionUuid) ||
./app/api/graph/create-draft/route.ts:384:      clean(attachment?.existingClioDocumentVersionUuid);
./app/api/graph/create-draft/route.ts:394:      clean(attachment?.clioDocumentName) ||
./app/api/graph/create-draft/route.ts:395:      clean(attachment?.existingClioDocumentName) ||
./app/api/graph/create-draft/route.ts:403:      clioDocumentId,
./app/api/graph/create-draft/route.ts:404:      existingClioDocumentId: clean(attachment?.existingClioDocumentId) || clioDocumentId,
./app/api/graph/create-draft/route.ts:405:      documentId: clean(attachment?.documentId) || clioDocumentId,
./app/api/graph/create-draft/route.ts:406:      id: clean(attachment?.id) || clioDocumentId,
./app/api/graph/create-draft/route.ts:407:      clioMatterId: clean(attachment?.clioMatterId) || clean(attachment?.clioUploadTargetMatterId) || "",
./app/api/graph/create-draft/route.ts:408:      clioUploadTargetMatterId: clean(attachment?.clioUploadTargetMatterId) || clean(attachment?.clioMatterId) || "",
./app/api/graph/create-draft/route.ts:409:      clioDisplayNumber: clean(attachment?.clioDisplayNumber) || clean(attachment?.masterDisplayNumber) || "",
./app/api/graph/create-draft/route.ts:410:      masterDisplayNumber: clean(attachment?.masterDisplayNumber) || clean(attachment?.clioDisplayNumber) || "",
./app/api/graph/create-draft/route.ts:411:      clioDocumentVersionUuid,
./app/api/graph/create-draft/route.ts:412:      existingClioDocumentVersionUuid: clean(attachment?.existingClioDocumentVersionUuid) || clioDocumentVersionUuid,
./app/api/graph/create-draft/route.ts:414:      graphUploadRequired: Boolean(clioDocumentId || clioDocumentVersionUuid || downloadUrl || attachment?.graphUploadRequired),
./app/api/graph/create-draft/route.ts:432:      Boolean(clean(attachment?.clioDocumentId) || clean(attachment?.clioDocumentVersionUuid) || clean(attachment?.downloadUrl) || clean(attachment?.pdfUrl))
./app/api/graph/create-draft/route.ts:445:        clean(attachment?.clioDocumentId) ||
./app/api/graph/create-draft/route.ts:446:        clean(attachment?.clioDocumentVersionUuid) ||
./app/api/graph/create-draft/route.ts:480:                clioDocumentId: clean(attachment?.clioDocumentId),
./app/api/graph/create-draft/route.ts:482:                existingClioDocumentId: clean(attachment?.existingClioDocumentId),
./app/api/graph/create-draft/route.ts:494:                clioDocumentId: clean(attachment?.clioDocumentId),
./app/api/graph/create-draft/route.ts:495:                clioDocumentVersionUuid: clean(attachment?.clioDocumentVersionUuid),
./app/api/graph/create-draft/route.ts:576:          clioDocumentId: clean(attachment?.clioDocumentId),
./app/api/graph/create-draft/route.ts:611:      clioMatterId: context.clioMatterId,
./app/api/graph/create-draft/route.ts:612:      clioDisplayNumber: clean(context.clioDisplayNumber),
./app/api/graph/create-draft/route.ts:613:      clioMaildropEmail: clean(context.clioMaildropEmail),
./app/api/graph/create-draft/route.ts:614:      clioMaildropLabel: clean(context.clioMaildropLabel),
./app/api/graph/create-draft/route.ts:625:    maildropResolvedForPayload: Boolean(resolvedMaildrop?.clioMaildropEmail),
./lib/matterHelpers.ts:19:  // If it's an object (Clio sometimes returns structured values)
./app/api/settlements/documents-preview/route.ts:56:    clioRecordsChanged: false,
./app/api/settlements/documents-preview/route.ts:195:        "Preview-only local settlement document plan.  This route reads Barsh Matters LocalSettlementRecord and LocalSettlementRow only.  It does not read Clio settlement values, write Clio, generate documents, create files, create drafts, change the print queue, close matters, or send email.",
./app/api/matters/identity-field/route.ts:240:      noClioWrite: true,
./app/api/matters/identity-field/route.ts:241:      noClioRead: true,
./app/api/matters/identity-field/route.ts:331:        noClioWrite: true,
./app/api/matters/identity-field/route.ts:332:        noClioRead: true,
./app/api/matters/identity-field/route.ts:344:          clioWrite: false,
./app/api/matters/identity-field/route.ts:345:          clioRead: false,
./app/api/matters/identity-field/route.ts:393:            noClioWrite: true,
./app/api/matters/identity-field/route.ts:394:            noClioRead: true,
./app/api/matters/identity-field/route.ts:415:      noClioWrite: true,
./app/api/matters/identity-field/route.ts:416:      noClioRead: true,
./app/api/matters/identity-field/route.ts:428:        clioWrite: false,
./app/api/matters/identity-field/route.ts:429:        clioRead: false,
./app/api/court-calendar/import-webcivil-local/route.ts:22:        clioRecordsChanged: false,
./app/api/court-calendar/import-webcivil-local/route.ts:198:          clioRecordsChanged: false,
./app/api/court-calendar/import-webcivil-local/route.ts:275:        clioRecordsChanged: false,
./docs/dedicated-mac-backup-restore-handoff.md:15:3. Clio stores actual matter/lawsuit documents.
./docs/dedicated-mac-backup-restore-handoff.md:19:Actual document files, scanned documents, generated final PDFs stored in Clio, and Clio document folders are intentionally excluded from the Barsh Matters database backup because Clio is the document vault.
./docs/dedicated-mac-backup-restore-handoff.md:109:10. Confirm Clio document access.
./docs/dedicated-mac-backup-restore-handoff.md:115:Documents remain in Clio.
./docs/dedicated-mac-backup-restore-handoff.md:138:The successful drill confirmed that the PostgreSQL-native backup can be restored into a clean non-production Neon database. This validates the disaster-recovery path for local Barsh Matters database state. Actual documents remain intentionally outside this restore path because Clio is the document vault.
./app/api/graph/local-thread-preview/route.ts:23:      clioMasterDisplayNumber: true,
./app/api/graph/local-thread-preview/route.ts:27:  return clean(lawsuit?.clioMasterDisplayNumber);
./app/api/graph/local-thread-preview/route.ts:37:  const clioDisplayNumber = clean(url.searchParams.get("clioDisplayNumber"));
./app/api/graph/local-thread-preview/route.ts:39:  const clioMatterId = numberOrUndefined(url.searchParams.get("clioMatterId"));
./app/api/graph/local-thread-preview/route.ts:55:    !clioDisplayNumber &&
./app/api/graph/local-thread-preview/route.ts:57:    clioMatterId === undefined
./app/api/graph/local-thread-preview/route.ts:64:  if (clioDisplayNumber) threadWhere.clioDisplayNumber = clioDisplayNumber;
./app/api/graph/local-thread-preview/route.ts:66:  if (clioMatterId !== undefined) threadWhere.clioMatterId = clioMatterId;
./app/api/graph/local-thread-preview/route.ts:70:      { clioDisplayNumber: mappedMasterDisplayNumber },
./app/api/graph/local-thread-preview/route.ts:127:    clioRecordsChanged: false,
./app/api/graph/local-thread-preview/route.ts:136:      clioDisplayNumber: clioDisplayNumber || null,
./app/api/graph/local-thread-preview/route.ts:138:      clioMatterId: clioMatterId ?? null,
./app/api/graph/local-thread-preview/route.ts:166:      clioMatterId: thread.clioMatterId,
./app/api/graph/local-thread-preview/route.ts:167:      clioDisplayNumber: thread.clioDisplayNumber,
./app/api/graph/local-thread-preview/route.ts:168:      clioMaildropEmailPresent: Boolean(thread.clioMaildropEmail),
./app/api/graph/local-thread-preview/route.ts:169:      clioMaildropLabel: thread.clioMaildropLabel,
./app/api/graph/local-thread-preview/route.ts:198:          clioDocumentId: attachment.clioDocumentId,
./app/api/graph/local-thread-preview/route.ts:199:          clioDocumentName: attachment.clioDocumentName,
./app/api/graph/local-thread-preview/route.ts:200:          clioDocumentVersionUuid: attachment.clioDocumentVersionUuid,
./app/api/graph/local-thread-preview/route.ts:207:      "Read-only local email-thread preview.  This route reads Barsh Matters local email metadata only and does not call Microsoft Graph, read a mailbox, send email, create drafts, write Clio, or modify database records.",
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:2:-- These tables are local Barsh Matters records only.  This migration does not call Microsoft Graph, send email, write to Clio, or alter existing document records.
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:20:    "clioMatterId" INTEGER,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:21:    "clioDisplayNumber" TEXT,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:22:    "clioMaildropEmail" TEXT,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:23:    "clioMaildropLabel" TEXT,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:77:    "clioDocumentId" TEXT,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:78:    "clioDocumentName" TEXT,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:79:    "clioDocumentVersionUuid" TEXT,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:114:    "clioMatterId" INTEGER,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:115:    "clioDisplayNumber" TEXT,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:129:    "targetSystem" TEXT NOT NULL DEFAULT 'clio',
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:135:    "clioRecordsChanged" BOOLEAN NOT NULL DEFAULT false,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:152:CREATE INDEX IF NOT EXISTS "EmailThread_clioMatterId_idx" ON "EmailThread"("clioMatterId");
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:153:CREATE INDEX IF NOT EXISTS "EmailThread_clioDisplayNumber_idx" ON "EmailThread"("clioDisplayNumber");
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:169:CREATE INDEX IF NOT EXISTS "EmailAttachment_clioDocumentId_idx" ON "EmailAttachment"("clioDocumentId");
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:184:CREATE INDEX IF NOT EXISTS "EmailMatterLink_clioMatterId_idx" ON "EmailMatterLink"("clioMatterId");
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:185:CREATE INDEX IF NOT EXISTS "EmailMatterLink_clioDisplayNumber_idx" ON "EmailMatterLink"("clioDisplayNumber");
./app/api/settlements/local-void/route.ts:110:            clioWritesPerformed: false,
./app/api/settlements/local-void/route.ts:177:      clioRecordsChanged: false,
./app/api/settlements/local-void/route.ts:194:        clioWritesPerformed: false,
./app/api/settlements/local-void/route.ts:199:        "Voided the active local settlement record and deleted related open settlement payment due ticklers only. No Clio records, documents, print queue records, or email records were changed.",
./lib/clio.ts:1:import { getValidClioAccessToken, refreshClioToken } from "@/lib/clioTokenStore";
./lib/clio.ts:2:import { type ClioLimitCategory, runWithClioLimit } from "@/lib/clioLimiter";
./lib/clio.ts:5:let clioCallCount = 0;
./lib/clio.ts:7:export function getClioMetrics() {
./lib/clio.ts:8:  return { clioCallCount };
./lib/clio.ts:11:export function resetClioMetrics() {
./lib/clio.ts:12:  clioCallCount = 0;
./lib/clio.ts:15:const RAW_CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com";
./lib/clio.ts:17:function normalizedClioApiBase(): string {
./lib/clio.ts:18:  const base = RAW_CLIO_API_BASE.replace(/\/$/, "");
./lib/clio.ts:22:function buildClioUrl(path: string): string {
./lib/clio.ts:31:  return `${normalizedClioApiBase()}${normalizedPath}`;
./lib/clio.ts:42:function classifyClioPath(path: string): ClioLimitCategory {
./lib/clio.ts:62:export async function clioFetch(
./lib/clio.ts:66:  const category = classifyClioPath(path);
./lib/clio.ts:68:  return runWithClioLimit(category, async () => {
./lib/clio.ts:69:    clioCallCount++;
./lib/clio.ts:70:    const url = buildClioUrl(path);
./lib/clio.ts:72:    const token = await getValidClioAccessToken();
./lib/clio.ts:81:    const refreshed = await refreshClioToken();
./app/api/matters/identity-field/search/route.ts:135:      noClioWrite: true,
./app/api/matters/identity-field/search/route.ts:136:      noClioRead: true,
./app/api/matters/identity-field/search/route.ts:142:        clioWrite: false,
./app/api/matters/identity-field/search/route.ts:143:        clioRead: false,
./app/api/court-calendar/filter-options/route.ts:42:      safety: { readOnly: true, clioRecordsChanged: false, databaseRecordsChanged: false, externalCalendarEventsCreated: false, emailsSent: false, documentsGenerated: false, printQueueChanged: false },
./app/api/court-calendar/filter-options/route.ts:45:    return NextResponse.json({ ok: false, action: "court-calendar-filter-options", localFirst: true, sourceOfTruth: "barsh-matters-local", error: error?.message || "Court calendar filter options failed.", safety: { clioRecordsChanged: false, databaseRecordsChanged: false, externalCalendarEventsCreated: false, emailsSent: false, documentsGenerated: false, printQueueChanged: false } }, { status: 500 });
./docs/dedicated-mac-secrets-inventory-template.md:19:## Clio configuration
./docs/dedicated-mac-secrets-inventory-template.md:21:- CLIO_CLIENT_ID
./docs/dedicated-mac-secrets-inventory-template.md:22:- CLIO_CLIENT_SECRET
./docs/dedicated-mac-secrets-inventory-template.md:23:- CLIO_REDIRECT_URI
./docs/dedicated-mac-secrets-inventory-template.md:24:- Clio token storage expectations
./docs/dedicated-mac-secrets-inventory-template.md:25:- Clio app/account ownership notes
./app/api/graph/thread-sync/route.ts:115:        clioMatterId: thread.clioMatterId,
./app/api/graph/thread-sync/route.ts:116:        clioDisplayNumber: thread.clioDisplayNumber,
./app/api/graph/thread-sync/route.ts:117:        clioMaildropEmail: thread.clioMaildropEmail,
./app/api/graph/thread-sync/route.ts:118:        clioMaildropLabel: thread.clioMaildropLabel,
./app/api/graph/thread-sync/route.ts:142:    clioRecordsChanged: false,
./app/api/graph/thread-sync/route.ts:162:          "Fail-closed Graph thread sync route.  First use /api/graph/thread-sync-preview, then add ?confirm=sync-graph-thread to explicitly read Microsoft Graph and persist normalized EmailThread/EmailMessage metadata locally.  This route never sends email, creates drafts, writes Clio, uploads documents, or uses local Outlook automation.",
./app/api/graph/thread-sync/route.ts:251:    clioMatterId: numberOrNull(body.clioMatterId ?? objectValue(body.context).clioMatterId ?? (localContext as any).clioMatterId),
./app/api/graph/thread-sync/route.ts:252:    clioDisplayNumber: clean(body.clioDisplayNumber || objectValue(body.context).clioDisplayNumber || (localContext as any).clioDisplayNumber),
./app/api/graph/thread-sync/route.ts:253:    clioMaildropEmail: clean(body.clioMaildropEmail || objectValue(body.context).clioMaildropEmail || (localContext as any).clioMaildropEmail),
./app/api/graph/thread-sync/route.ts:254:    clioMaildropLabel: clean(body.clioMaildropLabel || objectValue(body.context).clioMaildropLabel || (localContext as any).clioMaildropLabel),
./app/api/graph/thread-sync/route.ts:284:      "Confirmed Graph thread sync completed.  This route read Microsoft Graph and persisted normalized Barsh Matters email metadata locally.  It did not create drafts, send email, write Clio, upload documents, or use local Outlook automation.",
./prisma/migrations/20260424191943_init_postgres/migration.sql:27:CREATE TABLE "ClioToken" (
./prisma/migrations/20260424191943_init_postgres/migration.sql:34:    CONSTRAINT "ClioToken_pkey" PRIMARY KEY ("id")
./app/api/deaggregate/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/deaggregate/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/deaggregate");
./app/api/settlements/documents-print-queue-local/route.ts:34:    value === "settlement-clio-duplicate-skipped" ||
./app/api/settlements/documents-print-queue-local/route.ts:35:    value === "settlement-uploaded-to-clio"
./app/api/settlements/documents-print-queue-local/route.ts:56:    clioRecordsChanged: false,
./app/api/settlements/documents-print-queue-local/route.ts:57:    clioDocumentsUploaded: false,
./app/api/settlements/documents-print-queue-local/route.ts:134:    const filename = clean(deliveryCandidate.filename || deliveryCandidate.clioDocumentName || deliveryCandidate.existingClioDocumentName || fallbackSkipped.filename || selectedDocument.filename || `${documentLabel}.pdf`);
./app/api/settlements/documents-print-queue-local/route.ts:136:    const clioDocumentId = clean(deliveryCandidate.clioDocumentId || deliveryCandidate.documentId || deliveryCandidate.id);
./app/api/settlements/documents-print-queue-local/route.ts:137:    const clioDocumentName = clean(deliveryCandidate.clioDocumentName || deliveryCandidate.filename || filename);
./app/api/settlements/documents-print-queue-local/route.ts:138:    const clioDocumentVersionUuid = clean(deliveryCandidate.clioDocumentVersionUuid || deliveryCandidate.versionUuid || deliveryCandidate.latestVersionUuid);
./app/api/settlements/documents-print-queue-local/route.ts:145:      safeQueuePart(clioDocumentId || clioDocumentVersionUuid),
./app/api/settlements/documents-print-queue-local/route.ts:180:        clioDocumentId: clioDocumentId || null,
./app/api/settlements/documents-print-queue-local/route.ts:181:        clioDocumentName: clioDocumentName || null,
./app/api/settlements/documents-print-queue-local/route.ts:182:        clioDocumentVersionUuid: clioDocumentVersionUuid || null,
./app/api/settlements/documents-print-queue-local/route.ts:184:        notes: "Finalized settlement document queued from local Barsh Matters DocumentFinalization record. The queue item references the finalized PDF/Clio document metadata when available. No email was sent and no Clio records were changed by queueing.",
./app/api/settlements/documents-print-queue-local/route.ts:197:          clioUploaded: Boolean(clioDocumentId || clioDocumentVersionUuid || uploaded.length > 0 || skipped.length > 0),
./app/api/settlements/documents-print-queue-local/route.ts:198:          emailAttachmentReady: Boolean(clioDocumentId || clioDocumentVersionUuid || uploaded.length > 0 || skipped.length > 0),
./app/api/settlements/documents-print-queue-local/route.ts:200:          clioDocumentId: clioDocumentId || null,
./app/api/settlements/documents-print-queue-local/route.ts:201:          clioDocumentName: clioDocumentName || null,
./app/api/settlements/documents-print-queue-local/route.ts:202:          clioDocumentVersionUuid: clioDocumentVersionUuid || null,
./app/api/settlements/documents-print-queue-local/route.ts:236:      note: "Created a local Barsh Matters DocumentPrintQueueItem from a finalized settlement DocumentFinalization record. No new PDF was generated, no Clio upload occurred, no Outlook draft was created, and no email was sent by queueing.",
./docs/adr/0001-clio-single-master-storage.md:1:# ADR 0001: Clio Single Master Matter Storage Architecture
./docs/adr/0001-clio-single-master-storage.md:7:Barsh Matters currently uses Clio in a matter-centered manner. The existing test implementation creates individual Clio matters for BM files and creates additional Clio matters/file numbers upon lawsuit aggregation.
./docs/adr/0001-clio-single-master-storage.md:9:That structure is unnecessary because Clio is not the user-facing system and is not being used for billing, permissions, account/provider management, deadlines, templates, or matter-level workflows. Ordinary users do not access Clio directly. Users access documents through the Barsh Matters UI. Barsh Matters controls matter access, document visibility, templates, generated documents, scans, uploaded emails, and user permissions.
./docs/adr/0001-clio-single-master-storage.md:12:Barsh Matters will use one manually created Clio master matter/file as the document repository for the Barsh Matters project. Barsh Matters will automatically create bucket folders under that master Clio matter. Each bucket will contain individual BM folders. Each BM matter will have one flat Clio folder containing generated documents, scans, uploaded emails, attachments, and other matter-specific documents. Templates will remain exclusively in Barsh Matters. Clio will store only generated or uploaded matter documents.
./docs/adr/0001-clio-single-master-storage.md:17:Clio Matter: Barsh Matters Master Repository
./docs/adr/0001-clio-single-master-storage.md:35:3. Clio does not create individual matters for BM files.
./docs/adr/0001-clio-single-master-storage.md:36:4. Clio does not create lawsuit aggregation matters.
./docs/adr/0001-clio-single-master-storage.md:37:5. Clio does not generate the operative BM file number.
./docs/adr/0001-clio-single-master-storage.md:38:6. Clio does not store templates.
./docs/adr/0001-clio-single-master-storage.md:39:7. Barsh Matters creates Clio bucket folders.
./docs/adr/0001-clio-single-master-storage.md:40:8. Barsh Matters creates one Clio folder per BM matter.
./docs/adr/0001-clio-single-master-storage.md:41:9. Barsh Matters stores Clio folder IDs and Clio document IDs.
./docs/adr/0001-clio-single-master-storage.md:43:11. Clio remains the storage backend for finished/generated/uploaded documents only.
./docs/adr/0001-clio-single-master-storage.md:46:Preferred flow: BM matter is created by Barsh Matters without a Clio folder. On first generated or uploaded document, BM resolves or creates the correct bucket folder, resolves or creates the BM matter folder, uploads the document, and stores the Clio document ID and folder ID.
./docs/adr/0001-clio-single-master-storage.md:52:Existing BM matters and Clio mappings are test data and do not need to be preserved. A clean reset is acceptable during implementation.
./lib/documents/delivery.ts:25:  clioMaildropEmail?: string;
./lib/documents/delivery.ts:26:  clioMaildropLabel?: string;
./lib/documents/delivery.ts:122:    formatEmailRecipient(context.clioMaildropLabel, context.clioMaildropEmail) ||
./app/matter/[id]/page.tsx:182:function clioMatterUrl(matterId: any): string {
./app/matter/[id]/page.tsx:183:  return `https://app.clio.com/nc/#/matters/${matterId}`;
./app/matter/[id]/page.tsx:361:  { key: "documents", label: "Documents", note: "Preview, finalize, and Clio upload" },
./app/matter/[id]/page.tsx:662:  const [matterClioDocumentsLoading, setMatterClioDocumentsLoading] = useState(false);
./app/matter/[id]/page.tsx:663:  const [matterClioDocumentsResult, setMatterClioDocumentsResult] = useState<any>(null);
./app/matter/[id]/page.tsx:730:  async function loadMatterClioDocuments() {
./app/matter/[id]/page.tsx:734:      setMatterClioDocumentsResult({
./app/matter/[id]/page.tsx:736:        error: "No valid direct matter ID is available for Clio document lookup.",
./app/matter/[id]/page.tsx:743:      setMatterClioDocumentsLoading(true);
./app/matter/[id]/page.tsx:746:        `/api/documents/clio-matter-documents?matterId=${encodeURIComponent(String(numericMatterId))}`,
./app/matter/[id]/page.tsx:751:      setMatterClioDocumentsResult(
./app/matter/[id]/page.tsx:754:          error: "Could not parse Clio document list response.",
./app/matter/[id]/page.tsx:759:      setMatterClioDocumentsResult({
./app/matter/[id]/page.tsx:765:      setMatterClioDocumentsLoading(false);
./app/matter/[id]/page.tsx:769:  function matterClioDocumentsArray(): any[] {
./app/matter/[id]/page.tsx:770:    return Array.isArray(matterClioDocumentsResult?.documents)
./app/matter/[id]/page.tsx:771:      ? matterClioDocumentsResult.documents
./app/matter/[id]/page.tsx:776:    return matterClioDocumentsArray().find((doc: any) => textValue(doc.clioDocumentId) === matterSelectedViewDocumentId) || null;
./app/matter/[id]/page.tsx:783:    if (!matterClioDocumentsResult && !matterClioDocumentsLoading) {
./app/matter/[id]/page.tsx:784:      await loadMatterClioDocuments();
./app/matter/[id]/page.tsx:794:    const raw = textValue(doc?.latestDocumentVersion?.filename) || textValue(doc?.clioDocumentFilename) || textValue(doc?.clioDocumentName) || "Document";
./app/matter/[id]/page.tsx:817:      window.open("/api/documents/clio-document-open?" + params.toString(), "_blank", "noopener,noreferrer");
./app/matter/[id]/page.tsx:822:      window.open("/api/documents/clio-document-open?" + params.toString(), "_blank", "noopener,noreferrer");
./app/matter/[id]/page.tsx:827:      const editUrl = window.location.origin + "/api/documents/clio-document-open?" + params.toString();
./app/matter/[id]/page.tsx:835:    const docs = matterClioDocumentsArray();
./app/matter/[id]/page.tsx:857:            {matterClioDocumentsResult?.ok === false && (
./app/matter/[id]/page.tsx:859:                {textValue(matterClioDocumentsResult.error) || "Could not load Clio documents."}
./app/matter/[id]/page.tsx:863:            {matterClioDocumentsLoading && (
./app/matter/[id]/page.tsx:864:              <div style={{ padding: 12, border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc", color: "#475569", fontWeight: 800 }}>Loading documents from Clio...</div>
./app/matter/[id]/page.tsx:867:            {matterClioDocumentsResult?.ok && docs.length === 0 && (
./app/matter/[id]/page.tsx:874:                  const id = textValue(doc.clioDocumentId);
./app/matter/[id]/page.tsx:878:                    <button key={id || textValue(doc.clioDocumentName)} type="button" title="Select and open document." onClick={() => openDirectMatterListedDocument(doc, id, displayName)} style={{ display: "block", width: "100%", textAlign: "left", border: 0, borderBottom: "1px solid #e5e7eb", background: selected ? "#eff6ff" : "#ffffff", color: "#0f172a", padding: 12, cursor: id ? "pointer" : "not-allowed", opacity: id ? 1 : 0.6 }}>
./app/matter/[id]/page.tsx:899:                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>Select a document to view its stored Clio metadata.</div>
./app/matter/[id]/page.tsx:906:            <button type="button" onClick={() => void loadMatterClioDocuments()} disabled={matterClioDocumentsLoading} style={{ minWidth: 138, height: 40, border: "1px solid #1e3a8a", borderRadius: 10, background: matterClioDocumentsLoading ? "#dbeafe" : "#1e3a8a", color: "#ffffff", fontWeight: 950, cursor: matterClioDocumentsLoading ? "not-allowed" : "pointer" }}>{matterClioDocumentsLoading ? "Refreshing..." : "Refresh Documents"}</button>
./app/matter/[id]/page.tsx:1200:  function renderMatterClioDocumentsPanel() {
./app/matter/[id]/page.tsx:1201:    const docs = matterClioDocumentsArray();
./app/matter/[id]/page.tsx:1224:              Clio Documents Tab
./app/matter/[id]/page.tsx:1230:              Lists the current Clio Documents tab contents for this direct matter.  This does not upload, download, generate, email, print, queue, or write anything.
./app/matter/[id]/page.tsx:1236:            onClick={() => void loadMatterClioDocuments()}
./app/matter/[id]/page.tsx:1237:            disabled={matterClioDocumentsLoading}
./app/matter/[id]/page.tsx:1240:              background: matterClioDocumentsLoading ? "#dbeafe" : "#2563eb",
./app/matter/[id]/page.tsx:1245:              cursor: matterClioDocumentsLoading ? "not-allowed" : "pointer",
./app/matter/[id]/page.tsx:1248:            {matterClioDocumentsLoading ? "Refreshing..." : "Refresh Clio Documents"}
./app/matter/[id]/page.tsx:1252:        {matterClioDocumentsResult && (
./app/matter/[id]/page.tsx:1254:            {!matterClioDocumentsResult.ok && (
./app/matter/[id]/page.tsx:1265:                {textValue(matterClioDocumentsResult.error) || "Could not load Clio documents."}
./app/matter/[id]/page.tsx:1269:            {matterClioDocumentsResult.ok && (
./app/matter/[id]/page.tsx:1273:                    Clio Matter ID: {textValue(matterClioDocumentsResult.clioMatterId) || "—"}
./app/matter/[id]/page.tsx:1276:                    Documents: {matterClioDocumentsResult.summary?.documentCount ?? docs.length}
./app/matter/[id]/page.tsx:1279:                    Fully Uploaded: {matterClioDocumentsResult.summary?.fullyUploadedCount ?? "—"}
./app/matter/[id]/page.tsx:1301:                          <tr key={textValue(doc.clioDocumentId) || textValue(doc.clioDocumentName)}>
./app/matter/[id]/page.tsx:1303:                              {textValue(doc.clioDocumentName) || textValue(doc.clioDocumentFilename) || "Untitled"}
./app/matter/[id]/page.tsx:1304:                              <div style={{ color: "#64748b", fontWeight: 650 }}>{textValue(doc.clioDocumentFilename) || "—"}</div>
./app/matter/[id]/page.tsx:2500:        noClioWrite: true,
./app/matter/[id]/page.tsx:2501:        noClioRead: true,
./app/matter/[id]/page.tsx:3068:      // Local-first transition: do not refresh ClaimIndex from Clio after close.
./app/matter/[id]/page.tsx:3229:      createJson.noClioRecordsChangedMessage = "No Clio records were changed.";
./app/matter/[id]/page.tsx:3838:        `This updates only the local print queue record.  It will not change Clio, upload documents, create folders, or modify document contents.\n\n` +
./app/matter/[id]/page.tsx:3941:  async function uploadFinalDocumentsToClio() {
./app/matter/[id]/page.tsx:3954:      alert("Run Finalize Documents Preview successfully before uploading final documents to Clio.");
./app/matter/[id]/page.tsx:3963:      (doc: any) => doc?.wouldGenerate && doc?.wouldUploadToClio
./app/matter/[id]/page.tsx:3972:      textValue(documentPreview?.clioUploadTarget?.displayNumber) || "the Clio master matter";
./app/matter/[id]/page.tsx:3973:    const targetMatterId = textValue(documentPreview?.clioUploadTarget?.matterId);
./app/matter/[id]/page.tsx:3980:      `FINALIZE AND UPLOAD TO CLIO\n\n` +
./app/matter/[id]/page.tsx:3982:        `This will upload the following final document copy/copies to the direct bill matter Clio Documents tab:\n\n` +
./app/matter/[id]/page.tsx:3985:        `WARNING: Running this again may create duplicate uploaded documents in Clio.\n\n` +
./app/matter/[id]/page.tsx:4025:      alert(`Final upload complete.\n\nUploaded to Clio: ${uploadedCount} document(s).`);
./app/matter/[id]/page.tsx:4260:      await loadMatterClioDocuments();
./app/matter/[id]/page.tsx:4429:  async function loadProviderFeeDefaultsFromClio(options?: { silent?: boolean }) {
./app/matter/[id]/page.tsx:4451:          alert(json?.error || "Could not load provider fee defaults from Clio.");
./app/matter/[id]/page.tsx:4464:          alert(`No provider fee defaults are populated in Clio for this provider.  Missing: ${missing}.  You may enter the percentages manually.`);
./app/matter/[id]/page.tsx:4490:        error: err?.message || "Could not load provider fee defaults from Clio.",
./app/matter/[id]/page.tsx:4493:          noClioRecordsChanged: true,
./app/matter/[id]/page.tsx:4516:    void loadProviderFeeDefaultsFromClio({ silent: true });
./app/matter/[id]/page.tsx:4586:          noClioRecordsChanged: true,
./app/matter/[id]/page.tsx:4608:      alert("Run a successful settlement preview before validating Clio writeback readiness.");
./app/matter/[id]/page.tsx:4624:            clioWritebackPreview: row.clioWritebackPreview,
./app/matter/[id]/page.tsx:4650:          noClioRecordsChanged: true,
./app/matter/[id]/page.tsx:4663:  async function saveSettlementToClio() {
./app/matter/[id]/page.tsx:4667:      alert("No MASTER_LAWSUIT_ID found.  Generate or connect a lawsuit before saving settlement to Clio.");
./app/matter/[id]/page.tsx:4672:      alert("Run a successful settlement preview before saving to Clio.");
./app/matter/[id]/page.tsx:4677:      alert("Validate Clio writeback readiness successfully before saving to Clio.");
./app/matter/[id]/page.tsx:4682:      "This will write final settlement values to the child/bill matter(s) in Clio.\n\n" +
./app/matter/[id]/page.tsx:4703:            clioWritebackPreview: row.clioWritebackPreview,
./app/matter/[id]/page.tsx:4724:      alert(`Settlement saved to Clio for ${num(json.count)} child/bill matter(s).`);
./app/matter/[id]/page.tsx:4735:          clioRecordsMayHaveChanged: true,
./app/matter/[id]/page.tsx:4766:        error: err?.message || "Could not load current Clio settlement values.",
./app/matter/[id]/page.tsx:4769:          liveClioReadOnly: true,
./app/matter/[id]/page.tsx:4770:          noClioRecordsChanged: true,
./app/matter/[id]/page.tsx:4846:    const response = await fetch(`/api/documents/clio-maildrop-resolve?source=direct_matter&matterId=${queryMatterId}`);
./app/matter/[id]/page.tsx:4850:      alert(json?.error || "Could not resolve this matter's Clio Maildrop address.");
./app/matter/[id]/page.tsx:4856:      clioMaildropEmail: json.maildropEmail || context.clioMaildropEmail,
./app/matter/[id]/page.tsx:4857:      clioMaildropLabel: json.maildropLabel || context.clioMaildropLabel,
./app/matter/[id]/page.tsx:4862:    const filename = textValue(candidate?.filename || candidate?.clioDocumentName || candidate?.name).toLowerCase();
./app/matter/[id]/page.tsx:4867:  function clioOpenPathForFinalizedMatterDocument(candidate: any, mode: "inline" | "download" = "inline"): string {
./app/matter/[id]/page.tsx:4868:    const documentId = textValue(candidate?.clioDocumentId || candidate?.documentId || candidate?.id);
./app/matter/[id]/page.tsx:4869:    const filename = textValue(candidate?.filename || candidate?.clioDocumentName || candidate?.name || "document.pdf");
./app/matter/[id]/page.tsx:4878:    return "/api/documents/clio-document-open?" + params.toString();
./app/matter/[id]/page.tsx:4892:    if (uploadedCandidate?.clioDocumentId) {
./app/matter/[id]/page.tsx:4895:        id: uploadedCandidate.clioDocumentId,
./app/matter/[id]/page.tsx:4896:        clioDocumentId: uploadedCandidate.clioDocumentId,
./app/matter/[id]/page.tsx:4897:        clioDocumentName: uploadedCandidate.clioDocumentName || uploadedCandidate.filename,
./app/matter/[id]/page.tsx:4898:        filename: uploadedCandidate.filename || uploadedCandidate.clioDocumentName,
./app/matter/[id]/page.tsx:4908:    const existing = Array.isArray(skippedCandidate?.existingClioDocuments)
./app/matter/[id]/page.tsx:4909:      ? skippedCandidate.existingClioDocuments[0]
./app/matter/[id]/page.tsx:4917:        clioDocumentId: existing.id,
./app/matter/[id]/page.tsx:4918:        clioDocumentName: existing.name || skippedCandidate?.filename,
./app/matter/[id]/page.tsx:4938:      ? clioOpenPathForFinalizedMatterDocument(candidate, "download")
./app/matter/[id]/page.tsx:4940:    const documentUrl = candidate ? clioOpenPathForFinalizedMatterDocument(candidate, "download") : "";
./app/matter/[id]/page.tsx:4946:      pdfFilename: candidate?.filename || candidate?.clioDocumentName || context.documentLabel,
./app/matter/[id]/page.tsx:4947:      clioDocumentId: candidate?.clioDocumentId || candidate?.id || "",
./app/matter/[id]/page.tsx:4948:      clioDocumentVersionUuid: candidate?.clioDocumentVersionUuid || candidate?.latestDocumentVersion?.uuid || "",
./app/matter/[id]/page.tsx:4965:      alert("Finalize the document before preparing an email draft.  The email workflow requires a finalized PDF from this matter's Clio Documents tab.");
./app/matter/[id]/page.tsx:5028:            `Cc / MailDrop: ${context.clioMaildropLabel || "MailDrop"} ${context.clioMaildropEmail ? "<" + context.clioMaildropEmail + ">" : "not resolved"}\n` +
./app/matter/[id]/page.tsx:5039:                      item?.clioDocumentId ? "Clio Document ID: " + item.clioDocumentId : "",
./app/matter/[id]/page.tsx:5059:          `Cc / MailDrop: ${context.clioMaildropLabel || "MailDrop"} ${context.clioMaildropEmail ? "<" + context.clioMaildropEmail + ">" : "not resolved"}\n` +
./app/matter/[id]/page.tsx:5073:      alert("Finalize the document before printing.  Barsh Matters could not find a finalized Clio document from the latest finalization result.");
./app/matter/[id]/page.tsx:5078:      ? clioOpenPathForFinalizedMatterDocument(candidate, "inline")
./app/matter/[id]/page.tsx:5079:      : clioOpenPathForFinalizedMatterDocument(candidate, "download");
./app/matter/[id]/page.tsx:5082:      alert("Barsh Matters found a finalized document, but it could not build an openable Clio document URL.");
./app/matter/[id]/page.tsx:5113:    const clioTargetMatterId = Number(finalizeUploadResult?.clioUploadTarget?.matterId || 0);
./app/matter/[id]/page.tsx:5114:    const printQueueMatterId = Number.isFinite(clioTargetMatterId) && clioTargetMatterId > 0
./app/matter/[id]/page.tsx:5115:      ? clioTargetMatterId
./app/matter/[id]/page.tsx:5119:      textValue(finalizeUploadResult?.clioUploadTarget?.displayNumber) ||
./app/matter/[id]/page.tsx:5125:    if (!context.pdfUrl || !candidate?.clioDocumentId) {
./app/matter/[id]/page.tsx:5126:      alert("Finalize the document before sending it to the print queue.  The queue workflow requires a finalized PDF from this matter's Clio Documents tab.");
./app/matter/[id]/page.tsx:5131:      alert("Barsh Matters could not identify the Clio direct matter ID needed for the print queue.");
./app/matter/[id]/page.tsx:5144:        "Barsh Matters will add the currently Clio-verified finalized PDF to the print queue.  Existing queue records are skipped.\n\n" +
./app/matter/[id]/page.tsx:5157:          clioMatterId: printQueueMatterId,
./app/matter/[id]/page.tsx:5166:              clioMatterId: printQueueMatterId,
./app/matter/[id]/page.tsx:5189:                  item?.clioDocumentId ? "Clio Document ID: " + item.clioDocumentId : "",
./app/matter/[id]/page.tsx:5297:      clioMatterId: Number(matterId),
./app/matter/[id]/page.tsx:5298:      clioDisplayNumber: displayNumber,
./app/matter/[id]/page.tsx:5299:      clioMaildropLabel: textValue(matchingThread?.clioMaildropLabel),
./app/matter/[id]/page.tsx:5370:      "Sync this Microsoft Graph thread to Barsh Matters local email records?\n\nThis will read Microsoft Graph and update local EmailThread / EmailMessage metadata only.  It will not create a draft, send email, write Clio, upload documents, or use local Outlook automation."
./app/matter/[id]/page.tsx:5662:                        {formatEmailThreadTimestamp(thread.latestMessageAt)} · {messages.length} message{messages.length === 1 ? "" : "s"} · {textValue(thread.clioMaildropLabel) || "No MailDrop label"}
./app/matter/[id]/page.tsx:5785:                      <div style={{ marginTop: 3, fontSize: 13, fontWeight: 850, color: thread.clioMaildropEmailPresent ? bmColors.green : bmColors.red }}>
./app/matter/[id]/page.tsx:5786:                        {thread.clioMaildropEmailPresent ? "Yes" : "No"}
./app/matter/[id]/page.tsx:6279:                  !selectedTemplate ? "Select a document first." : "Open a temporary PDF preview without uploading to Clio."
./app/matter/[id]/page.tsx:6291:                  !selectedTemplate ? "Select a document first." : "Finalize and upload the selected document to Clio."
./app/matter/[id]/page.tsx:6410:                    "Finalize and upload the selected document to Clio."
./app/matter/[id]/page.tsx:6532:                  Read-only local data available for future direct matter templates.  It does not generate documents, upload documents, write to Clio, or change the print queue.
./app/matter/[id]/page.tsx:6733:              This is a read-only review of the data available for future Direct Matter templates.  It reads ClaimIndex and local reference data only.  It does not generate documents, upload documents, write to Clio, or change the print queue.
./app/matter/[id]/page.tsx:6785:                <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Clio Correctness Dependency</div>
./app/matter/[id]/page.tsx:6786:                <div style={{ fontWeight: 900 }}>{documentData.clioCorrectnessDependency ? "Yes" : "No"}</div>
./app/matter/[id]/page.tsx:6887:          noClioRecordsChanged: true,
./app/matter/[id]/page.tsx:6920:        noClioRead: true,
./app/matter/[id]/page.tsx:6921:        noClioWrite: true,
./app/matter/[id]/page.tsx:6937:          noClioRecordsChanged: true,
./app/matter/[id]/page.tsx:6964:      "Close Paid Settlements?\\n\\nUse this only after payment is confirmed. This will route through the guarded Close Lawsuit workflow, sync the Clio operational close status, mark the master lawsuit Closed with Close Reason = PAID (SETTLEMENT), and mark child matters Closed with Closed Reason = Closed Lawsuit. No documents or print queue records will be changed."
./app/matter/[id]/page.tsx:7038:          noClioRecordsChanged: true,
./app/matter/[id]/page.tsx:7385:  const settlementValuesWrittenToClio =
./app/matter/[id]/page.tsx:7389:  const currentClioValuesLoaded =
./app/matter/[id]/page.tsx:7409:      expected: (row: any) => row?.clioWritebackPreview?.fields?.SETTLED_AMOUNT,
./app/matter/[id]/page.tsx:7468:  if (settlementValuesWrittenToClio && currentClioValuesLoaded) {
./app/matter/[id]/page.tsx:7474:          `Matter ${textValue((expectedRow as any)?.displayNumber) || matterId} is missing from current Clio readback.`
./app/matter/[id]/page.tsx:7485:            `${textValue((expectedRow as any)?.displayNumber) || matterId}: ${field.label} expected ${money(Number(expectedValue ?? 0) / 100)} but Clio shows ${money(Number(actualValue ?? 0) / 100)}.`
./app/matter/[id]/page.tsx:7492:  const currentClioValuesMatchExpected =
./app/matter/[id]/page.tsx:7493:    settlementValuesWrittenToClio &&
./app/matter/[id]/page.tsx:7494:    currentClioValuesLoaded &&
./app/matter/[id]/page.tsx:7521:        ? "Provider/client Clio defaults were loaded or checked.  Missing defaults remain non-blocking."
./app/matter/[id]/page.tsx:7522:        : "Auto-loads when this tab opens from the read-only Clio provider/client contact defaults.  Open the Settlement tab and confirm provider fee defaults were checked.",
./app/matter/[id]/page.tsx:7529:        : "Run the writeback readiness preview before saving to Clio.",
./app/matter/[id]/page.tsx:7532:      label: "Settlement values written to Clio",
./app/matter/[id]/page.tsx:7533:      done: settlementValuesWrittenToClio,
./app/matter/[id]/page.tsx:7534:      detail: settlementValuesWrittenToClio
./app/matter/[id]/page.tsx:7536:        : "Not complete until Save Settlement to Clio succeeds.",
./app/matter/[id]/page.tsx:7539:      label: "Current Clio values match expected settlement values",
./app/matter/[id]/page.tsx:7540:      done: currentClioValuesMatchExpected,
./app/matter/[id]/page.tsx:7541:      detail: currentClioValuesMatchExpected
./app/matter/[id]/page.tsx:7542:        ? `Current Clio readback matches expected settlement values for ${num(expectedRowsByMatterId.size)} child/bill matter(s).`
./app/matter/[id]/page.tsx:7545:          : currentClioValuesLoaded
./app/matter/[id]/page.tsx:7546:            ? "Current Clio values are loaded.  Save settlement values first, then refresh/read back for exact value comparison."
./app/matter/[id]/page.tsx:9172:                          title="Open the Direct Matter Clio document picker."
./app/matter/[id]/page.tsx:10236:              Final document upload to Clio remains explicit only.
./app/matter/[id]/page.tsx:10320:                Read-only settlement workspace draft.  This panel does not change Clio, ClaimIndex, document records,
./app/matter/[id]/page.tsx:10439:                  Operational checklist for settlement processing.  This panel is read-only and does not write to Clio,
./app/matter/[id]/page.tsx:10526:                <div style={{ fontWeight: 900, marginBottom: 4 }}>Current Clio Value Mismatch Details</div>
./app/matter/[id]/page.tsx:10570:                  Local settlement value review for child/bill matters.  This does not write to Clio, ClaimIndex, documents, or the print queue.
./app/matter/[id]/page.tsx:10750:                    Read-only preview of planned settlement documents using local settlement values.  This does not generate documents, upload to Clio, create database records, or change the print queue.
./app/matter/[id]/page.tsx:10914:                Preview only.  No settlement documents are generated here.  No Clio records, database records, or print queue records are changed.
./app/matter/[id]/page.tsx:11329:                      ? "Clio provider contact"
./app/matter/[id]/page.tsx:11339:                    Missing Clio default(s): {providerFeeDefaultsResult.validation.missingDefaults.join(", ")}.  Missing values are not blocking; enter them manually if needed.
./app/matter/[id]/page.tsx:11436:              Preview only.  This does not write to Clio, does not write to the database, does not generate documents,
./app/matter/[id]/page.tsx:11578:                  Dry-run validation only.  This checks whether the child/bill matters have the required existing Clio custom field value records for final settlement writeback.
./app/matter/[id]/page.tsx:11772:                Dry-run only.  No Clio records, database records, documents, or print queue records were changed.
./app/matter/[id]/page.tsx:11790:                      This is the explicit final Clio writeback action.  It writes settlement values only to child/bill matters.
./app/matter/[id]/page.tsx:11795:                      onClick={saveSettlementToClio}
./app/matter/[id]/page.tsx:11807:                      {settlementWritebackLoading ? "Saving..." : "Save Settlement to Clio"}
./app/matter/[id]/page.tsx:11856:                  Settlement values were written to Clio for {num(settlementWritebackResult.count)} child/bill matter(s).
./app/matter/[id]/page.tsx:11947:                  Dry-run only.  This previews which child/bill matters may be eligible to be marked closed as PAID (SETTLEMENT) after payment is confirmed.  Settlement agreement or settlement financial writeback alone is not enough to close a matter.  It does not write to Clio, ClaimIndex, documents, or the print queue.
./app/matter/[id]/page.tsx:12099:                    Use only after payment is confirmed. This runs the guarded Close Lawsuit workflow. Clio close sync must succeed before local close records are committed. Documents and print queue records are not changed.
./app/matter/[id]/page.tsx:12127:                    Guarded Close Lawsuit completed. Clio operational close status was synced before local close records were committed.
./app/matter/[id]/page.tsx:12227:                  Local audit/history only.  This does not read or change Clio settlement fields.
./app/matter/[id]/page.tsx:12396:                              {row.noWritePerformed ? " No Clio write" : " Clio write attempted"} ·
./app/matter/[id]/page.tsx:12567:                they do not change Clio, upload documents, create folders, or modify document contents.
./app/matter/[id]/page.tsx:12775:                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 5 }}>Clio Document ID</th>
./app/matter/[id]/page.tsx:12792:                          {textValue(row.clioDocumentId) || "—"}
./app/matter/[id]/page.tsx:12871:                      These are proposed print candidates only.  Each listed document has been verified against the current Clio master matter Documents tab.
./app/matter/[id]/page.tsx:12896:                Persistent local database audit entries for this matter and, when applicable, its master lawsuit context.  These records do not replace Clio as the source of truth.
./lib/graph/maildropForDraft.ts:1:import { clioFetch } from "@/lib/clio";
./lib/graph/maildropForDraft.ts:8:  clioMaildropEmail: string;
./lib/graph/maildropForDraft.ts:9:  clioMaildropLabel: string;
./lib/graph/maildropForDraft.ts:11:  source: "clio-maildrop-resolve-helper";
./lib/graph/maildropForDraft.ts:31:    clioMaildropEmail: maildropEmail,
./lib/graph/maildropForDraft.ts:32:    clioMaildropLabel: maildropLabel,
./lib/graph/maildropForDraft.ts:34:    source: "clio-maildrop-resolve-helper",
./lib/graph/maildropForDraft.ts:38:async function readMatterMaildropByClioId(matterId: number): Promise<GraphDraftMaildropResolution> {
./lib/graph/maildropForDraft.ts:40:  const res = await clioFetch(`/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`);
./lib/graph/maildropForDraft.ts:54:  const res = await clioFetch(`/matters.json?${params.toString()}`);
./lib/graph/maildropForDraft.ts:76:    const byClioId = await readMatterMaildropByClioId(Math.trunc(numericMatterId));
./lib/graph/maildropForDraft.ts:77:    if (byClioId) return byClioId;
./app/api/reference-data/entities/route.ts:20:    clioData: false,
./app/api/reference-data/entities/route.ts:21:    noClioRecordsChanged: true,
./app/api/reference-data/entities/route.ts:166:      details: { localReferenceData: true, clioData: false },
./app/api/reference-data/entities/route.ts:307:      details: { localReferenceData: true, clioData: false },
./app/api/graph/token-health/route.ts:27:    clioRecordsChanged: false,
./lib/graph/maildropRegistry.ts:23:  clioMatterId?: number | string | null;
./lib/graph/maildropRegistry.ts:24:  clioDisplayNumber?: string | null;
./lib/graph/maildropRegistry.ts:25:  clioMaildropEmail?: string | null;
./lib/graph/maildropRegistry.ts:26:  clioMaildropLabel?: string | null;
./lib/graph/maildropRegistry.ts:31:  const clioMaildropEmail = lowerEmail(input.clioMaildropEmail);
./lib/graph/maildropRegistry.ts:32:  if (!clioMaildropEmail) return null;
./lib/graph/maildropRegistry.ts:39:    clioMatterId: numberOrNull(input.clioMatterId),
./lib/graph/maildropRegistry.ts:40:    clioDisplayNumber: clean(input.clioDisplayNumber) || null,
./lib/graph/maildropRegistry.ts:41:    clioMaildropEmail,
./lib/graph/maildropRegistry.ts:42:    clioMaildropLabel: clean(input.clioMaildropLabel) || null,
./lib/graph/maildropRegistry.ts:49:    where: { clioMaildropEmail },
./lib/graph/maildropRegistry.ts:56:      clioMatterId: data.clioMatterId,
./lib/graph/maildropRegistry.ts:57:      clioDisplayNumber: data.clioDisplayNumber,
./lib/graph/maildropRegistry.ts:58:      clioMaildropLabel: data.clioMaildropLabel,
./lib/graph/maildropRegistry.ts:70:      clioMaildropEmail: { not: "" },
./lib/graph/maildropRegistry.ts:80:      clioMatterId: true,
./lib/graph/maildropRegistry.ts:81:      clioDisplayNumber: true,
./lib/graph/maildropRegistry.ts:82:      clioMaildropEmail: true,
./lib/graph/maildropRegistry.ts:83:      clioMaildropLabel: true,
./lib/graph/maildropRegistry.ts:92:    const email = lowerEmail(row.clioMaildropEmail);
./lib/graph/maildropRegistry.ts:102:      clioMaildropEmail: { not: null },
./lib/graph/maildropRegistry.ts:112:      clioMatterId: true,
./lib/graph/maildropRegistry.ts:113:      clioDisplayNumber: true,
./lib/graph/maildropRegistry.ts:114:      clioMaildropEmail: true,
./lib/graph/maildropRegistry.ts:115:      clioMaildropLabel: true,
./lib/graph/maildropRegistry.ts:121:    const email = lowerEmail(row.clioMaildropEmail);
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:2:-- This is local Barsh Matters metadata only. It does not write to Clio.
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:10:  "clioMatterId" INTEGER,
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:11:  "clioDisplayNumber" TEXT,
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:12:  "clioMaildropEmail" TEXT NOT NULL,
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:13:  "clioMaildropLabel" TEXT,
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:23:CREATE UNIQUE INDEX "MaildropAddress_clioMaildropEmail_key" ON "MaildropAddress"("clioMaildropEmail");
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:28:CREATE INDEX "MaildropAddress_clioMatterId_idx" ON "MaildropAddress"("clioMatterId");
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:29:CREATE INDEX "MaildropAddress_clioDisplayNumber_idx" ON "MaildropAddress"("clioDisplayNumber");
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:38:  "clioMatterId",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:39:  "clioDisplayNumber",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:40:  "clioMaildropEmail",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:41:  "clioMaildropLabel",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:48:SELECT DISTINCT ON (LOWER(TRIM("clioMaildropEmail")))
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:49:  'emailthread_' || md5(LOWER(TRIM("clioMaildropEmail"))) AS "id",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:54:  "clioMatterId",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:55:  "clioDisplayNumber",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:56:  LOWER(TRIM("clioMaildropEmail")) AS "clioMaildropEmail",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:57:  "clioMaildropLabel",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:68:WHERE "clioMaildropEmail" IS NOT NULL
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:69:  AND TRIM("clioMaildropEmail") <> ''
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:70:ORDER BY LOWER(TRIM("clioMaildropEmail")), "updatedAt" DESC
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:71:ON CONFLICT ("clioMaildropEmail") DO UPDATE SET
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:76:  "clioMatterId" = COALESCE(EXCLUDED."clioMatterId", "MaildropAddress"."clioMatterId"),
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:77:  "clioDisplayNumber" = COALESCE(EXCLUDED."clioDisplayNumber", "MaildropAddress"."clioDisplayNumber"),
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:78:  "clioMaildropLabel" = COALESCE(EXCLUDED."clioMaildropLabel", "MaildropAddress"."clioMaildropLabel"),
./app/api/settlements/local-preview/route.ts:206:            clioRecordsChanged: false,
./app/api/settlements/local-preview/route.ts:443:        clioRecordsChanged: false,
./app/api/settlements/local-preview/route.ts:470:          clioRecordsChanged: false,
./app/api/settlements/local-preview/route.ts:478:          "Local-first settlement calculation preview only.  This endpoint reads Barsh Matters ClaimIndex data and does not write Clio, write the database, generate documents, print, queue, or close matters.",
./app/api/settlements/local-preview/route.ts:492:          clioRecordsChanged: false,
./app/matter/[id]/page.tsx.bak-smart-filter-2026-04-23:89:        fetch(`/api/clio/matter-context?matterId=${id}`, {
./app/api/claim-index/rebuild/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/claim-index/rebuild/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/claim-index/rebuild");
./app/api/claim-index/rebuild/route.ts:8:  return legacyClioOperationalRouteBlocked("app/api/claim-index/rebuild");
./app/api/graph/thread-sync-preview/route.ts:104:    clioRecordsChanged: false,
./app/api/graph/thread-sync-preview/route.ts:122:          "Fail-closed Graph thread sync preview.  Add ?confirm=preview-graph-thread-sync to explicitly run a read-only Microsoft Graph mailbox lookup.  This preview never persists messages, creates drafts, sends email, writes Clio, or modifies database records.",
./app/api/reference-data/import-confirm/route.ts:177:        clioData: false,
./lib/documents/artifactContract.ts:44:  clioUploaded?: boolean;
./lib/documents/artifactContract.ts:45:  clioDocumentId?: string | null;
./lib/documents/artifactContract.ts:46:  clioDocumentName?: string | null;
./lib/documents/artifactContract.ts:47:  clioDocumentVersionUuid?: string | null;
./lib/documents/artifactContract.ts:88:    clioUploaded: Boolean(input.clioUploaded),
./lib/documents/artifactContract.ts:89:    clioDocumentId: clean(input.clioDocumentId) || null,
./lib/documents/artifactContract.ts:90:    clioDocumentName: clean(input.clioDocumentName) || null,
./lib/documents/artifactContract.ts:91:    clioDocumentVersionUuid: clean(input.clioDocumentVersionUuid) || null,
./lib/documents/artifactContract.ts:97:      canUploadToClioVault: Boolean(input.persistentFileCreated || downloadUrl),
./lib/documents/artifactContract.ts:103:      noClioUploadPretended: !input.clioUploaded,
./lib/documents/artifactContract.ts:142:    clioUploaded: false,
./lib/documents/artifactContract.ts:183:    clioUploaded: false,
./app/api/settlements/preview/route.ts:59:            noClioRecordsChanged: true,
./app/api/settlements/preview/route.ts:86:          noClioRecordsChanged: true,
./app/api/settlements/preview/route.ts:93:          "Preview failure only. No Clio records, database records, documents, or print queue records were changed.",
./prisma/migrations/20260427213500_add_clio_token_expires_at/migration.sql:1:ALTER TABLE "ClioToken"
./app/matter/[id]/page.tsx.bak-layout-fix-2026-04-23:89:        fetch(`/api/clio/matter-context?matterId=${id}`, {
./lib/graph/emailPersistence.ts:53:    clioMatterId?: string | number | null;
./lib/graph/emailPersistence.ts:54:    clioDisplayNumber?: string | null;
./lib/graph/emailPersistence.ts:55:    clioMaildropEmail?: string | null;
./lib/graph/emailPersistence.ts:56:    clioMaildropLabel?: string | null;
./lib/graph/emailPersistence.ts:97:  const clioMatterId = numberOrNull(context.clioMatterId);
./lib/graph/emailPersistence.ts:98:  const matterDisplayNumber = clean(context.matterDisplayNumber || context.clioDisplayNumber);
./lib/graph/emailPersistence.ts:100:  const clioDisplayNumber = clean(context.clioDisplayNumber);
./lib/graph/emailPersistence.ts:101:  const clioMaildropEmail = clean(context.clioMaildropEmail);
./lib/graph/emailPersistence.ts:102:  const clioMaildropLabel = clean(context.clioMaildropLabel);
./lib/graph/emailPersistence.ts:124:      clioMatterId,
./lib/graph/emailPersistence.ts:125:      clioDisplayNumber: clioDisplayNumber || null,
./lib/graph/emailPersistence.ts:126:      clioMaildropEmail: clioMaildropEmail || null,
./lib/graph/emailPersistence.ts:127:      clioMaildropLabel: clioMaildropLabel || null,
./lib/graph/emailPersistence.ts:148:      clioMatterId,
./lib/graph/emailPersistence.ts:149:      clioDisplayNumber: clioDisplayNumber || null,
./lib/graph/emailPersistence.ts:150:      clioMaildropEmail: clioMaildropEmail || null,
./lib/graph/emailPersistence.ts:151:      clioMaildropLabel: clioMaildropLabel || null,
./lib/graph/emailPersistence.ts:234:        clioDocumentId: attachment?.clioDocumentId === undefined || attachment?.clioDocumentId === null
./lib/graph/emailPersistence.ts:236:          : String(attachment.clioDocumentId),
./lib/graph/emailPersistence.ts:237:        clioDocumentName: clean(attachment?.clioDocumentName) || clean(attachment?.name) || null,
./lib/graph/emailPersistence.ts:238:        clioDocumentVersionUuid: clean(attachment?.clioDocumentVersionUuid) || null,
./lib/graph/emailPersistence.ts:252:      clioMatterId,
./lib/graph/emailPersistence.ts:253:      clioDisplayNumber: clioDisplayNumber || null,
./lib/graph/emailPersistence.ts:258:        clioMaildropEmail,
./lib/graph/emailPersistence.ts:259:        clioMaildropLabel,
./lib/graph/emailPersistence.ts:277:      clioRecordsChanged: false,
./lib/graph/emailPersistence.ts:336:    clioMatterId?: string | number | null;
./lib/graph/emailPersistence.ts:337:    clioDisplayNumber?: string | null;
./lib/graph/emailPersistence.ts:338:    clioMaildropEmail?: string | null;
./lib/graph/emailPersistence.ts:339:    clioMaildropLabel?: string | null;
./lib/graph/emailPersistence.ts:418:  const clioMatterId = numberOrNull(context.clioMatterId);
./lib/graph/emailPersistence.ts:419:  const matterDisplayNumber = clean(context.matterDisplayNumber || context.clioDisplayNumber);
./lib/graph/emailPersistence.ts:421:  const clioDisplayNumber = clean(context.clioDisplayNumber);
./lib/graph/emailPersistence.ts:422:  const clioMaildropEmail = clean(context.clioMaildropEmail);
./lib/graph/emailPersistence.ts:423:  const clioMaildropLabel = clean(context.clioMaildropLabel);
./lib/graph/emailPersistence.ts:450:      clioMatterId,
./lib/graph/emailPersistence.ts:451:      clioDisplayNumber: clioDisplayNumber || null,
./lib/graph/emailPersistence.ts:452:      clioMaildropEmail: clioMaildropEmail || null,
./lib/graph/emailPersistence.ts:453:      clioMaildropLabel: clioMaildropLabel || null,
./lib/graph/emailPersistence.ts:475:      clioMatterId,
./lib/graph/emailPersistence.ts:476:      clioDisplayNumber: clioDisplayNumber || null,
./lib/graph/emailPersistence.ts:477:      clioMaildropEmail: clioMaildropEmail || null,
./lib/graph/emailPersistence.ts:478:      clioMaildropLabel: clioMaildropLabel || null,
./lib/graph/emailPersistence.ts:585:    if (matterId || matterDisplayNumber || masterLawsuitId || clioMatterId || clioDisplayNumber) {
./lib/graph/emailPersistence.ts:602:            clioMatterId,
./lib/graph/emailPersistence.ts:603:            clioDisplayNumber: clioDisplayNumber || null,
./lib/graph/emailPersistence.ts:608:              clioMaildropEmail,
./lib/graph/emailPersistence.ts:609:              clioMaildropLabel,
./lib/graph/emailPersistence.ts:631:      clioRecordsChanged: false,
./app/api/claim-index/refresh-cluster/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/claim-index/refresh-cluster/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/claim-index/refresh-cluster");
./prisma/migrations/20260504131500_add_document_finalization/migration.sql:1:-- Add local audit/tracking records for explicit Clio document finalization.
./prisma/migrations/20260504131500_add_document_finalization/migration.sql:2:-- Clio remains the source of truth for actual document existence.
./prisma/migrations/20260504131500_add_document_finalization/migration.sql:13:    "clioUploadTarget" JSONB,
./app/court-calendar/page.tsx:737:      setWebCivilImportResult({ ok: true, previewOnly: true, parsedRowCount: events.length, importableRowCount: 0, skippedRowCount: 0, rows: [], safety: { clipboardOnly: true, clioRecordsChanged: false, externalWebCivilCalled: false } });
./app/court-calendar/page.tsx:739:      setWebCivilImportResult({ ok: true, previewOnly: true, parsedRowCount: events.length, importableRowCount: 0, skippedRowCount: 0, rows: [], error: "Template filled below. Browser clipboard permission was not available.", safety: { clipboardOnly: true, clioRecordsChanged: false, externalWebCivilCalled: false } });
./app/api/graph/draft-payload-preview/route.ts:26:        (context.clioMaildropEmail
./app/api/graph/draft-payload-preview/route.ts:27:          ? [{ name: context.clioMaildropLabel || "MailDrop", email: context.clioMaildropEmail }]
./app/api/graph/draft-payload-preview/route.ts:39:      !clean(context.clioMaildropEmail) && body?.matterId
./app/api/graph/draft-payload-preview/route.ts:43:    if (resolvedMaildrop?.clioMaildropEmail) {
./app/api/graph/draft-payload-preview/route.ts:46:        clioMaildropEmail: resolvedMaildrop.clioMaildropEmail,
./app/api/graph/draft-payload-preview/route.ts:47:        clioMaildropLabel: resolvedMaildrop.clioMaildropLabel,
./app/api/graph/draft-payload-preview/route.ts:52:          name: resolvedMaildrop.clioMaildropLabel,
./app/api/graph/draft-payload-preview/route.ts:53:          email: resolvedMaildrop.clioMaildropEmail,
./app/api/graph/draft-payload-preview/route.ts:84:        clioMatterId: context.clioMatterId,
./app/api/graph/draft-payload-preview/route.ts:85:        clioDisplayNumber: clean(context.clioDisplayNumber),
./app/api/graph/draft-payload-preview/route.ts:86:        clioMaildropEmail: clean(context.clioMaildropEmail),
./app/api/graph/draft-payload-preview/route.ts:87:        clioMaildropLabel: clean(context.clioMaildropLabel),
./app/api/graph/draft-payload-preview/route.ts:100:      clioRecordsChanged: false,
./app/api/graph/draft-payload-preview/route.ts:105:      maildropResolvedForPayload: Boolean(resolvedMaildrop?.clioMaildropEmail),
./app/api/graph/draft-payload-preview/route.ts:109:        "Preview only.  This route converts Barsh Matters document delivery data into a Microsoft Graph draft-message payload shape.  It does not create a draft, send email, read a mailbox, write to Clio, or write to the database.",
./app/api/graph/draft-payload-preview/route.ts:122:        clioRecordsChanged: false,
./lib/documents/templateImport.ts:93:    clioRecordsChanged: false,
./lib/documents/templateImport.ts:110:    clioRecordsChanged: false,
./app/api/reference-data/aliases/route.ts:15:    clioData: false,
./app/api/reference-data/aliases/route.ts:16:    noClioRecordsChanged: true,
./app/api/reference-data/aliases/route.ts:92:        clioData: false,
./app/api/reference-data/aliases/route.ts:207:        clioData: false,
./lib/settlementPreview.ts:116:    blockingErrors.push("Settled With must be selected from Clio contacts.");
./lib/settlementPreview.ts:157:    warnings.push("Principal fee percentage is 0%. Provider-specific Clio contact fee percentages are not loaded in this preview yet.");
./lib/settlementPreview.ts:161:    warnings.push("Interest fee percentage is 0%. Provider-specific Clio contact interest fee percentages are not loaded in this preview yet.");
./lib/settlementPreview.ts:206:      clioWritebackPreview: {
./lib/settlementPreview.ts:286:      previewDoesNotWriteToClio: true,
./lib/settlementPreview.ts:288:      intendedClioWriteTarget: "child-bill-matters-only",
./lib/settlementPreview.ts:293:      noClioRecordsChanged: true,
./lib/settlementPreview.ts:301:      "Preview only. This endpoint calculates proposed settlement allocation and future Clio writeback values but does not write to Clio, does not write to the database, does not generate documents, and does not change the print queue.",
./lib/graph/draft.ts:12:  clioDocumentId?: string | number | null;
./lib/graph/draft.ts:13:  clioDocumentVersionUuid?: string | null;
./lib/graph/draft.ts:29:    clioMatterId?: string | number | null;
./lib/graph/draft.ts:30:    clioDisplayNumber?: string | null;
./lib/graph/draft.ts:31:    clioMaildropEmail?: string | null;
./lib/graph/draft.ts:32:    clioMaildropLabel?: string | null;
./lib/graph/draft.ts:57:    clioDocumentId: string | null;
./lib/graph/draft.ts:58:    clioDocumentVersionUuid: string | null;
./lib/graph/draft.ts:170:  const maildropEmail = clean(input.matterContext?.clioMaildropEmail).toLowerCase();
./lib/graph/draft.ts:183:    clioDocumentId:
./lib/graph/draft.ts:184:      attachment.clioDocumentId === null || attachment.clioDocumentId === undefined
./lib/graph/draft.ts:186:        : String(attachment.clioDocumentId),
./lib/graph/draft.ts:187:    clioDocumentVersionUuid: cleanOptionalString(attachment.clioDocumentVersionUuid),
./lib/graph/draft.ts:194:  if (!maildropEmail) warnings.push("No Clio MailDrop address is available yet.");
./lib/graph/draft.ts:195:  if (maildropEmail && !hasMaildropCc) warnings.push("Clio MailDrop must be included in Cc for thread capture.");
./lib/graph/draft.ts:196:  if (maildropInBcc) warnings.push("Clio MailDrop must not be placed in Bcc because Reply All will not preserve it.");
./lib/graph/draft.ts:204:    ["String {00020329-0000-0000-C000-000000000046} Name BarshMattersClioMatterId", matter.clioMatterId],
./lib/graph/draft.ts:205:    ["String {00020329-0000-0000-C000-000000000046} Name BarshMattersClioDisplayNumber", matter.clioDisplayNumber],
./prisma/migrations/20260427212500_add_clio_token_token_type/migration.sql:1:ALTER TABLE "ClioToken"
./app/api/claim-index/by-master/route.ts:31:    noClioRecordsChanged: true,
./app/api/settlements/documents-print-local/route.ts:31:    value === "settlement-clio-duplicate-skipped" ||
./app/api/settlements/documents-print-local/route.ts:32:    value === "settlement-uploaded-to-clio"
./app/api/settlements/documents-print-local/route.ts:92:      clean(finalizedCandidate.filename || finalizedCandidate.clioDocumentName || finalizedCandidate.existingClioDocumentName || selected.filename || generated.filename) ||
./app/api/settlements/documents-print-local/route.ts:250:      This print view is local-first and reads the Barsh Matters DocumentFinalization record.  It does not create a PDF, upload to Clio, create an Outlook draft, or send email.
./lib/claimClusterCache.ts:3:// lawsuit membership correctness, direct matter display correctness, or Clio hydration.
./prisma/migrations/20260504143000_add_document_print_queue/migration.sql:1:-- Add local print queue records for Clio-verified finalized documents.
./prisma/migrations/20260504143000_add_document_print_queue/migration.sql:2:-- Clio remains the source of truth for actual document existence.
./prisma/migrations/20260504143000_add_document_print_queue/migration.sql:15:    "clioDocumentId" TEXT,
./prisma/migrations/20260504143000_add_document_print_queue/migration.sql:16:    "clioDocumentName" TEXT,
./prisma/migrations/20260504143000_add_document_print_queue/migration.sql:17:    "clioDocumentVersionUuid" TEXT,
./prisma/migrations/20260504143000_add_document_print_queue/migration.sql:36:CREATE INDEX IF NOT EXISTS "DocumentPrintQueueItem_clioDocumentId_idx" ON "DocumentPrintQueueItem"("clioDocumentId");
./app/admin/document-readiness/audit/page.tsx:12:  clioMasterMatterId?: number | null;
./app/admin/document-readiness/audit/page.tsx:13:  clioMasterDisplayNumber?: string | null;
./app/admin/document-readiness/audit/page.tsx:98:    masterClioShellMapping: CountBucket[];
./app/admin/document-readiness/audit/page.tsx:211:    "Clio Master",
./app/admin/document-readiness/audit/page.tsx:268:      row?.clioMasterDisplayNumber || row?.clioMasterMatterId,
./app/admin/document-readiness/audit/page.tsx:386:            adversary attorney details, linked child matter fields, master Clio shell mapping, and local template/finalization
./app/admin/document-readiness/audit/page.tsx:387:            records. It does not call Clio, call Graph, create working documents, generate documents, finalize documents,
./app/admin/document-readiness/audit/page.tsx:437:              <CountTable title="Master Clio shell mapping" rows={result.counts?.masterClioShellMapping || []} />
./app/admin/document-readiness/audit/page.tsx:483:                              <th style={thStyle}>Clio Shell</th>
./app/admin/document-readiness/audit/page.tsx:496:                                <td style={tdStyle}>{row.clioMasterDisplayNumber || row.clioMasterMatterId || ""}</td>
./app/admin/document-readiness/audit/page.tsx:550:                restore, Clio, Graph, document generation, finalization, upload, email, print, queue, delete, or write controls.
./app/api/clio/oauth/callback/route.ts:2:import { saveClioToken } from "@/lib/clioTokenStore";
./app/api/clio/oauth/callback/route.ts:27:    const expectedState = req.cookies.get("clio_oauth_state")?.value;
./app/api/clio/oauth/callback/route.ts:31:        { ok: false, error: `Clio authorization failed: ${error}` },
./app/api/clio/oauth/callback/route.ts:38:        { ok: false, error: "Missing OAuth code from Clio." },
./app/api/clio/oauth/callback/route.ts:45:        { ok: false, error: "Invalid OAuth state. Please restart Clio authorization." },
./app/api/clio/oauth/callback/route.ts:51:      process.env.CLIO_REDIRECT_URI ||
./app/api/clio/oauth/callback/route.ts:52:      `${getBaseUrl(req)}/api/clio/oauth/callback`;
./app/api/clio/oauth/callback/route.ts:56:      client_id: requiredEnv("CLIO_CLIENT_ID"),
./app/api/clio/oauth/callback/route.ts:57:      client_secret: requiredEnv("CLIO_CLIENT_SECRET"),
./app/api/clio/oauth/callback/route.ts:62:    const tokenRes = await fetch("https://app.clio.com/oauth/token", {
./app/api/clio/oauth/callback/route.ts:77:          error: "Clio token exchange failed.",
./app/api/clio/oauth/callback/route.ts:93:          error: "Clio token exchange did not return both access_token and refresh_token.",
./app/api/clio/oauth/callback/route.ts:100:    const saved = await saveClioToken({
./app/api/clio/oauth/callback/route.ts:108:      message: "Clio authorization complete. Tokens saved.",
./app/api/clio/oauth/callback/route.ts:112:    res.cookies.delete("clio_oauth_state");
./app/api/settlements/history/route.ts:37:            noClioRecordsChanged: true,
./app/api/settlements/history/route.ts:80:        noClioRecordsChanged: true,
./app/api/settlements/history/route.ts:95:          noClioRecordsChanged: true,
./app/admin/ticklers/page.tsx:772:              Read-only preview of duplicate open settlement payment follow-up ticklers grouped by settlement record, master lawsuit, and due date.  No delete, complete, merge, reopen, rerun, payment, closure, Clio, email, print, queue, or write action is available here.
./app/admin/ticklers/page.tsx:1393:                Administrator inspection only.  This popup does not process ticklers, complete ticklers, post payments, change statuses, run ticklers, write records, update Clio, or modify Barsh Matters data.
./app/api/reference-data/contact-search/route.ts:148:        clioRead: false,
./app/api/reference-data/contact-search/route.ts:149:        clioWrite: false,
./lib/clioWrite.ts.bak.deaggregate:1:import { clioFetch } from "@/lib/clio";
./lib/clioWrite.ts.bak.deaggregate:2:import { MATTER_CF } from "@/lib/clioFields";
./lib/clioWrite.ts.bak.deaggregate:24:  const res = await clioFetch(`/api/v4/matters/${matterId}.json?fields=${fields}`);
./lib/clioWrite.ts.bak.deaggregate:80:  const res = await clioFetch(`/api/v4/matters/${matterId}`, {
./lib/readMatterFromClio.ts:1:export async function readMatterFromClio(matterId: number) {
./lib/readMatterFromClio.ts:2:  const url = `https://app.clio.com/api/v4/matters/${matterId}.json?fields=id,display_number,description,status,client,custom_field_values`;
./lib/readMatterFromClio.ts:6:      Authorization: `Bearer ${process.env.CLIO_ACCESS_TOKEN}`,
./lib/readMatterFromClio.ts:13:    throw new Error(`Clio API ${res.status}: ${text}`);
./lib/referenceImport.ts:39:    clioData: false,
./lib/referenceImport.ts:40:    noClioRecordsChanged: true,
./lib/referenceImport.ts:54:    clioData: false,
./lib/referenceImport.ts:55:    noClioRecordsChanged: true,
./app/api/clio/oauth/start/route.ts:26:      process.env.CLIO_REDIRECT_URI ||
./app/api/clio/oauth/start/route.ts:27:      `${getBaseUrl(req)}/api/clio/oauth/callback`;
./app/api/clio/oauth/start/route.ts:31:      client_id: requiredEnv("CLIO_CLIENT_ID"),
./app/api/clio/oauth/start/route.ts:37:      `https://app.clio.com/oauth/authorize?${params.toString()}`
./app/api/clio/oauth/start/route.ts:40:    res.cookies.set("clio_oauth_state", state, {
./lib/clio.ts.backup.20260427-200918:1:import { getValidClioAccessToken, refreshClioToken } from "@/lib/clioTokenStore";
./lib/clio.ts.backup.20260427-200918:3:const CLIO_API_BASE = process.env.CLIO_API_BASE || "https://app.clio.com/api/v4";
./lib/clio.ts.backup.20260427-200918:5:function buildClioUrl(path: string): string {
./lib/clio.ts.backup.20260427-200918:7:  return `${CLIO_API_BASE}${path}`;
./lib/clio.ts.backup.20260427-200918:21:export async function clioFetch(
./lib/clio.ts.backup.20260427-200918:25:  const url = buildClioUrl(path);
./lib/clio.ts.backup.20260427-200918:27:  const token = await getValidClioAccessToken();
./lib/clio.ts.backup.20260427-200918:36:  const refreshed = await refreshClioToken();
./app/admin/document-templates/page.tsx:407:        note: "DOCX file content is captured as base64 and stored in the local DocumentTemplateVersion.contentText field when confirmed.  This does not generate documents, upload to Clio, create drafts, send email, print, or queue documents.",
./app/admin/document-templates/page.tsx:691:                Read-only admin view for document templates, categories, repository source, versions, and merge fields.  This page does not edit templates, seed templates, upload files, generate documents, send email, print, queue documents, or write to Clio.
./app/admin/document-templates/page.tsx:890:              Clio, create email drafts, print, or queue documents.  Merge fields may include visible UI
./app/admin/document-templates/page.tsx:927:                  <div><strong>No Clio / email / print:</strong> {String(!importConfirmResult.safety?.clioRecordsChanged && !importConfirmResult.safety?.emailsSent && !importConfirmResult.safety?.printQueueChanged)}</div>
./app/admin/document-templates/page.tsx:991:                  or write to Clio.  This section is advanced/debug-only.
./app/admin/document-templates/page.tsx:1007:              as base64.  This does not generate documents, upload to Clio, create drafts, send email, print, or queue documents.
./app/admin/document-templates/page.tsx:1167:                  <div><strong>No Clio / email / print:</strong> {String(!customTemplateConfirmResult.safety?.clioRecordsChanged && !customTemplateConfirmResult.safety?.emailsSent && !customTemplateConfirmResult.safety?.printQueueChanged)}</div>
./app/admin/document-templates/page.tsx:1386:          <strong>Safety:</strong> This admin function is read-only.  The endpoint may read local database template records or fallback registry records, but it does not seed, edit, delete, upload, generate, email, print, queue, or write Clio data.
./app/api/settlements/provider-remittance-breakdown/route.ts:67:    noClioRecordsChanged: true,
./app/api/settlements/provider-remittance-breakdown/route.ts:351:        "This route returns a generated DOCX response only. It does not upload documents to Clio, create database records, create persistent files, or change the print queue."
./prisma/migrations/20260520120500_add_local_settlement_records/migration.sql:2:-- These tables are app-native/local and do not write to Clio.
./app/api/reference-data/import-cleanup-confirm/route.ts:18:    clioData: false,
./app/api/reference-data/import-cleanup-confirm/route.ts:19:    noClioRecordsChanged: true,
./app/api/reference-data/import-cleanup-confirm/route.ts:155:        clioData: false,
./app/admin/ticklers/runner/page.tsx:228:            update Clio, generate documents, email, print, or queue anything.
./app/admin/ticklers/runner/page.tsx:389:                    Audit only: this summary records the LocalWorkflowTickler completion result and does not post payments, close matters, change settlement records, update Clio, generate documents, email, print, or queue anything.
./lib/clioCloseSync.ts:1:import { clioFetch } from "@/lib/clio";
./lib/clioCloseSync.ts:3:export type ClioCloseSyncResult = {
./lib/clioCloseSync.ts:18:async function readClioResponse(response: Response): Promise<unknown> {
./lib/clioCloseSync.ts:31: * Allowed Clio scope:
./lib/clioCloseSync.ts:35: * - ClaimIndex hydration/rebuild from Clio.
./lib/clioCloseSync.ts:36: * - lawsuit grouping changes from Clio.
./lib/clioCloseSync.ts:37: * - generic hidden Clio mutation.
./lib/clioCloseSync.ts:40:export async function syncClioMatterClosed(params: {
./lib/clioCloseSync.ts:44:}): Promise<ClioCloseSyncResult> {
./lib/clioCloseSync.ts:53:      error: "Missing valid Clio matter ID for close sync.",
./lib/clioCloseSync.ts:65:    const response = await clioFetch(endpoint, {
./lib/clioCloseSync.ts:73:    const responseBody = await readClioResponse(response);
./lib/clioCloseSync.ts:83:        error: `Clio close sync failed for matter ${matterId}: ${response.status} ${response.statusText}`,
./lib/clioCloseSync.ts:102:      error: error?.message || `Clio close sync failed for matter ${matterId}.`,
./lib/clioCloseSync.ts:107:export async function syncClioMattersClosed(params: {
./lib/clioCloseSync.ts:115:  failed: ClioCloseSyncResult[];
./lib/clioCloseSync.ts:116:  results: ClioCloseSyncResult[];
./lib/clioCloseSync.ts:122:  const results: ClioCloseSyncResult[] = [];
./lib/clioCloseSync.ts:124:    const result = await syncClioMatterClosed({
./lib/legacyClioOperationalRouteBlocked.ts:3:export function legacyClioOperationalRouteBlocked(routeName: string) {
./lib/legacyClioOperationalRouteBlocked.ts:9:      status: "legacy-clio-operational-route-disabled",
./lib/legacyClioOperationalRouteBlocked.ts:11:        "This legacy Clio-operational route has been disabled.  Barsh Matters local schema is now the operational source of truth.  Clio may be used only for explicit BRL/document shell creation, document vault storage/access, MailDrop/document access, or separately approved transitional writeback workflows.",
./lib/legacyClioOperationalRouteBlocked.ts:12:      allowedClioUses: [
./lib/legacyClioOperationalRouteBlocked.ts:14:        "Clio document vault upload/list/open",
./lib/legacyClioOperationalRouteBlocked.ts:15:        "Clio MailDrop resolution",
./lib/legacyClioOperationalRouteBlocked.ts:16:        "separately approved transitional Clio writeback with explicit confirmation",
./lib/legacyClioOperationalRouteBlocked.ts:19:        "using Clio to hydrate or overwrite ClaimIndex identity/reference/workflow fields",
./lib/legacyClioOperationalRouteBlocked.ts:20:        "using Clio as the source of truth for lawsuit grouping",
./lib/legacyClioOperationalRouteBlocked.ts:21:        "creating Clio master matters through legacy aggregation",
./lib/legacyClioOperationalRouteBlocked.ts:23:        "rebuilding local operational data from Clio without an explicit migration/import workflow",
./lib/legacyClioOperationalRouteBlocked.ts:28:        writesClio: false,
./lib/legacyClioOperationalRouteBlocked.ts:29:        createsClioMasterMatter: false,
./app/api/documents/preview-pdf/route.ts:41:            clioRecordsChanged: false,
./app/api/documents/preview-pdf/route.ts:77:          clioRecordsChanged: false,
./lib/clioLimiter.ts:3:export type ClioLimitCategory = "search" | "matter" | "contact" | "token" | "default";
./lib/clioLimiter.ts:7:const CATEGORY_LIMITS: Record<ClioLimitCategory, number> = {
./lib/clioLimiter.ts:17:const categoryActive: Record<ClioLimitCategory, number> = {
./lib/clioLimiter.ts:26:  category: ClioLimitCategory;
./lib/clioLimiter.ts:32:function canRun(category: ClioLimitCategory) {
./lib/clioLimiter.ts:51:export async function runWithClioLimit<T>(
./lib/clioLimiter.ts:52:  category: ClioLimitCategory,
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:1:-- Add explicit Clio master matter mapping fields for Barsh Matters master lawsuits.
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:3:-- Clio-assigned matter IDs and BRLXXXXX display numbers.
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:6:ADD COLUMN IF NOT EXISTS "clioMasterMatterId" INTEGER,
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:7:ADD COLUMN IF NOT EXISTS "clioMasterDisplayNumber" TEXT,
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:8:ADD COLUMN IF NOT EXISTS "clioMasterMatterDescription" TEXT,
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:9:ADD COLUMN IF NOT EXISTS "clioMasterMappedAt" TIMESTAMP(3),
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:10:ADD COLUMN IF NOT EXISTS "clioMasterMappingSource" TEXT;
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:12:CREATE INDEX IF NOT EXISTS "Lawsuit_clioMasterMatterId_idx"
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:13:ON "Lawsuit"("clioMasterMatterId");
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:15:CREATE INDEX IF NOT EXISTS "Lawsuit_clioMasterDisplayNumber_idx"
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql:16:ON "Lawsuit"("clioMasterDisplayNumber");
./app/api/settlements/local-history/route.ts:210:            clioRecordsChanged: false,
./app/api/settlements/local-history/route.ts:337:        clioRecordsChanged: false,
./app/api/settlements/local-history/route.ts:345:        "Read-only Barsh Matters local settlement history.  This route reads LocalSettlementRecord and LocalSettlementRow only.  It does not write Clio, generate documents, change the print queue, close matters, or perform settlement writeback.",
./app/api/settlements/local-history/route.ts:357:          clioRecordsChanged: false,
./app/admin/permissions/page.tsx:31:          <p style={{ margin: 0, color: "#475569", lineHeight: 1.45 }}>Read-only permissions foundation. This page exposes permission definitions and route/function mappings. It does not create users, edit roles, block pages, block functions, modify records, write Clio, or enforce permission restrictions yet.</p>
./app/api/reference-data/import-history/route.ts:17:    clioData: false,
./app/api/reference-data/import-history/route.ts:18:    noClioRecordsChanged: true,
./prisma/migrations/20260515123500_remove_webhook_infrastructure/migration.sql:1:-- Remove obsolete Clio webhook processing infrastructure.
./prisma/migrations/20260515123500_remove_webhook_infrastructure/migration.sql:2:-- Clio is no longer an operational source-of-truth dependency for Barsh Matters workflows.
./lib/clio.ts.backup.20260427-200825:1:const CLIO_API_BASE = process.env.CLIO_API_BASE;
./lib/clio.ts.backup.20260427-200825:3:export async function clioFetch(
./lib/clio.ts.backup.20260427-200825:10:      : `${CLIO_API_BASE}${path}`;
./lib/clio.ts.backup.20260427-200825:15:      Authorization: `Bearer ${process.env.CLIO_ACCESS_TOKEN}`,
./app/api/claim-index/by-matter/route.ts:173:      noClioWrite: true,
./app/api/claim-index/by-matter/route.ts:174:      noClioRead: true,
./app/api/claim-index/by-matter/route.ts:180:        clioWrite: false,
./app/api/claim-index/by-matter/route.ts:181:        clioRead: false,
./app/admin/page.tsx:48:      "Preview extra local lawsuits, child matter links, and mapped Clio document shells before any separately approved cleanup.",
./app/admin/page.tsx:184:            Admin-only Barsh Matters functions.  This page is protected by the administrator gate and does not perform imports, writes, edits, uploads, document generation, printing, email, queueing, or Clio operations by itself.
./app/api/settlements/writeback/route.ts:8:  action: "legacy-clio-settlement-route-disabled",
./app/api/settlements/writeback/route.ts:13:    "This legacy Clio settlement operational route is disabled.  Settlement/payment/workflow data is now handled by Barsh Matters local-first settlement routes.  Clio remains available only for document storage/access and MailDrop/document-vault behavior.",
./app/api/settlements/writeback/route.ts:20:    clioRecordsChanged: false,
./app/api/documents/finalize-preview/route.ts:3:import { clioFetch } from "@/lib/clio";
./app/api/documents/finalize-preview/route.ts:5:  findExistingClioDocumentsByFilename,
./app/api/documents/finalize-preview/route.ts:6:  listClioMatterDocuments,
./app/api/documents/finalize-preview/route.ts:7:} from "@/lib/clioDocumentUpload";
./app/api/documents/finalize-preview/route.ts:29:async function readClioJson(res: Response, fallback: string): Promise<any> {
./app/api/documents/finalize-preview/route.ts:48:async function resolveClioMatterByDisplayNumber(displayNumberInput: string) {
./app/api/documents/finalize-preview/route.ts:55:      clioMatterId: null,
./app/api/documents/finalize-preview/route.ts:56:      clioDisplayNumber: "",
./app/api/documents/finalize-preview/route.ts:57:      error: "Missing Clio display number.",
./app/api/documents/finalize-preview/route.ts:66:  const res = await clioFetch(`/matters.json?${params.toString()}`);
./app/api/documents/finalize-preview/route.ts:67:  const json = await readClioJson(res, `Clio matter lookup failed for ${displayNumber}`);
./app/api/documents/finalize-preview/route.ts:82:      clioMatterId: null,
./app/api/documents/finalize-preview/route.ts:83:      clioDisplayNumber: "",
./app/api/documents/finalize-preview/route.ts:84:      error: `Could not resolve Clio matter id for ${displayNumber}.`,
./app/api/documents/finalize-preview/route.ts:91:    clioMatterId: exact.id,
./app/api/documents/finalize-preview/route.ts:92:    clioDisplayNumber: exact.displayNumber,
./app/api/documents/finalize-preview/route.ts:186:        wouldUploadToClio: canGenerate,
./app/api/documents/finalize-preview/route.ts:224:      wouldUploadToClio: canGenerate,
./app/api/documents/finalize-preview/route.ts:234:      wouldUploadToClio: canGenerate,
./app/api/documents/finalize-preview/route.ts:244:      wouldUploadToClio: canGenerate,
./app/api/documents/finalize-preview/route.ts:312:      wouldUploadToClio: Boolean(validation.canGenerate),
./app/api/documents/finalize-preview/route.ts:317:      const directResolution = await resolveClioMatterByDisplayNumber(directDisplay);
./app/api/documents/finalize-preview/route.ts:321:        matterId: directResolution.clioMatterId,
./app/api/documents/finalize-preview/route.ts:322:        displayNumber: directResolution.clioDisplayNumber || directDisplay,
./app/api/documents/finalize-preview/route.ts:325:        wouldUploadToClio: Boolean(validation.canGenerate && directResolution.ok && directResolution.clioMatterId),
./app/api/documents/finalize-preview/route.ts:328:      if (!directResolution.ok || !directResolution.clioMatterId) {
./app/api/documents/finalize-preview/route.ts:330:        validation.blockingErrors.push(directResolution.error || "Could not resolve direct matter Clio upload target.");
./app/api/documents/finalize-preview/route.ts:350:    let existingClioDocuments: any[] = [];
./app/api/documents/finalize-preview/route.ts:355:        existingClioDocuments = await listClioMatterDocuments(Number(uploadTarget.matterId));
./app/api/documents/finalize-preview/route.ts:358:          err?.message || "Could not check existing Clio documents.";
./app/api/documents/finalize-preview/route.ts:363:      const existingMatches = findExistingClioDocumentsByFilename(
./app/api/documents/finalize-preview/route.ts:364:        existingClioDocuments,
./app/api/documents/finalize-preview/route.ts:370:        alreadyUploadedToClio: existingMatches.length > 0,
./app/api/documents/finalize-preview/route.ts:372:        existingClioDocuments: existingMatches.map((match) => ({
./app/api/documents/finalize-preview/route.ts:384:      .filter((document) => document.alreadyUploadedToClio)
./app/api/documents/finalize-preview/route.ts:389:        existingClioDocuments: document.existingClioDocuments,
./app/api/documents/finalize-preview/route.ts:400:      clioUploadTarget: {
./app/api/documents/finalize-preview/route.ts:402:        wouldUploadToClio: canGenerate,
./app/api/documents/finalize-preview/route.ts:435:        noClioRecordsChanged: true,
./app/api/documents/finalize-preview/route.ts:443:        "Dry run only. This endpoint previews finalization/upload targets only. No files were persisted, no documents were uploaded to Clio, no Clio records were changed, no folders were created, and no database records were changed.",
./app/api/documents/finalize-preview/route.ts:454:          noClioRecordsChanged: true,
./lib/clioDocumentUpload.ts:1:import { clioFetch } from "@/lib/clio";
./lib/clioDocumentUpload.ts:3:type ClioPutHeader = {
./lib/clioDocumentUpload.ts:8:type ClioUploadResult = {
./lib/clioDocumentUpload.ts:15:export type ClioMatterDocument = {
./lib/clioDocumentUpload.ts:38:function headersFromClioPutHeaders(putHeaders: ClioPutHeader[]): Headers {
./lib/clioDocumentUpload.ts:53:async function readClioJson(res: Response, fallback: string): Promise<any> {
./lib/clioDocumentUpload.ts:72:export async function uploadBufferToClioMatterDocuments(params: {
./lib/clioDocumentUpload.ts:77:}): Promise<ClioUploadResult> {
./lib/clioDocumentUpload.ts:86:    throw new Error("Missing valid Clio matter ID for document upload.");
./lib/clioDocumentUpload.ts:90:    throw new Error("Missing filename for Clio document upload.");
./lib/clioDocumentUpload.ts:97:  const createRes = await clioFetch(
./lib/clioDocumentUpload.ts:116:  const createJson = await readClioJson(
./lib/clioDocumentUpload.ts:118:    `Clio document create failed for ${filename}`
./lib/clioDocumentUpload.ts:132:      `Clio document create response was missing required upload fields for ${filename}: ${JSON.stringify(createJson)}`
./lib/clioDocumentUpload.ts:136:  const uploadHeaders = headersFromClioPutHeaders(putHeaders);
./lib/clioDocumentUpload.ts:155:      `Signed Clio document upload failed for ${filename}: ${uploadRes.status} ${uploadRes.statusText}${uploadText ? ` ${uploadText}` : ""}`
./lib/clioDocumentUpload.ts:159:  const finalizeRes = await clioFetch(
./lib/clioDocumentUpload.ts:175:  const finalizeJson = await readClioJson(
./lib/clioDocumentUpload.ts:177:    `Clio document finalize failed for ${filename}`
./lib/clioDocumentUpload.ts:186:      `Clio did not confirm fully_uploaded=true for ${filename}: ${JSON.stringify(finalizeJson)}`
./lib/clioDocumentUpload.ts:198:export async function listClioMatterDocuments(matterIdInput: number): Promise<ClioMatterDocument[]> {
./lib/clioDocumentUpload.ts:202:    throw new Error("Missing valid Clio matter ID for document lookup.");
./lib/clioDocumentUpload.ts:214:  const res = await clioFetch(
./lib/clioDocumentUpload.ts:218:  const json = await readClioJson(
./lib/clioDocumentUpload.ts:220:    `Clio document lookup failed for matter ${matterId}`
./lib/clioDocumentUpload.ts:251:export function findExistingClioDocumentsByFilename(
./lib/clioDocumentUpload.ts:252:  existingDocuments: ClioMatterDocument[],
./lib/clioDocumentUpload.ts:254:): ClioMatterDocument[] {
./app/api/reference-data/import-cleanup-preview/route.ts:18:    clioData: false,
./app/api/reference-data/import-cleanup-preview/route.ts:19:    noClioRecordsChanged: true,
./lib/clioTokenStore.ts:3:type StoredClioToken = {
./lib/clioTokenStore.ts:9:let refreshInFlight: Promise<StoredClioToken> | null = null;
./lib/clioTokenStore.ts:24:export async function getStoredClioToken(): Promise<StoredClioToken> {
./lib/clioTokenStore.ts:25:  const dbToken = await prisma.clioToken.findUnique({
./lib/clioTokenStore.ts:37:  const accessToken = requiredEnv("CLIO_ACCESS_TOKEN");
./lib/clioTokenStore.ts:38:  const refreshToken = requiredEnv("CLIO_REFRESH_TOKEN");
./lib/clioTokenStore.ts:47:export async function saveClioToken(token: StoredClioToken): Promise<StoredClioToken> {
./lib/clioTokenStore.ts:48:  const saved = await prisma.clioToken.upsert({
./lib/clioTokenStore.ts:70:async function refreshClioTokenNow(): Promise<StoredClioToken> {
./lib/clioTokenStore.ts:71:  const current = await getStoredClioToken();
./lib/clioTokenStore.ts:74:    client_id: requiredEnv("CLIO_CLIENT_ID"),
./lib/clioTokenStore.ts:75:    client_secret: requiredEnv("CLIO_CLIENT_SECRET"),
./lib/clioTokenStore.ts:80:  const res = await fetch("https://app.clio.com/oauth/token", {
./lib/clioTokenStore.ts:93:      `Clio token refresh failed: ${res.status} ${JSON.stringify(json)}`
./lib/clioTokenStore.ts:102:    throw new Error(`Clio token refresh returned no access_token`);
./lib/clioTokenStore.ts:105:  return saveClioToken({
./lib/clioTokenStore.ts:114:export async function refreshClioToken(): Promise<StoredClioToken> {
./lib/clioTokenStore.ts:116:    refreshInFlight = refreshClioTokenNow().finally(() => {
./lib/clioTokenStore.ts:124:export async function getValidClioAccessToken(): Promise<string> {
./lib/clioTokenStore.ts:125:  const current = await getStoredClioToken();
./lib/clioTokenStore.ts:131:  const refreshed = await refreshClioToken();
./app/api/settlements/local-record/route.ts:136:            clioRecordsChanged: false,
./app/api/settlements/local-record/route.ts:185:            clioRecordsChanged: false,
./app/api/settlements/local-record/route.ts:227:          clioRecordsChanged: false,
./app/api/settlements/local-record/route.ts:294:          clioRecordsChanged: false,
./app/api/settlements/local-record/route.ts:303:          "Local settlement record saved to Barsh Matters local settlement tables only.  One active settlement is permitted per lawsuit.  No Clio write, document generation, print queue change, or matter closure occurred.",
./app/api/settlements/local-record/route.ts:316:          clioRecordsChanged: false,
./lib/claimIndexUpsert.ts:3:import { clioFetch } from "@/lib/clio";
./lib/claimIndexUpsert.ts:4:import { MATTER_CF } from "@/lib/clioFields";
./lib/claimIndexUpsert.ts:29:  const res = await clioFetch(`/api/v4/contacts/${id}.json?fields=id,name`);
./app/admin/backup-restore/page.tsx:47:      pullsDocumentsFromClio?: boolean;
./app/admin/backup-restore/page.tsx:107:      clioWrite: boolean;
./app/admin/backup-restore/page.tsx:146:      clioWrite: boolean;
./app/admin/backup-restore/page.tsx:179:      clioWrite: boolean;
./app/admin/backup-restore/page.tsx:220:      pullsDocumentsFromClio?: boolean;
./app/admin/backup-restore/page.tsx:419:    ["Pulls documents from Clio", baseline?.manifest?.documentFilePolicy?.pullsDocumentsFromClio ?? "", comparison?.manifest?.documentFilePolicy?.pullsDocumentsFromClio ?? ""],
./app/admin/backup-restore/page.tsx:664:  if (latest?.documentFilePolicy?.pullsDocumentsFromClio !== false) {
./app/admin/backup-restore/page.tsx:665:    warnings.push({ level: "warning", message: "Latest backup manifest does not confirm Clio document pulling is disabled." });
./app/admin/backup-restore/page.tsx:997:            Preview-only restore safety: this page does not execute restores, write Clio data, send email, generate documents, or change the print queue.
./app/admin/backup-restore/page.tsx:1027:              <div><strong>Pulls docs from Clio:</strong> {passFail(status?.latestManifest?.documentFilePolicy?.pullsDocumentsFromClio)}</div>
./app/admin/backup-restore/page.tsx:1043:              Read-only preview for cleaning up old scheduled-backup log noise.  This section shows log health, old-error presence, file size, line count, and proposed archive names only.  It does not archive, truncate, move, delete, restore data, send alerts, call Clio, generate documents, or change the print queue.
./app/admin/backup-restore/page.tsx:1109:              Guarded action: archive <strong>launchd.err.log only</strong>. This moves the current stderr log to a timestamped archive and creates a fresh empty stderr log. It does not touch stdout, backups, manifests, database dumps, restore workflows, alert state, Clio, email, documents, or the print queue.
./app/admin/backup-restore/page.tsx:1158:              Read-only alert state from the monitored backup wrapper.  This panel shows the last alert and duplicate-suppression state only.  It does not send email, edit alert state, restore data, delete backups, run retention cleanup, call Clio, generate documents, or change the print queue.
./app/admin/backup-restore/page.tsx:1230:              Read-only visibility for the scheduled local database/index backup system.  This section reads backup status, retention policy, and recent backup logs only.  It does not delete backups, execute restores, call Clio, send email, generate documents, or change the print queue.
./app/admin/backup-restore/page.tsx:1557:              Read-only comparison preview for two backup manifests.  This comparison does not restore data, delete backups, run retention cleanup, call Clio, send email, generate documents, or change the print queue.
./app/admin/backup-restore/page.tsx:1669:              Read-only audit report generated from the backup metadata already loaded on this page.  Copy and CSV export are client-side only.  This section does not create server-side export files, restore data, delete backups, run retention cleanup, call Clio, send email, generate documents, or change the print queue.
./app/admin/backup-restore/page.tsx:1879:                  Read-only manifest inspection.  This popup does not restore data, delete backups, call Clio, send email, generate documents, or change the print queue.  Passwords and database URLs are not displayed; the manifest only reports whether a password was stored.
./app/admin/backup-restore/page.tsx:1957:                        detailRow("Pulls documents from Clio", passFail(detailBackup.manifest?.documentFilePolicy?.pullsDocumentsFromClio)),
./app/api/claim-index/search-grouped/route.ts:89:      clioMasterMatterId: true,
./app/api/claim-index/search-grouped/route.ts:90:      clioMasterDisplayNumber: true,
./app/api/claim-index/search-grouped/route.ts:91:      clioMasterMatterDescription: true,
./app/api/claim-index/search-grouped/route.ts:116:      clioMasterMatterId: lawsuit.clioMasterMatterId || null,
./app/api/claim-index/search-grouped/route.ts:117:      clio_master_matter_id: lawsuit.clioMasterMatterId || null,
./app/api/claim-index/search-grouped/route.ts:118:      clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber || null,
./app/api/claim-index/search-grouped/route.ts:119:      clio_master_display_number: lawsuit.clioMasterDisplayNumber || null,
./app/api/claim-index/search-grouped/route.ts:120:      clioMasterMatterDescription: lawsuit.clioMasterMatterDescription || null,
./app/api/claim-index/search-grouped/route.ts:121:      clio_master_matter_description: lawsuit.clioMasterMatterDescription || null,
./app/api/claim-index/search-grouped/route.ts:156:        noClioRead: true,
./app/api/claim-index/search-grouped/route.ts:157:        noClioWrite: true,
./app/api/claim-index/search-grouped/route.ts:198:    noClioRead: true,
./app/api/claim-index/search-grouped/route.ts:199:    noClioWrite: true,
./app/api/claim-index/search-grouped/route.ts:200:    noClioHydration: true,
./app/api/documents/packet/route.ts:234:      clioMasterMatterId: true,
./app/api/documents/packet/route.ts:235:      clioMasterDisplayNumber: true,
./app/api/documents/packet/route.ts:236:      clioMasterMatterDescription: true,
./app/api/documents/packet/route.ts:237:      clioMasterMappedAt: true,
./app/api/documents/packet/route.ts:238:      clioMasterMappingSource: true,
./app/api/documents/packet/route.ts:269:  const hasMappedClioMasterMatter =
./app/api/documents/packet/route.ts:270:    Boolean(lawsuit?.clioMasterMatterId) || Boolean(clean(lawsuit?.clioMasterDisplayNumber));
./app/api/documents/packet/route.ts:273:  if (masterRows.length === 0 && !hasMappedClioMasterMatter) {
./app/api/documents/packet/route.ts:396:    clioCorrectnessDependency: false,
./app/api/documents/packet/route.ts:401:      clio: false,
./app/api/documents/packet/route.ts:550:          clioMasterMatterId: lawsuit.clioMasterMatterId,
./app/api/documents/packet/route.ts:551:          clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber,
./app/api/documents/packet/route.ts:552:          clioMasterMatterDescription: lawsuit.clioMasterMatterDescription,
./app/api/documents/packet/route.ts:553:          clioMasterMappedAt: lawsuit.clioMasterMappedAt,
./app/api/documents/packet/route.ts:554:          clioMasterMappingSource: lawsuit.clioMasterMappingSource,
./app/api/documents/packet/route.ts:560:    masterMatter: lawsuit?.clioMasterMatterId
./app/api/documents/packet/route.ts:563:          matterId: lawsuit.clioMasterMatterId,
./app/api/documents/packet/route.ts:564:          id: lawsuit.clioMasterMatterId,
./app/api/documents/packet/route.ts:565:          displayNumber: lawsuit.clioMasterDisplayNumber || master?.display_number || masterLawsuitId,
./app/api/documents/packet/route.ts:566:          display_number: lawsuit.clioMasterDisplayNumber || master?.display_number || masterLawsuitId,
./app/api/documents/packet/route.ts:567:          description: lawsuit.clioMasterMatterDescription || master?.description || "",
./app/api/documents/packet/route.ts:569:          mappingSource: lawsuit.clioMasterMappingSource || "lawsuit.clio-master-mapping",
./app/api/documents/packet/route.ts:570:          mappedAt: lawsuit.clioMasterMappedAt || null,
./app/api/documents/packet/route.ts:571:          source: "lawsuit.clio-master-mapping",
./app/api/documents/packet/route.ts:595:      hasMappedClioMasterMatter,
./app/api/documents/packet/route.ts:600:      reason: "local-document-packet-no-clio-refresh",
./app/api/documents/packet/route.ts:601:      clioCorrectnessDependency: false,
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:30:mustContain("route reports no Clio writes", route, "writesClio: false");
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:31:mustContain("route reports no Clio deletes", route, "deletesClio: false");
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:38:mustNotContain("route must not use Clio", route, "clioFetch");
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:39:mustNotContain("route must not import Clio", route, "@/lib/clio");
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:40:mustNotContain("route must not call document upload helper", route, "clioDocumentUpload");
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:55:mustContain("page explains child Clio matters are not deleted", page, "It will not delete child/bill Clio matters");
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:67:console.log("EXPECTS_NO_CLIO_WRITES=YES");
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:68:console.log("EXPECTS_NO_CLIO_DELETES=YES");
./lib/settlementClioWriteback.ts:1:import { clioFetch } from "@/lib/clio";
./lib/settlementClioWriteback.ts:2:import { MATTER_CF } from "@/lib/clioFields";
./lib/settlementClioWriteback.ts:13:type ClioMatter = {
./lib/settlementClioWriteback.ts:83:function isMasterMatter(matter: ClioMatter): boolean {
./lib/settlementClioWriteback.ts:93:function findCFV(matter: ClioMatter, fieldId: number): CFV | undefined {
./lib/settlementClioWriteback.ts:109:async function readClioContact(contactId: unknown): Promise<ContactValidation> {
./lib/settlementClioWriteback.ts:118:      error: "SETTLED_WITH must be a valid Clio person contact ID.",
./lib/settlementClioWriteback.ts:122:  const res = await clioFetch(
./lib/settlementClioWriteback.ts:139:      error: `Could not read SETTLED_WITH contact ${id} from Clio: status ${res.status}; body ${body}`,
./lib/settlementClioWriteback.ts:164:async function readMatterLive(matterId: number): Promise<ClioMatter> {
./lib/settlementClioWriteback.ts:165:  const res = await clioFetch(
./lib/settlementClioWriteback.ts:178:      `Failed to read matter ${matterId} from Clio: status ${res.status}; body ${body}`
./lib/settlementClioWriteback.ts:185:    throw new Error(`Matter ${matterId} was not returned by Clio.`);
./lib/settlementClioWriteback.ts:192:  matter: ClioMatter;
./lib/settlementClioWriteback.ts:267:export async function previewSettlementWritebackToClio(params: {
./lib/settlementClioWriteback.ts:282:  const settledWithContact = await readClioContact(params.request.fields.SETTLED_WITH);
./lib/settlementClioWriteback.ts:309:      noClioRecordsChanged: true,
./lib/settlementClioWriteback.ts:318:export async function writeSettlementToClioMatter(params: {
./lib/settlementClioWriteback.ts:336:        noClioRecordsChanged: true,
./lib/settlementClioWriteback.ts:369:  const res = await clioFetch(`/api/v4/matters/${matterId}.json`, {
./lib/settlementClioWriteback.ts:387:      `Failed to write settlement fields to Clio matter ${matter.display_number || matterId}: status ${res.status}; body ${body}`
./lib/settlementClioWriteback.ts:403:      clioRecordsChanged: true,
./app/api/reference-data/options/route.ts:188:      noClioWrite: true,
./app/api/reference-data/options/route.ts:189:      noClioRead: true,
./app/api/reference-data/options/route.ts:209:        clioWrite: false,
./app/api/reference-data/options/route.ts:210:        clioRead: false,
./app/admin/reference-data/page.tsx:58:      clioMatterId?: string | null;
./app/admin/reference-data/page.tsx:59:      clioDisplayNumber?: string | null;
./app/admin/reference-data/page.tsx:71:    writesClio: boolean;
./app/admin/reference-data/page.tsx:75:    callsClio: boolean;
./app/admin/reference-data/page.tsx:894:        `Confirmed cleanup deactivated ${json.summary?.deactivated ?? 0} imported reference records.  No records were hard-deleted, and no Clio data was changed.`
./app/admin/reference-data/page.tsx:1018:      setStatusMessage("Generated CSV import preview only.  No database records or Clio records were changed.");
./app/admin/reference-data/page.tsx:1068:        `Confirmed CSV import.  Created ${json.summary?.created ?? 0}, updated ${json.summary?.updated ?? 0}, aliases added ${json.summary?.aliasesCreated ?? 0}.  No Clio data was changed.`
./app/admin/reference-data/page.tsx:1110:      setStatusMessage("Created local reference record.  No Clio data was changed.");
./app/admin/reference-data/page.tsx:1157:            : "Updated local reference record.  No Clio data was changed."
./app/admin/reference-data/page.tsx:1198:      setStatusMessage("Added local search alias.  No Clio data was changed.");
./app/admin/reference-data/page.tsx:1289:                <div style={{ marginTop: 4, fontSize: 14 }}><strong>No drafts / sends / Clio writes:</strong> {String(!emailAutomationStatus.safety.createsDrafts && !emailAutomationStatus.safety.sendsEmail && !emailAutomationStatus.safety.writesClio)}</div>
./app/admin/reference-data/page.tsx:1315:                          <td style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>{row.matterId || row.masterLawsuitId || row.clioDisplayNumber || row.clioMatterId || "—"}</td>
./app/admin/reference-data/page.tsx:1401:              local PostgreSQL database, not in Clio.  Clio should remain the document vault and external shell.
./app/admin/reference-data/page.tsx:1481:                Preview itself does not change reference records, Clio records, documents, or print-queue records.
./app/admin/reference-data/page.tsx:1753:                write to Clio, generate documents, change the print queue, or hard-delete records.
./app/admin/reference-data/page.tsx:1924:                and does not modify local records or Clio.
./app/admin/reference-data/page.tsx:2293:                    This popup reads the audit log only.  It does not modify local records, Clio, documents, or the print queue.
./app/admin/reference-data/page.tsx:2467:                deactivate-only, and does not hard-delete records, touch Clio, generate documents, or change the print queue.
./app/admin/reference-data/page.tsx:2652:                  Confirmed deactivate cleanup: {cleanupConfirmResult.summary?.deactivated ?? 0} imported records deactivated.  No records were hard-deleted, no aliases were deleted, and no Clio data was changed.
./app/admin/reference-data/page.tsx:2926:                  Local Barsh Matters data.  Not a Clio contact search.
./app/api/settlements/attorney-fee-breakdown/route.ts:67:    noClioRecordsChanged: true,
./app/api/settlements/attorney-fee-breakdown/route.ts:356:        "This route returns a generated DOCX response only. It does not upload documents to Clio, create database records, create persistent files, or change the print queue."
./lib/clioFields.ts:1:export const CLIO_API_VERSION = process.env.CLIO_API_VERSION || "4.0.13";
./scripts/verify-direct-view-documents-popup-header-standard-safety.mjs:33:  'No documents are currently listed in this Clio matter Documents tab.',
./scripts/verify-direct-view-documents-popup-header-standard-safety.mjs:35:  'Clio Matter ID:',
./scripts/verify-direct-view-documents-popup-header-standard-safety.mjs:37:  "Pick a document from this matter's Clio Documents tab.",
./app/admin/lawsuit-cleanup/page.tsx:22:  clioMasterMatterId: string;
./app/admin/lawsuit-cleanup/page.tsx:23:  clioMasterDisplayNumber: string;
./app/admin/lawsuit-cleanup/page.tsx:24:  clioMasterMappingSource: string;
./app/admin/lawsuit-cleanup/page.tsx:25:  hasClioShell: boolean;
./app/admin/lawsuit-cleanup/page.tsx:50:  clioDeleteCandidateCount?: number;
./app/admin/lawsuit-cleanup/page.tsx:52:  writesClio?: boolean;
./app/admin/lawsuit-cleanup/page.tsx:53:  deletesClio?: boolean;
./app/admin/lawsuit-cleanup/page.tsx:85:  const [onlyWithClioShell, setOnlyWithClioShell] = useState(false);
./app/admin/lawsuit-cleanup/page.tsx:124:          deleteClioShell: true,
./app/admin/lawsuit-cleanup/page.tsx:154:      params.set("onlyWithClioShell", onlyWithClioShell ? "true" : "false");
./app/admin/lawsuit-cleanup/page.tsx:187:            Preview-only Admin utility for inspecting extra local lawsuit records, child matter links, and mapped Clio master document shells.
./app/admin/lawsuit-cleanup/page.tsx:197:        <strong>Preview only.</strong> This page does not deaggregate matters, delete local lawsuits, delete Clio shells, update ClaimIndex, write Clio, upload documents, send email, or queue print jobs.
./app/admin/lawsuit-cleanup/page.tsx:219:            <input type="checkbox" checked={onlyWithClioShell} onChange={(event) => setOnlyWithClioShell(event.target.checked)} />
./app/admin/lawsuit-cleanup/page.tsx:220:            Only lawsuits with mapped Clio shells
./app/admin/lawsuit-cleanup/page.tsx:236:          {cleanupResult.clioDeleteResult ? (
./app/admin/lawsuit-cleanup/page.tsx:237:            <> · deleted Clio shell status {cleanupResult.clioDeleteResult.status}</>
./app/admin/lawsuit-cleanup/page.tsx:262:              <div style={summaryLabelStyle}>Clio Shell Candidates</div>
./app/admin/lawsuit-cleanup/page.tsx:263:              <div style={summaryValueStyle}>{preview.clioDeleteCandidateCount ?? 0}</div>
./app/admin/lawsuit-cleanup/page.tsx:329:                      <div><strong>Clio Shell:</strong> {safe(lawsuit.clioMasterDisplayNumber || lawsuit.clioMasterMatterId)}</div>
./app/admin/lawsuit-cleanup/page.tsx:330:                      <div><strong>Mapping Source:</strong> {safe(lawsuit.clioMasterMappingSource)}</div>
./app/admin/lawsuit-cleanup/page.tsx:337:                          This will delete only the mapped Clio master shell when present, clear local child lawsuit links,
./app/admin/lawsuit-cleanup/page.tsx:338:                          delete this local Lawsuit row, and create an AuditLog entry.  It will not delete child/bill Clio matters.
./app/admin/lawsuit-cleanup/page.tsx:429:              update Clio, or modify Barsh Matters data.
./app/admin/lawsuit-cleanup/page.tsx:442:                      <th style={thStyle}>Clio Shell</th>
./app/admin/lawsuit-cleanup/page.tsx:448:                      const clioShell = entry.details?.clioShell || {};
./app/admin/lawsuit-cleanup/page.tsx:449:                      const clioLabel =
./app/admin/lawsuit-cleanup/page.tsx:450:                        clioShell.clioMasterDisplayNumber ||
./app/admin/lawsuit-cleanup/page.tsx:451:                        clioShell.clioMasterMatterId ||
./app/admin/lawsuit-cleanup/page.tsx:452:                        entry.details?.deletedLocalLawsuit?.clioMasterDisplayNumber ||
./app/admin/lawsuit-cleanup/page.tsx:454:                      const clioStatus =
./app/admin/lawsuit-cleanup/page.tsx:455:                        clioShell.result?.status ||
./app/admin/lawsuit-cleanup/page.tsx:456:                        entry.details?.clioDeleteResult?.status ||
./app/admin/lawsuit-cleanup/page.tsx:469:                            {safe(clioLabel)}
./app/admin/lawsuit-cleanup/page.tsx:470:                            {clioStatus !== "—" ? ` / status ${clioStatus}` : ""}
./scripts/verify-graph-background-thread-sync-safety.mjs:63:  "clioRecordsChanged: false",
./scripts/verify-graph-background-thread-sync-safety.mjs:67:console.log("\n=== VERIFY NO DRAFT / SEND / CLIO / DOCUMENT UPLOAD WIRING ===");
./scripts/verify-graph-background-thread-sync-safety.mjs:75:  "clio.documents",
./scripts/verify-graph-background-thread-sync-safety.mjs:77:  "clioDocumentUpload",
./scripts/verify-graph-background-thread-sync-safety.mjs:78:  "writeToClio",
./scripts/verify-graph-background-thread-sync-safety.mjs:79:  "settlementClioWriteback",
./scripts/verify-settlement-document-local-print-queue-safety.mjs:34:  mustInclude(routePath, "clioRecordsChanged: false");
./scripts/verify-settlement-document-local-print-queue-safety.mjs:35:  mustInclude(routePath, "clioDocumentsUploaded: false");
./scripts/verify-settlement-document-local-print-queue-safety.mjs:38:  mustNotInclude(routePath, "uploadDocumentToClio", "Clio document upload");
./scripts/verify-settlement-document-local-print-queue-safety.mjs:48:mustInclude(pagePath, "No PDF was generated, no Clio upload occurred, no Outlook draft was created, and no email was sent.");
./app/api/documents/print-queue/route.ts:4:  findExistingClioDocumentsByFilename,
./app/api/documents/print-queue/route.ts:5:  listClioMatterDocuments,
./app/api/documents/print-queue/route.ts:6:} from "@/lib/clioDocumentUpload";
./app/api/documents/print-queue/route.ts:7:import { clioFetch } from "@/lib/clio";
./app/api/documents/print-queue/route.ts:73:async function verifyClioDocumentById(documentId: string) {
./app/api/documents/print-queue/route.ts:79:  const res = await clioFetch(
./app/api/documents/print-queue/route.ts:105:  const clioDocumentId = clean(candidate?.clioDocumentId);
./app/api/documents/print-queue/route.ts:106:  const clioDocumentVersionUuid = clean(candidate?.clioDocumentVersionUuid);
./app/api/documents/print-queue/route.ts:113:    clioDocumentId || "no-document-id",
./app/api/documents/print-queue/route.ts:114:    clioDocumentVersionUuid || "no-version-uuid",
./app/api/documents/print-queue/route.ts:145:      (candidate: any) => candidate?.currentClioExistenceVerified === true
./app/api/documents/print-queue/route.ts:156:    const dedupeClioDocumentId = clean(req.nextUrl.searchParams.get("dedupeClioDocumentId")) !== "false";
./app/api/documents/print-queue/route.ts:199:        clean(row?.filename).toLowerCase().endsWith(".pdf") && clean(row?.clioDocumentId)
./app/api/documents/print-queue/route.ts:203:    if (dedupeClioDocumentId) {
./app/api/documents/print-queue/route.ts:206:        const clioDocumentId = clean(row?.clioDocumentId);
./app/api/documents/print-queue/route.ts:208:        const dedupeKey = clioDocumentId ? `${clioDocumentId}|${documentKey}` : "";
./app/api/documents/print-queue/route.ts:225:      dedupeClioDocumentId,
./app/api/documents/print-queue/route.ts:230:        noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:243:          noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:273:            noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:290:            noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:307:          numberOrNull(rawCandidate?.clioMatterId) ||
./app/api/documents/print-queue/route.ts:308:          numberOrNull(body?.clioMatterId) ||
./app/api/documents/print-queue/route.ts:312:        const clioDocumentId = clean(rawCandidate?.clioDocumentId || rawCandidate?.documentId || rawCandidate?.id);
./app/api/documents/print-queue/route.ts:313:        const filename = clean(rawCandidate?.filename || rawCandidate?.clioDocumentName || rawCandidate?.name);
./app/api/documents/print-queue/route.ts:315:        if (!masterMatterId || !clioDocumentId) {
./app/api/documents/print-queue/route.ts:318:            clioDocumentId,
./app/api/documents/print-queue/route.ts:320:            error: "Direct matter print candidate requires a direct matter ID and Clio document ID.",
./app/api/documents/print-queue/route.ts:325:        const currentDocuments = await listClioMatterDocuments(masterMatterId);
./app/api/documents/print-queue/route.ts:326:        const wantedId = Number(clioDocumentId);
./app/api/documents/print-queue/route.ts:330:          : findExistingClioDocumentsByFilename(currentDocuments, filename)[0] || null;
./app/api/documents/print-queue/route.ts:332:        if (!byFilename && clioDocumentId) {
./app/api/documents/print-queue/route.ts:333:          byFilename = await verifyClioDocumentById(clioDocumentId);
./app/api/documents/print-queue/route.ts:339:            clioDocumentId,
./app/api/documents/print-queue/route.ts:341:            error: "No current matching document was found in this direct matter's Clio Documents tab or by Clio document ID lookup.",
./app/api/documents/print-queue/route.ts:360:          clioDocumentId: clean(byFilename.id || clioDocumentId),
./app/api/documents/print-queue/route.ts:361:          clioDocumentName: clean(byFilename.name || rawCandidate?.clioDocumentName || filename),
./app/api/documents/print-queue/route.ts:362:          clioDocumentVersionUuid: clean(version.uuid || rawCandidate?.clioDocumentVersionUuid),
./app/api/documents/print-queue/route.ts:363:          currentClioExistenceVerified: true,
./app/api/documents/print-queue/route.ts:364:          currentClioExistenceMatch: {
./app/api/documents/print-queue/route.ts:373:            "Direct matter finalized PDF candidate supplied by the UI and verified against the current direct matter Clio Documents tab.",
./app/api/documents/print-queue/route.ts:385:          currentClioExistenceVerified: verifiedDirectCandidates.length > 0,
./app/api/documents/print-queue/route.ts:415:          error: "No currently Clio-verified print candidates were available to add.",
./app/api/documents/print-queue/route.ts:418:            currentClioExistenceVerified:
./app/api/documents/print-queue/route.ts:419:              preview?.verification?.currentClioExistenceVerified === true,
./app/api/documents/print-queue/route.ts:429:            noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:451:      const existingByClioDocument = clean(candidate.clioDocumentId)
./app/api/documents/print-queue/route.ts:454:              clioDocumentId: clean(candidate.clioDocumentId),
./app/api/documents/print-queue/route.ts:461:      if (existingByClioDocument) {
./app/api/documents/print-queue/route.ts:462:        existing.push(existingByClioDocument);
./app/api/documents/print-queue/route.ts:485:          clioDocumentId: clean(candidate.clioDocumentId) || null,
./app/api/documents/print-queue/route.ts:486:          clioDocumentName: clean(candidate.clioDocumentName) || null,
./app/api/documents/print-queue/route.ts:487:          clioDocumentVersionUuid:
./app/api/documents/print-queue/route.ts:488:            clean(candidate.clioDocumentVersionUuid) || null,
./app/api/documents/print-queue/route.ts:517:        onlyClioVerifiedCandidatesAccepted: true,
./app/api/documents/print-queue/route.ts:518:        noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:521:        clioDocumentsTabRemainsSourceOfTruth: true,
./app/api/documents/print-queue/route.ts:531:          noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:557:            noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:576:            noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:595:            noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:617:            noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:656:        noClioRecordsChanged: true,
./app/api/documents/print-queue/route.ts:660:        clioDocumentsTabRemainsSourceOfTruth: true,
./app/api/documents/print-queue/route.ts:670:          noClioRecordsChanged: true,
./app/api/claim-index/local-index-status/route.ts:3:// It is read-only local database status inspection with no Clio access and no write behavior.
./scripts/verify-graph-draft-payload-safety.mjs:47:mustContain(helperPath, helper, "BarshMattersClioMatterId");
./scripts/verify-graph-draft-payload-safety.mjs:50:mustContain(helperPath, helper, "Clio MailDrop must be included in Cc");
./scripts/verify-graph-draft-payload-safety.mjs:51:mustContain(helperPath, helper, "Clio MailDrop must not be placed in Bcc");
./scripts/verify-graph-draft-payload-safety.mjs:63:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-graph-draft-payload-safety.mjs:72:mustNotContain(routePath, route, "clioFetch(");
./app/admin/claim-index/page.tsx:397:      data-clio-operations-enabled="false"
./app/admin/claim-index/page.tsx:412:            Read-only audit view of the local Barsh Matters ClaimIndex table.  This page searches ClaimIndex only and does not edit matters, restore data, call Clio, generate documents, send email, print, queue, or write to the database.
./app/admin/claim-index/page.tsx:422:          <strong>Safety:</strong> Display and CSV export are client-side/read-only.  No confirm buttons, restore actions, Clio writebacks, matter edits, document generation, print queue writes, or database writes are exposed here.
./app/admin/readiness-dashboard/page.tsx:285:            This page fetches existing read-only audit APIs and summarizes their status. It does not edit, save, restore, call Clio,
./app/admin/readiness-dashboard/page.tsx:412:          It does not expose fix, edit, save, delete, restore, Clio, Graph, document-generation, finalization, upload, email, print, queue, or database-write controls.
./app/api/settlements/local-record-preview/route.ts:183:          clioRecordsChanged: false,
./app/api/settlements/local-record-preview/route.ts:191:          "Preview only.  This validates the local settlement record payload and returns what would be saved to Barsh Matters local settlement tables.  It does not write the database, write Clio, generate documents, print, queue, or close matters.",
./app/api/settlements/local-record-preview/route.ts:205:          clioRecordsChanged: false,
./app/api/documents/matter-packet/route.ts:205:          clioCorrectnessDependency: false,
./app/api/documents/matter-packet/route.ts:221:          clioCorrectnessDependency: false,
./app/api/documents/matter-packet/route.ts:226:            clio: false,
./app/api/documents/matter-packet/route.ts:361:      clioCorrectnessDependency: false,
./app/api/documents/matter-packet/route.ts:367:        clio: false,
./app/api/documents/matter-packet/route.ts:398:          reason: "local-direct-matter-document-packet-no-clio-refresh",
./app/api/documents/matter-packet/route.ts:399:          clioCorrectnessDependency: false,
./app/api/documents/matter-packet/route.ts:415:        clioCorrectnessDependency: false,
./app/admin/claim-index/audit/page.tsx:347:            restore data, call Clio, generate documents, send email, print, queue, or write to the database.
./app/admin/claim-index/audit/page.tsx:481:                edit, delete, Clio, document, email, print, or queue controls.
./app/api/aggregation/add-matters/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/aggregation/add-matters/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/aggregation/add-matters");
./scripts/verify-admin-readiness-dashboard-safety.mjs:46:  "call Clio",
./scripts/verify-admin-readiness-dashboard-safety.mjs:76:  "clioFetch",
./scripts/verify-admin-readiness-dashboard-safety.mjs:103:console.log("PASS: Admin Readiness Dashboard is read-only, uses existing audit endpoints, and exposes no restore/Clio/Graph/document/email/print/queue/write controls.");
./app/api/settlements/close-preview/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/settlements/close-preview/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/settlements/close-preview");
./app/api/settlements/close-preview/route.ts:8:  return legacyClioOperationalRouteBlocked("app/api/settlements/close-preview");
./scripts/verify-reference-import-preview-safety.mjs:63:  "clioFetch",
./app/admin/audit-history/page.tsx:104:                Read-only administrator view for recent local Barsh Matters audit/history entries.  This page does not edit records, delete entries, write Clio, send email, print, or queue documents.
./app/admin/audit-history/page.tsx:253:          <strong>Safety:</strong> This admin function is read-only and uses the existing local audit-log API.  It does not write Clio or modify Barsh Matters records.
./scripts/verify-document-delivery-history-safety.mjs:14:  "noClioRecordsChanged: true",
./scripts/verify-document-delivery-history-safety.mjs:23:  "clioMatterId",
./scripts/verify-document-delivery-history-safety.mjs:24:  "clioDisplayNumber",
./scripts/verify-document-delivery-history-safety.mjs:39:  "clioRecordsChanged: true",
./scripts/verify-provider-client-invoice-create-draft-safety.mjs:47:mustNotMatch("route", route, /clioFetch|fetchClio|updateClio|from\s+["'][^"']*clio/i, "Clio operational dependency");
./app/admin/users/page.tsx:339:              <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.5 }}>Phase 3 guarded route. Preview is the default. Apply creates only an AdminUser row; it does not assign roles, create permission overrides, enable enforcement, write Clio, send email, generate documents, or change the print queue.</p>
./app/admin/users/page.tsx:389:              <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.5 }}>Phase 3 guarded route. Preview is the default. Apply creates only an AdminUserRole join row; it requires an active target user, an active role, an active owner_admin actor, duplicate-assignment prevention, and active bootstrapSafe owner_admin preservation. It does not create users, create roles, create permission overrides, enable enforcement, write Clio, send email, generate documents, or change the print queue.</p>
./app/admin/users/page.tsx:434:              <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.5 }}>Phase 3 guarded route. Preview is the default. Apply deletes only an AdminUserRole join row; it blocks missing assignments and blocks removing owner_admin from the last active bootstrapSafe owner_admin user. It does not delete users, delete roles, create permission overrides, enable enforcement, write Clio, send email, generate documents, or change the print queue.</p>
./app/admin/users/page.tsx:482:              <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.5 }}>Phase 3 guarded route. Preview is the default. Apply creates or updates only one AdminUserPermissionOverride row; it requires an explicit reason and blocks any block override mapped to administrator lockout safety routes. It does not change roles, enable enforcement, write Clio, send email, generate documents, or change the print queue.</p>
./app/api/aggregation/find-siblings/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/aggregation/find-siblings/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/aggregation/find-siblings");
./scripts/verify-document-view-open-behavior-safety.cjs:2:const route = fs.readFileSync("app/api/documents/clio-document-open/route.ts", "utf8");
./scripts/verify-document-view-open-behavior-safety.cjs:12:assertOk(route.includes("mode === \"email-pdf\""), "Clio document route supports email-pdf mode");
./scripts/verify-document-view-open-behavior-safety.cjs:13:assertOk(route.includes("clio-eml-rendered-pdf"), "EML PDF route identifies rendered PDF source");
./app/api/settlements/current-values/route.ts:8:  action: "legacy-clio-settlement-route-disabled",
./app/api/settlements/current-values/route.ts:13:    "This legacy Clio settlement operational route is disabled.  Settlement/payment/workflow data is now handled by Barsh Matters local-first settlement routes.  Clio remains available only for document storage/access and MailDrop/document-vault behavior.",
./app/api/settlements/current-values/route.ts:20:    clioRecordsChanged: false,
./app/api/documents/print-queue-preview/route.ts:4:  findExistingClioDocumentsByFilename,
./app/api/documents/print-queue-preview/route.ts:5:  listClioMatterDocuments,
./app/api/documents/print-queue-preview/route.ts:6:  type ClioMatterDocument,
./app/api/documents/print-queue-preview/route.ts:7:} from "@/lib/clioDocumentUpload";
./app/api/documents/print-queue-preview/route.ts:52:      clioDocumentId: clean(doc.clioDocumentId),
./app/api/documents/print-queue-preview/route.ts:53:      clioDocumentName: clean(doc.clioDocumentName),
./app/api/documents/print-queue-preview/route.ts:54:      clioDocumentVersionUuid: clean(doc.clioDocumentVersionUuid),
./app/api/documents/print-queue-preview/route.ts:57:        "Document appears in local DocumentFinalization uploaded[] audit data and was verified against the current Clio master matter Documents tab.",
./app/api/documents/print-queue-preview/route.ts:59:      currentClioExistenceVerified: false,
./app/api/documents/print-queue-preview/route.ts:60:      currentClioExistenceMatch: null,
./app/api/documents/print-queue-preview/route.ts:61:      currentClioExistenceReason: "Not checked yet.",
./app/api/documents/print-queue-preview/route.ts:65:function normalizeClioDocumentMatch(document: ClioMatterDocument) {
./app/api/documents/print-queue-preview/route.ts:76:function findCurrentClioMatch(
./app/api/documents/print-queue-preview/route.ts:77:  existingDocuments: ClioMatterDocument[],
./app/api/documents/print-queue-preview/route.ts:79:): ClioMatterDocument | null {
./app/api/documents/print-queue-preview/route.ts:80:  const wantedId = numberOrNull(candidate?.clioDocumentId);
./app/api/documents/print-queue-preview/route.ts:81:  const wantedUuid = clean(candidate?.clioDocumentVersionUuid).toLowerCase();
./app/api/documents/print-queue-preview/route.ts:96:  const filenameMatches = findExistingClioDocumentsByFilename(
./app/api/documents/print-queue-preview/route.ts:104:function buildClioDocumentOpenUrl(req: NextRequest, documentId: unknown, filename?: unknown): string {
./app/api/documents/print-queue-preview/route.ts:108:  const url = new URL("/api/documents/clio-document-open", req.nextUrl.origin);
./app/api/documents/print-queue-preview/route.ts:117:async function verifyCandidatesAgainstCurrentClioDocuments(finalizations: any[]) {
./app/api/documents/print-queue-preview/route.ts:118:  const documentsByMatterId = new Map<number, ClioMatterDocument[]>();
./app/api/documents/print-queue-preview/route.ts:128:        error: "Missing valid master matter ID for current Clio document verification.",
./app/api/documents/print-queue-preview/route.ts:136:      const documents = await listClioMatterDocuments(matterId);
./app/api/documents/print-queue-preview/route.ts:142:        error: err?.message || "Could not verify current Clio documents.",
./app/api/documents/print-queue-preview/route.ts:153:      const match = findCurrentClioMatch(currentDocuments, candidate);
./app/api/documents/print-queue-preview/route.ts:158:          currentClioExistenceVerified: false,
./app/api/documents/print-queue-preview/route.ts:159:          currentClioExistenceMatch: null,
./app/api/documents/print-queue-preview/route.ts:160:          currentClioExistenceReason:
./app/api/documents/print-queue-preview/route.ts:161:            "No current matching document was found in the Clio master matter Documents tab.",
./app/api/documents/print-queue-preview/route.ts:167:        currentClioExistenceVerified: true,
./app/api/documents/print-queue-preview/route.ts:168:        currentClioExistenceMatch: normalizeClioDocumentMatch(match),
./app/api/documents/print-queue-preview/route.ts:169:        currentClioExistenceReason:
./app/api/documents/print-queue-preview/route.ts:170:          "A current matching document was found in the Clio master matter Documents tab.",
./app/api/documents/print-queue-preview/route.ts:179:        (document: any) => document.currentClioExistenceVerified
./app/api/documents/print-queue-preview/route.ts:181:      currentClioExistenceVerified: true,
./app/api/documents/print-queue-preview/route.ts:200:        status: "uploaded-to-clio",
./app/api/documents/print-queue-preview/route.ts:223:          clioUploadTarget: toJsonSafe(row.clioUploadTarget),
./app/api/documents/print-queue-preview/route.ts:227:          currentClioExistenceVerified: false,
./app/api/documents/print-queue-preview/route.ts:232:    const verification = await verifyCandidatesAgainstCurrentClioDocuments(
./app/api/documents/print-queue-preview/route.ts:240:          (doc: any) => doc.currentClioExistenceVerified
./app/api/documents/print-queue-preview/route.ts:252:        const documentUrl = buildClioDocumentOpenUrl(
./app/api/documents/print-queue-preview/route.ts:254:          doc.clioDocumentId,
./app/api/documents/print-queue-preview/route.ts:255:          doc.filename || doc.clioDocumentName || doc.label || doc.key
./app/api/documents/print-queue-preview/route.ts:283:      (doc: any) => !doc.currentClioExistenceVerified
./app/api/documents/print-queue-preview/route.ts:300:        currentClioExistenceVerified: true,
./app/api/documents/print-queue-preview/route.ts:301:        sourceOfTruth: "Clio master matter Documents tab",
./app/api/documents/print-queue-preview/route.ts:310:        currentClioExistenceVerified: true,
./app/api/documents/print-queue-preview/route.ts:311:        clioDocumentsTabRemainsSourceOfTruth: true,
./app/api/documents/print-queue-preview/route.ts:312:        noClioRecordsChanged: true,
./app/api/documents/print-queue-preview/route.ts:318:        "This endpoint proposes print candidates from local DocumentFinalization audit records only after verifying that each candidate still has a matching current document in the Clio master matter Documents tab.  It does not create print records or change Clio.",
./app/api/documents/print-queue-preview/route.ts:329:          noClioRecordsChanged: true,
./app/admin/clients/[id]/invoice/page.tsx:491:        "This will not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records.",
./app/admin/clients/[id]/invoice/page.tsx:1890:              Source costs, remittance records, Clio, ClaimIndex, documents, email, print, and queue are not changed.
./app/admin/clients/[id]/invoice/page.tsx:1947:                Lifecycle: detail/review uses frozen ProviderClientInvoiceLine rows. Finalize marks only included MatterPaymentReceipt rows. Clio, ClaimIndex, source costs, remittance records, documents, email, print, and queue are not mutated.
./scripts/verify-direct-view-documents-popup-body-clean-safety.mjs:21:  "Select a document to view its stored Clio metadata.",
./scripts/verify-direct-view-documents-popup-body-clean-safety.mjs:27:  "Document opening/viewing will be wired to a safe Clio retrieval route next.",
./scripts/verify-direct-view-documents-popup-body-clean-safety.mjs:29:  "<strong>Clio Document ID:</strong>",
./scripts/verify-print-queue-browser-history-safety.mjs:25:mustContain("reads dedupe flag from URL", 'dedupeClioDocumentId: params.get("dedupeClioDocumentId") !== "false"');
./scripts/verify-print-queue-browser-history-safety.mjs:35:mustContain("status update preserves URL state", "await loadQueue({ status: statusFilter, masterLawsuitId, limit, finalizedPdfOnly, dedupeClioDocumentId }, { replaceUrl: true });");
./app/api/aggregation/build-lawsuit/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/aggregation/build-lawsuit/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/aggregation/build-lawsuit");
./scripts/verify-prod-auth-admin-smoke.mjs:4:const BASE = process.env.BARSH_PROD_BASE_URL || "https://clio-lawsuit-aggregator.vercel.app";
./app/admin/clients/[id]/page.tsx:1333:            Attorney Fee is a separate non-remittance payment type. This report reads local child-ledger receipt rows only and does not create invoices, write remittances, update ClaimIndex, or update Clio.
./app/admin/clients/[id]/page.tsx:1441:            This panel is a local summary grouped from matched child matters. It does not create lawsuits, edit lawsuit metadata, write payments, or update Clio.
./app/api/aggregation/expand-claim/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/aggregation/expand-claim/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/aggregation/expand-claim");
./scripts/verify-verifier-contract-locks.mjs:71:  mustContain(file, text, 'action: "legacy-clio-settlement-route-disabled"');
./scripts/verify-verifier-contract-locks.mjs:85:    mustContain(file, text, 'source: "live-clio-read"');
./scripts/verify-verifier-contract-locks.mjs:115:  mustContain("direct email verifier", text, "VERIFY NO DIRECT DRAFT/SEND/CLIO WRITE WIRING INSIDE DIRECT EMAILS PANEL");
./scripts/verify-verifier-contract-locks.mjs:116:  mustNotContain("direct email verifier", text, "VERIFY NO DIRECT DRAFT/SEND/CLIO WRITE WIRING IN DIRECT EMAILS UI");
./scripts/verify-verifier-contract-locks.mjs:147:    /clioMaildropEmail\\s\+String\\\?\?\\s\+@unique/,
./scripts/verify-verifier-contract-locks.mjs:148:    "escaped clioMaildropEmail String/String? @unique regex"
./scripts/verify-verifier-contract-locks.mjs:150:  mustContain("MailDrop registry verifier", text, 'CREATE UNIQUE INDEX "MaildropAddress_clioMaildropEmail_key"');
./scripts/verify-verifier-contract-locks.mjs:151:  mustNotContain("MailDrop registry verifier", text, 'clioMaildropEmail   String   @unique"');
./scripts/verify-verifier-contract-locks.mjs:170:console.log("Updated verifier contracts are locked against stale Clio-read/write, stale preview-route, stale broad-scope, and stale UI-heading expectations.");
./app/api/aggregation/from-search/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/aggregation/from-search/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/aggregation/from-search");
./app/api/settlements/provider-fee-defaults/route.ts:8:  action: "legacy-clio-settlement-route-disabled",
./app/api/settlements/provider-fee-defaults/route.ts:13:    "This legacy Clio settlement operational route is disabled.  Settlement/payment/workflow data is now handled by Barsh Matters local-first settlement routes.  Clio remains available only for document storage/access and MailDrop/document-vault behavior.",
./app/api/settlements/provider-fee-defaults/route.ts:20:    clioRecordsChanged: false,
./app/api/settlements/settlement-summary/route.ts:83:    noClioRecordsChanged: true,
./app/api/settlements/settlement-summary/route.ts:392:        "This route returns a generated DOCX response only. It does not upload documents to Clio, create database records, create persistent files, or change the print queue."
./app/api/settlements/close/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/settlements/close/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/settlements/close");
./app/api/settlements/contacts/route.ts:64:        clioRecordsChanged: false,
./app/api/settlements/contacts/route.ts:82:          clioRecordsChanged: false,
./app/api/documents/master-clio-mapping-inspect/route.ts:8:function looksLikeClioDisplayNumber(value: unknown): boolean {
./app/api/documents/master-clio-mapping-inspect/route.ts:48:      .filter((row) => looksLikeClioDisplayNumber(row.display_number))
./app/api/documents/master-clio-mapping-inspect/route.ts:51:        clioMatterId: row.matter_id,
./app/api/documents/master-clio-mapping-inspect/route.ts:52:        clioDisplayNumber: normalizeBrl(row.display_number),
./app/api/documents/master-clio-mapping-inspect/route.ts:57:            ? "known Clio tester child matter"
./app/api/documents/master-clio-mapping-inspect/route.ts:61:    const possibleMasterClioMappings = brlCandidates.filter((candidate) => {
./app/api/documents/master-clio-mapping-inspect/route.ts:62:      const display = clean(candidate.clioDisplayNumber);
./app/api/documents/master-clio-mapping-inspect/route.ts:67:      .filter((lawsuit: any) => lawsuit.clioMasterMatterId || lawsuit.clioMasterDisplayNumber)
./app/api/documents/master-clio-mapping-inspect/route.ts:70:        clioMasterMatterId: lawsuit.clioMasterMatterId || null,
./app/api/documents/master-clio-mapping-inspect/route.ts:71:        clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber || null,
./app/api/documents/master-clio-mapping-inspect/route.ts:72:        clioMasterMatterDescription: lawsuit.clioMasterMatterDescription || null,
./app/api/documents/master-clio-mapping-inspect/route.ts:73:        clioMasterMappedAt: lawsuit.clioMasterMappedAt || null,
./app/api/documents/master-clio-mapping-inspect/route.ts:74:        clioMasterMappingSource: lawsuit.clioMasterMappingSource || null,
./app/api/documents/master-clio-mapping-inspect/route.ts:79:      action: "master-clio-mapping-inspection",
./app/api/documents/master-clio-mapping-inspect/route.ts:81:      clioRecordsChanged: false,
./app/api/documents/master-clio-mapping-inspect/route.ts:85:        "Read-only local inspection.  The Barsh Matters master lawsuit ID is not a Clio matter number.  Clio uses BRLXXXXX display numbers, so Barsh Matters must map masterLawsuitId to a Clio matter id/display number before reading Clio Maildrop or documents.",
./app/api/documents/master-clio-mapping-inspect/route.ts:90:        possibleMasterClioMappings,
./app/api/documents/master-clio-mapping-inspect/route.ts:97:        possibleMasterClioMappingCount: possibleMasterClioMappings.length,
./app/api/documents/master-clio-mapping-inspect/route.ts:99:        knownClioTesterMattersPresent: brlCandidates
./app/api/documents/master-clio-mapping-inspect/route.ts:100:          .filter((row) => row.clioDisplayNumber === "BRL30121" || row.clioDisplayNumber === "BRL30122")
./app/api/documents/master-clio-mapping-inspect/route.ts:101:          .map((row) => row.clioDisplayNumber),
./app/api/documents/master-clio-mapping-inspect/route.ts:102:        masterAppearsMappedToClio:
./app/api/documents/master-clio-mapping-inspect/route.ts:103:          explicitLawsuitMappings.length > 0 || possibleMasterClioMappings.length > 0,
./app/api/documents/master-clio-mapping-inspect/route.ts:110:        action: "master-clio-mapping-inspection",
./app/api/documents/master-clio-mapping-inspect/route.ts:112:        clioRecordsChanged: false,
./app/api/documents/master-clio-mapping-inspect/route.ts:114:        error: error?.message || "Master Clio mapping inspection failed.",
./app/admin/lawsuits/audit/page.tsx:22:  clioMasterMatterId?: number | null;
./app/admin/lawsuits/audit/page.tsx:23:  clioMasterDisplayNumber?: string | null;
./app/admin/lawsuits/audit/page.tsx:24:  clioMasterMappedAt?: string | null;
./app/admin/lawsuits/audit/page.tsx:25:  clioMasterMappingSource?: string | null;
./app/admin/lawsuits/audit/page.tsx:75:    mappedMasterClioShellCount: number;
./app/admin/lawsuits/audit/page.tsx:76:    unmappedMasterClioShellCount: number;
./app/admin/lawsuits/audit/page.tsx:88:    masterClioShellMapping: CountBucket[];
./app/admin/lawsuits/audit/page.tsx:202:    "Clio Master Matter ID",
./app/admin/lawsuits/audit/page.tsx:203:    "Clio Master Display Number",
./app/admin/lawsuits/audit/page.tsx:263:      row?.clioMasterMatterId,
./app/admin/lawsuits/audit/page.tsx:264:      row?.clioMasterDisplayNumber,
./app/admin/lawsuits/audit/page.tsx:381:            This page checks master IDs, child membership, amount/venue metadata, master Clio shell mapping, and close-status consistency.
./app/admin/lawsuits/audit/page.tsx:382:            It does not edit, restore, deaggregate, delete, call Clio, generate documents, send email, print, queue, or write to the database.
./app/admin/lawsuits/audit/page.tsx:423:              <SummaryCard label="Mapped Clio shells" value={result.summary?.mappedMasterClioShellCount ?? 0} note={`${result.summary?.unmappedMasterClioShellCount ?? 0} unmapped`} />
./app/admin/lawsuits/audit/page.tsx:431:              <CountTable title="Master Clio shell mapping" rows={result.counts?.masterClioShellMapping || []} />
./app/admin/lawsuits/audit/page.tsx:477:                              <th style={thStyle}>Clio Shell</th>
./app/admin/lawsuits/audit/page.tsx:493:                                <td style={tdStyle}>{row.clioMasterDisplayNumber || row.clioMasterMatterId || ""}</td>
./app/admin/lawsuits/audit/page.tsx:549:                edit, delete, deaggregate, Clio, document, email, print, or queue controls.
./app/api/advanced-search/picklists/route.ts:119:    clioRead: false,
./app/api/advanced-search/picklists/route.ts:120:    clioWrite: false,
./app/api/advanced-search/picklists/route.ts:142:      noClioReadPerformed: true,
./app/api/advanced-search/picklists/route.ts:143:      noClioRecordsChanged: true,
./app/api/settlements/writeback-preview/route.ts:8:  action: "legacy-clio-settlement-route-disabled",
./app/api/settlements/writeback-preview/route.ts:13:    "This legacy Clio settlement operational route is disabled.  Settlement/payment/workflow data is now handled by Barsh Matters local-first settlement routes.  Clio remains available only for document storage/access and MailDrop/document-vault behavior.",
./app/api/settlements/writeback-preview/route.ts:20:    clioRecordsChanged: false,
./app/api/documents/working-docx-latest/route.ts:43:        clioRecordsChanged: false,
./app/api/documents/working-docx-latest/route.ts:56:          clioRecordsChanged: false,
./scripts/verify-document-template-detail-workflow-safety.mjs:24:assert(detailRoute.includes("clioWrites: false"), "template detail API safety blocks Clio writes");
./scripts/verify-audit-log-safety.mjs:42:  "clioFetch",
./scripts/verify-audit-log-safety.mjs:43:  "getValidClioAccessToken",
./scripts/verify-audit-log-safety.mjs:44:  "CLIO_API_BASE",
./scripts/verify-audit-log-safety.mjs:45:  "app.clio.com",
./scripts/verify-audit-log-safety.mjs:47:  "ingestMattersFromClioBatch",
./scripts/verify-audit-log-safety.mjs:69:console.log("Audit log safety verifier passed: local DB only, matter-specific fields present, no Clio/document/print/payment/settlement writes.");
./scripts/verify-settled-with-person-contact-safety.mjs:42:  mustNotExist("app/api/clio/contacts/search/route.ts");
./scripts/verify-settled-with-person-contact-safety.mjs:47:  mustContain("local contact search route", localContactSearchRoute, "clioRead: false");
./scripts/verify-settled-with-person-contact-safety.mjs:48:  mustContain("local contact search route", localContactSearchRoute, "clioWrite: false");
./scripts/verify-settled-with-person-contact-safety.mjs:57:  mustNotContain("local contact search route", localContactSearchRoute, "getValidClioAccessToken");
./scripts/verify-settled-with-person-contact-safety.mjs:58:  mustNotContain("local contact search route", localContactSearchRoute, "clioFetch");
./scripts/verify-settled-with-person-contact-safety.mjs:59:  mustNotContain("local contact search route", localContactSearchRoute, "CLIO_API_BASE");
./scripts/verify-settled-with-person-contact-safety.mjs:68:  mustNotContain("direct matter page", directMatterPage, "/api/clio/contacts/search");
./scripts/verify-settled-with-person-contact-safety.mjs:69:  mustNotContain("master lawsuit page", masterPage, "/api/clio/contacts/search");
./app/api/settlements/documents-finalize-local/route.ts:5:  listClioMatterDocuments,
./app/api/settlements/documents-finalize-local/route.ts:6:  uploadBufferToClioMatterDocuments,
./app/api/settlements/documents-finalize-local/route.ts:7:} from "@/lib/clioDocumentUpload";
./app/api/settlements/documents-finalize-local/route.ts:223:    clioRecordsChanged: false,
./app/api/settlements/documents-finalize-local/route.ts:224:    clioDocumentsUploaded: false,
./app/api/settlements/documents-finalize-local/route.ts:256:            clioRecordsChanged: false,
./app/api/settlements/documents-finalize-local/route.ts:274:            clioRecordsChanged: false,
./app/api/settlements/documents-finalize-local/route.ts:292:            clioRecordsChanged: false,
./app/api/settlements/documents-finalize-local/route.ts:327:            clioRecordsChanged: false,
./app/api/settlements/documents-finalize-local/route.ts:380:            clioRecordsChanged: false,
./app/api/settlements/documents-finalize-local/route.ts:402:        clioMasterMatterId: true,
./app/api/settlements/documents-finalize-local/route.ts:403:        clioMasterDisplayNumber: true,
./app/api/settlements/documents-finalize-local/route.ts:404:        clioMasterMatterDescription: true,
./app/api/settlements/documents-finalize-local/route.ts:408:    const clioMatterId = Number(lawsuit?.clioMasterMatterId || 0);
./app/api/settlements/documents-finalize-local/route.ts:409:    const clioDisplayNumber = clean(lawsuit?.clioMasterDisplayNumber);
./app/api/settlements/documents-finalize-local/route.ts:412:    if (!Number.isFinite(clioMatterId) || clioMatterId <= 0) {
./app/api/settlements/documents-finalize-local/route.ts:417:          error: `No mapped Clio master matter exists for ${effectiveMasterLawsuitId}. Finalized settlement documents must upload to the mapped master Clio matter.`,
./app/api/settlements/documents-finalize-local/route.ts:421:            clioRecordsChanged: false,
./app/api/settlements/documents-finalize-local/route.ts:477:        throw new Error("Generated settlement DOCX did not expose a download URL for Clio upload.");
./app/api/settlements/documents-finalize-local/route.ts:486:          `Could not generate settlement DOCX for Clio upload: ${docxRes.status} ${docxRes.statusText}${text ? ` ${text.slice(0, 300)}` : ""}`
./app/api/settlements/documents-finalize-local/route.ts:493:        throw new Error("Generated settlement DOCX was empty and could not be uploaded to Clio.");
./app/api/settlements/documents-finalize-local/route.ts:514:      throw new Error("Generated settlement PDF was empty and could not be uploaded to Clio.");
./app/api/settlements/documents-finalize-local/route.ts:517:    const existingClioDocuments = await listClioMatterDocuments(clioMatterId);
./app/api/settlements/documents-finalize-local/route.ts:518:    const existingMatch = existingClioDocuments.find((doc: any) => {
./app/api/settlements/documents-finalize-local/route.ts:532:      const existingClioDocumentIdForSkippedPdf = String(
./app/api/settlements/documents-finalize-local/route.ts:536:        existingMatchAny.clioDocumentId ||
./app/api/settlements/documents-finalize-local/route.ts:540:      const existingClioDocumentVersionUuidForSkippedPdf = String(
./app/api/settlements/documents-finalize-local/route.ts:553:        reason: "A PDF document with this exact filename already exists in the mapped master Clio matter Documents tab.",
./app/api/settlements/documents-finalize-local/route.ts:555:        clioUploaded: false,
./app/api/settlements/documents-finalize-local/route.ts:556:        existingClioDocumentId: existingClioDocumentIdForSkippedPdf || null,
./app/api/settlements/documents-finalize-local/route.ts:557:        clioDocumentId: existingClioDocumentIdForSkippedPdf || null,
./app/api/settlements/documents-finalize-local/route.ts:558:        documentId: existingClioDocumentIdForSkippedPdf || null,
./app/api/settlements/documents-finalize-local/route.ts:559:        id: existingClioDocumentIdForSkippedPdf || null,
./app/api/settlements/documents-finalize-local/route.ts:560:        existingClioDocumentName: existingMatch.name || existingMatch.filename || finalPdfFilename,
./app/api/settlements/documents-finalize-local/route.ts:561:        existingClioDocumentVersionUuid: existingClioDocumentVersionUuidForSkippedPdf || null,
./app/api/settlements/documents-finalize-local/route.ts:562:        clioDocumentVersionUuid: existingClioDocumentVersionUuidForSkippedPdf || null,
./app/api/settlements/documents-finalize-local/route.ts:574:      const uploadResult = await uploadBufferToClioMatterDocuments({
./app/api/settlements/documents-finalize-local/route.ts:575:        matterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:609:        clioDocumentId: uploadResult.documentId,
./app/api/settlements/documents-finalize-local/route.ts:610:        clioDocumentName: uploadResult.documentName,
./app/api/settlements/documents-finalize-local/route.ts:611:        clioDocumentVersionUuid: uploadResult.documentVersionUuid,
./app/api/settlements/documents-finalize-local/route.ts:632:      clioUploaded: uploaded.length > 0,
./app/api/settlements/documents-finalize-local/route.ts:633:      clioSkippedDuplicate: skipped.length > 0,
./app/api/settlements/documents-finalize-local/route.ts:634:      clioUploadTargetMatterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:635:      clioUploadTargetDisplayNumber: clioDisplayNumber || null,
./app/api/settlements/documents-finalize-local/route.ts:638:      note: "Local settlement finalization generated the settlement DOCX route and automatically stored the document in the mapped master Clio matter Documents tab when no exact filename duplicate existed.",
./app/api/settlements/documents-finalize-local/route.ts:644:        masterMatterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:645:        masterDisplayNumber: clioDisplayNumber || null,
./app/api/settlements/documents-finalize-local/route.ts:646:        status: uploaded.length > 0 ? "settlement-uploaded-to-clio" : "settlement-clio-duplicate-skipped",
./app/api/settlements/documents-finalize-local/route.ts:650:        clioUploadTarget: jsonSafe({
./app/api/settlements/documents-finalize-local/route.ts:652:          matterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:653:          displayNumber: clioDisplayNumber || null,
./app/api/settlements/documents-finalize-local/route.ts:654:          description: clean(lawsuit?.clioMasterMatterDescription) || null,
./app/api/settlements/documents-finalize-local/route.ts:656:          clioUploadDeferred: false,
./app/api/settlements/documents-finalize-local/route.ts:669:          clioUploaded: uploaded.length > 0,
./app/api/settlements/documents-finalize-local/route.ts:739:      clioUploadTarget: {
./app/api/settlements/documents-finalize-local/route.ts:741:        matterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:742:        displayNumber: clioDisplayNumber || null,
./app/api/settlements/documents-finalize-local/route.ts:743:        description: clean(lawsuit?.clioMasterMatterDescription) || null,
./app/api/settlements/documents-finalize-local/route.ts:757:        clioRecordsChanged: uploaded.length > 0,
./app/api/settlements/documents-finalize-local/route.ts:758:        clioDocumentsUploaded: uploaded.length,
./app/api/settlements/documents-finalize-local/route.ts:759:        duplicateClioDocumentsSkipped: skipped.length,
./app/api/settlements/documents-finalize-local/route.ts:761:        uploadedOnlyToMappedMasterClioMatterDocumentsTab: true,
./app/api/settlements/documents-finalize-local/route.ts:765:          ? "Created a persistent local Barsh Matters DocumentFinalization record and automatically uploaded the finalized settlement PDF to the mapped master Clio matter Documents tab. No Outlook draft was created, no email was sent, and no print queue item was written."
./app/api/settlements/documents-finalize-local/route.ts:766:          : "Created a persistent local Barsh Matters DocumentFinalization record. Clio upload was skipped because an exact filename duplicate already exists in the mapped master Clio matter Documents tab. No Outlook draft was created, no email was sent, and no print queue item was written.",
./app/api/settlements/documents-finalize-local/route.ts:777:          clioRecordsChanged: false,
./app/api/documents/clio-document-open/route.ts:2:import { clioFetch } from "@/lib/clio";
./app/api/documents/clio-document-open/route.ts:115:  const res = await clioFetch(
./app/api/documents/clio-document-open/route.ts:123:      `Clio document metadata lookup failed: ${res.status} ${res.statusText} ${JSON.stringify(json).slice(0, 700)}`
./app/api/documents/clio-document-open/route.ts:150:          action: "clio-document-open",
./app/api/documents/clio-document-open/route.ts:154:            noClioRecordsChanged: true,
./app/api/documents/clio-document-open/route.ts:168:        action: "clio-document-open",
./app/api/documents/clio-document-open/route.ts:175:        downloadPath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}`,
./app/api/documents/clio-document-open/route.ts:176:        inlinePath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}&mode=inline`,
./app/api/documents/clio-document-open/route.ts:177:        editPath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}&mode=edit`,
./app/api/documents/clio-document-open/route.ts:180:          noClioRecordsChanged: true,
./app/api/documents/clio-document-open/route.ts:187:    const downloadRes = await clioFetch(`/api/v4/documents/${encodeURIComponent(documentId)}/download`);
./app/api/documents/clio-document-open/route.ts:192:        `Clio document download failed: ${downloadRes.status} ${downloadRes.statusText}${text ? ` ${text.slice(0, 700)}` : ""}`
./app/api/documents/clio-document-open/route.ts:209:          "X-Barsh-Matters-Source": "clio-eml-rendered-pdf",
./app/api/documents/clio-document-open/route.ts:210:          "X-Barsh-Matters-Clio-Document-Id": documentId,
./app/api/documents/clio-document-open/route.ts:211:          ...(metadata.versionUuid ? { "X-Barsh-Matters-Clio-Version-Uuid": metadata.versionUuid } : {}),
./app/api/documents/clio-document-open/route.ts:227:        "X-Barsh-Matters-Source": "clio-document-download",
./app/api/documents/clio-document-open/route.ts:228:        "X-Barsh-Matters-Clio-Document-Id": documentId,
./app/api/documents/clio-document-open/route.ts:229:        ...(metadata.versionUuid ? { "X-Barsh-Matters-Clio-Version-Uuid": metadata.versionUuid } : {}),
./app/api/documents/clio-document-open/route.ts:236:        action: "clio-document-open",
./app/api/documents/clio-document-open/route.ts:237:        error: err?.message || "Could not open Clio document.",
./app/api/documents/clio-document-open/route.ts:240:          noClioRecordsChanged: true,
./app/api/documents/delivery-draft-preview/route.ts:71:    clioMaildropEmail: clean(raw.clioMaildropEmail) || undefined,
./app/api/documents/delivery-draft-preview/route.ts:72:    clioMaildropLabel: clean(raw.clioMaildropLabel) || undefined,
./app/api/documents/delivery-draft-preview/route.ts:75:    clioDocumentId: clean((raw as any).clioDocumentId) || undefined,
./app/api/documents/delivery-draft-preview/route.ts:76:    clioDocumentVersionUuid: clean((raw as any).clioDocumentVersionUuid) || undefined,
./app/api/documents/delivery-draft-preview/route.ts:93:    const cc = normalizeEmailList(body.cc || context.clioMaildropEmail || context.suggestedCcEmail);
./app/api/documents/delivery-draft-preview/route.ts:107:            clioDocumentId: clean((context as any).clioDocumentId),
./app/api/documents/delivery-draft-preview/route.ts:108:            existingClioDocumentId: clean((context as any).existingClioDocumentId) || clean((context as any).clioDocumentId),
./app/api/documents/delivery-draft-preview/route.ts:109:            documentId: clean((context as any).documentId) || clean((context as any).clioDocumentId),
./app/api/documents/delivery-draft-preview/route.ts:110:            id: clean((context as any).id) || clean((context as any).clioDocumentId),
./app/api/documents/delivery-draft-preview/route.ts:111:            clioDocumentVersionUuid: clean((context as any).clioDocumentVersionUuid),
./app/api/documents/delivery-draft-preview/route.ts:112:            existingClioDocumentVersionUuid: clean((context as any).existingClioDocumentVersionUuid) || clean((context as any).clioDocumentVersionUuid),
./app/api/documents/delivery-draft-preview/route.ts:113:            clioMatterId: clean((context as any).clioMatterId),
./app/api/documents/delivery-draft-preview/route.ts:114:            clioUploadTargetMatterId: clean((context as any).clioUploadTargetMatterId) || clean((context as any).clioMatterId),
./app/api/documents/delivery-draft-preview/route.ts:115:            clioDisplayNumber: clean((context as any).clioDisplayNumber) || clean((context as any).masterDisplayNumber),
./app/api/documents/delivery-draft-preview/route.ts:116:            masterDisplayNumber: clean((context as any).masterDisplayNumber) || clean((context as any).clioDisplayNumber),
./app/api/documents/delivery-draft-preview/route.ts:118:            graphUploadRequired: rawSource === "settlement_finalized_pdf_delivery" || Boolean(clean((context as any).clioDocumentId) || clean((context as any).clioDocumentVersionUuid)),
./app/api/documents/delivery-draft-preview/route.ts:128:            clioDocumentId: clean((context as any).clioDocumentId),
./app/api/documents/delivery-draft-preview/route.ts:129:            existingClioDocumentId: clean((context as any).existingClioDocumentId) || clean((context as any).clioDocumentId),
./app/api/documents/delivery-draft-preview/route.ts:130:            documentId: clean((context as any).documentId) || clean((context as any).clioDocumentId),
./app/api/documents/delivery-draft-preview/route.ts:131:            id: clean((context as any).id) || clean((context as any).clioDocumentId),
./app/api/documents/delivery-draft-preview/route.ts:132:            clioDocumentVersionUuid: clean((context as any).clioDocumentVersionUuid),
./app/api/documents/delivery-draft-preview/route.ts:133:            existingClioDocumentVersionUuid: clean((context as any).existingClioDocumentVersionUuid) || clean((context as any).clioDocumentVersionUuid),
./app/api/documents/delivery-draft-preview/route.ts:134:            clioMatterId: clean((context as any).clioMatterId),
./app/api/documents/delivery-draft-preview/route.ts:135:            clioUploadTargetMatterId: clean((context as any).clioUploadTargetMatterId) || clean((context as any).clioMatterId),
./app/api/documents/delivery-draft-preview/route.ts:136:            clioDisplayNumber: clean((context as any).clioDisplayNumber) || clean((context as any).masterDisplayNumber),
./app/api/documents/delivery-draft-preview/route.ts:137:            masterDisplayNumber: clean((context as any).masterDisplayNumber) || clean((context as any).clioDisplayNumber),
./app/api/documents/delivery-draft-preview/route.ts:164:        matterDisplayNumber: graphContext.matterDisplayNumber || graphContext.clioDisplayNumber,
./app/api/documents/delivery-draft-preview/route.ts:166:        clioMatterId: graphContext.clioMatterId,
./app/api/documents/delivery-draft-preview/route.ts:167:        clioDisplayNumber: graphContext.clioDisplayNumber,
./app/api/documents/delivery-draft-preview/route.ts:168:        clioMaildropEmail: graphContext.clioMaildropEmail,
./app/api/documents/delivery-draft-preview/route.ts:169:        clioMaildropLabel: graphContext.clioMaildropLabel,
./app/api/documents/delivery-draft-preview/route.ts:187:      clioRecordsChanged: false,
./app/api/documents/delivery-draft-preview/route.ts:210:                    clean((attachment as any).clioDocumentId) ||
./app/api/documents/delivery-draft-preview/route.ts:211:                    clean((attachment as any).existingClioDocumentId) ||
./app/api/documents/delivery-draft-preview/route.ts:214:                    clean((attachment as any).clioDocumentVersionUuid) ||
./app/api/documents/delivery-draft-preview/route.ts:227:        clioMaildropRequiredForCc: true,
./app/api/documents/delivery-draft-preview/route.ts:232:        "Preview only.  This route returns the Outlook/Microsoft Graph draft payload that Barsh Matters should create later.  It does not create a draft, send email, attach files, write to Clio, write to the database, or change the print queue.",
./app/api/documents/delivery-draft-preview/route.ts:243:        clioRecordsChanged: false,
./scripts/verify-local-settlement-documents-preview-safety.mjs:10:check("documents preview does not upload to Clio", !route.includes("uploadDocumentToClio"));
./app/api/documents/finalize/route.ts:4:  findExistingClioDocumentsByFilename,
./app/api/documents/finalize/route.ts:5:  listClioMatterDocuments,
./app/api/documents/finalize/route.ts:6:  uploadBufferToClioMatterDocuments,
./app/api/documents/finalize/route.ts:7:} from "@/lib/clioDocumentUpload";
./app/api/documents/finalize/route.ts:22:  wouldUploadToClio: boolean;
./app/api/documents/finalize/route.ts:67:    const target = params.preview?.clioUploadTarget || {};
./app/api/documents/finalize/route.ts:79:        clioUploadTarget: jsonSafe(params.preview?.clioUploadTarget),
./app/api/documents/finalize/route.ts:139:  const raw = preview?.clioUploadTarget?.matterId;
./app/api/documents/finalize/route.ts:281:      if (!document?.wouldGenerate || !document?.wouldUploadToClio) return false;
./app/api/documents/finalize/route.ts:286:    const existingDocuments = await listClioMatterDocuments(matterId);
./app/api/documents/finalize/route.ts:291:      const existingMatches = findExistingClioDocumentsByFilename(
./app/api/documents/finalize/route.ts:302:          reason: "already-uploaded-to-clio",
./app/api/documents/finalize/route.ts:303:          existingClioDocuments: existingMatches.map((match) => ({
./app/api/documents/finalize/route.ts:327:          : document.wouldUploadToClio
./app/api/documents/finalize/route.ts:340:              clean(skip?.reason) === "already-uploaded-to-clio"
./app/api/documents/finalize/route.ts:362:            "No upload was performed because all selected documents already exist in Clio by exact filename match.",
./app/api/documents/finalize/route.ts:373:            clioDocumentsTabRemainsSourceOfTruth: true,
./app/api/documents/finalize/route.ts:420:      const result = await uploadBufferToClioMatterDocuments({
./app/api/documents/finalize/route.ts:456:        clioDocumentId: result.documentId,
./app/api/documents/finalize/route.ts:457:        clioDocumentName: result.documentName,
./app/api/documents/finalize/route.ts:458:        clioDocumentVersionUuid: result.documentVersionUuid,
./app/api/documents/finalize/route.ts:468:      status: "uploaded-to-clio",
./app/api/documents/finalize/route.ts:481:      clioUploadTarget: preview.clioUploadTarget,
./app/api/documents/finalize/route.ts:493:        clioDocumentsTabRemainsSourceOfTruth: true,
./app/api/documents/finalize/route.ts:495:        uploadedOnlyToRequestedClioMatterDocumentsTab: true,
./app/api/advanced-search/hydrate/route.ts:1:import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";
./app/api/advanced-search/hydrate/route.ts:4:  return legacyClioOperationalRouteBlocked("app/api/advanced-search/hydrate");
./app/api/ticklers/settlement-payment-due/route.ts:80:            clioRecordsChanged: false,
./app/api/ticklers/settlement-payment-due/route.ts:112:        clioRecordsChanged: false,
./app/api/ticklers/settlement-payment-due/route.ts:130:          clioRecordsChanged: false,
./app/api/ticklers/settlement-payment-due/route.ts:167:            clioRecordsChanged: false,
./app/api/ticklers/settlement-payment-due/route.ts:193:            clioRecordsChanged: false,
./app/api/ticklers/settlement-payment-due/route.ts:270:          clioRecordsChanged: false,
./app/api/ticklers/settlement-payment-due/route.ts:291:          clioRecordsChanged: false,
./app/api/ticklers/settlement-payment-due/route.ts:314:        clioRecordsChanged: false,
./app/api/ticklers/settlement-payment-due/route.ts:323:        "Created a Barsh Matters local payment due follow-up tickler.  This does not create a Clio task, calendar event, email, document, print queue item, or matter closure.",
./app/api/ticklers/settlement-payment-due/route.ts:335:          clioRecordsChanged: false,
./scripts/verify-attorney-fee-docx-safety.mjs:57:console.log("=== VERIFY NO CLIO / DATABASE / FILE / PRINT QUEUE MUTATION ===");
./scripts/verify-attorney-fee-docx-safety.mjs:58:mustContain("attorney fee route", attorneyFeeRoute, "noClioRecordsChanged: true");
./scripts/verify-attorney-fee-docx-safety.mjs:63:mustNotContain("attorney fee route", attorneyFeeRoute, "clioFetch(");
./scripts/verify-attorney-fee-docx-safety.mjs:64:mustNotContain("attorney fee route", attorneyFeeRoute, "uploadBufferToClioMatterDocuments");
./scripts/verify-attorney-fee-docx-safety.mjs:65:mustNotContain("attorney fee route", attorneyFeeRoute, "listClioMatterDocuments");
./scripts/verify-attorney-fee-docx-safety.mjs:100:mustNotContain("settlement documents preview route", previewRoute, "live-clio-read");
./scripts/verify-attorney-fee-docx-safety.mjs:101:mustNotContain("settlement documents preview route", previewRoute, "clioFetch(");
./scripts/verify-attorney-fee-docx-safety.mjs:117:console.log("No Clio records were changed by this verifier.");
./app/api/documents/clio-maildrop-resolve/route.ts:2:import { clioFetch } from "@/lib/clio";
./app/api/documents/clio-maildrop-resolve/route.ts:45:  const res = await clioFetch(`/api/v4/matters.json?${params.toString()}`);
./app/api/documents/clio-maildrop-resolve/route.ts:49:    throw new Error(json?.error?.message || json?.message || `Could not search Clio matter ${normalized}.`);
./app/api/documents/clio-maildrop-resolve/route.ts:59:  const res = await clioFetch(
./app/api/documents/clio-maildrop-resolve/route.ts:73:    throw new Error(`Could not read Clio matter ${matterId}: status ${res.status}; body ${bodyText || "(empty)"}`);
./app/api/documents/clio-maildrop-resolve/route.ts:87:  // Direct UI ids may be BRL30121, 30121, or a real Clio numeric id.  Five-digit BRL-style ids should be searched as display numbers.
./app/api/documents/clio-maildrop-resolve/route.ts:111:      clioMasterMatterId: true,
./app/api/documents/clio-maildrop-resolve/route.ts:112:      clioMasterDisplayNumber: true,
./app/api/documents/clio-maildrop-resolve/route.ts:113:      clioMasterMatterDescription: true,
./app/api/documents/clio-maildrop-resolve/route.ts:117:  if (!lawsuit?.clioMasterMatterId) {
./app/api/documents/clio-maildrop-resolve/route.ts:118:    throw new Error(`No mapped Clio master matter found for ${masterLawsuitId}.`);
./app/api/documents/clio-maildrop-resolve/route.ts:121:  return await readMatterMaildropById(Number(lawsuit.clioMasterMatterId));
./app/api/documents/clio-maildrop-resolve/route.ts:137:      throw new Error("Resolved Clio matter did not include a display number.");
./app/api/documents/clio-maildrop-resolve/route.ts:141:      throw new Error(`Resolved Clio matter ${displayNumber} did not include maildrop_address.`);
./app/api/documents/clio-maildrop-resolve/route.ts:145:      source: "clio_maildrop_resolve",
./app/api/documents/clio-maildrop-resolve/route.ts:148:      clioMatterId: Number(matter?.id || 0) || null,
./app/api/documents/clio-maildrop-resolve/route.ts:149:      clioDisplayNumber: displayNumber,
./app/api/documents/clio-maildrop-resolve/route.ts:150:      clioMaildropEmail: maildropEmail,
./app/api/documents/clio-maildrop-resolve/route.ts:151:      clioMaildropLabel: `MailDrop- ${displayNumber}`,
./app/api/documents/clio-maildrop-resolve/route.ts:153:        route: "/api/documents/clio-maildrop-resolve",
./app/api/documents/clio-maildrop-resolve/route.ts:161:      action: "clio-maildrop-resolve",
./app/api/documents/clio-maildrop-resolve/route.ts:163:      clioRecordsChanged: false,
./app/api/documents/clio-maildrop-resolve/route.ts:176:        "Read-only Maildrop resolver.  Direct matter delivery uses that matter's Maildrop.  Master lawsuit delivery uses the mapped Clio master matter's Maildrop.",
./app/api/documents/clio-maildrop-resolve/route.ts:182:        action: "clio-maildrop-resolve",
./app/api/documents/clio-maildrop-resolve/route.ts:184:        clioRecordsChanged: false,
./app/api/documents/clio-maildrop-resolve/route.ts:186:        error: error?.message || "Clio Maildrop resolve failed.",
./scripts/verify-reference-import-cleanup-confirm-safety.mjs:46:if (!route.includes("noClioRecordsChanged: true")) {
./scripts/verify-reference-import-cleanup-confirm-safety.mjs:47:  fail("Cleanup confirm route must state no Clio records changed.");
./scripts/verify-reference-import-cleanup-confirm-safety.mjs:59:  "clioFetch",
./scripts/verify-local-settlement-record-save-safety.mjs:36:  "clioRecordsChanged: false",
./scripts/verify-local-settlement-record-save-safety.mjs:45:  "clioFetch(",
./scripts/verify-local-settlement-record-save-safety.mjs:46:  "writeSettlementToClio",
./scripts/verify-local-settlement-record-save-safety.mjs:47:  "previewSettlementWritebackToClio",
./app/api/admin/document-readiness/audit/route.ts:39:  clioMasterMatterId: number | null;
./app/api/admin/document-readiness/audit/route.ts:40:  clioMasterDisplayNumber: string | null;
./app/api/admin/document-readiness/audit/route.ts:93:  clioMasterMatterId: true,
./app/api/admin/document-readiness/audit/route.ts:94:  clioMasterDisplayNumber: true,
./app/api/admin/document-readiness/audit/route.ts:95:  clioMasterMatterDescription: true,
./app/api/admin/document-readiness/audit/route.ts:96:  clioMasterMappedAt: true,
./app/api/admin/document-readiness/audit/route.ts:97:  clioMasterMappingSource: true,
./app/api/admin/document-readiness/audit/route.ts:190:    clioMasterMatterId: lawsuit.clioMasterMatterId,
./app/api/admin/document-readiness/audit/route.ts:191:    clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber,
./app/api/admin/document-readiness/audit/route.ts:292:    const noMasterClioShell = rows.filter((row) => !row.clioMasterMatterId && !clean(row.clioMasterDisplayNumber));
./app/api/admin/document-readiness/audit/route.ts:294:      id: "missing-master-clio-shell",
./app/api/admin/document-readiness/audit/route.ts:295:      label: "Missing mapped master Clio shell",
./app/api/admin/document-readiness/audit/route.ts:297:      count: noMasterClioShell.length,
./app/api/admin/document-readiness/audit/route.ts:298:      description: "Final PDF upload and external document viewing require a mapped master Clio shell.",
./app/api/admin/document-readiness/audit/route.ts:299:      sampleRows: noMasterClioShell,
./app/api/admin/document-readiness/audit/route.ts:302:    const partialMasterClioShell = rows.filter(
./app/api/admin/document-readiness/audit/route.ts:303:      (row) => (!!row.clioMasterMatterId && !clean(row.clioMasterDisplayNumber)) || (!row.clioMasterMatterId && !!clean(row.clioMasterDisplayNumber))
./app/api/admin/document-readiness/audit/route.ts:306:      id: "partial-master-clio-shell",
./app/api/admin/document-readiness/audit/route.ts:307:      label: "Partial mapped master Clio shell",
./app/api/admin/document-readiness/audit/route.ts:309:      count: partialMasterClioShell.length,
./app/api/admin/document-readiness/audit/route.ts:310:      description: "The master shell mapping should ideally preserve both clioMasterMatterId and clioMasterDisplayNumber.",
./app/api/admin/document-readiness/audit/route.ts:311:      sampleRows: partialMasterClioShell,
./app/api/admin/document-readiness/audit/route.ts:528:        masterClioShellMapping: [
./app/api/admin/document-readiness/audit/route.ts:529:          { label: "Mapped master Clio shell", count: rows.filter((row) => row.clioMasterMatterId || clean(row.clioMasterDisplayNumber)).length },
./app/api/admin/document-readiness/audit/route.ts:530:          { label: "No mapped master Clio shell", count: rows.filter((row) => !row.clioMasterMatterId && !clean(row.clioMasterDisplayNumber)).length },
./app/api/admin/document-readiness/audit/route.ts:543:        "Read-only Admin Document Generation Readiness Audit. This route only reads local Prisma tables. It does not call Clio, call Graph, create working documents, generate documents, finalize documents, upload documents, send email, print, queue, restore data, update records, delete records, or write the database.",
./app/api/documents/generate-preview/route.ts:120:    note: "Dry run only. No files were created, no Clio records were changed, and no database records were changed.",
./scripts/verify-direct-matter-document-preview-ui-safety.mjs:38:mustContain("explicit no generation language", "It does not generate documents, upload documents, write to Clio, or change the print queue.");
./scripts/verify-direct-matter-document-preview-ui-safety.mjs:41:mustNotContain("preview action writing to Clio", "loadMatterDocumentDataPreviewToClio");
./app/api/documents/clio-matter-documents/route.ts:3:import { clioFetch } from "@/lib/clio";
./app/api/documents/clio-matter-documents/route.ts:4:import { listClioMatterDocuments } from "@/lib/clioDocumentUpload";
./app/api/documents/clio-matter-documents/route.ts:29:async function readClioJson(res: Response, fallback: string): Promise<any> {
./app/api/documents/clio-matter-documents/route.ts:48:async function resolveClioMatterByDisplayNumber(displayNumberInput: string) {
./app/api/documents/clio-matter-documents/route.ts:55:      clioMatterId: null,
./app/api/documents/clio-matter-documents/route.ts:56:      clioDisplayNumber: "",
./app/api/documents/clio-matter-documents/route.ts:58:      error: "Missing Clio display number for direct matter document lookup.",
./app/api/documents/clio-matter-documents/route.ts:68:  const res = await clioFetch(`/matters.json?${params.toString()}`);
./app/api/documents/clio-matter-documents/route.ts:69:  const json = await readClioJson(res, `Clio matter lookup failed for ${displayNumber}`);
./app/api/documents/clio-matter-documents/route.ts:84:      clioMatterId: null,
./app/api/documents/clio-matter-documents/route.ts:85:      clioDisplayNumber: "",
./app/api/documents/clio-matter-documents/route.ts:87:      error: `Could not resolve Clio matter id for ${displayNumber}.`,
./app/api/documents/clio-matter-documents/route.ts:94:    clioMatterId: exact.id,
./app/api/documents/clio-matter-documents/route.ts:95:    clioDisplayNumber: exact.displayNumber,
./app/api/documents/clio-matter-documents/route.ts:101:function normalizeClioDocumentRows(documents: any[], source: {
./app/api/documents/clio-matter-documents/route.ts:102:  clioMatterId: number | null;
./app/api/documents/clio-matter-documents/route.ts:103:  clioDisplayNumber: string;
./app/api/documents/clio-matter-documents/route.ts:108:    clioDocumentId: doc.id,
./app/api/documents/clio-matter-documents/route.ts:109:    clioDocumentName: doc.name,
./app/api/documents/clio-matter-documents/route.ts:110:    clioDocumentFilename: doc.filename,
./app/api/documents/clio-matter-documents/route.ts:113:    sourceClioMatterId: source.clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:114:    sourceClioDisplayNumber: source.clioDisplayNumber,
./app/api/documents/clio-matter-documents/route.ts:150:          action: "clio-matter-documents-list",
./app/api/documents/clio-matter-documents/route.ts:152:          clioRecordsChanged: false,
./app/api/documents/clio-matter-documents/route.ts:169:          action: "clio-matter-documents-list",
./app/api/documents/clio-matter-documents/route.ts:171:          clioRecordsChanged: false,
./app/api/documents/clio-matter-documents/route.ts:184:    let clioMatterId: number | null = null;
./app/api/documents/clio-matter-documents/route.ts:185:    let clioDisplayNumber = "";
./app/api/documents/clio-matter-documents/route.ts:206:      const clioResolution = await resolveClioMatterByDisplayNumber(localDisplayNumber);
./app/api/documents/clio-matter-documents/route.ts:208:      if (!clioResolution.ok || !clioResolution.clioMatterId) {
./app/api/documents/clio-matter-documents/route.ts:212:            action: "clio-matter-documents-list",
./app/api/documents/clio-matter-documents/route.ts:215:            clioRecordsChanged: false,
./app/api/documents/clio-matter-documents/route.ts:225:            clioDisplayNumber: localDisplayNumber,
./app/api/documents/clio-matter-documents/route.ts:227:              clioResolution.error ||
./app/api/documents/clio-matter-documents/route.ts:228:              `Could not resolve real Clio matter id for ${localDisplayNumber}.`,
./app/api/documents/clio-matter-documents/route.ts:230:              source: "claim-index + clio-display-number-resolution",
./app/api/documents/clio-matter-documents/route.ts:234:              clioResolution,
./app/api/documents/clio-matter-documents/route.ts:241:      clioMatterId = clioResolution.clioMatterId;
./app/api/documents/clio-matter-documents/route.ts:242:      clioDisplayNumber = clioResolution.clioDisplayNumber || localDisplayNumber;
./app/api/documents/clio-matter-documents/route.ts:244:        source: "claim-index + clio-display-number-resolution",
./app/api/documents/clio-matter-documents/route.ts:248:        clioResolution,
./app/api/documents/clio-matter-documents/route.ts:260:          clioMasterMatterId: true,
./app/api/documents/clio-matter-documents/route.ts:261:          clioMasterDisplayNumber: true,
./app/api/documents/clio-matter-documents/route.ts:262:          clioMasterMatterDescription: true,
./app/api/documents/clio-matter-documents/route.ts:263:          clioMasterMappedAt: true,
./app/api/documents/clio-matter-documents/route.ts:264:          clioMasterMappingSource: true,
./app/api/documents/clio-matter-documents/route.ts:283:      clioMatterId = numberOrNull(lawsuit?.clioMasterMatterId);
./app/api/documents/clio-matter-documents/route.ts:284:      clioDisplayNumber = normalizeBrl(lawsuit?.clioMasterDisplayNumber);
./app/api/documents/clio-matter-documents/route.ts:286:        source: "lawsuit.clio-master-mapping",
./app/api/documents/clio-matter-documents/route.ts:297:            action: "clio-matter-documents-list",
./app/api/documents/clio-matter-documents/route.ts:299:            clioRecordsChanged: false,
./app/api/documents/clio-matter-documents/route.ts:315:      if (!clioMatterId) {
./app/api/documents/clio-matter-documents/route.ts:319:            action: "clio-matter-documents-list",
./app/api/documents/clio-matter-documents/route.ts:322:            clioRecordsChanged: false,
./app/api/documents/clio-matter-documents/route.ts:332:              "No mapped Clio master matter ID exists for this Barsh Matters Lawsuit ID.  Refusing to list Clio documents without an explicit mapping.",
./app/api/documents/clio-matter-documents/route.ts:340:    if (!clioMatterId) {
./app/api/documents/clio-matter-documents/route.ts:344:          action: "clio-matter-documents-list",
./app/api/documents/clio-matter-documents/route.ts:346:          clioRecordsChanged: false,
./app/api/documents/clio-matter-documents/route.ts:353:          error: "Unable to resolve a Clio matter ID.",
./app/api/documents/clio-matter-documents/route.ts:363:      const masterDisplay = clioDisplayNumber || normalizeBrl(localSource?.lawsuit?.clioMasterDisplayNumber);
./app/api/documents/clio-matter-documents/route.ts:364:      const masterDocuments = await listClioMatterDocuments(clioMatterId);
./app/api/documents/clio-matter-documents/route.ts:366:        clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:367:        clioDisplayNumber: masterDisplay,
./app/api/documents/clio-matter-documents/route.ts:372:      normalizedDocuments.push(...normalizeClioDocumentRows(masterDocuments, masterSource));
./app/api/documents/clio-matter-documents/route.ts:387:        const childResolution = await resolveClioMatterByDisplayNumber(childDisplay);
./app/api/documents/clio-matter-documents/route.ts:388:        if (!childResolution.ok || !childResolution.clioMatterId) {
./app/api/documents/clio-matter-documents/route.ts:390:            clioMatterId: null,
./app/api/documents/clio-matter-documents/route.ts:391:            clioDisplayNumber: childDisplay,
./app/api/documents/clio-matter-documents/route.ts:400:        const childDocuments = await listClioMatterDocuments(childResolution.clioMatterId);
./app/api/documents/clio-matter-documents/route.ts:402:          clioMatterId: childResolution.clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:403:          clioDisplayNumber: childResolution.clioDisplayNumber || childDisplay,
./app/api/documents/clio-matter-documents/route.ts:405:          sourceLabel: sourceLabel(childResolution.clioDisplayNumber || childDisplay, "bill"),
./app/api/documents/clio-matter-documents/route.ts:408:        normalizedDocuments.push(...normalizeClioDocumentRows(childDocuments, childSource));
./app/api/documents/clio-matter-documents/route.ts:415:      const directDocuments = await listClioMatterDocuments(clioMatterId);
./app/api/documents/clio-matter-documents/route.ts:417:        clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:418:        clioDisplayNumber,
./app/api/documents/clio-matter-documents/route.ts:420:        sourceLabel: sourceLabel(clioDisplayNumber, "bill"),
./app/api/documents/clio-matter-documents/route.ts:423:      normalizedDocuments = normalizeClioDocumentRows(directDocuments, directSource);
./app/api/documents/clio-matter-documents/route.ts:432:      action: "clio-matter-documents-list",
./app/api/documents/clio-matter-documents/route.ts:435:      clioRecordsChanged: false,
./app/api/documents/clio-matter-documents/route.ts:446:      clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:447:      clioDisplayNumber,
./app/api/documents/clio-matter-documents/route.ts:464:        noClioWrites: true,
./app/api/documents/clio-matter-documents/route.ts:472:        masterMatterRequiresExplicitClioMapping: targetType === "master-lawsuit",
./app/api/documents/clio-matter-documents/route.ts:479:        action: "clio-matter-documents-list",
./app/api/documents/clio-matter-documents/route.ts:481:        clioRecordsChanged: false,
./app/api/documents/clio-matter-documents/route.ts:488:        error: error?.message || "Could not list Clio matter documents.",
./scripts/verify-claim-index-local-source-contract.mjs:10:    markers: ['noClioRead', 'noClioWrite', 'noClioHydration'],
./scripts/verify-claim-index-local-source-contract.mjs:27:  { label: 'Clio matter-context route', re: /\/api\/clio\/matter-context|matter-context/iu },
./scripts/verify-claim-index-local-source-contract.mjs:28:  { label: 'Clio operational import', re: /from\s+['"][^'"]*(?:clio|Clio)[^'"]*['"]/u },
./scripts/verify-claim-index-local-source-contract.mjs:29:  { label: 'Clio operational require', re: /require\(['"][^'"]*(?:clio|Clio)[^'"]*['"]\)/u },
./scripts/verify-claim-index-local-source-contract.mjs:30:  { label: 'Clio custom field operational dependency', re: /\bcustom_field_values\b|\bcustomFieldValues\b/u },
./scripts/verify-claim-index-local-source-contract.mjs:31:  { label: 'Clio hydration language', re: /\bhydrat(?:e|ion|ed|ing)\b.*\bClio\b|\bClio\b.*\bhydrat(?:e|ion|ed|ing)\b/iu },
./scripts/verify-claim-index-local-source-contract.mjs:32:  { label: 'Clio rebuild language', re: /\brebuildClaimIndex\b|\brebuild.*\bClio\b|\bClio\b.*\brebuild\b/iu },
./scripts/verify-claim-index-local-source-contract.mjs:33:  { label: 'Known Clio operational helper', re: /\bfetchMatterFromClio\b|\bgetMatterFromClio\b|\bclioMatterContext\b|\bloadClioMatterContext\b/u },
./scripts/verify-claim-index-local-source-contract.mjs:37:  { label: 'Clio matter-context route', re: /\/api\/clio\/matter-context|matter-context/iu },
./scripts/verify-claim-index-local-source-contract.mjs:38:  { label: 'Clio hydration language', re: /\bhydrat(?:e|ion|ed|ing)\b.*\bClio\b|\bClio\b.*\bhydrat(?:e|ion|ed|ing)\b/iu },
./scripts/verify-claim-index-local-source-contract.mjs:39:  { label: 'Clio rebuild language', re: /\brebuildClaimIndex\b|\brebuild.*\bClio\b|\bClio\b.*\brebuild\b/iu },
./scripts/verify-claim-index-local-source-contract.mjs:40:  { label: 'Known Clio operational helper', re: /\bfetchMatterFromClio\b|\bgetMatterFromClio\b|\bclioMatterContext\b|\bloadClioMatterContext\b/u },
./scripts/verify-claim-index-local-source-contract.mjs:41:  { label: 'Clio custom field operational dependency', re: /\bcustom_field_values\b|\bcustomFieldValues\b/u },
./scripts/verify-claim-index-local-source-contract.mjs:55:    l.includes('does not write clio') ||
./scripts/verify-claim-index-local-source-contract.mjs:80:const isAllowedCreateLawsuitClioDocumentShellLine = (rel, line) => {
./scripts/verify-claim-index-local-source-contract.mjs:86:    l.includes('from "@/lib/clio"') ||
./scripts/verify-claim-index-local-source-contract.mjs:87:    l.includes("from '@/lib/clio'") ||
./scripts/verify-claim-index-local-source-contract.mjs:88:    l.includes('cliofetch(') ||
./scripts/verify-claim-index-local-source-contract.mjs:89:    l.includes('createcliomastermatter') ||
./scripts/verify-claim-index-local-source-contract.mjs:90:    l.includes('readcliomatterclient') ||
./scripts/verify-claim-index-local-source-contract.mjs:91:    l.includes('findclientfromchildcliomatters') ||
./scripts/verify-claim-index-local-source-contract.mjs:92:    l.includes('createdcliomatter') ||
./scripts/verify-claim-index-local-source-contract.mjs:93:    l.includes('createscliodocumentshell') ||
./scripts/verify-claim-index-local-source-contract.mjs:94:    l.includes('createscliomastermatter') ||
./scripts/verify-claim-index-local-source-contract.mjs:95:    l.includes('cliomastermatterid') ||
./scripts/verify-claim-index-local-source-contract.mjs:96:    l.includes('cliomasterdisplaynumber') ||
./scripts/verify-claim-index-local-source-contract.mjs:97:    l.includes('cliomastermatterdescription') ||
./scripts/verify-claim-index-local-source-contract.mjs:98:    l.includes('cliomastermappedat') ||
./scripts/verify-claim-index-local-source-contract.mjs:99:    l.includes('cliomastermappingsource') ||
./scripts/verify-claim-index-local-source-contract.mjs:100:    l.includes('noClioOperationalHydration'.toLowerCase()) ||
./scripts/verify-claim-index-local-source-contract.mjs:101:    l.includes('writesclio')
./scripts/verify-claim-index-local-source-contract.mjs:112:    if (isAllowedCreateLawsuitClioDocumentShellLine(rel, line)) return;
./scripts/verify-claim-index-local-source-contract.mjs:134:  'ClaimIndex is not a Clio cache',
./scripts/verify-claim-index-local-source-contract.mjs:135:  'ClaimIndex is not hydrated from Clio',
./scripts/verify-claim-index-local-source-contract.mjs:139:  'does not pull document files from Clio',
./app/api/documents/clio-master-matter-preview/route.ts:3:import { clioFetch } from "@/lib/clio";
./app/api/documents/clio-master-matter-preview/route.ts:30:function buildClioMatterDescription(masterLawsuitId: string) {
./app/api/documents/clio-master-matter-preview/route.ts:34:async function readClioMatterClient(matterId: number | string) {
./app/api/documents/clio-master-matter-preview/route.ts:39:  const res = await clioFetch(
./app/api/documents/clio-master-matter-preview/route.ts:55:      error: `Could not read Clio matter client: status ${res.status}; body ${bodyText || "(empty)"}`,
./app/api/documents/clio-master-matter-preview/route.ts:68:      error: "Child Clio matter did not include a valid client id.",
./app/api/documents/clio-master-matter-preview/route.ts:81:async function findClientFromChildClioMatters(rows: Array<{ matter_id: number | null; display_number?: string | null }>) {
./app/api/documents/clio-master-matter-preview/route.ts:92:    const result = await readClioMatterClient(candidate.matterId);
./app/api/documents/clio-master-matter-preview/route.ts:117:    error: "No child Clio matter with a readable client was found.",
./app/api/documents/clio-master-matter-preview/route.ts:126:    clioMatterId: "TO_BE_ASSIGNED_BY_CLIO",
./app/api/documents/clio-master-matter-preview/route.ts:127:    clioDisplayNumber: "TO_BE_ASSIGNED_BY_CLIO_BRLXXXXX",
./app/api/documents/clio-master-matter-preview/route.ts:128:    clioMatterDescription: buildClioMatterDescription(masterLawsuitId),
./app/api/documents/clio-master-matter-preview/route.ts:130:      "Clio document vault for finalized master lawsuit documents",
./app/api/documents/clio-master-matter-preview/route.ts:131:      "Clio Maildrop source for document-delivery Cc",
./app/api/documents/clio-master-matter-preview/route.ts:132:      "Clio document source for Outlook/Microsoft Graph draft attachments",
./app/api/documents/clio-master-matter-preview/route.ts:133:      "Clio document source for Barsh Matters UI document access",
./app/api/documents/clio-master-matter-preview/route.ts:180:    const childClient = await findClientFromChildClioMatters(claimIndexRows);
./app/api/documents/clio-master-matter-preview/route.ts:182:    const plannedClioMatterPayload = {
./app/api/documents/clio-master-matter-preview/route.ts:184:        description: buildClioMatterDescription(masterLawsuitId),
./app/api/documents/clio-master-matter-preview/route.ts:185:        // Clio assigns the BRLXXXXX display number.  Barsh Matters must store it after creation.
./app/api/documents/clio-master-matter-preview/route.ts:209:      action: "clio-master-matter-create-preview",
./app/api/documents/clio-master-matter-preview/route.ts:211:      createsClioMatter: false,
./app/api/documents/clio-master-matter-preview/route.ts:212:      clioRecordsChanged: false,
./app/api/documents/clio-master-matter-preview/route.ts:227:      plannedClioMatterPayload,
./app/api/documents/clio-master-matter-preview/route.ts:230:        ...(childClient.ok ? [] : [childClient.error || "Could not derive Clio client from child matters."]),
./app/api/documents/clio-master-matter-preview/route.ts:235:        typedConfirmationRequired: `CREATE CLIO MASTER ${masterLawsuitId}`,
./app/api/documents/clio-master-matter-preview/route.ts:236:        clioCreateEndpoint: "POST /api/v4/matters.json",
./app/api/documents/clio-master-matter-preview/route.ts:237:        mustCaptureClioMatterId: true,
./app/api/documents/clio-master-matter-preview/route.ts:238:        mustCaptureClioDisplayNumber: true,
./app/api/documents/clio-master-matter-preview/route.ts:241:        mustNotUseMasterLawsuitIdAsClioDisplayNumber: true,
./app/api/documents/clio-master-matter-preview/route.ts:242:        clioAssignsBrlDisplayNumber: true,
./app/api/documents/clio-master-matter-preview/route.ts:245:        "Preview only.  This route plans the Clio master matter creation and Barsh Matters mapping needed for document storage, Maildrop Cc, document retrieval, and future Outlook/Microsoft Graph attachments.  It does not create a Clio matter and does not write to the database.",
./app/api/documents/clio-master-matter-preview/route.ts:251:        action: "clio-master-matter-create-preview",
./app/api/documents/clio-master-matter-preview/route.ts:253:        createsClioMatter: false,
./app/api/documents/clio-master-matter-preview/route.ts:254:        clioRecordsChanged: false,
./app/api/documents/clio-master-matter-preview/route.ts:256:        error: error?.message || "Clio master matter create preview failed.",
./scripts/verify-claimindex-rebuild-status-safety.mjs:42:assertNotIncludes("legacy rebuild-status shim", legacyRoute, "clioFetch(");
./scripts/verify-claimindex-rebuild-status-safety.mjs:43:assertNotIncludes("legacy rebuild-status shim", legacyRoute, "ingestMatterFromClio");
./scripts/verify-claimindex-rebuild-status-safety.mjs:44:assertNotIncludes("legacy rebuild-status shim", legacyRoute, "ingestMattersFromClioBatch");
./scripts/verify-claimindex-rebuild-status-safety.mjs:65:assertNotIncludes("local index status route", localRoute, "clioFetch(");
./scripts/verify-claimindex-rebuild-status-safety.mjs:66:assertNotIncludes("local index status route", localRoute, "ingestMatterFromClio");
./scripts/verify-claimindex-rebuild-status-safety.mjs:67:assertNotIncludes("local index status route", localRoute, "ingestMattersFromClioBatch");
./app/api/advanced-search/candidates/route.ts:365:      noClioRecordsChanged: true,
./app/api/lawsuits/local-generation-create/route.ts:4:import { clioFetch } from "@/lib/clio";
./app/api/lawsuits/local-generation-create/route.ts:54:function buildClioMatterDescription(masterLawsuitId: string) {
./app/api/lawsuits/local-generation-create/route.ts:58:function normalizeClioDisplayNumber(value: unknown): string {
./app/api/lawsuits/local-generation-create/route.ts:66:async function readClioMatterClient(matterId: number | string) {
./app/api/lawsuits/local-generation-create/route.ts:71:  const res = await clioFetch(
./app/api/lawsuits/local-generation-create/route.ts:87:      error: `Could not read Clio matter client: status ${res.status}; body ${bodyText || "(empty)"}`,
./app/api/lawsuits/local-generation-create/route.ts:100:      error: "Child Clio matter did not include a valid client id.",
./app/api/lawsuits/local-generation-create/route.ts:113:async function findClientFromChildClioMatters(rows: Array<{ matter_id: number | null; display_number?: string | null }>) {
./app/api/lawsuits/local-generation-create/route.ts:124:    const result = await readClioMatterClient(candidate.matterId);
./app/api/lawsuits/local-generation-create/route.ts:149:    error: "No child Clio matter with a readable client was found.",
./app/api/lawsuits/local-generation-create/route.ts:153:async function createClioMasterMatter(params: {
./app/api/lawsuits/local-generation-create/route.ts:160:  const res = await clioFetch(`/api/v4/matters.json?fields=${encodeURIComponent(fields)}`, {
./app/api/lawsuits/local-generation-create/route.ts:185:      `Failed to create Clio master matter: status ${res.status}; body ${bodyText || "(empty)"}`
./app/api/lawsuits/local-generation-create/route.ts:191:  const displayNumber = normalizeClioDisplayNumber(matter?.display_number);
./app/api/lawsuits/local-generation-create/route.ts:195:    throw new Error("Clio created matter response did not include a valid matter id.");
./app/api/lawsuits/local-generation-create/route.ts:199:    throw new Error("Clio created matter response did not include a display number / BRL number.");
./app/api/lawsuits/local-generation-create/route.ts:236:            writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:237:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-create/route.ts:254:            writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:255:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-create/route.ts:272:            writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:273:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-create/route.ts:290:            writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:291:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-create/route.ts:321:            writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:322:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-create/route.ts:346:            writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:347:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-create/route.ts:367:            writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:368:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-create/route.ts:376:    const childClient = await findClientFromChildClioMatters(selectedRows);
./app/api/lawsuits/local-generation-create/route.ts:383:          error: childClient.error || "Could not derive the Clio client from the selected child matters.",
./app/api/lawsuits/local-generation-create/route.ts:388:            writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:389:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-create/route.ts:417:    const clioMatterDescription = buildClioMatterDescription(masterLawsuitId);
./app/api/lawsuits/local-generation-create/route.ts:419:    const createdClioMatter = await createClioMasterMatter({
./app/api/lawsuits/local-generation-create/route.ts:421:      description: clioMatterDescription,
./app/api/lawsuits/local-generation-create/route.ts:446:            createsClioDocumentShell: true,
./app/api/lawsuits/local-generation-create/route.ts:447:            clioMasterMatterId: createdClioMatter.matterId,
./app/api/lawsuits/local-generation-create/route.ts:448:            clioMasterDisplayNumber: createdClioMatter.displayNumber,
./app/api/lawsuits/local-generation-create/route.ts:449:            clioMasterMatterDescription: createdClioMatter.description || clioMatterDescription,
./app/api/lawsuits/local-generation-create/route.ts:450:            clioClientId: childClient.clientId,
./app/api/lawsuits/local-generation-create/route.ts:451:            clioClientName: childClient.clientName,
./app/api/lawsuits/local-generation-create/route.ts:452:            noClioOperationalHydration: true,
./app/api/lawsuits/local-generation-create/route.ts:453:            noClioMasterMatterManualStepRequired: true,
./app/api/lawsuits/local-generation-create/route.ts:467:          clioMasterMatterId: createdClioMatter.matterId,
./app/api/lawsuits/local-generation-create/route.ts:468:          clioMasterDisplayNumber: createdClioMatter.displayNumber,
./app/api/lawsuits/local-generation-create/route.ts:469:          clioMasterMatterDescription: createdClioMatter.description || clioMatterDescription,
./app/api/lawsuits/local-generation-create/route.ts:470:          clioMasterMappedAt: new Date(),
./app/api/lawsuits/local-generation-create/route.ts:471:          clioMasterMappingSource: "barsh-matters-create-lawsuit-confirm",
./app/api/lawsuits/local-generation-create/route.ts:517:      createdClioMatter: {
./app/api/lawsuits/local-generation-create/route.ts:518:        id: createdClioMatter.matterId,
./app/api/lawsuits/local-generation-create/route.ts:519:        displayNumber: createdClioMatter.displayNumber,
./app/api/lawsuits/local-generation-create/route.ts:520:        description: createdClioMatter.description || clioMatterDescription,
./app/api/lawsuits/local-generation-create/route.ts:522:      clioMasterMatterId: result.lawsuit.clioMasterMatterId,
./app/api/lawsuits/local-generation-create/route.ts:523:      clioMasterDisplayNumber: result.lawsuit.clioMasterDisplayNumber,
./app/api/lawsuits/local-generation-create/route.ts:524:      clioMasterMatterDescription: result.lawsuit.clioMasterMatterDescription,
./app/api/lawsuits/local-generation-create/route.ts:525:      clioMasterMappedAt: result.lawsuit.clioMasterMappedAt,
./app/api/lawsuits/local-generation-create/route.ts:526:      clioMasterMappingSource: result.lawsuit.clioMasterMappingSource,
./app/api/lawsuits/local-generation-create/route.ts:527:      proposedNextStep: "Use the mapped Clio document shell for finalized master lawsuit documents, Maildrop, document retrieval, and Microsoft Graph draft attachments.",
./app/api/lawsuits/local-generation-create/route.ts:531:        writesClio: true,
./app/api/lawsuits/local-generation-create/route.ts:532:        createsClioMasterMatter: true,
./app/api/lawsuits/local-generation-create/route.ts:550:          writesClio: false,
./app/api/lawsuits/local-generation-create/route.ts:551:          createsClioMasterMatter: false,
./scripts/verify-admin-claim-index-viewer-safety.mjs:52:  requireIncludes(routePath, route, "does not update ClaimIndex, restore data, call Clio", "route safety copy");
./scripts/verify-admin-claim-index-viewer-safety.mjs:70:    "clio",
./scripts/verify-admin-claim-index-viewer-safety.mjs:71:    "ClioClient",
./scripts/verify-admin-claim-index-viewer-safety.mjs:82:  requireIncludes(pagePath, page, 'data-clio-operations-enabled="false"', "Clio disabled marker");
./scripts/verify-admin-claim-index-viewer-safety.mjs:101:    "write to Clio",
./scripts/verify-document-template-import-routes-safety.mjs:44:  check(`${label} does not import Clio`, !text.includes("@/lib/clio") && !text.includes("uploadDocumentToClio"));
./app/api/admin/invoices/route.ts:72:      safety: "Read-only global invoice search/reporting. This route does not create, finalize, void, remit, print, email, queue, mutate source payment rows, update ClaimIndex, or mutate Clio.",
./app/api/admin/backups/run/route.ts:56:          clioWrite: false,
./app/api/admin/backups/run/route.ts:76:      clioWrite: false,
./app/api/lawsuits/update-metadata/route.ts:139:          noClioRead: true,
./app/api/lawsuits/update-metadata/route.ts:140:          noClioWrite: true,
./app/api/lawsuits/update-metadata/route.ts:150:      noClioRead: true,
./app/api/lawsuits/update-metadata/route.ts:151:      noClioWrite: true,
./app/api/lawsuits/update-metadata/route.ts:161:        noClioRead: true,
./app/api/lawsuits/update-metadata/route.ts:162:        noClioWrite: true,
./app/api/lawsuits/update-metadata/route.ts:191:          noClioRead: true,
./app/api/lawsuits/update-metadata/route.ts:192:          noClioWrite: true,
./app/api/lawsuits/update-metadata/route.ts:215:          noClioRead: true,
./app/api/lawsuits/update-metadata/route.ts:216:          noClioWrite: true,
./app/api/lawsuits/update-metadata/route.ts:248:      noClioRead: true,
./app/api/lawsuits/update-metadata/route.ts:249:      noClioWrite: true,
./app/api/lawsuits/update-metadata/route.ts:291:      noClioRead: true,
./app/api/lawsuits/update-metadata/route.ts:292:      noClioWrite: true,
./app/api/lawsuits/update-metadata/route.ts:297:      clioPostFilingWrite: {
./app/api/lawsuits/update-metadata/route.ts:300:        reason: "Clio post-filing writeback removed from update-metadata route.  Use a separately approved explicit document-shell sync workflow if needed.",
./app/api/lawsuits/update-metadata/route.ts:301:        clioWriteAttempted: false,
./app/api/lawsuits/update-metadata/route.ts:310:        noClioRead: true,
./app/api/lawsuits/update-metadata/route.ts:311:        noClioWrite: true,
./app/api/documents/templates/import-confirm/route.ts:271:        "Confirmed document template import wrote only local Barsh Matters DocumentTemplate, DocumentTemplateVersion, and DocumentTemplateMergeField rows. It did not upload files, generate documents, write Clio, create drafts, send email, print, or queue documents.",
./scripts/verify-template-stored-docx-download-safety.mjs:15:  "noClioRecordsChanged: true",
./scripts/verify-template-stored-docx-download-safety.mjs:41:  "clio.com",
./scripts/verify-template-stored-docx-download-safety.mjs:63:console.log("PASS: stored template DOCX download is read-only and exposes local DB DOCX payloads without Clio, Graph, email, print, or queue side effects.");
./app/api/documents/clio-master-crossref-confirm/route.ts:2:import { clioFetch } from "@/lib/clio";
./app/api/documents/clio-master-crossref-confirm/route.ts:15:  const previewUrl = new URL("/api/documents/clio-master-crossref-preview", req.nextUrl.origin);
./app/api/documents/clio-master-crossref-confirm/route.ts:26:    throw new Error(json?.error || "Could not load Clio cross-reference preview.");
./app/api/documents/clio-master-crossref-confirm/route.ts:62:  const res = await clioFetch(`/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`, {
./app/api/documents/clio-master-crossref-confirm/route.ts:85:      `Failed to write Clio cross-reference fields to ${target?.displayNumber || matterId}: status ${res.status}; body ${bodyText || "(empty)"}`
./app/api/documents/clio-master-crossref-confirm/route.ts:107:    const requiredConfirmation = `WRITE CLIO CROSSREF ${masterLawsuitId}`;
./app/api/documents/clio-master-crossref-confirm/route.ts:113:          action: "clio-master-crossref-confirm",
./app/api/documents/clio-master-crossref-confirm/route.ts:117:          clioRecordsChanged: false,
./app/api/documents/clio-master-crossref-confirm/route.ts:131:          action: "clio-master-crossref-confirm",
./app/api/documents/clio-master-crossref-confirm/route.ts:132:          clioRecordsChanged: false,
./app/api/documents/clio-master-crossref-confirm/route.ts:137:          error: "Clio cross-reference writeback is blocked because preview is not ready for confirm.",
./app/api/documents/clio-master-crossref-confirm/route.ts:152:      action: "clio-master-crossref-confirm",
./app/api/documents/clio-master-crossref-confirm/route.ts:153:      clioRecordsChanged: true,
./app/api/documents/clio-master-crossref-confirm/route.ts:163:        "Wrote only Clio cross-reference custom fields for child and master Clio matters.  No Barsh Matters database records, documents, email, print, or print queue records were changed.",
./app/api/documents/clio-master-crossref-confirm/route.ts:169:        action: "clio-master-crossref-confirm",
./app/api/documents/clio-master-crossref-confirm/route.ts:170:        clioRecordsChanged: false,
./app/api/documents/clio-master-crossref-confirm/route.ts:172:        error: error?.message || "Clio master cross-reference confirm failed.",
./app/api/lawsuits/local-generation-preview/route.ts:69:            writesClio: false,
./app/api/lawsuits/local-generation-preview/route.ts:70:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-preview/route.ts:87:            writesClio: false,
./app/api/lawsuits/local-generation-preview/route.ts:88:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-preview/route.ts:118:            writesClio: false,
./app/api/lawsuits/local-generation-preview/route.ts:119:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-preview/route.ts:144:            writesClio: false,
./app/api/lawsuits/local-generation-preview/route.ts:145:            createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-preview/route.ts:251:        writesClio: false,
./app/api/lawsuits/local-generation-preview/route.ts:252:        createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-preview/route.ts:260:        writesClio: false,
./app/api/lawsuits/local-generation-preview/route.ts:261:        createsClioMasterMatter: false,
./app/api/lawsuits/local-generation-preview/route.ts:274:          writesClio: false,
./app/api/lawsuits/local-generation-preview/route.ts:275:          createsClioMasterMatter: false,
./scripts/verify-admin-users-phase6-audit-visibility-readiness-safety.mjs:40:    "writeClio",
./scripts/verify-admin-users-phase6-audit-visibility-readiness-safety.mjs:53:  "does not edit records, delete entries, write Clio, send email, print, or queue documents",
./app/api/documents/templates/replace-version/route.ts:32:    clioWrites: false,
./app/api/documents/templates/replace-version/route.ts:303:        "Confirmed replacement created a new DocumentTemplateVersion, preserved prior versions, and updated currentVersionId.  It did not generate documents, upload to Clio, send email, create drafts, print, or queue documents.",
./app/api/admin/backups/status/route.ts:54:    pullsDocumentsFromClio?: boolean;
./app/api/admin/backups/status/route.ts:229:      clioWrite: false,
./app/api/admin/backups/status/route.ts:259:      clioWrite: false,
./app/api/admin/backups/status/route.ts:290:      clioWrite: false,
./app/api/admin/backups/status/route.ts:313:      clioWrite: false,
./app/api/lawsuits/close/route.ts:3:import { syncClioMattersClosed } from "@/lib/clioCloseSync";
./app/api/lawsuits/close/route.ts:37:function clioCloseSyncAuditSummary(result: {
./app/api/lawsuits/close/route.ts:115:    const clioMatterIdsToClose = Array.from(
./app/api/lawsuits/close/route.ts:117:        numericId((existing as any).clioMasterMatterId),
./app/api/lawsuits/close/route.ts:122:    if (!clioMatterIdsToClose.length) {
./app/api/lawsuits/close/route.ts:123:      return jsonError("No Clio matter IDs were available for guarded lawsuit close sync. Local lawsuit close was not committed.", 409, {
./app/api/lawsuits/close/route.ts:127:          clioCloseSyncAttempted: false,
./app/api/lawsuits/close/route.ts:128:          clioClosed: false,
./app/api/lawsuits/close/route.ts:136:    const clioCloseSync = await syncClioMattersClosed({
./app/api/lawsuits/close/route.ts:137:      matterIds: clioMatterIdsToClose,
./app/api/lawsuits/close/route.ts:142:    if (!clioCloseSync.ok) {
./app/api/lawsuits/close/route.ts:143:      return jsonError("Clio close sync failed. Local lawsuit close was not committed.", 502, {
./app/api/lawsuits/close/route.ts:147:        clioCloseSync,
./app/api/lawsuits/close/route.ts:149:          clioCloseSyncAttempted: true,
./app/api/lawsuits/close/route.ts:150:          clioClosed: false,
./app/api/lawsuits/close/route.ts:173:            clioCloseSyncRequired: true,
./app/api/lawsuits/close/route.ts:174:            clioCloseSyncReadOnly: false,
./app/api/lawsuits/close/route.ts:175:            clioCloseSync: clioCloseSyncAuditSummary(clioCloseSync),
./app/api/lawsuits/close/route.ts:209:          summary: `Closed lawsuit ${masterLawsuitId} locally and in Clio; child matters marked Closed with reason ${CHILD_CLOSED_REASON}.`,
./app/api/lawsuits/close/route.ts:223:            storage: "Lawsuit.lawsuitOptions + ClaimIndex + Clio matter status",
./app/api/lawsuits/close/route.ts:227:            clioCloseSyncRequired: true,
./app/api/lawsuits/close/route.ts:228:            clioCloseSyncReadOnly: false,
./app/api/lawsuits/close/route.ts:229:            clioCloseSync: clioCloseSyncAuditSummary(clioCloseSync),
./app/api/lawsuits/close/route.ts:251:      source: "local-lawsuit-schema-claimindex-and-clio",
./app/api/lawsuits/close/route.ts:252:      clioCloseSyncRequired: true,
./app/api/lawsuits/close/route.ts:253:      clioCloseSyncReadOnly: false,
./app/api/lawsuits/close/route.ts:263:      clioCloseSync,
./app/api/lawsuits/close/route.ts:265:        clioCloseSyncAttempted: true,
./app/api/lawsuits/close/route.ts:266:        clioClosed: true,
./app/api/lawsuits/close/route.ts:267:        clioWrite: true,
./app/api/lawsuits/close/route.ts:268:        clioRead: false,
./app/api/documents/clio-maildrop-inspect/route.ts:2:import { clioFetch } from "@/lib/clio";
./app/api/documents/clio-maildrop-inspect/route.ts:31:      lowerValue.includes("clio")
./app/api/documents/clio-maildrop-inspect/route.ts:56:async function readClioMatterWithFields(matterId: number, fields: string) {
./app/api/documents/clio-maildrop-inspect/route.ts:57:  const res = await clioFetch(
./app/api/documents/clio-maildrop-inspect/route.ts:76:    error: res.ok ? "" : bodyText || json?.error || "Clio matter read failed.",
./app/api/documents/clio-maildrop-inspect/route.ts:87:  const res = await clioFetch(`/api/v4/matters.json?${params.toString()}`);
./app/api/documents/clio-maildrop-inspect/route.ts:123:    const mappedMasterMatterId = numberOrNull(lawsuit?.clioMasterMatterId);
./app/api/documents/clio-maildrop-inspect/route.ts:156:        reads.push(await readClioMatterWithFields(matterId, fields));
./app/api/documents/clio-maildrop-inspect/route.ts:168:      action: "clio-maildrop-inspection",
./app/api/documents/clio-maildrop-inspect/route.ts:170:      clioRecordsChanged: false,
./app/api/documents/clio-maildrop-inspect/route.ts:175:            clioMasterMatterId: lawsuit.clioMasterMatterId,
./app/api/documents/clio-maildrop-inspect/route.ts:176:            clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber,
./app/api/documents/clio-maildrop-inspect/route.ts:177:            clioMasterMatterDescription: lawsuit.clioMasterMatterDescription,
./app/api/documents/clio-maildrop-inspect/route.ts:184:        "Read-only Maildrop inspection.  This probes candidate Clio matter fields to determine how Clio exposes the matter Maildrop address for document delivery Cc.",
./app/api/documents/clio-maildrop-inspect/route.ts:190:        action: "clio-maildrop-inspection",
./app/api/documents/clio-maildrop-inspect/route.ts:192:        clioRecordsChanged: false,
./app/api/documents/clio-maildrop-inspect/route.ts:194:        error: error?.message || "Clio Maildrop inspection failed.",
./app/api/admin/clients/[id]/invoice/create/route.ts:116:    sourceMatterId: clean(lineValue(line, ["sourceMatterId", "matterId", "matter_id", "clioMatterId"])) || null,
./app/api/admin/clients/[id]/invoice/create/route.ts:264:            noClioRecordsChanged: true,
./app/api/admin/clients/[id]/invoice/create/route.ts:281:      safety: "Created a local draft invoice and frozen invoice lines only. This route does not finalize invoices, update MatterPaymentReceipt.invoiceId, write remittances, generate documents, send email, print, queue, update ClaimIndex, mutate Clio, or change source payment/cost rows.",
./scripts/verify-settlement-documents-preview-safety.mjs:50:mustContain("settlement documents preview route", route, "clioRecordsChanged: false");
./scripts/verify-settlement-documents-preview-safety.mjs:59:mustContain("settlement documents preview route", route, "It does not read Clio settlement values");
./scripts/verify-settlement-documents-preview-safety.mjs:60:mustContain("settlement documents preview route", route, "write Clio");
./scripts/verify-settlement-documents-preview-safety.mjs:84:mustNotContain("settlement documents preview route", route, "live-clio-read");
./scripts/verify-settlement-documents-preview-safety.mjs:85:mustNotContain("settlement documents preview route", route, "clioFetch(");
./scripts/verify-settlement-documents-preview-safety.mjs:111:mustNotContain("matter page", matterPage, "Upload Settlement Documents to Clio");
./scripts/verify-settlement-documents-preview-safety.mjs:127:console.log("No Clio records were changed by this verifier.");
./app/api/admin/backups/restore-preview/route.ts:104:          clioWrite: false,
./app/api/admin/backups/restore-preview/route.ts:123:      clioWrite: false,
./app/api/documents/templates/route.ts:38:    clioRecordsChanged: false,
./app/api/documents/templates/route.ts:180:        "Read-only document-template repository endpoint.  It reads local Barsh Matters DocumentTemplate tables when records exist and falls back to seeded code-registry templates when the database repository is empty.  It does not edit templates, seed templates, generate documents, upload to Clio, create drafts, send email, print, or queue documents.",
./app/api/documents/finalization-history/route.ts:73:  const target = row?.clioUploadTarget && typeof row.clioUploadTarget === "object" ? row.clioUploadTarget : {};
./app/api/documents/finalization-history/route.ts:107:    clioUploadTarget: row?.clioUploadTarget || null,
./app/api/documents/finalization-history/route.ts:118:    const clioMatterId = parsePositiveInt(req.nextUrl.searchParams.get("clioMatterId"));
./app/api/documents/finalization-history/route.ts:119:    const clioDisplayNumber = clean(req.nextUrl.searchParams.get("clioDisplayNumber"));
./app/api/documents/finalization-history/route.ts:126:      clioMatterId ? String(clioMatterId) : "",
./app/api/documents/finalization-history/route.ts:127:      clioDisplayNumber,
./app/api/documents/finalization-history/route.ts:136:            "Missing lookup. Provide masterLawsuitId, matterId, matterDisplayNumber, clioMatterId, or clioDisplayNumber.",
./app/api/documents/finalization-history/route.ts:139:            noClioRecordsChanged: true,
./app/api/documents/finalization-history/route.ts:171:    if (clioMatterId) {
./app/api/documents/finalization-history/route.ts:172:      emailThreadOr.push({ clioMatterId });
./app/api/documents/finalization-history/route.ts:173:      emailMatterLinkOr.push({ clioMatterId });
./app/api/documents/finalization-history/route.ts:176:    if (clioDisplayNumber) {
./app/api/documents/finalization-history/route.ts:177:      finalizationOr.push({ masterDisplayNumber: clioDisplayNumber });
./app/api/documents/finalization-history/route.ts:178:      printQueueOr.push({ masterDisplayNumber: clioDisplayNumber });
./app/api/documents/finalization-history/route.ts:179:      emailThreadOr.push({ clioDisplayNumber });
./app/api/documents/finalization-history/route.ts:180:      emailMatterLinkOr.push({ clioDisplayNumber });
./app/api/documents/finalization-history/route.ts:232:      if (thread.clioMatterId) targetIds.add(String(thread.clioMatterId));
./app/api/documents/finalization-history/route.ts:233:      if (thread.clioDisplayNumber) targetIds.add(thread.clioDisplayNumber);
./app/api/documents/finalization-history/route.ts:244:      if (link.clioMatterId) targetIds.add(String(link.clioMatterId));
./app/api/documents/finalization-history/route.ts:245:      if (link.clioDisplayNumber) targetIds.add(link.clioDisplayNumber);
./app/api/documents/finalization-history/route.ts:251:    if (clioMatterId) targetIds.add(String(clioMatterId));
./app/api/documents/finalization-history/route.ts:252:    if (clioDisplayNumber) targetIds.add(clioDisplayNumber);
./app/api/documents/finalization-history/route.ts:290:      clioUploadTarget: toJsonSafe(row.clioUploadTarget),
./app/api/documents/finalization-history/route.ts:312:      clioDocumentId: safeString(row.clioDocumentId),
./app/api/documents/finalization-history/route.ts:313:      clioDocumentName: safeString(row.clioDocumentName),
./app/api/documents/finalization-history/route.ts:314:      clioDocumentVersionUuid: safeString(row.clioDocumentVersionUuid),
./app/api/documents/finalization-history/route.ts:342:      clioMatterId: thread.clioMatterId,
./app/api/documents/finalization-history/route.ts:343:      clioDisplayNumber: safeString(thread.clioDisplayNumber),
./app/api/documents/finalization-history/route.ts:344:      clioMaildropLabel: safeString(thread.clioMaildropLabel),
./app/api/documents/finalization-history/route.ts:384:      clioMatterId: link.clioMatterId,
./app/api/documents/finalization-history/route.ts:385:      clioDisplayNumber: safeString(link.clioDisplayNumber),
./app/api/documents/finalization-history/route.ts:405:      clioRecordsChanged: log.clioRecordsChanged,
./app/api/documents/finalization-history/route.ts:473:        clioMatterId,
./app/api/documents/finalization-history/route.ts:474:        clioDisplayNumber: clioDisplayNumber || null,
./app/api/documents/finalization-history/route.ts:504:        clioDocumentsTabRemainsSourceOfTruth: true,
./app/api/documents/finalization-history/route.ts:505:        noClioRecordsChanged: true,
./app/api/documents/finalization-history/route.ts:520:          noClioRecordsChanged: true,
./app/api/documents/clio-master-matter-confirm/route.ts:3:import { clioFetch } from "@/lib/clio";
./app/api/documents/clio-master-matter-confirm/route.ts:20:function buildClioMatterDescription(masterLawsuitId: string) {
./app/api/documents/clio-master-matter-confirm/route.ts:24:async function readClioMatterClient(matterId: number | string) {
./app/api/documents/clio-master-matter-confirm/route.ts:29:  const res = await clioFetch(
./app/api/documents/clio-master-matter-confirm/route.ts:45:      error: `Could not read Clio matter client: status ${res.status}; body ${bodyText || "(empty)"}`,
./app/api/documents/clio-master-matter-confirm/route.ts:58:      error: "Child Clio matter did not include a valid client id.",
./app/api/documents/clio-master-matter-confirm/route.ts:71:async function findClientFromChildClioMatters(rows: Array<{ matter_id: number | null; display_number?: string | null }>) {
./app/api/documents/clio-master-matter-confirm/route.ts:82:    const result = await readClioMatterClient(candidate.matterId);
./app/api/documents/clio-master-matter-confirm/route.ts:107:    error: "No child Clio matter with a readable client was found.",
./app/api/documents/clio-master-matter-confirm/route.ts:113:function normalizeClioDisplayNumber(value: unknown): string {
./app/api/documents/clio-master-matter-confirm/route.ts:122:  const previewUrl = new URL("/api/documents/clio-master-matter-preview", req.nextUrl.origin);
./app/api/documents/clio-master-matter-confirm/route.ts:135:    throw new Error(json?.error || "Could not load Clio master matter preview.");
./app/api/documents/clio-master-matter-confirm/route.ts:141:async function createClioMasterMatter(params: {
./app/api/documents/clio-master-matter-confirm/route.ts:148:  const res = await clioFetch(`/api/v4/matters.json?fields=${encodeURIComponent(fields)}`, {
./app/api/documents/clio-master-matter-confirm/route.ts:173:      `Failed to create Clio master matter: status ${res.status}; body ${bodyText || "(empty)"}`
./app/api/documents/clio-master-matter-confirm/route.ts:179:  const displayNumber = normalizeClioDisplayNumber(matter?.display_number);
./app/api/documents/clio-master-matter-confirm/route.ts:183:    throw new Error("Clio created matter response did not include a valid matter id.");
./app/api/documents/clio-master-matter-confirm/route.ts:187:    throw new Error("Clio created matter response did not include a display number / BRL number.");
./app/api/documents/clio-master-matter-confirm/route.ts:205:    const requiredConfirmation = `CREATE CLIO MASTER ${masterLawsuitId}`;
./app/api/documents/clio-master-matter-confirm/route.ts:211:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:215:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:216:          clioRecordsChanged: false,
./app/api/documents/clio-master-matter-confirm/route.ts:232:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:233:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:234:          clioRecordsChanged: false,
./app/api/documents/clio-master-matter-confirm/route.ts:242:    if (lawsuit.clioMasterMatterId || clean(lawsuit.clioMasterDisplayNumber)) {
./app/api/documents/clio-master-matter-confirm/route.ts:246:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:247:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:248:          clioRecordsChanged: false,
./app/api/documents/clio-master-matter-confirm/route.ts:251:            clioMasterMatterId: lawsuit.clioMasterMatterId,
./app/api/documents/clio-master-matter-confirm/route.ts:252:            clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber,
./app/api/documents/clio-master-matter-confirm/route.ts:253:            clioMasterMatterDescription: lawsuit.clioMasterMatterDescription,
./app/api/documents/clio-master-matter-confirm/route.ts:254:            clioMasterMappedAt: lawsuit.clioMasterMappedAt,
./app/api/documents/clio-master-matter-confirm/route.ts:257:            "This local master lawsuit already has a Clio master matter mapping.  Refusing to create a duplicate Clio master matter.",
./app/api/documents/clio-master-matter-confirm/route.ts:272:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:273:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:274:          clioRecordsChanged: false,
./app/api/documents/clio-master-matter-confirm/route.ts:277:          error: "Clio master matter creation is blocked by preview warnings.",
./app/api/documents/clio-master-matter-confirm/route.ts:293:    const childClient = await findClientFromChildClioMatters(claimIndexRows);
./app/api/documents/clio-master-matter-confirm/route.ts:299:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:300:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:301:          clioRecordsChanged: false,
./app/api/documents/clio-master-matter-confirm/route.ts:304:          error: childClient.error || "Could not derive Clio client from child matters.",
./app/api/documents/clio-master-matter-confirm/route.ts:310:    const description = buildClioMatterDescription(masterLawsuitId);
./app/api/documents/clio-master-matter-confirm/route.ts:311:    const created = await createClioMasterMatter({
./app/api/documents/clio-master-matter-confirm/route.ts:320:        clioMasterMatterId: created.matterId,
./app/api/documents/clio-master-matter-confirm/route.ts:321:        clioMasterDisplayNumber: created.displayNumber,
./app/api/documents/clio-master-matter-confirm/route.ts:322:        clioMasterMatterDescription: created.description || description,
./app/api/documents/clio-master-matter-confirm/route.ts:323:        clioMasterMappedAt: new Date(),
./app/api/documents/clio-master-matter-confirm/route.ts:324:        clioMasterMappingSource: "barsh-matters-clio-master-matter-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:330:      action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:331:      createsClioMatter: true,
./app/api/documents/clio-master-matter-confirm/route.ts:332:      clioRecordsChanged: true,
./app/api/documents/clio-master-matter-confirm/route.ts:339:      createdClioMatter: {
./app/api/documents/clio-master-matter-confirm/route.ts:346:        clioMasterMatterId: updatedLawsuit.clioMasterMatterId,
./app/api/documents/clio-master-matter-confirm/route.ts:347:        clioMasterDisplayNumber: updatedLawsuit.clioMasterDisplayNumber,
./app/api/documents/clio-master-matter-confirm/route.ts:348:        clioMasterMatterDescription: updatedLawsuit.clioMasterMatterDescription,
./app/api/documents/clio-master-matter-confirm/route.ts:349:        clioMasterMappedAt: updatedLawsuit.clioMasterMappedAt,
./app/api/documents/clio-master-matter-confirm/route.ts:350:        clioMasterMappingSource: updatedLawsuit.clioMasterMappingSource,
./app/api/documents/clio-master-matter-confirm/route.ts:353:        "Read the created Clio matter to identify its Maildrop field/address.",
./app/api/documents/clio-master-matter-confirm/route.ts:354:        "Use the mapped Clio matter for finalized master lawsuit document upload.",
./app/api/documents/clio-master-matter-confirm/route.ts:355:        "Use the mapped Clio matter documents as attachment sources for Microsoft Graph draft creation.",
./app/api/documents/clio-master-matter-confirm/route.ts:358:        "Created one Clio master matter and stored the mapping on the local Lawsuit row.  No documents were uploaded, downloaded, emailed, printed, or queued.",
./app/api/documents/clio-master-matter-confirm/route.ts:364:        action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:365:        createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:366:        error: error?.message || "Clio master matter create confirm failed.",
./scripts/verify-clio-maildrop-delivery-safety.mjs:28:const routePath = "app/api/documents/clio-maildrop-resolve/route.ts";
./scripts/verify-clio-maildrop-delivery-safety.mjs:40:console.log("=== CLIO MAILDROP DELIVERY SAFETY VERIFICATION ===");
./scripts/verify-clio-maildrop-delivery-safety.mjs:43:mustContain(routePath, route, 'action: "clio-maildrop-resolve"');
./scripts/verify-clio-maildrop-delivery-safety.mjs:60:mustContain(helperPath, helper, "clioMaildropLabel?: string");
./scripts/verify-clio-maildrop-delivery-safety.mjs:62:mustContain(helperPath, helper, "formatEmailRecipient(context.clioMaildropLabel, context.clioMaildropEmail)");
./scripts/verify-clio-maildrop-delivery-safety.mjs:66:mustContain(directPath, direct, "clioMaildropEmail: json.maildropEmail");
./scripts/verify-clio-maildrop-delivery-safety.mjs:67:mustContain(directPath, direct, "clioMaildropLabel: json.maildropLabel");
./scripts/verify-clio-maildrop-delivery-safety.mjs:71:mustContain(masterPath, master, "clioMaildropEmail: json.maildropEmail");
./scripts/verify-clio-maildrop-delivery-safety.mjs:72:mustContain(masterPath, master, "clioMaildropLabel: json.maildropLabel");
./scripts/verify-clio-maildrop-delivery-safety.mjs:74:if (packageJson.includes('"verify:clio-maildrop-delivery-safety"')) {
./scripts/verify-clio-maildrop-delivery-safety.mjs:81:  console.error(`=== CLIO MAILDROP DELIVERY SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-clio-maildrop-delivery-safety.mjs:85:console.log("=== CLIO MAILDROP DELIVERY SAFETY PASSED ===");
./scripts/verify-settlement-document-popup-copy-simplified.mjs:34:  "stale Step 3 Clio upload copy",
./scripts/verify-settlement-document-popup-copy-simplified.mjs:35:  "Master/Lawsuit final upload to Clio is now handled in Step 3."
./app/api/admin/backups/archive-error-log/route.ts:97:      clioWrite: false,
./app/api/admin/clients/[id]/invoice/create-preview/route.ts:387:      safety: "Read-only invoice create preview. Ordinary mode excludes MatterPaymentReceipt rows already assigned to an invoiceId and cost-expended rows already frozen into finalized non-voided invoice lines. Admin include-already-invoiced mode is diagnostic only for MatterPaymentReceipt rows. This route does not create invoices, update MatterPaymentReceipt.invoiceId, write remittances, generate documents, send email, print, queue, update ClaimIndex, mutate Clio, or write any database rows.",
./app/api/documents/templates/detail/route.ts:126:    clioWrites: false,
./app/api/documents/templates/detail/route.ts:198:        "Read-only template detail endpoint.  It reads one template, its versions, and merge fields.  It does not edit templates, upload files, generate documents, write Clio, create drafts, send email, print, or queue documents.",
./app/api/documents/direct-finalize-preview/route.ts:3:import { clioFetch } from "@/lib/clio";
./app/api/documents/direct-finalize-preview/route.ts:5:  listClioMatterDocuments,
./app/api/documents/direct-finalize-preview/route.ts:6:} from "@/lib/clioDocumentUpload";
./app/api/documents/direct-finalize-preview/route.ts:28:async function readClioJson(res: Response, fallback: string): Promise<any> {
./app/api/documents/direct-finalize-preview/route.ts:47:async function resolveClioMatterByDisplayNumber(displayNumberInput: string) {
./app/api/documents/direct-finalize-preview/route.ts:54:      clioMatterId: null,
./app/api/documents/direct-finalize-preview/route.ts:55:      clioDisplayNumber: "",
./app/api/documents/direct-finalize-preview/route.ts:56:      error: "Missing Clio display number.",
./app/api/documents/direct-finalize-preview/route.ts:65:  const res = await clioFetch(`/matters.json?${params.toString()}`);
./app/api/documents/direct-finalize-preview/route.ts:66:  const json = await readClioJson(res, `Clio matter lookup failed for ${displayNumber}`);
./app/api/documents/direct-finalize-preview/route.ts:81:      clioMatterId: null,
./app/api/documents/direct-finalize-preview/route.ts:82:      clioDisplayNumber: "",
./app/api/documents/direct-finalize-preview/route.ts:83:      error: `Could not resolve Clio matter id for ${displayNumber}.`,
./app/api/documents/direct-finalize-preview/route.ts:90:    clioMatterId: exact.id,
./app/api/documents/direct-finalize-preview/route.ts:91:    clioDisplayNumber: exact.displayNumber,
./app/api/documents/direct-finalize-preview/route.ts:167:        wouldUploadToClio: canGenerate,
./app/api/documents/direct-finalize-preview/route.ts:247:    const clioResolution = await resolveClioMatterByDisplayNumber(resolvedDisplay);
./app/api/documents/direct-finalize-preview/route.ts:255:    if (!clioResolution.ok || !clioResolution.clioMatterId) {
./app/api/documents/direct-finalize-preview/route.ts:256:      validation.blockingErrors.push(clioResolution.error || "Could not resolve direct matter Clio upload target.");
./app/api/documents/direct-finalize-preview/route.ts:260:    const canGenerate = Boolean(validation.canGenerate && clioResolution.clioMatterId);
./app/api/documents/direct-finalize-preview/route.ts:269:    let existingClioDocuments: any[] = [];
./app/api/documents/direct-finalize-preview/route.ts:272:    if (canGenerate && clioResolution.clioMatterId) {
./app/api/documents/direct-finalize-preview/route.ts:274:        existingClioDocuments = await listClioMatterDocuments(Number(clioResolution.clioMatterId));
./app/api/documents/direct-finalize-preview/route.ts:276:        existingDocumentLookupError = err?.message || "Could not check existing Clio documents.";
./app/api/documents/direct-finalize-preview/route.ts:281:      existingClioDocuments.map((doc: any) => clean(doc?.name || doc?.filename).toLowerCase()).filter(Boolean)
./app/api/documents/direct-finalize-preview/route.ts:289:        alreadyExistsInClio: alreadyExists,
./app/api/documents/direct-finalize-preview/route.ts:290:        wouldUploadToClio: Boolean(doc.wouldUploadToClio && !alreadyExists),
./app/api/documents/direct-finalize-preview/route.ts:301:      clioUploadTarget: {
./app/api/documents/direct-finalize-preview/route.ts:303:        matterId: clioResolution.clioMatterId,
./app/api/documents/direct-finalize-preview/route.ts:304:        displayNumber: clioResolution.clioDisplayNumber || resolvedDisplay,
./app/api/documents/direct-finalize-preview/route.ts:306:        wouldUploadToClio: Boolean(canGenerate),
./app/api/documents/direct-finalize-preview/route.ts:322:      existingClioDocuments: {
./app/api/documents/direct-finalize-preview/route.ts:323:        count: existingClioDocuments.length,
./app/api/documents/direct-finalize-preview/route.ts:330:        clioRecordsChanged: false,
./app/api/documents/direct-finalize-preview/route.ts:336:      note: "Direct matter finalization preview mirrors the lawsuit document workflow using the direct matter packet and direct matter Clio Documents tab.",
./scripts/verify-admin-audit-history-page-and-menu.mjs:16:  ["admin audit page says no Clio writes", page.includes("does not write Clio")],
./app/api/documents/clio-master-crossref-preview/route.ts:3:import { clioFetch } from "@/lib/clio";
./app/api/documents/clio-master-crossref-preview/route.ts:4:import { MATTER_CF } from "@/lib/clioFields";
./app/api/documents/clio-master-crossref-preview/route.ts:51:async function readClioMatter(matterId: number) {
./app/api/documents/clio-master-crossref-preview/route.ts:60:  const res = await clioFetch(
./app/api/documents/clio-master-crossref-preview/route.ts:74:    throw new Error(`Could not read Clio matter ${matterId}: status ${res.status}; body ${bodyText || "(empty)"}`);
./app/api/documents/clio-master-crossref-preview/route.ts:95:    blockingReason: existing?.id ? "" : `${params.fieldLabel} custom field value record does not exist on this Clio matter.`,
./app/api/documents/clio-master-crossref-preview/route.ts:112:          action: "clio-master-crossref-preview",
./app/api/documents/clio-master-crossref-preview/route.ts:114:          clioRecordsChanged: false,
./app/api/documents/clio-master-crossref-preview/route.ts:136:        : clean(row.display_number) !== clean(lawsuit.clioMasterDisplayNumber)
./app/api/documents/clio-master-crossref-preview/route.ts:139:    const masterMatterId = numberOrNull(lawsuit.clioMasterMatterId);
./app/api/documents/clio-master-crossref-preview/route.ts:154:    const masterLawsuitDisplayValue = clean(lawsuit.clioMasterDisplayNumber)
./app/api/documents/clio-master-crossref-preview/route.ts:155:      ? `${masterLawsuitId} / ${clean(lawsuit.clioMasterDisplayNumber)}`
./app/api/documents/clio-master-crossref-preview/route.ts:161:      blockingWarnings.push("No local Clio master matter mapping exists on the Lawsuit row.");
./app/api/documents/clio-master-crossref-preview/route.ts:165:      blockingWarnings.push("No target Clio matters were found for cross-reference preview.");
./app/api/documents/clio-master-crossref-preview/route.ts:176:        const matter = await readClioMatter(matterId);
./app/api/documents/clio-master-crossref-preview/route.ts:207:          isMasterClioMatter: matterId === masterMatterId,
./app/api/documents/clio-master-crossref-preview/route.ts:218:          error: error?.message || "Could not read target Clio matter.",
./app/api/documents/clio-master-crossref-preview/route.ts:229:      action: "clio-master-crossref-preview",
./app/api/documents/clio-master-crossref-preview/route.ts:231:      clioRecordsChanged: false,
./app/api/documents/clio-master-crossref-preview/route.ts:235:        clioMasterMatterId: lawsuit.clioMasterMatterId || null,
./app/api/documents/clio-master-crossref-preview/route.ts:236:        clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber || null,
./app/api/documents/clio-master-crossref-preview/route.ts:237:        clioMasterMatterDescription: lawsuit.clioMasterMatterDescription || null,
./app/api/documents/clio-master-crossref-preview/route.ts:256:        typedConfirmationRequired: `WRITE CLIO CROSSREF ${masterLawsuitId}`,
./app/api/documents/clio-master-crossref-preview/route.ts:265:        "Preview only.  This route plans Clio cross-reference custom-field updates for child and master Clio matters.  It does not write to Clio or Barsh Matters.",
./app/api/documents/clio-master-crossref-preview/route.ts:271:        action: "clio-master-crossref-preview",
./app/api/documents/clio-master-crossref-preview/route.ts:273:        clioRecordsChanged: false,
./app/api/documents/clio-master-crossref-preview/route.ts:275:        error: error?.message || "Clio master cross-reference preview failed.",
./app/api/admin/clients/[id]/invoice/route.ts:45:      safety: "Read-only provider/client invoice history. This route does not create, finalize, void, remit, print, email, queue, mutate source payment rows, update ClaimIndex, or mutate Clio.",
./app/api/documents/templates/import-preview/route.ts:46:        "Preview-only document template import. It validates template rows and existing keys but does not write DocumentTemplate, DocumentTemplateVersion, DocumentTemplateMergeField, Clio, documents, print queue, drafts, or email.",
./app/api/documents/working-docx/route.ts:138:            clioRecordsChanged: false,
./app/api/documents/working-docx/route.ts:231:            clioRecordsChanged: false,
./app/api/documents/working-docx/route.ts:295:        clioRecordsChanged: false,
./app/api/documents/working-docx/route.ts:313:          clioRecordsChanged: false,
./scripts/verify-standard-xls-export-columns-safety.mjs:30:check("if export code is present it avoids Clio writes", !all.includes("method: \"PATCH\"") && !all.includes("clioFetch("));
./app/api/admin/clients/[id]/route.ts:304:  return clean(row.matterId || row.matter_id || row.claimIndexMatterId || row.claimIndexId || row.clioMatterId || row.displayNumber || row.display_number);
./app/api/admin/clients/[id]/route.ts:576:        noClioRecordsChanged: true,
./app/api/admin/clients/[id]/route.ts:592:        noClioRecordsChanged: true,
./app/api/admin/clients/[id]/route.ts:688:            row.clioMatterId,
./app/api/admin/clients/[id]/route.ts:689:            row.clio_matter_id,
./app/api/admin/clients/[id]/route.ts:722:        claim.clioMatterId,
./app/api/admin/clients/[id]/route.ts:723:        claim.clio_matter_id,
./app/api/admin/clients/[id]/route.ts:822:          ...splitMetadataList(options.indexAaaNumberClioMatterIds),
./app/api/admin/clients/[id]/route.ts:823:          ...splitMetadataList(options.index_aaa_number_clio_matter_ids),
./app/api/admin/clients/[id]/route.ts:824:          ...splitMetadataList(options.lawsuitMatterDisplayNumbersWrittenToClio),
./app/api/admin/clients/[id]/route.ts:825:          ...splitMetadataList(options.lawsuit_matter_display_numbers_written_to_clio),
./app/api/admin/clients/[id]/route.ts:941:        "Read-only Admin Client detail/remittance preview. This route reads local tables only. It does not call Clio, write payments, edit ClaimIndex, generate documents, send email, print, queue, or export files.",
./app/api/admin/users/permission-override/route.ts:300:        note: "Preview only. No AdminUserPermissionOverride row, role row, enforcement setting, Clio record, document, email, or print queue item was changed.",
./scripts/verify-court-calendar-route-safety.mjs:23:  "clioRecordsChanged: false",
./scripts/verify-court-calendar-route-safety.mjs:44:  "clioApi",
./scripts/verify-clio-master-matter-confirm-safety.mjs:28:const routePath = "app/api/documents/clio-master-matter-confirm/route.ts";
./scripts/verify-clio-master-matter-confirm-safety.mjs:34:console.log("=== CLIO MASTER MATTER CONFIRM SAFETY VERIFICATION ===");
./scripts/verify-clio-master-matter-confirm-safety.mjs:37:mustContain(routePath, route, 'action: "clio-master-matter-create-confirm"');
./scripts/verify-clio-master-matter-confirm-safety.mjs:39:mustContain(routePath, route, "CREATE CLIO MASTER");
./scripts/verify-clio-master-matter-confirm-safety.mjs:42:mustContain(routePath, route, "Refusing to create a duplicate Clio master matter");
./scripts/verify-clio-master-matter-confirm-safety.mjs:43:mustContain(routePath, route, "clioFetch(`/api/v4/matters.json");
./scripts/verify-clio-master-matter-confirm-safety.mjs:44:mustContain(routePath, route, "findClientFromChildClioMatters");
./scripts/verify-clio-master-matter-confirm-safety.mjs:49:mustContain(routePath, route, "clioMasterMatterId: created.matterId");
./scripts/verify-clio-master-matter-confirm-safety.mjs:50:mustContain(routePath, route, "clioMasterDisplayNumber: created.displayNumber");
./scripts/verify-clio-master-matter-confirm-safety.mjs:51:mustContain(routePath, route, "clioMasterMatterDescription");
./scripts/verify-clio-master-matter-confirm-safety.mjs:52:mustContain(routePath, route, "clioMasterMappedAt: new Date()");
./scripts/verify-clio-master-matter-confirm-safety.mjs:53:mustContain(routePath, route, "clioRecordsChanged: true");
./scripts/verify-clio-master-matter-confirm-safety.mjs:61:mustNotContain(routePath, route, "uploadBufferToClioMatterDocuments");
./scripts/verify-clio-master-matter-confirm-safety.mjs:68:if (packageJson.includes('"verify:clio-master-matter-confirm-safety"')) {
./scripts/verify-clio-master-matter-confirm-safety.mjs:75:  console.error(`=== CLIO MASTER MATTER CONFIRM SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-clio-master-matter-confirm-safety.mjs:79:console.log("=== CLIO MASTER MATTER CONFIRM SAFETY PASSED ===");
./scripts/verify-clio-document-list-ui-safety.mjs:14:check("Direct Matter keeps Clio document state", direct.includes("matterClioDocumentsLoading") && direct.includes("matterClioDocumentsResult"));
./scripts/verify-clio-document-list-ui-safety.mjs:15:check("Direct Matter keeps read-only document loader", direct.includes("loadMatterClioDocuments") && direct.includes("/api/documents/clio-matter-documents?matterId="));
./scripts/verify-clio-document-list-ui-safety.mjs:18:check("Master keeps Clio document state", master.includes("masterClioDocumentsLoading") && master.includes("masterClioDocumentsResult"));
./scripts/verify-clio-document-list-ui-safety.mjs:19:check("Master keeps read-only document loader", master.includes("loadMasterClioDocuments") && master.includes("/api/documents/clio-matter-documents?masterLawsuitId="));
./scripts/verify-clio-document-list-ui-safety.mjs:22:check("UI only uses GET document-list fetches", !direct.includes("clio-matter-documents\", { method: \"POST\"") && !master.includes("clio-matter-documents\", { method: \"POST\""));
./scripts/verify-clio-document-list-ui-safety.mjs:25:  console.error(`FAIL: ${failures} Clio document list UI safety check(s) failed.`);
./scripts/verify-clio-document-list-ui-safety.mjs:28:console.log("PASS: Clio document list UI safety passed. The Golden Rule allows Clio document listing/viewing/retrieval.");
./app/api/admin/clients/[id]/invoice/cost-ledger/route.ts:266:      safety: "Read-only provider/client invoice cost ledger. It shows cost-expended rows, cost-received rows, invoice status, and eligibility. It does not create, finalize, update, void, remit, print, email, queue, mutate source payment/cost rows, update ClaimIndex, or mutate Clio.",
./scripts/verify-admin-document-template-repository-page.mjs:15:  ["no Clio writes", page.includes("write Clio data") && !page.includes("/api/clio")],
./app/api/admin/clients/route.ts:171:        "Read-only Admin Clients list. This route reads local reference data only. It does not call Clio, write payments, generate documents, send email, print, or queue anything.",
./scripts/verify-admin-backup-prisma-model-archive-coverage.mjs:98:  pullsDocumentsFromClio: false,
./scripts/verify-admin-backup-prisma-model-archive-coverage.mjs:99:  documentVault: "Clio",
./scripts/verify-monitored-backup-email-alert-safety.mjs:56:  'clioFetch',
./scripts/verify-monitored-backup-email-alert-safety.mjs:57:  '@/lib/clio',
./scripts/verify-monitored-backup-email-alert-safety.mjs:93:console.log('PASS: Monitored backup wrapper supports multiple alert recipients without restore/delete/Clio/document/print behavior.');
./scripts/verify-admin-scheduled-backup-health-safety.mjs:21:  'clioWrite: false',
./scripts/verify-admin-scheduled-backup-health-safety.mjs:36:  'It does not delete backups, execute restores, call Clio, send email, generate documents, or change the print queue.',
./scripts/verify-admin-scheduled-backup-health-safety.mjs:86:console.log('PASS: Scheduled backup health is read-only and has no restore/deletion/Clio/email/document/print behavior.');
./app/api/admin/users/create/route.ts:213:        note: "Preview only. No AdminUser row, role assignment, permission override, enforcement setting, Clio record, document, email, or print queue item was changed.",
./scripts/verify-dedicated-mac-backup-readiness.mjs:62:console.log("CLIO_CALLS=NO");
./scripts/verify-dedicated-mac-backup-readiness.mjs:154:      ["documentFilePolicy.pullsDocumentsFromClio", manifest.documentFilePolicy?.pullsDocumentsFromClio, false],
./scripts/verify-dedicated-mac-backup-readiness.mjs:155:      ["documentFilePolicy.documentVault", manifest.documentFilePolicy?.documentVault, "Clio"],
./scripts/verify-packet-clio-master-mapping-safety.mjs:8:    label: "packet route selects Clio master mapping fields from Lawsuit",
./scripts/verify-packet-clio-master-mapping-safety.mjs:10:      route.includes("clioMasterMatterId: true") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:11:      route.includes("clioMasterDisplayNumber: true") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:12:      route.includes("clioMasterMatterDescription: true") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:13:      route.includes("clioMasterMappingSource: true"),
./scripts/verify-packet-clio-master-mapping-safety.mjs:16:    label: "packet route uses Lawsuit Clio mapping for masterMatter",
./scripts/verify-packet-clio-master-mapping-safety.mjs:18:      route.includes("matterId: lawsuit.clioMasterMatterId") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:19:      route.includes("displayNumber: lawsuit.clioMasterDisplayNumber") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:20:      route.includes('source: "lawsuit.clio-master-mapping"'),
./scripts/verify-packet-clio-master-mapping-safety.mjs:29:    label: "packet route exposes Clio mapping on returned lawsuit object",
./scripts/verify-packet-clio-master-mapping-safety.mjs:31:      route.includes("clioMasterMatterId: lawsuit.clioMasterMatterId") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:32:      route.includes("clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber"),
./scripts/verify-packet-clio-master-mapping-safety.mjs:35:    label: "packet route allows generation with mapped Clio master matter even without ClaimIndex master row",
./scripts/verify-packet-clio-master-mapping-safety.mjs:37:      route.includes("const hasMappedClioMasterMatter") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:38:      route.includes("masterRows.length === 0 && !hasMappedClioMasterMatter") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:39:      route.includes("hasMappedClioMasterMatter,") &&
./scripts/verify-packet-clio-master-mapping-safety.mjs:55:  console.error(`\nFAIL: ${failed} packet Clio master mapping safety check(s) failed.`);
./scripts/verify-packet-clio-master-mapping-safety.mjs:59:console.log("\nPASS: packet route returns mapped Clio master matter and allows document generation from that mapping.");
./scripts/verify-claim-index-regular-search-lawsuit-metadata-safety.mjs:53:  mustNotContain(`${routePath} must not call Clio`, route, "clioFetch");
./scripts/verify-email-automation-status-safety.mjs:39:assertIncludes(route, "writesClio: false", "Clio write safety flag");
./scripts/verify-email-automation-status-safety.mjs:44:assertIncludes(route, "callsClio: false", "Clio call safety flag");
./scripts/verify-email-automation-status-safety.mjs:51:  "clioApi",
./scripts/verify-email-automation-status-safety.mjs:52:  "getClio",
./scripts/verify-email-automation-status-safety.mjs:53:  "fetchClio",
./scripts/verify-email-automation-status-safety.mjs:54:  "updateClio",
./scripts/verify-email-automation-status-safety.mjs:55:  "writeClio",
./scripts/verify-guarded-clio-close-sync-safety.mjs:23:console.log("=== VERIFY GUARDED CLIO CLOSE SYNC SAFETY ===");
./scripts/verify-guarded-clio-close-sync-safety.mjs:25:const helper = read("lib/clioCloseSync.ts");
./scripts/verify-guarded-clio-close-sync-safety.mjs:31:mustContain("helper", helper, "export async function syncClioMatterClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:32:mustContain("helper", helper, "export async function syncClioMattersClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:38:mustNotContain("helper", helper, "ingestMattersFromClioBatch");
./scripts/verify-guarded-clio-close-sync-safety.mjs:39:mustNotContain("helper", helper, "legacyClioOperationalRouteBlocked");
./scripts/verify-guarded-clio-close-sync-safety.mjs:42:mustContain("matter close route", matterClose, 'import { syncClioMatterClosed } from "@/lib/clioCloseSync";');
./scripts/verify-guarded-clio-close-sync-safety.mjs:43:mustContain("matter close route", matterClose, "const clioCloseSync = await syncClioMatterClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:46:mustContain("matter close route", matterClose, "clioCloseSyncAttempted: true");
./scripts/verify-guarded-clio-close-sync-safety.mjs:47:mustContain("matter close route", matterClose, "clioClosed: true");
./scripts/verify-guarded-clio-close-sync-safety.mjs:51:mustContain("matter close route stores JSON-safe Clio audit summary", matterClose, "clioCloseSyncAuditSummary(clioCloseSync)");
./scripts/verify-guarded-clio-close-sync-safety.mjs:52:mustNotContain("matter close route", matterClose, "legacyClioOperationalRouteBlocked");
./scripts/verify-guarded-clio-close-sync-safety.mjs:54:mustNotContain("matter close route", matterClose, "ingestMattersFromClioBatch");
./scripts/verify-guarded-clio-close-sync-safety.mjs:56:mustContain("lawsuit close route", lawsuitClose, 'import { syncClioMattersClosed } from "@/lib/clioCloseSync";');
./scripts/verify-guarded-clio-close-sync-safety.mjs:57:mustContain("lawsuit close route", lawsuitClose, "const clioCloseSync = await syncClioMattersClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:58:mustContain("lawsuit close route", lawsuitClose, "No Clio matter IDs were available");
./scripts/verify-guarded-clio-close-sync-safety.mjs:61:mustContain("lawsuit close route", lawsuitClose, "clioCloseSyncAttempted: true");
./scripts/verify-guarded-clio-close-sync-safety.mjs:62:mustContain("lawsuit close route", lawsuitClose, "clioClosed: true");
./scripts/verify-guarded-clio-close-sync-safety.mjs:66:mustContain("lawsuit close route stores JSON-safe Clio audit summary", lawsuitClose, "clioCloseSyncAuditSummary(clioCloseSync)");
./scripts/verify-guarded-clio-close-sync-safety.mjs:69:mustNotContain("lawsuit close route", lawsuitClose, "legacyClioOperationalRouteBlocked");
./scripts/verify-guarded-clio-close-sync-safety.mjs:71:mustNotContain("lawsuit close route", lawsuitClose, "ingestMattersFromClioBatch");
./scripts/verify-guarded-clio-close-sync-safety.mjs:73:mustContain("settlement close shortcut remains blocked", settlementClose, "legacyClioOperationalRouteBlocked");
./scripts/verify-guarded-clio-close-sync-safety.mjs:74:mustNotContain("settlement close shortcut remains blocked", settlementClose, "syncClioMatterClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:75:mustNotContain("settlement close shortcut remains blocked", settlementClose, "syncClioMattersClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:77:mustContain("package.json", packageJson, "verify:guarded-clio-close-sync-safety");
./scripts/verify-guarded-clio-close-sync-safety.mjs:80:  console.error(`=== GUARDED CLIO CLOSE SYNC SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-guarded-clio-close-sync-safety.mjs:84:console.log("=== GUARDED CLIO CLOSE SYNC SAFETY PASSED ===");
./scripts/verify-guarded-clio-close-sync-safety.mjs:85:console.log("Golden Rule: close workflows now perform guarded Clio operational close-status sync; settlement shortcut remains blocked.");
./scripts/verify-local-search-and-lawsuits-routing-safety.mjs:13:assert(!home.includes("clioFetch("), "home search must not call Clio.");
./scripts/verify-local-search-and-lawsuits-routing-safety.mjs:14:assert(!lawsuits.includes("clioFetch("), "lawsuits page must not call Clio.");
./scripts/verify-local-search-and-lawsuits-routing-safety.mjs:19:console.log("WRITES_CLIO=false");
./scripts/verify-admin-backup-comparison-preview-safety.mjs:14:  'This comparison does not restore data, delete backups, run retention cleanup, call Clio, send email, generate documents, or change the print queue.',
./scripts/verify-admin-backup-comparison-preview-safety.mjs:69:console.log('PASS: Backup comparison preview is read-only with URL-backed state and no restore/delete/Clio/email/document/print behavior.');
./scripts/verify-settlement-provider-fee-defaults-local-ui-safety.mjs:22:check("route reports no Clio change", route.includes("clioRecordsChanged: false"));
./scripts/verify-settlement-provider-fee-defaults-local-ui-safety.mjs:24:check("route avoids Clio reads/writes", !route.includes("clioFetch(") && !route.includes("writeSettlementToClio"));
./app/api/admin/users/planning/route.ts:21:    note: "Read-only Phase 2 planning surface. This endpoint reads DB-backed admin user/role tables for preview only. It does not create users, edit roles, assign permissions, write database records, write Clio, or enable enforcement.",
./scripts/verify-settlement-summary-docx-safety.mjs:57:console.log("=== VERIFY NO CLIO / DATABASE / FILE / PRINT QUEUE MUTATION ===");
./scripts/verify-settlement-summary-docx-safety.mjs:58:mustContain("settlement summary route", settlementSummaryRoute, "noClioRecordsChanged: true");
./scripts/verify-settlement-summary-docx-safety.mjs:63:mustNotContain("settlement summary route", settlementSummaryRoute, "clioFetch(");
./scripts/verify-settlement-summary-docx-safety.mjs:64:mustNotContain("settlement summary route", settlementSummaryRoute, "uploadBufferToClioMatterDocuments");
./scripts/verify-settlement-summary-docx-safety.mjs:65:mustNotContain("settlement summary route", settlementSummaryRoute, "listClioMatterDocuments");
./scripts/verify-settlement-summary-docx-safety.mjs:100:mustNotContain("settlement documents preview route", previewRoute, "live-clio-read");
./scripts/verify-settlement-summary-docx-safety.mjs:101:mustNotContain("settlement documents preview route", previewRoute, "clioFetch(");
./scripts/verify-settlement-summary-docx-safety.mjs:117:console.log("No Clio records were changed by this verifier.");
./scripts/verify-index-backup-safety.mjs:41:if (/from\s+['"][^'"]*clio|\/api\/clio|custom_field_values|matter-context/u.test(backupScript)) {
./scripts/verify-index-backup-safety.mjs:42:  failures.push('backup script appears to contain Clio operational dependency');
./scripts/verify-index-backup-safety.mjs:77:if (!backupScript.includes('PULLS_DOCUMENTS_FROM_CLIO=NO')) {
./scripts/verify-index-backup-safety.mjs:78:  failures.push('backup script missing no-Clio-document-pull policy');
./scripts/verify-index-backup-safety.mjs:110:  'does not pull document files from Clio',
./app/api/admin/clients/[id]/invoice/[invoiceId]/finalize/route.ts:191:            noClioRecordsChanged: true,
./app/api/admin/clients/[id]/invoice/[invoiceId]/finalize/route.ts:210:      safety: "Finalized a local invoice only. This route marks included MatterPaymentReceipt rows with invoiceId, treating null and empty invoiceId as unmarked, but does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records.",
./scripts/verify-graph-token-foundation-safety.mjs:77:mustContain(tokenRoutePath, tokenRoute, "clioRecordsChanged: false");
./scripts/verify-graph-token-foundation-safety.mjs:85:mustNotContain(tokenRoutePath, tokenRoute, "clioFetch(");
./app/api/admin/claim-index/audit/route.ts:205:          clioMasterMatterId: true,
./app/api/admin/claim-index/audit/route.ts:206:          clioMasterDisplayNumber: true,
./app/api/admin/claim-index/audit/route.ts:525:        "Read-only Admin ClaimIndex data-quality audit. This route only reads prisma.claimIndex and prisma.lawsuit. It does not update ClaimIndex, restore data, call Clio, generate documents, send email, print, queue, or write the database.",
./scripts/verify-adversary-attorney-lawsuit-search-export-safety.mjs:71:mustContain("search-grouped remains no Clio hydration", grouped, "noClioHydration: true");
./scripts/verify-adversary-attorney-lawsuit-search-export-safety.mjs:72:mustNotContain("search-grouped must not call Clio fetch", grouped, "clioFetch");
./scripts/verify-adversary-attorney-lawsuit-search-export-safety.mjs:73:mustNotContain("search-grouped must not call Clio token", grouped, "getValidClioAccessToken");
./scripts/backup-local-indexes.mjs:346:      pullsDocumentsFromClio: false,
./scripts/backup-local-indexes.mjs:347:      documentVault: 'Clio',
./scripts/backup-local-indexes.mjs:351:    note: 'Local PostgreSQL database/index backup. Clio is not queried. pg_dump captures database tables, data, schema objects, and indexes. Actual document folders are not crawled or copied. PostgreSQL large objects are excluded.',
./scripts/backup-local-indexes.mjs:496:  console.log('PULLS_DOCUMENTS_FROM_CLIO=NO');
./scripts/backup-local-indexes.mjs:497:  console.log('DOCUMENT_VAULT=Clio');
./scripts/verify-local-lawsuit-generation-preview-safety.mjs:4:const createShellVerifier = fs.readFileSync("scripts/verify-create-lawsuit-clio-shell-contract.mjs", "utf8");
./scripts/verify-local-lawsuit-generation-preview-safety.mjs:22:assert(pkg.includes("verify:create-lawsuit-clio-shell-contract"), "modern Create Lawsuit Clio shell verifier must remain registered.");
./scripts/verify-local-lawsuit-generation-preview-safety.mjs:23:assert(createShellVerifier.includes("Clio") || createShellVerifier.includes("clio"), "Create Lawsuit shell contract should cover Clio shell assignment.");
./scripts/verify-local-lawsuit-generation-preview-safety.mjs:38:console.log("GOLDEN_RULE=Clio owns lawsuit shell numbers/IDs; Barsh Matters owns workflow and local grouping.");
./scripts/verify-local-lawsuit-generation-preview-safety.mjs:40:console.log("MODERN_LAWSUIT_GENERATION=CREATE_LAWSUIT_WORKFLOW_WITH_CLIO_SHELL");
./scripts/verify-local-lawsuit-generation-preview-safety.mjs:41:console.log("PASS: local lawsuit generation preview safety delegated to modern Create Lawsuit Clio shell contract.");
./app/api/admin/users/assign-role/route.ts:339:        note: "Preview only. No AdminUserRole row, permission override, enforcement setting, Clio record, document, email, or print queue item was changed.",
./app/api/admin/clients/[id]/invoice/[invoiceId]/route.ts:95:      safety: "Read-only invoice detail. This route does not create, finalize, update, void, remit, print, email, queue, mutate source payment rows, update ClaimIndex, or mutate Clio.",
./scripts/verify-local-first-settlement-preview-safety.mjs:80:  "clioRecordsChanged: false",
./scripts/verify-local-first-settlement-preview-safety.mjs:89:  "clioFetch(",
./scripts/verify-local-first-settlement-preview-safety.mjs:90:  "previewSettlementWritebackToClio",
./scripts/verify-local-first-settlement-preview-safety.mjs:91:  "writeSettlementToClio",
./app/api/admin/claim-index/search/route.ts:212:        "Read-only Admin ClaimIndex search. This route only reads prisma.claimIndex and does not update ClaimIndex, restore data, call Clio, generate documents, send email, print, queue, or write the database.",
./scripts/verify-template-docx-db-storage-safety.mjs:78:console.log("PASS: template DOCX DB storage captures DOCX base64 locally without Clio, Graph, email, print, or queue side effects.");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:24:mustContain("confirm route imports clioFetch", route, 'import { clioFetch } from "@/lib/clio";');
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:28:mustContain("confirm route limits Clio shell mapping source", route, "barsh-matters-create-lawsuit-confirm");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:29:mustContain("confirm route requires deleteClioShell when shell exists", route, "deleteClioShell=true is required");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:30:mustContain("confirm route deletes Clio matter shell endpoint", route, "/api/v4/matters/");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:35:mustContain("confirm route audits no child Clio deletion", route, "noChildClioMatterDeletion: true");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:36:mustContain("confirm route reports child Clio matters not deleted", route, "deletedChildClioMatters: false");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:38:mustContain("confirm route reports Clio delete status", route, "clioDeleteResult");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:41:mustNotContain("confirm route must not delete Clio by child display number", route, "display_number).json");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:42:mustNotContain("confirm route must not delete Clio from child rows", route, "deleteMappedClioShell(row");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:43:mustNotContain("confirm route must not delete Clio from child matter id", route, "deleteMappedClioShell(child");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:44:mustNotContain("confirm route must not delete all Clio matters", route, "/api/v4/matters.json");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:45:mustNotContain("confirm route must not upload documents", route, "clioDocumentUpload");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:52:mustContain("preview route still reports no Clio writes", previewRoute, "writesClio: false");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:53:mustContain("preview route still reports no Clio deletes", previewRoute, "deletesClio: false");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:58:mustContain("page always requests Clio shell deletion", page, "deleteClioShell: true");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:59:mustContain("page says child Clio matters are not deleted", page, "It will not delete child/bill Clio matters");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:68:console.log("EXPECTS_CLIO_MASTER_SHELL_ONLY=YES");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:69:console.log("EXPECTS_NO_CHILD_CLIO_DELETE=YES");
./scripts/verify-graph-create-draft-safety.mjs:56:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-graph-create-draft-safety.mjs:60:mustContain(routePath, route, "clioMaildropEmail");
./scripts/verify-graph-create-draft-safety.mjs:62:mustContain(routePath, route, "context.clioMaildropEmail");
./scripts/verify-graph-create-draft-safety.mjs:63:mustContain(routePath, route, "email: context.clioMaildropEmail");
./scripts/verify-graph-create-draft-safety.mjs:70:// Rule 1 allowed Clio scope in this route: finalized document retrieval/listing and MailDrop context only.
./scripts/verify-graph-create-draft-safety.mjs:71:mustContain(routePath, route, "clioFetch");
./scripts/verify-graph-create-draft-safety.mjs:72:mustContain(routePath, route, "listClioMatterDocuments");
./scripts/verify-graph-create-draft-safety.mjs:84:mustNotContain(routePath, route, "ingestMattersFromClioBatch");
./scripts/verify-graph-create-draft-safety.mjs:102:console.log("The Golden Rule: Clio document retrieval and MailDrop context are allowed; Clio matter mutation remains forbidden.");
./scripts/verify-graph-maildrop-discovery-safety.mjs:64:  "clioMaildropEmail: { not: null }",
./scripts/verify-graph-maildrop-discovery-safety.mjs:80:  "clioRecordsChanged: false",
./scripts/verify-graph-maildrop-discovery-safety.mjs:84:console.log("\n=== VERIFY NO DRAFT / SEND / CLIO / DOCUMENT UPLOAD WIRING ===");
./scripts/verify-graph-maildrop-discovery-safety.mjs:91:  "clio.documents",
./scripts/verify-graph-maildrop-discovery-safety.mjs:93:  "clioDocumentUpload",
./scripts/verify-graph-maildrop-discovery-safety.mjs:94:  "writeToClio",
./scripts/verify-graph-maildrop-discovery-safety.mjs:95:  "settlementClioWriteback",
./app/api/admin/clients/[id]/invoice/[invoiceId]/void/route.ts:109:            noClioRecordsChanged: true,
./app/api/admin/clients/[id]/invoice/[invoiceId]/void/route.ts:129:            noClioRecordsChanged: true,
./app/api/admin/clients/[id]/invoice/[invoiceId]/void/route.ts:147:      safety: "Voided a local finalized invoice only. This route clears MatterPaymentReceipt.invoiceId only for included receipt rows currently marked with this exact invoice id. It does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records.",
./scripts/verify-settlement-finalized-email-safety.mjs:25:    label: "settlement email launcher uses finalized Clio document id",
./scripts/verify-settlement-finalized-email-safety.mjs:26:    ok: page.includes("selectedCandidate.clioDocumentId"),
./scripts/verify-settlement-finalized-email-safety.mjs:38:    ok: page.includes("Create an Outlook draft with the finalized settlement PDF attached from the mapped master Clio matter."),
./scripts/verify-settlement-finalized-email-safety.mjs:41:    label: "duplicate-skipped finalized PDFs expose clioDocumentId alias",
./scripts/verify-settlement-finalized-email-safety.mjs:43:      finalizeRoute.includes("existingClioDocumentIdForSkippedPdf") &&
./scripts/verify-settlement-finalized-email-safety.mjs:44:      finalizeRoute.includes("clioDocumentId: existingClioDocumentIdForSkippedPdf || null"),
./scripts/verify-settlement-finalized-email-safety.mjs:47:    label: "duplicate-skipped finalized PDFs expose clioDocumentVersionUuid alias",
./scripts/verify-settlement-finalized-email-safety.mjs:49:      finalizeRoute.includes("existingClioDocumentVersionUuidForSkippedPdf") &&
./scripts/verify-settlement-finalized-email-safety.mjs:50:      finalizeRoute.includes("clioDocumentVersionUuid: existingClioDocumentVersionUuidForSkippedPdf || null"),
./scripts/verify-settlement-finalized-email-safety.mjs:116:    label: "backend Graph draft route treats Clio document version UUID as attachment source",
./scripts/verify-settlement-finalized-email-safety.mjs:118:      createDraftRoute.includes("clioDocumentVersionUuid || downloadUrl") &&
./scripts/verify-settlement-finalized-email-safety.mjs:120:      createDraftRoute.includes("clean(attachment?.clioDocumentVersionUuid)"),
./scripts/verify-settlement-finalized-email-safety.mjs:123:    label: "backend Graph attachment download falls back to existing Clio document id",
./scripts/verify-settlement-finalized-email-safety.mjs:125:      createDraftRoute.includes("clean(attachment?.existingClioDocumentId)") &&
./scripts/verify-settlement-finalized-email-safety.mjs:130:    label: "settlement finalized email prefers existing Clio document id over version UUID",
./scripts/verify-settlement-finalized-email-safety.mjs:132:      page.includes("selectedCandidate.existingClioDocumentId") &&
./scripts/verify-settlement-finalized-email-safety.mjs:133:      createDraftRoute.includes("existingClioDocumentId: clean(attachment?.existingClioDocumentId) || clioDocumentId") &&
./scripts/verify-settlement-finalized-email-safety.mjs:134:      createDraftRoute.includes("documentId: clean(attachment?.documentId) || clioDocumentId"),
./scripts/verify-settlement-finalized-email-safety.mjs:137:    label: "settlement finalized email falls back to loaded master Clio matter id",
./scripts/verify-settlement-finalized-email-safety.mjs:139:      page.includes("masterClioDocumentsResult?.clioMatterId") &&
./scripts/verify-settlement-finalized-email-safety.mjs:140:      page.includes("masterClioDocumentsResult?.clioDisplayNumber"),
./scripts/verify-settlement-finalized-email-safety.mjs:145:      finalizeRoute.includes("existingClioDocumentIdForSkippedPdf") &&
./scripts/verify-settlement-finalized-email-safety.mjs:146:      finalizeRoute.includes("documentId: existingClioDocumentIdForSkippedPdf || null") &&
./scripts/verify-settlement-finalized-email-safety.mjs:147:      finalizeRoute.includes("id: existingClioDocumentIdForSkippedPdf || null"),
./scripts/verify-settlement-finalized-email-safety.mjs:151:    label: "backend Graph attachment resolves Clio document id from mapped matter documents",
./scripts/verify-settlement-finalized-email-safety.mjs:153:      createDraftRoute.includes("resolveClioDocumentIdForAttachment") &&
./scripts/verify-settlement-finalized-email-safety.mjs:154:      createDraftRoute.includes("listClioMatterDocuments(matterId)") &&
./scripts/verify-settlement-finalized-email-safety.mjs:155:      createDraftRoute.includes("resolveClioMatterIdForAttachment"),
./scripts/verify-settlement-finalized-email-safety.mjs:158:    label: "settlement finalized email passes mapped Clio matter target for attachment resolution",
./scripts/verify-settlement-finalized-email-safety.mjs:160:      page.includes("clioMatterId:") &&
./scripts/verify-settlement-finalized-email-safety.mjs:161:      page.includes("masterDocumentFinalizationResult?.clioUploadTarget?.id") &&
./scripts/verify-settlement-finalized-email-safety.mjs:162:      page.includes("clioDisplayNumber:"),
./scripts/verify-settlement-finalized-email-safety.mjs:165:    label: "backend Graph attachment resolver searches Clio matter documents by mapped matter target",
./scripts/verify-settlement-finalized-email-safety.mjs:167:      createDraftRoute.includes("resolveClioMatterIdForAttachment") &&
./scripts/verify-settlement-finalized-email-safety.mjs:170:      createDraftRoute.includes("listClioMatterDocuments(matterId)"),
./app/api/admin/users/remove-role/route.ts:344:        note: "Preview only. No AdminUserRole row, permission override, enforcement setting, Clio record, document, email, or print queue item was changed.",
./scripts/verify-document-template-repository-api-foundation.mjs:38:  ["route does not import Clio helpers", !route.includes("@/lib/clio") && !route.includes("clioClient")],
./scripts/verify-document-template-repository-api-foundation.mjs:39:  ["route does not call Clio endpoints", !route.includes("/api/clio") && !route.includes("clio-maildrop")],
./app/api/admin/email-automation-status/route.ts:176:    row?.clioMaildropEmail,
./app/api/admin/email-automation-status/route.ts:187:    details.clioMaildropEmail,
./app/api/admin/email-automation-status/route.ts:203:    normalizedAddress: firstText(row?.normalizedEmail, row?.normalizedAddress, row?.clioMaildropEmail, details.normalizedEmail, details.normalizedAddress, details.clioMaildropEmail),
./app/api/admin/email-automation-status/route.ts:204:    label: firstText(row?.clioMaildropLabel, row?.label, row?.displayName, row?.name, details.clioMaildropLabel, details.label, details.displayName, details.name),
./app/api/admin/email-automation-status/route.ts:208:    clioMatterId: firstText(row?.clioMatterId, row?.clioMatterID, details.clioMatterId, details.clioMatterID),
./app/api/admin/email-automation-status/route.ts:209:    clioDisplayNumber: firstText(row?.clioDisplayNumber, details.clioDisplayNumber),
./app/api/admin/email-automation-status/route.ts:293:      writesClio: false,
./app/api/admin/email-automation-status/route.ts:297:      callsClio: false,
./scripts/verify-settlement-recorded-panel-copy-simplified.mjs:28:  "Barsh Matters local settlement readback.  Clio is not the source of truth for this panel."
./scripts/inventory-claim-index-cleanup-candidates.mjs:43:  ['clio matter-context', /\/api\/clio\/matter-context|matter-context/g],
./scripts/inventory-claim-index-cleanup-candidates.mjs:45:  ['noClio markers', /noClioRead|noClioWrite|noClioHydration/g],
./scripts/verify-active-operational-clio-routes-removed.mjs:66:const deleted = "lib/ingestMattersFromClioBatch.ts";
./scripts/verify-active-operational-clio-routes-removed.mjs:77:  assert(!source.includes("clioFetch"), `${label} must not call clioFetch.`);
./scripts/verify-active-operational-clio-routes-removed.mjs:78:  assert(!source.includes("ingestMattersFromClioBatch"), `${label} must not import ingestMattersFromClioBatch.`);
./scripts/verify-active-operational-clio-routes-removed.mjs:79:  assert(!source.includes("upsertClaimIndexFromMatter"), `${label} must not refresh ClaimIndex from Clio.`);
./scripts/verify-active-operational-clio-routes-removed.mjs:80:  assert(!source.includes("method: \"PATCH\""), `${label} must not PATCH Clio.`);
./scripts/verify-active-operational-clio-routes-removed.mjs:83:assert(matterClose.includes("syncClioMatterClosed"), "matter close must perform guarded Clio close sync.");
./scripts/verify-active-operational-clio-routes-removed.mjs:84:assert(matterClose.includes("clioRead: false"), "matter close must not hydrate/read back local data from Clio.");
./scripts/verify-active-operational-clio-routes-removed.mjs:85:assert(settlementClose.includes("legacyClioOperationalRouteBlocked"), "settlement close should remain blocked pending local-first rebuild.");
./scripts/verify-active-operational-clio-routes-removed.mjs:88:  "clioFetch",
./scripts/verify-active-operational-clio-routes-removed.mjs:90:  "ingestMattersFromClioBatch",
./scripts/verify-active-operational-clio-routes-removed.mjs:93:  "writePostFilingFieldsToClio",
./scripts/verify-active-operational-clio-routes-removed.mjs:95:  assert(!metadata.includes(forbidden), `update-metadata still contains forbidden Clio marker: ${forbidden}`);
./scripts/verify-active-operational-clio-routes-removed.mjs:99:assert(metadata.includes("noClioRead: true"), "update-metadata must report noClioRead=true.");
./scripts/verify-active-operational-clio-routes-removed.mjs:100:assert(metadata.includes("noClioWrite: true"), "update-metadata must report noClioWrite=true.");
./scripts/verify-active-operational-clio-routes-removed.mjs:109:  assert(!source.includes("@/lib/ingestMattersFromClioBatch"), `${file} imports deleted ingestMattersFromClioBatch.`);
./scripts/verify-active-operational-clio-routes-removed.mjs:115:  assert(settlementCloseRes.json?.writes?.writesClio === false, "settlements close must report writesClio=false.");
./scripts/verify-active-operational-clio-routes-removed.mjs:120:console.log("RESULT: active operational Clio routes removed");
./scripts/verify-active-operational-clio-routes-removed.mjs:121:console.log("ACTIVE_OPERATIONAL_CLIO_ROUTES_STATUS=0");
./scripts/verify-active-operational-clio-routes-removed.mjs:126:console.log("WRITES_CLIO=false");
./scripts/verify-graph-draft-persistence-safety.mjs:49:mustContain(helperPath, helper, "clioMaildropEmail");
./scripts/verify-graph-draft-persistence-safety.mjs:51:mustContain(helperPath, helper, "clioRecordsChanged: false");
./scripts/verify-graph-draft-persistence-safety.mjs:60:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-graph-draft-persistence-safety.mjs:63:mustContain(routePath, route, "clioFetch");
./scripts/verify-graph-draft-persistence-safety.mjs:64:mustContain(routePath, route, "listClioMatterDocuments");
./scripts/verify-graph-draft-persistence-safety.mjs:74:mustNotContain(routePath, route, "ingestMattersFromClioBatch");
./scripts/verify-graph-draft-persistence-safety.mjs:75:mustNotContain(helperPath, helper, "clioFetch(");
./scripts/verify-graph-draft-persistence-safety.mjs:93:console.log("The Golden Rule: Graph draft metadata persistence is local-only; Clio document retrieval/MailDrop context are allowed before persistence.");
./app/api/admin/lawsuits/audit/route.ts:24:  clioMasterMatterId: number | null;
./app/api/admin/lawsuits/audit/route.ts:25:  clioMasterDisplayNumber: string | null;
./app/api/admin/lawsuits/audit/route.ts:26:  clioMasterMappedAt: Date | null;
./app/api/admin/lawsuits/audit/route.ts:27:  clioMasterMappingSource: string | null;
./app/api/admin/lawsuits/audit/route.ts:85:  clioMasterMatterId: true,
./app/api/admin/lawsuits/audit/route.ts:86:  clioMasterDisplayNumber: true,
./app/api/admin/lawsuits/audit/route.ts:87:  clioMasterMappedAt: true,
./app/api/admin/lawsuits/audit/route.ts:88:  clioMasterMappingSource: true,
./app/api/admin/lawsuits/audit/route.ts:150:    clioMasterMatterId: row.clioMasterMatterId,
./app/api/admin/lawsuits/audit/route.ts:151:    clioMasterDisplayNumber: row.clioMasterDisplayNumber,
./app/api/admin/lawsuits/audit/route.ts:152:    clioMasterMappedAt: row.clioMasterMappedAt,
./app/api/admin/lawsuits/audit/route.ts:153:    clioMasterMappingSource: row.clioMasterMappingSource,
./app/api/admin/lawsuits/audit/route.ts:188:      add(obj.clioMatterId);
./app/api/admin/lawsuits/audit/route.ts:189:      add(obj.clio_matter_id);
./app/api/admin/lawsuits/audit/route.ts:202:  for (const match of text.matchAll(/\b(?:matterId|matter_id|clioMatterId|clio_matter_id|id)\D{0,12}(\d{6,})\b/gi)) {
./app/api/admin/lawsuits/audit/route.ts:239:      add(obj.clioDisplayNumber);
./app/api/admin/lawsuits/audit/route.ts:240:      add(obj.clio_display_number);
./app/api/admin/lawsuits/audit/route.ts:516:    const clioMappingMissing = lawsuits.filter(
./app/api/admin/lawsuits/audit/route.ts:517:      (row) => !row.clioMasterMatterId && !clean(row.clioMasterDisplayNumber)
./app/api/admin/lawsuits/audit/route.ts:520:      id: "missing-master-clio-shell-mapping",
./app/api/admin/lawsuits/audit/route.ts:521:      label: "Missing master Clio shell mapping",
./app/api/admin/lawsuits/audit/route.ts:523:      count: clioMappingMissing.length,
./app/api/admin/lawsuits/audit/route.ts:524:      description: "Master Clio shell mapping is important for final document upload/document viewing, but this audit does not call Clio.",
./app/api/admin/lawsuits/audit/route.ts:525:      sampleRows: clioMappingMissing,
./app/api/admin/lawsuits/audit/route.ts:528:    const partialClioMapping = lawsuits.filter(
./app/api/admin/lawsuits/audit/route.ts:530:        (!!row.clioMasterMatterId && !clean(row.clioMasterDisplayNumber)) ||
./app/api/admin/lawsuits/audit/route.ts:531:        (!row.clioMasterMatterId && !!clean(row.clioMasterDisplayNumber))
./app/api/admin/lawsuits/audit/route.ts:534:      id: "partial-master-clio-shell-mapping",
./app/api/admin/lawsuits/audit/route.ts:535:      label: "Partial master Clio shell mapping",
./app/api/admin/lawsuits/audit/route.ts:537:      count: partialClioMapping.length,
./app/api/admin/lawsuits/audit/route.ts:538:      description: "A master Clio shell mapping should ideally preserve both clioMasterMatterId and clioMasterDisplayNumber.",
./app/api/admin/lawsuits/audit/route.ts:539:      sampleRows: partialClioMapping,
./app/api/admin/lawsuits/audit/route.ts:608:    const mappedClioCount = lawsuits.filter((row) => row.clioMasterMatterId || clean(row.clioMasterDisplayNumber)).length;
./app/api/admin/lawsuits/audit/route.ts:624:        mappedMasterClioShellCount: mappedClioCount,
./app/api/admin/lawsuits/audit/route.ts:625:        unmappedMasterClioShellCount: lawsuits.length - mappedClioCount,
./app/api/admin/lawsuits/audit/route.ts:637:        masterClioShellMapping: [
./app/api/admin/lawsuits/audit/route.ts:638:          { label: "Mapped master Clio shell", count: mappedClioCount },
./app/api/admin/lawsuits/audit/route.ts:639:          { label: "No mapped master Clio shell", count: lawsuits.length - mappedClioCount },
./app/api/admin/lawsuits/audit/route.ts:648:        "Read-only Admin Lawsuit/master data-quality audit. This route only reads prisma.lawsuit and prisma.claimIndex. It does not update local lawsuits, update ClaimIndex, restore data, call Clio, generate documents, send email, print, queue, delete, deaggregate, or write the database.",
./app/api/admin/lawsuits/cleanup-preview/route.ts:35:  const onlyWithClioShell = url.searchParams.get("onlyWithClioShell") === "true";
./app/api/admin/lawsuits/cleanup-preview/route.ts:75:      const clioMasterMatterId = text(lawsuit.clioMasterMatterId);
./app/api/admin/lawsuits/cleanup-preview/route.ts:76:      const clioMasterDisplayNumber = text(lawsuit.clioMasterDisplayNumber);
./app/api/admin/lawsuits/cleanup-preview/route.ts:83:        clioMasterMatterId,
./app/api/admin/lawsuits/cleanup-preview/route.ts:84:        clioMasterDisplayNumber,
./app/api/admin/lawsuits/cleanup-preview/route.ts:85:        clioMasterMappingSource: text(lawsuit.clioMasterMappingSource),
./app/api/admin/lawsuits/cleanup-preview/route.ts:86:        hasClioShell: Boolean(clioMasterMatterId || clioMasterDisplayNumber),
./app/api/admin/lawsuits/cleanup-preview/route.ts:91:    .filter((lawsuit) => includeEmpty || lawsuit.childCount > 0 || lawsuit.hasClioShell)
./app/api/admin/lawsuits/cleanup-preview/route.ts:93:    .filter((lawsuit) => !onlyWithClioShell || lawsuit.hasClioShell);
./app/api/admin/lawsuits/cleanup-preview/route.ts:95:  const clioDeleteCandidates = candidateRows
./app/api/admin/lawsuits/cleanup-preview/route.ts:96:    .filter((lawsuit) => lawsuit.hasClioShell)
./app/api/admin/lawsuits/cleanup-preview/route.ts:99:      clioMatterId: lawsuit.clioMasterMatterId,
./app/api/admin/lawsuits/cleanup-preview/route.ts:100:      clioDisplayNumber: lawsuit.clioMasterDisplayNumber,
./app/api/admin/lawsuits/cleanup-preview/route.ts:101:      mappingSource: lawsuit.clioMasterMappingSource,
./app/api/admin/lawsuits/cleanup-preview/route.ts:121:      onlyWithClioShell,
./app/api/admin/lawsuits/cleanup-preview/route.ts:127:    clioDeleteCandidateCount: clioDeleteCandidates.length,
./app/api/admin/lawsuits/cleanup-preview/route.ts:129:    writesClio: false,
./app/api/admin/lawsuits/cleanup-preview/route.ts:130:    deletesClio: false,
./app/api/admin/lawsuits/cleanup-preview/route.ts:134:    clioDeleteCandidates,
./app/api/admin/lawsuits/cleanup-preview/route.ts:146:      "Preview only. This route does not deaggregate matters, delete local lawsuits, delete Clio shells, update ClaimIndex, write Clio, upload documents, send email, or queue print jobs.",
./scripts/inventory-claim-index-schema.mjs:31:  if (/clio/.test(hay)) return 'CLIO_SHELL_OR_DOCUMENT_METADATA_FIELD_REVIEW';
./scripts/inventory-claim-index-schema.mjs:39:  if (/clio|maildrop|document.*shell|brl/.test(hay)) return 'CLIO_SHELL_ONLY_OR_DISPLAY_IDENTIFIER';
./scripts/verify-document-finalization-target-routing-safety.mjs:14:      finalizePreview.includes("resolveClioMatterByDisplayNumber"),
./scripts/verify-document-finalization-target-routing-safety.mjs:34:      directPage.includes("direct bill matter Clio Documents tab"),
./scripts/verify-document-finalization-target-routing-safety.mjs:39:      finalizeRoute.includes("uploadedOnlyToRequestedClioMatterDocumentsTab") &&
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:143:  mustContain(`ClaimIndex Clio/import upsert maps ${field}`, claimIndexUpsert, `${field}:`);
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:195:mustContain("identity route is local-only no Clio write", identityRoute, "noClioWrite: true");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:196:mustContain("identity route is local-only no Clio read", identityRoute, "noClioRead: true");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:226:mustContain("direct route is local-only no Clio write", directRoute, "noClioWrite: true");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:227:mustContain("direct route is local-only no Clio read", directRoute, "noClioRead: true");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:274:  mustNotContain(`${label} must not call Clio`, text, "clioFetch");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:275:  mustNotContain(`${label} must not call Clio API`, text, "api/v4");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:47:mustContain("explicitly imports clioFetch only for approved document-shell creation", 'import { clioFetch } from "@/lib/clio";');
./scripts/verify-local-lawsuit-generation-create-safety.mjs:48:mustContain("builds Clio shell description from local master lawsuit id", "MASTER LAWSUIT - ${masterLawsuitId}");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:49:mustContain("derives Clio client from selected child matter shells", "findClientFromChildClioMatters(selectedRows)");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:50:mustContain("reads child Clio matter client only to assign same Clio client to shell", "readClioMatterClient");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:51:mustContain("creates only a Clio master document shell", "createClioMasterMatter");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:52:mustContain("uses Clio matter create endpoint for shell creation", "/api/v4/matters.json");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:53:mustContain("stores Clio assigned matter id in local mapping", "clioMasterMatterId: createdClioMatter.matterId");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:54:mustContain("stores Clio assigned display number in local mapping", "clioMasterDisplayNumber: createdClioMatter.displayNumber");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:55:mustContain("stores Clio shell mapping source", 'clioMasterMappingSource: "barsh-matters-create-lawsuit-confirm"');
./scripts/verify-local-lawsuit-generation-create-safety.mjs:56:mustContain("response returns created Clio matter shell", "createdClioMatter: {");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:57:mustContain("response acknowledges Clio document shell creation", "createsClioDocumentShell: true");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:58:mustContain("response acknowledges narrow Clio shell write", "writesClio: true");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:59:mustContain("response acknowledges Clio master shell creation", "createsClioMasterMatter: true");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:60:mustContain("route states no operational Clio hydration", "noClioOperationalHydration: true");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:70:mustNotContain("must not call separate Clio master confirm route", "/api/documents/clio-master-matter-confirm");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:72:mustNotContain("must not use master lawsuit id as Clio display number", "clioMasterDisplayNumber: masterLawsuitId");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:73:mustNotContain("must not upload documents during create", "clioDocumentUpload");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:77:mustNotContain("must not use Clio as local identity hydration", "clioMatterToClaimIndex");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:78:mustNotContain("must not refresh from Clio after create", "refreshFromClio");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:80:const clioFetchCount = countOccurrences(route, "clioFetch(");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:81:const clioMatterEndpointCount = countOccurrences(route, "/api/v4/matters.json");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:83:if (clioFetchCount !== 2) {
./scripts/verify-local-lawsuit-generation-create-safety.mjs:84:  failures.push(`approved Clio shell scope: expected exactly 2 clioFetch calls: one child-client read and one master-shell create; found ${clioFetchCount}`);
./scripts/verify-local-lawsuit-generation-create-safety.mjs:87:if (clioMatterEndpointCount !== 1) {
./scripts/verify-local-lawsuit-generation-create-safety.mjs:88:  failures.push(`approved Clio shell scope: expected exactly 1 Clio matter-create endpoint string; found ${clioMatterEndpointCount}`);
./scripts/verify-local-lawsuit-generation-create-safety.mjs:96:console.log("EXPECTS_APPROVED_CLIO_DOCUMENT_SHELL_EXCEPTION=YES");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:97:console.log("EXPECTS_CHILD_CLIO_CLIENT_READ_ONLY_FOR_SHELL_CLIENT=YES");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:98:console.log("EXPECTS_NO_CLIO_OPERATIONAL_HYDRATION=YES");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:102:console.log("CLIO_FETCH_COUNT=" + clioFetchCount);
./scripts/verify-local-lawsuit-generation-create-safety.mjs:103:console.log("CLIO_MATTER_ENDPOINT_COUNT=" + clioMatterEndpointCount);
./scripts/verify-provider-client-invoice-cost-ledger-ui-safety.mjs:59:mustNotMatch("route", route, /clioFetch|fetchClio|updateClio|from\s+["'][^"']*clio/i, "Clio operational dependency");
./scripts/verify-master-view-documents-source-labels-safety.mjs:3:const routePath = "app/api/documents/clio-matter-documents/route.ts";
./scripts/verify-master-view-documents-source-labels-safety.mjs:14:      route.includes('sourceLabel(childResolution.clioDisplayNumber || childDisplay, "bill")') &&
./scripts/verify-master-view-documents-source-labels-safety.mjs:22:      route.includes("resolveClioMatterByDisplayNumber(childDisplay)") &&
./scripts/verify-master-view-documents-source-labels-safety.mjs:26:    label: "document rows include source label and source Clio matter fields",
./scripts/verify-master-view-documents-source-labels-safety.mjs:28:      route.includes("sourceClioMatterId") &&
./scripts/verify-master-view-documents-source-labels-safety.mjs:29:      route.includes("sourceClioDisplayNumber") &&
./scripts/verify-master-view-documents-source-labels-safety.mjs:38:      masterPage.includes("selectedDoc.sourceClioDisplayNumber"),
./app/api/admin/lawsuits/cleanup-confirm/route.ts:3:import { clioFetch } from "@/lib/clio";
./app/api/admin/lawsuits/cleanup-confirm/route.ts:8:const APPROVED_CLIO_SHELL_MAPPING_SOURCE = "barsh-matters-create-lawsuit-confirm";
./app/api/admin/lawsuits/cleanup-confirm/route.ts:33:async function deleteMappedClioShell(clioMatterId: number) {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:34:  const response = await clioFetch(`/api/v4/matters/${encodeURIComponent(String(clioMatterId))}.json`, {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:41:    clioMatterId,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:54:  const deleteClioShell = Boolean(body?.deleteClioShell);
./app/api/admin/lawsuits/cleanup-confirm/route.ts:66:        writesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:67:        deletesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:79:        writesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:80:        deletesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:93:        writesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:94:        deletesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:110:        writesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:111:        deletesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:122:  const clioMasterMatterId = typeof lawsuit.clioMasterMatterId === "number" ? lawsuit.clioMasterMatterId : null;
./app/api/admin/lawsuits/cleanup-confirm/route.ts:123:  const clioMasterDisplayNumber = text(lawsuit.clioMasterDisplayNumber);
./app/api/admin/lawsuits/cleanup-confirm/route.ts:124:  const clioMasterMappingSource = text(lawsuit.clioMasterMappingSource);
./app/api/admin/lawsuits/cleanup-confirm/route.ts:125:  const hasClioShell = Boolean(clioMasterMatterId || clioMasterDisplayNumber);
./app/api/admin/lawsuits/cleanup-confirm/route.ts:127:  if (hasClioShell && !deleteClioShell) {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:131:        error: "This lawsuit has a mapped Clio master shell.  deleteClioShell=true is required so cleanup does not leave an orphan Clio shell.",
./app/api/admin/lawsuits/cleanup-confirm/route.ts:133:        clioMasterMatterId,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:134:        clioMasterDisplayNumber,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:136:        writesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:137:        deletesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:143:  if (hasClioShell && clioMasterMappingSource !== APPROVED_CLIO_SHELL_MAPPING_SOURCE) {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:147:        error: "Mapped Clio shell was not created by the approved Create Lawsuit workflow.  Refusing Clio deletion.",
./app/api/admin/lawsuits/cleanup-confirm/route.ts:149:        clioMasterMatterId,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:150:        clioMasterDisplayNumber,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:151:        clioMasterMappingSource,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:152:        requiredMappingSource: APPROVED_CLIO_SHELL_MAPPING_SOURCE,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:154:        writesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:155:        deletesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:161:  if (hasClioShell && !clioMasterMatterId) {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:165:        error: "Mapped Clio shell display number exists, but clioMasterMatterId is missing.  Refusing cleanup to avoid an orphan Clio shell.",
./app/api/admin/lawsuits/cleanup-confirm/route.ts:167:        clioMasterDisplayNumber,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:169:        writesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:170:        deletesClio: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:176:  let clioDeleteResult: Awaited<ReturnType<typeof deleteMappedClioShell>> | null = null;
./app/api/admin/lawsuits/cleanup-confirm/route.ts:178:  if (hasClioShell && clioMasterMatterId) {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:179:    clioDeleteResult = await deleteMappedClioShell(clioMasterMatterId);
./app/api/admin/lawsuits/cleanup-confirm/route.ts:181:    if (!clioDeleteResult.ok) {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:185:          error: "Clio master shell deletion failed.  Local deaggregation was not performed.",
./app/api/admin/lawsuits/cleanup-confirm/route.ts:187:          clioDeleteResult,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:189:          writesClio: true,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:190:          deletesClio: true,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:224:          clioShell: {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:225:            deleteRequested: deleteClioShell,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:226:            deleted: Boolean(clioDeleteResult?.ok),
./app/api/admin/lawsuits/cleanup-confirm/route.ts:227:            clioMasterMatterId,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:228:            clioMasterDisplayNumber,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:229:            clioMasterMappingSource,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:230:            result: clioDeleteResult,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:234:            noChildClioMatterDeletion: true,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:247:        clioMasterMatterId: deleted.clioMasterMatterId,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:248:        clioMasterDisplayNumber: deleted.clioMasterDisplayNumber,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:260:    clioDeleteResult,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:263:    writesClio: Boolean(clioDeleteResult),
./app/api/admin/lawsuits/cleanup-confirm/route.ts:264:    deletesClio: Boolean(clioDeleteResult),
./app/api/admin/lawsuits/cleanup-confirm/route.ts:265:    deletedClioShellOnly: Boolean(clioDeleteResult),
./app/api/admin/lawsuits/cleanup-confirm/route.ts:266:    deletedChildClioMatters: false,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:268:      "Completed guarded Admin Lawsuit Cleanup.  Deleted only the mapped Clio master shell when present, cleared local child lawsuit links, deleted the local Lawsuit row, and wrote an AuditLog entry.",
./app/api/admin/ticklers/duplicates/route.ts:108:        "Read-only duplicate settlement payment follow-up tickler diagnostic. This route does not delete, complete, merge, reopen, rerun, process, pay, close, update Clio, email, print, queue, or modify records.",
./scripts/verify-transaction-reference-dropdowns-safety.mjs:81:mustNotContain("transaction seed no Clio", seed, "clioFetch");
./scripts/verify-transaction-reference-dropdowns-safety.mjs:82:mustNotContain("transaction seed no Clio token", seed, "getValidClioAccessToken");
./scripts/verify-matter-local-field-safety.mjs:23:check("identity field route is local/non-Clio workflow", identity.includes("export async function") && !identity.includes("clioFetch("));
./scripts/verify-matter-local-field-safety.mjs:24:check("direct field route is local/non-Clio workflow", direct.includes("export async function") && !direct.includes("clioFetch("));
./scripts/verify-matter-local-field-safety.mjs:27:check("routes avoid Clio writes", !identity.includes("clioFetch(") && !direct.includes("clioFetch("));
./scripts/verify-document-template-merge-field-visibility-safety.mjs:35:check("no Clio call introduced", !helper.includes("uploadDocumentToClio") && !confirm.includes("uploadDocumentToClio"));
./scripts/verify-adversary-attorney-document-merge-data-safety.mjs:48:mustNotContain("packet route must not call operational Clio matter context", packet, "/api/clio/matter-context");
./app/api/admin/ticklers/duplicates/cleanup-preview/route.ts:141:        "Preview-only duplicate settlement payment follow-up tickler cleanup plan. This route does not delete, complete, merge, reopen, rerun, process, pay, close, update Clio, email, print, queue, or modify records.",
./scripts/verify-clio-operational-routes-quarantined.mjs:18:  "clioFetch",
./scripts/verify-clio-operational-routes-quarantined.mjs:20:  "getMasterIdFromClio",
./scripts/verify-clio-operational-routes-quarantined.mjs:21:  "ingestMatterFromClio",
./scripts/verify-clio-operational-routes-quarantined.mjs:22:  "ingestMattersFromClioBatch",
./scripts/verify-clio-operational-routes-quarantined.mjs:24:  "indexMatterFromClioPayload",
./scripts/verify-clio-operational-routes-quarantined.mjs:91:      source.includes("legacyClioOperationalRouteBlocked"),
./scripts/verify-clio-operational-routes-quarantined.mjs:92:      `${file} does not use legacyClioOperationalRouteBlocked`
./scripts/verify-clio-operational-routes-quarantined.mjs:96:    assert(hits.length === 0, `${file} still contains forbidden Clio operational markers: ${hits.join(", ")}`);
./scripts/verify-clio-operational-routes-quarantined.mjs:99:  const helper = fs.readFileSync("lib/legacyClioOperationalRouteBlocked.ts", "utf8");
./scripts/verify-clio-operational-routes-quarantined.mjs:100:  assert(helper.includes("status: \"legacy-clio-operational-route-disabled\""), "Blocked helper missing explicit status.");
./scripts/verify-clio-operational-routes-quarantined.mjs:101:  assert(helper.includes("writesClio: false"), "Blocked helper must report writesClio=false.");
./scripts/verify-clio-operational-routes-quarantined.mjs:121:      assert(res.json?.writes?.writesClio === false, `${method} ${path} expected writesClio=false`);
./scripts/verify-clio-operational-routes-quarantined.mjs:128:  console.log("RESULT: Clio operational routes quarantined");
./scripts/verify-clio-operational-routes-quarantined.mjs:129:  console.log("CLIO_OPERATIONAL_QUARANTINE_STATUS=0");
./scripts/verify-clio-operational-routes-quarantined.mjs:132:  console.log("WRITES_CLIO=false");
./scripts/verify-clio-operational-routes-quarantined.mjs:137:  console.error("RESULT: Clio operational routes quarantined");
./scripts/verify-clio-operational-routes-quarantined.mjs:138:  console.error("CLIO_OPERATIONAL_QUARANTINE_STATUS=1");
./scripts/verify-admin-duplicate-settlement-tickler-diagnostic-safety.mjs:42:mustInclude("Admin Ticklers page", page, "No delete, complete, merge, reopen, rerun, payment, closure, Clio, email, print, queue, or write action is available here.");
./scripts/verify-home-advanced-adversary-attorney-safety.mjs:59:mustNotContain("candidate route must not call Clio", candidates, "clioFetch");
./scripts/windows-register-index-backup-task.ps1:7:$Repo = "C:\barsh-matters\clio-lawsuit-aggregator"
./scripts/verify-dropbox-backup-mirror-safety.mjs:32:console.log("CLIO_CALLS=NO");
./scripts/verify-dropbox-backup-mirror-safety.mjs:111:    ["documentFilePolicy.pullsDocumentsFromClio", manifest.documentFilePolicy?.pullsDocumentsFromClio, false],
./scripts/verify-dropbox-backup-mirror-safety.mjs:112:    ["documentFilePolicy.documentVault", manifest.documentFilePolicy?.documentVault, "Clio"],
./scripts/verify-graph-config-health-safety.mjs:52:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-graph-config-health-safety.mjs:75:mustNotContain(routePath, route, "clioFetch(");
./scripts/verify-graph-config-health-safety.mjs:101:mustContain(schemaPath, schema, "clioMaildropEmail");
./scripts/verify-graph-config-health-safety.mjs:102:mustContain(schemaPath, schema, "clioDocumentId");
./scripts/verify-claimindex-ingest-field-coverage-safety.mjs:106:mustNotContain("claimIndexUpsert must not write back to Clio", upsert, "method: \"PATCH\"");
./scripts/verify-claimindex-ingest-field-coverage-safety.mjs:107:mustNotContain("claimIndexUpsert must not create Clio records", upsert, "method: \"POST\"");
./scripts/verify-claimindex-ingest-field-coverage-safety.mjs:108:mustNotContain("claimIndexUpsert must not delete Clio records", upsert, "method: \"DELETE\"");
./scripts/verify-claimindex-ingest-field-coverage-safety.mjs:117:console.log("No Clio records were changed by this verifier.");
./scripts/verify-reference-import-confirm-safety.mjs:36:if (!helper.includes("noClioRecordsChanged: true")) {
./scripts/verify-reference-import-confirm-safety.mjs:37:  fail("Confirmed import safety must state no Clio records changed.");
./scripts/verify-reference-import-confirm-safety.mjs:93:  "clioFetch",
./scripts/verify-reference-import-confirm-safety.mjs:120:if (!page.includes("does not") || !page.includes("Clio")) {
./scripts/verify-reference-import-confirm-safety.mjs:121:  fail("Admin UI must clearly state no Clio writes.");
./scripts/verify-admin-backup-restore-preview-safety.mjs:71:  [/from\s+["'][^"']*clio/i, 'imports Clio module'],
./scripts/verify-admin-backup-restore-preview-safety.mjs:72:  [/require\(["'][^"']*clio/i, 'requires Clio module'],
./scripts/verify-admin-backup-restore-preview-safety.mjs:73:  [/CLIO_/i, 'references CLIO env/config'],
./scripts/verify-master-stored-db-docx-step2-copy-safety.mjs:8:  "No final Clio upload, email draft, or print queue record is created by preview",
./scripts/verify-clio-master-matter-preview-safety.mjs:28:const routePath = "app/api/documents/clio-master-matter-preview/route.ts";
./scripts/verify-clio-master-matter-preview-safety.mjs:34:console.log("=== CLIO MASTER MATTER PREVIEW SAFETY VERIFICATION ===");
./scripts/verify-clio-master-matter-preview-safety.mjs:37:mustContain(routePath, route, 'action: "clio-master-matter-create-preview"');
./scripts/verify-clio-master-matter-preview-safety.mjs:39:mustContain(routePath, route, "createsClioMatter: false");
./scripts/verify-clio-master-matter-preview-safety.mjs:40:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-clio-master-matter-preview-safety.mjs:45:mustContain(routePath, route, "TO_BE_ASSIGNED_BY_CLIO_BRLXXXXX");
./scripts/verify-clio-master-matter-preview-safety.mjs:46:mustContain(routePath, route, "mustNotUseMasterLawsuitIdAsClioDisplayNumber: true");
./scripts/verify-clio-master-matter-preview-safety.mjs:47:mustContain(routePath, route, "clioAssignsBrlDisplayNumber: true");
./scripts/verify-clio-master-matter-preview-safety.mjs:49:mustContain(routePath, route, "findClientFromChildClioMatters");
./scripts/verify-clio-master-matter-preview-safety.mjs:57:mustContain(routePath, route, "clioFetch(");
./scripts/verify-clio-master-matter-preview-safety.mjs:58:mustContain(routePath, route, "readClioMatterClient");
./scripts/verify-clio-master-matter-preview-safety.mjs:67:if (packageJson.includes('"verify:clio-master-matter-preview-safety"')) {
./scripts/verify-clio-master-matter-preview-safety.mjs:74:  console.error(`=== CLIO MASTER MATTER PREVIEW SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-clio-master-matter-preview-safety.mjs:78:console.log("=== CLIO MASTER MATTER PREVIEW SAFETY PASSED ===");
./scripts/verify-graph-thread-sync-persistence-safety.mjs:41:  'clioRecordsChanged: false',
./scripts/verify-graph-thread-sync-persistence-safety.mjs:69:  'clioRecordsChanged: false',
./scripts/verify-graph-thread-sync-persistence-safety.mjs:73:console.log("\\n=== VERIFY NO EMAIL SEND / DRAFT CREATE / CLIO / DOCUMENT UPLOAD ===");
./scripts/verify-graph-thread-sync-persistence-safety.mjs:78:  'clioFetch(',
./scripts/verify-graph-thread-sync-persistence-safety.mjs:79:  'uploadBufferToClio',
./scripts/verify-graph-thread-sync-persistence-safety.mjs:80:  'uploadBufferToClioMatterDocuments',
./scripts/verify-graph-thread-sync-persistence-safety.mjs:96:console.log("Confirmed sync does not create drafts, send email, write Clio, upload documents, or use local Outlook automation.");
./scripts/verify-provider-client-invoice-detail-safety.mjs:53:mustNotMatch("route", route, /clioFetch|fetchClio|updateClio|from\s+["'][^"']*clio/i, "Clio operational dependency");
./scripts/verify-reference-import-cleanup-preview-safety.mjs:30:if (!route.includes("noClioRecordsChanged: true")) {
./scripts/verify-reference-import-cleanup-preview-safety.mjs:31:  fail("Cleanup preview route must state no Clio records changed.");
./scripts/verify-reference-import-cleanup-preview-safety.mjs:56:  "clioFetch",
./scripts/verify-lawsuits-master-link-target-safety.mjs:23:mustNot("lawsuits page must not call clioFetch", lawsuitsPage, "clioFetch(");
./scripts/verify-lawsuits-master-link-target-safety.mjs:26:console.log("EXPECTS_CLIO_MAPPING_ATTACHED_TO_LOCAL_SEARCH_ROWS=YES");
./scripts/verify-reference-data-safety.mjs:94:mustContain("entity route", entityRoute, "clioData: false");
./scripts/verify-reference-data-safety.mjs:95:mustContain("entity route", entityRoute, "noClioRecordsChanged: true");
./scripts/verify-reference-data-safety.mjs:98:mustNotContain("entity route", entityRoute, "clioFetch(");
./scripts/verify-reference-data-safety.mjs:111:mustContain("alias route", aliasRoute, "clioData: false");
./scripts/verify-reference-data-safety.mjs:112:mustContain("alias route", aliasRoute, "noClioRecordsChanged: true");
./scripts/verify-reference-data-safety.mjs:115:mustNotContain("alias route", aliasRoute, "clioFetch(");
./scripts/verify-reference-data-safety.mjs:131:console.log("No Clio records are changed by the local reference data routes.");
./scripts/verify-print-queue-clio-document-null-type-safety.mjs:7:  "verifyClioDocumentById",
./scripts/verify-print-queue-clio-document-null-type-safety.mjs:8:  "if (!byFilename && clioDocumentId)",
./scripts/verify-print-queue-clio-document-null-type-safety.mjs:12:  "let byFilename: ClioMatterDocument",
./scripts/verify-print-queue-clio-document-null-type-safety.mjs:29:  console.error("FAIL: print queue Clio document nullable type verifier failed");
./scripts/verify-print-queue-clio-document-null-type-safety.mjs:34:console.log("PASS: print queue Clio document lookup allows nullable verification fallback without side effects.");
./scripts/verify-admin-backup-alert-state-safety.mjs:20:  'clioWrite: false',
./scripts/verify-admin-backup-alert-state-safety.mjs:36:  'It does not send email, edit alert state, restore data, delete backups, run retention cleanup, call Clio, generate documents, or change the print queue.',
./scripts/verify-admin-backup-alert-state-safety.mjs:62:    'clioFetch',
./scripts/verify-admin-backup-alert-state-safety.mjs:63:    '@/lib/clio',
./scripts/verify-admin-backup-alert-state-safety.mjs:88:console.log('PASS: Backup alert state panel is read-only and has no send/edit/restore/delete/Clio/document/print behavior.');
./scripts/verify-admin-template-merge-field-visibility-display.mjs:29:check("admin display does not upload files", !page.includes("uploadDocumentToClio") && !page.includes("FormData") && !page.includes("readAsArrayBuffer"));
./app/api/admin/ticklers/search/route.ts:621:        clioWritesPerformed: false,
./scripts/verify-admin-reference-data-adversary-attorney-safety.mjs:191:  "Reference import forbids Clio data changes",
./scripts/verify-admin-reference-data-adversary-attorney-safety.mjs:193:  "noClioRecordsChanged: true"
./scripts/verify-admin-reference-data-adversary-attorney-safety.mjs:206:  mustNotContain(`${label} must not call clioFetch`, text, "clioFetch(");
./scripts/verify-admin-reference-data-adversary-attorney-safety.mjs:207:  mustNotContain(`${label} must not call Clio token helper`, text, "getClioAccessToken");
./scripts/verify-admin-backup-log-archive-preview-safety.mjs:28:  'clioWrite: false',
./scripts/verify-admin-backup-log-archive-preview-safety.mjs:44:  'It does not archive, truncate, move, delete, restore data, send alerts, call Clio, generate documents, or change the print queue.',
./scripts/verify-admin-backup-log-archive-preview-safety.mjs:75:    'clioFetch',
./scripts/verify-admin-backup-log-archive-preview-safety.mjs:76:    '@/lib/clio',
./scripts/verify-admin-backup-log-archive-preview-safety.mjs:101:console.log('PASS: Backup log archive preview is read-only and has no archive/truncate/delete/restore/send/Clio/document/print behavior.');
./scripts/verify-settlement-document-print-docx-route-ui-safety.mjs:21:check("finalized document URL resolver builds Clio document open route", page.includes("/api/documents/clio-document-open?") && page.includes('params.set("documentId", String(clioDocumentId))'));
./scripts/verify-settlement-document-print-docx-route-ui-safety.mjs:26:check("print success copy reflects finalized PDF print path", page.includes("The finalized settlement PDF from the mapped master Clio matter Documents tab was opened for printing."));
./scripts/verify-settlement-document-print-docx-route-ui-safety.mjs:31:check("does not add Clio upload from print", !page.includes("uploadDocumentToClio"));
./scripts/verify-clio-maildrop-resolve-source-scope-safety.mjs:3:const routePath = "app/api/documents/clio-maildrop-resolve/route.ts";
./scripts/verify-clio-maildrop-resolve-source-scope-safety.mjs:30:requireContains("no Clio records changed flag", "clioRecordsChanged: false");
./scripts/verify-clio-maildrop-resolve-source-scope-safety.mjs:34:console.log("PASS: Clio MailDrop resolve source/scope safety verifier passed.");
./scripts/verify-settlement-save-finalized-pdf-safety.mjs:21:mustInclude("finalized PDF save success copy", "The finalized settlement PDF from the mapped master Clio matter Documents tab was opened for local saving.");
./scripts/verify-settlement-delivery-void-notice-hidden-email-purple.mjs:18:mustInclude("email button title retained", 'title="Create an Outlook draft with the finalized settlement PDF attached from the mapped master Clio matter."');
./scripts/backup-local-indexes-monitored.mjs:264:    pullsDocumentsFromClio: manifest?.documentFilePolicy?.pullsDocumentsFromClio ?? null,
./scripts/backup-local-indexes-monitored.mjs:334:    `Pulls documents from Clio: ${status.pullsDocumentsFromClio === true ? 'YES' : status.pullsDocumentsFromClio === false ? 'NO' : 'UNKNOWN'}`,
./scripts/inspect-close-reason.ts:4:const BASE = process.env.CLIO_API_BASE || "https://app.clio.com";
./scripts/inspect-close-reason.ts:7:  const token = await prisma.clioToken.findFirst({
./scripts/inspect-close-reason.ts:12:    throw new Error("No Clio access token found in ClioToken table.");
./scripts/inspect-close-reason.ts:18:async function clio(path: string) {
./scripts/inspect-close-reason.ts:31:    console.error("CLIO ERROR", res.status, text);
./scripts/inspect-close-reason.ts:41:  const fields = await clio(
./scripts/inspect-close-reason.ts:54:  const matters = await clio(
./scripts/verify-placeholder-document-template-labels-safety.mjs:14:check("UI avoids pretending templates are Clio templates", !mattersPage.includes("Clio template source of truth"));
./scripts/verify-local-settlement-history-safety.mjs:28:  "clioRecordsChanged: false",
./scripts/verify-local-settlement-history-safety.mjs:42:  "clioDocumentUpload",
./scripts/verify-local-settlement-history-safety.mjs:43:  "uploadFinalDocumentsToClio",
./scripts/verify-direct-view-documents-button-safety.mjs:44:mustNotContain("direct Clio write action", "loadMatterDocumentDataPreviewToClio");
./scripts/verify-dedicated-mac-handoff-package.mjs:36:console.log("CLIO_CALLS=NO");
./scripts/verify-dedicated-mac-handoff-package.mjs:44:  "Clio is the document vault",
./scripts/verify-dedicated-mac-handoff-package.mjs:51:  "CLIO_CLIENT_SECRET",
./scripts/verify-local-settlement-persistence-schema-safety.mjs:68:mustNotContain("prisma/schema.prisma", schema, "clioFetch(");
./scripts/verify-local-settlement-persistence-schema-safety.mjs:69:mustNotContain("prisma/schema.prisma", schema, "writeSettlementToClio");
./scripts/verify-current-settlement-values-safety.mjs:43:mustContain("current values route", route, 'action: "legacy-clio-settlement-route-disabled"');
./scripts/verify-current-settlement-values-safety.mjs:47:mustContain("current values route", route, "This legacy Clio settlement operational route is disabled.");
./scripts/verify-current-settlement-values-safety.mjs:51:mustContain("current values route", route, "clioRecordsChanged: false");
./scripts/verify-current-settlement-values-safety.mjs:65:mustNotContain("current values route", route, "clioFetch(");
./scripts/verify-current-settlement-values-safety.mjs:69:console.log("=== VERIFY OLD LIVE CLIO READBACK CONTRACT IS NOT RESTORED ===");
./scripts/verify-current-settlement-values-safety.mjs:72:mustNotContain("current values route", route, 'source: "live-clio-read"');
./scripts/verify-current-settlement-values-safety.mjs:73:mustNotContain("current values route", route, "liveClioReadOnly");
./scripts/verify-current-settlement-values-safety.mjs:99:console.log("Legacy Clio current settlement values route remains disabled.");
./scripts/verify-current-settlement-values-safety.mjs:100:console.log("No Clio records were changed by this verifier.");
./scripts/verify-no-operational-clio-hydration-regression.mjs:41:    label: 'Clio matter-context route must not be used for local matter/search display',
./scripts/verify-no-operational-clio-hydration-regression.mjs:42:    re: /\/api\/clio\/matter-context|matter-context/iu,
./scripts/verify-no-operational-clio-hydration-regression.mjs:45:    label: 'ClaimIndex must not be rebuilt from Clio',
./scripts/verify-no-operational-clio-hydration-regression.mjs:46:    re: /\brebuildClaimIndexFromClio\b|\brebuild.*\bClio\b|\bClio\b.*\brebuild\b/iu,
./scripts/verify-no-operational-clio-hydration-regression.mjs:49:    label: 'ClaimIndex/search must not hydrate from Clio',
./scripts/verify-no-operational-clio-hydration-regression.mjs:50:    re: /\bhydrat(?:e|ion|ed|ing)\b.*\bClio\b|\bClio\b.*\bhydrat(?:e|ion|ed|ing)\b/iu,
./scripts/verify-no-operational-clio-hydration-regression.mjs:53:    label: 'local search/display path must not depend on Clio custom fields',
./scripts/verify-no-operational-clio-hydration-regression.mjs:57:    label: 'known Clio operational matter helper must not return',
./scripts/verify-no-operational-clio-hydration-regression.mjs:58:    re: /\bfetchMatterFromClio\b|\bgetMatterFromClio\b|\bclioMatterContext\b|\bloadClioMatterContext\b/iu,
./scripts/verify-no-operational-clio-hydration-regression.mjs:73:    l.includes('does not write clio') ||
./scripts/verify-no-operational-clio-hydration-regression.mjs:107:console.log('RESULT: verify no operational Clio hydration regression');
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:18:mustContain("imports clioFetch for explicit Clio document shell creation", 'import { clioFetch } from "@/lib/clio";');
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:19:mustContain("builds Clio master description from local master ID", "MASTER LAWSUIT - ${masterLawsuitId}");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:20:mustContain("creates Clio matter through Clio matters endpoint", "clioFetch(`/api/v4/matters.json?fields=");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:21:mustContain("uses child Clio matter client", "findClientFromChildClioMatters(selectedRows)");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:22:mustContain("stores Clio matter id on local Lawsuit row", "clioMasterMatterId: createdClioMatter.matterId");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:23:mustContain("stores Clio display number on local Lawsuit row", "clioMasterDisplayNumber: createdClioMatter.displayNumber");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:24:mustContain("stores mapping source", 'clioMasterMappingSource: "barsh-matters-create-lawsuit-confirm"');
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:25:mustContain("returns created Clio matter in response", "createdClioMatter: {");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:26:mustContain("response acknowledges Clio write", "writesClio: true");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:27:mustContain("response acknowledges Clio master creation", "createsClioMasterMatter: true");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:33:mustNotContain("must not call separate clio-master confirm route", "/api/documents/clio-master-matter-confirm");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:35:mustNotContain("must not use master lawsuit id as Clio display number", "clioMasterDisplayNumber: masterLawsuitId");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:37:console.log("RESULT: verify Create Lawsuit Clio shell contract");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:41:console.log("EXPECTS_CLIO_MASTER_DOCUMENT_SHELL=YES");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:42:console.log("EXPECTS_CLIO_ASSIGNED_BRL_MAPPING=YES");
./scripts/verify-local-settlement-history-ui-safety.mjs:11:check("no Clio write in page", !page.includes("writeSettlementToClio"));
./scripts/verify-local-close-workflows-safety.mjs:34:mustContain("matter close route performs guarded Clio close sync", matterClose, "syncClioMatterClosed");
./scripts/verify-local-close-workflows-safety.mjs:35:mustContain("matter close route blocks local commit if Clio sync fails", matterClose, "Local matter close was not committed.");
./scripts/verify-local-close-workflows-safety.mjs:37:mustContain("matter close route audit stores Clio sync result", matterClose, "clioCloseSync");
./scripts/verify-local-close-workflows-safety.mjs:40:mustContain("matter close route reports Clio closed", matterClose, "clioClosed: true");
./scripts/verify-local-close-workflows-safety.mjs:41:mustNotContain("matter close route must not use legacy Clio blocked helper", matterClose, "legacyClioOperationalRouteBlocked");
./scripts/verify-local-close-workflows-safety.mjs:42:mustNotContain("matter close route must not hydrate ClaimIndex from Clio", matterClose, "upsertClaimIndexFromMatter");
./scripts/verify-local-close-workflows-safety.mjs:43:mustNotContain("matter close route must not ingest Clio batch", matterClose, "ingestMattersFromClioBatch");
./scripts/verify-local-close-workflows-safety.mjs:53:mustContain("lawsuit close route performs guarded Clio close sync", lawsuitClose, "syncClioMattersClosed");
./scripts/verify-local-close-workflows-safety.mjs:54:mustContain("lawsuit close route blocks local commit if Clio sync fails", lawsuitClose, "Local lawsuit close was not committed.");
./scripts/verify-local-close-workflows-safety.mjs:56:mustContain("lawsuit close route audit stores Clio sync result", lawsuitClose, "clioCloseSync");
./scripts/verify-local-close-workflows-safety.mjs:59:mustContain("lawsuit close route reports Clio closed", lawsuitClose, "clioClosed: true");
./scripts/verify-local-close-workflows-safety.mjs:60:mustNotContain("lawsuit close route must not use legacy Clio blocked helper", lawsuitClose, "legacyClioOperationalRouteBlocked");
./scripts/verify-local-close-workflows-safety.mjs:61:mustNotContain("lawsuit close route must not hydrate ClaimIndex from Clio", lawsuitClose, "upsertClaimIndexFromMatter");
./scripts/verify-local-close-workflows-safety.mjs:62:mustNotContain("lawsuit close route must not ingest Clio batch", lawsuitClose, "ingestMattersFromClioBatch");
./scripts/verify-master-email-strict-display-filter-safety.mjs:20:requireContains("master display select", "clioMasterDisplayNumber: true");
./scripts/verify-master-email-strict-display-filter-safety.mjs:23:requireContains("clio display filter", "{ clioDisplayNumber: mappedMasterDisplayNumber }");
./scripts/verify-master-email-strict-display-filter-safety.mjs:33:requireContains("no Clio writes", "clioRecordsChanged: false");
./scripts/verify-master-email-strict-display-filter-safety.mjs:39:forbidContains("Clio fetch", "clioFetch(");
./scripts/verify-direct-matter-document-activity-ui-safety.mjs:29:const helperEnd = page.indexOf("function renderMatterClioDocumentsPanel()");
./scripts/verify-direct-matter-document-activity-ui-safety.mjs:37:  "uploadFinalDocumentsToClio",
./scripts/verify-direct-matter-document-activity-ui-safety.mjs:46:const viewButtonIndex = page.indexOf("Open the Direct Matter Clio document picker.");
./scripts/verify-settlement-writeback-safety.mjs:33:  assertContains(label, route, 'action: "legacy-clio-settlement-route-disabled"');
./scripts/verify-settlement-writeback-safety.mjs:36:  assertContains(label, route, "This legacy Clio settlement operational route is disabled.");
./scripts/verify-settlement-writeback-safety.mjs:40:  assertContains(label, route, "clioRecordsChanged: false");
./scripts/verify-settlement-writeback-safety.mjs:49:  assertNotContains(label, route, "written-to-clio");
./scripts/verify-settlement-writeback-safety.mjs:51:  assertNotContains(label, route, "settlementClioWriteback");
./scripts/verify-settlement-writeback-safety.mjs:53:  assertNotContains(label, route, "clioFetch(");
./scripts/verify-settlement-writeback-safety.mjs:63:assertContains("history route", historyRoute, "noClioRecordsChanged: true");
./scripts/verify-settlement-writeback-safety.mjs:70:assertNotContains("history route", historyRoute, "clioFetch(");
./scripts/verify-settlement-writeback-safety.mjs:76:assertContains("settlement preview", settlementPreview, "does not write to Clio");
./scripts/verify-settlement-writeback-safety.mjs:83:console.log("Legacy Clio settlement writeback routes remain disabled.");
./scripts/verify-settlement-writeback-safety.mjs:84:console.log("No Clio calls were made by this verifier.");
./scripts/verify-clio-master-crossref-confirm-safety.mjs:28:const routePath = "app/api/documents/clio-master-crossref-confirm/route.ts";
./scripts/verify-clio-master-crossref-confirm-safety.mjs:34:console.log("=== CLIO MASTER CROSSREF CONFIRM SAFETY VERIFICATION ===");
./scripts/verify-clio-master-crossref-confirm-safety.mjs:37:mustContain(routePath, route, 'action: "clio-master-crossref-confirm"');
./scripts/verify-clio-master-crossref-confirm-safety.mjs:39:mustContain(routePath, route, "WRITE CLIO CROSSREF");
./scripts/verify-clio-master-crossref-confirm-safety.mjs:45:mustContain(routePath, route, "clioRecordsChanged: true");
./scripts/verify-clio-master-crossref-confirm-safety.mjs:53:mustNotContain(routePath, route, "uploadBufferToClioMatterDocuments");
./scripts/verify-clio-master-crossref-confirm-safety.mjs:58:if (packageJson.includes('"verify:clio-master-crossref-confirm-safety"')) {
./scripts/verify-clio-master-crossref-confirm-safety.mjs:65:  console.error(`=== CLIO MASTER CROSSREF CONFIRM SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-clio-master-crossref-confirm-safety.mjs:69:console.log("=== CLIO MASTER CROSSREF CONFIRM SAFETY PASSED ===");
./scripts/verify-provider-client-invoice-cost-expended-reinvoice-safety.mjs:52:mustContain("finalize route", finalize, "does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue");
./scripts/verify-provider-client-invoice-cost-expended-reinvoice-safety.mjs:59:mustNotMatch("preview route", preview, /clioFetch|fetchClio|updateClio|from\s+["'][^"']*clio/i, "Clio operational dependency");
./scripts/verify-settlement-document-artifact-contract-usage-safety.mjs:28:check("settlement route does not upload to Clio", !route.includes("uploadDocumentToClio"));
./scripts/verify-document-template-replacement-versioning-safety.mjs:27:assert(route.includes("clioWrites: false"), "replacement route safety blocks Clio writes");
./scripts/verify-admin-users-phase6-negative-path-diagnostics-readiness-safety.mjs:88:    "writeClio",
./scripts/verify-lawsuit-sibling-local-data-contract.mjs:31:  'Search must not fallback to Clio',
./scripts/verify-lawsuit-sibling-local-data-contract.mjs:42:for (const marker of ['noClioRead', 'noClioWrite', 'noClioHydration']) {
./scripts/verify-lawsuit-sibling-local-data-contract.mjs:58:  if (/\/api\/clio\/matter-context|custom_field_values|customFieldValues|fetchMatterFromClio|getMatterFromClio|Clio API source of truth/i.test(text)) {
./scripts/verify-lawsuit-sibling-local-data-contract.mjs:59:    failures.push(`${rel}: local lawsuit generation route contains forbidden Clio operational/hydration language`);
./scripts/verify-direct-visible-popup-standardization-safety.mjs:17:  docActivity: sliceBetween("docActivity", "function renderMatterDocumentActivityPopup()", "function renderMatterClioDocumentsPanel()"),
./scripts/verify-master-view-documents-button-safety.mjs:44:mustNotContain("master Clio write action", "loadMasterDocumentDataPreviewToClio");
./scripts/verify-claimcluster-cache-contract.mjs:30:  'ClaimClusterCache must not import or call Clio helpers',
./scripts/verify-claimcluster-cache-contract.mjs:31:  'ClaimClusterCache must not contain Clio custom-field logic',
./scripts/verify-claimcluster-cache-contract.mjs:47:  if (/clioFetch|fetchMatterFromClio|getMatterFromClio|ingestMatterFromClio|ingestMattersFromClioBatch|custom_field_values|customFieldValues|\/api\/clio\/matter-context|matter-context/u.test(text)) {
./scripts/verify-claimcluster-cache-contract.mjs:48:    failures.push(`${cacheHelperPath}: must not contain Clio operational/hydration/custom-field logic`);
./scripts/verify-claimcluster-cache-contract.mjs:56:  if (!text.includes('legacyClioOperationalRouteBlocked')) {
./scripts/verify-claimcluster-cache-contract.mjs:60:  if (/clioFetch|fetchMatterFromClio|getMatterFromClio|ingestMatterFromClio|ingestMattersFromClioBatch|custom_field_values|customFieldValues/u.test(text)) {
./scripts/verify-claimcluster-cache-contract.mjs:61:    failures.push(`${blockedRefreshClusterPath}: blocked route must not contain active Clio operational code`);
./scripts/verify-admin-lawsuit-audit-safety.mjs:54:  "missing-master-clio-shell-mapping",
./scripts/verify-admin-lawsuit-audit-safety.mjs:55:  "partial-master-clio-shell-mapping",
./scripts/verify-admin-lawsuit-audit-safety.mjs:80:  "clioFetch",
./scripts/verify-admin-lawsuit-audit-safety.mjs:87:  "deleteClioShell",
./scripts/verify-admin-lawsuit-audit-safety.mjs:116:  "call Clio",
./scripts/verify-admin-lawsuit-audit-safety.mjs:144:  "deleteClioShell",
./scripts/verify-admin-lawsuit-audit-safety.mjs:145:  "clioFetch",
./scripts/verify-admin-lawsuit-audit-safety.mjs:176:console.log("PASS: Admin Lawsuit/master audit is read-only, local-only, verifier-covered, and exposes no restore/Clio/document/email/print/write/deaggregate/delete controls.");
./scripts/verify-graph-live-token-test-safety.mjs:54:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-graph-live-token-test-safety.mjs:66:mustNotContain(routePath, route, "clioFetch(");
./scripts/verify-graph-thread-sync-preview-safety.mjs:40:  'clioRecordsChanged: false',
./scripts/verify-graph-thread-sync-preview-safety.mjs:57:console.log("\\n=== VERIFY NO DRAFT/SEND/DB/CLIO MUTATION ===");
./scripts/verify-graph-thread-sync-preview-safety.mjs:68:  'clioFetch(',
./scripts/verify-graph-thread-sync-preview-safety.mjs:77:console.log("Route does not create drafts, send email, persist mailbox records, write Clio, or modify database records.");
./scripts/verify-document-generation-action-launch-safety.mjs:55:mustNotContain(direct, directPath, "direct Clio write action", "loadMatterDocumentDataPreviewToClio");
./scripts/verify-document-generation-action-launch-safety.mjs:56:mustNotContain(master, masterPath, "master Clio write action", "loadMasterDocumentDataPreviewToClio");
./scripts/verify-admin-client-remittance-source-safety.mjs:107:mustContain("admin client detail route", route, "It does not call Clio");
./scripts/verify-admin-client-remittance-source-safety.mjs:119:mustContain("admin client detail route", route, "noClioRecordsChanged: true");
./scripts/verify-admin-client-remittance-source-safety.mjs:121:mustNotMatch("admin client detail route", route, /from\s+["'][^"']*clio/i, "Clio import");
./scripts/verify-admin-client-remittance-source-safety.mjs:122:mustNotMatch("admin client detail route", route, /\bclioFetch\s*\(/i, "clioFetch call");
./scripts/verify-admin-client-remittance-source-safety.mjs:123:mustNotMatch("admin client detail route", route, /\bfetchClio\s*\(/i, "fetchClio call");
./scripts/verify-admin-client-remittance-source-safety.mjs:124:mustNotMatch("admin client detail route", route, /\bupdateClio\b/i, "updateClio reference");
./scripts/verify-admin-client-remittance-source-safety.mjs:160:mustNotContain("admin client page obsolete inline preview copy", page, "This preview does not create invoices, write remittances, or update Clio");
./scripts/verify-admin-client-remittance-source-safety.mjs:181:console.log("No Clio records are changed by this workflow.");
./scripts/verify-court-calendar-webcivil-local-import-safety.mjs:23:  "clioRecordsChanged: false",
./scripts/verify-court-calendar-webcivil-local-import-safety.mjs:37:  "clioApi",
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:28:  'app/api/claim-index/rebuild is a quarantined legacy Clio operational route',
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:29:  'app/api/advanced-search/hydrate is a quarantined legacy Clio hydration route',
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:31:  'must not query Clio',
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:57:  if (!text.includes('legacyClioOperationalRouteBlocked')) {
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:58:    failures.push(`${rel}: must remain blocked with legacyClioOperationalRouteBlocked`);
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:61:  if (/clioFetch|fetchMatterFromClio|getMatterFromClio|custom_field_values|customFieldValues|ingestMatterFromClio|ingestMattersFromClioBatch/u.test(text)) {
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:62:    failures.push(`${rel}: blocked route must not contain active Clio operational/hydration code`);
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:72:  { label: 'Clio fetch/helper', re: /clioFetch|fetchMatterFromClio|getMatterFromClio|ingestMatterFromClio|ingestMattersFromClioBatch/u },
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:73:  { label: 'Clio custom fields', re: /custom_field_values|customFieldValues/u },
./scripts/verify-claimindex-legacy-deprecation-contract.mjs:74:  { label: 'legacy matter-context', re: /\/api\/clio\/matter-context|matter-context/u },
./scripts/verify-vercel-background-email-cron-safety.mjs:59:mustContain(knownThreadRoutePath, knownThreadRoute, "clioRecordsChanged: false");
./scripts/verify-vercel-background-email-cron-safety.mjs:72:mustContain(maildropRoutePath, maildropRoute, "clioRecordsChanged: false");
./scripts/verify-clio-document-list-readonly-safety.mjs:3:const routePath = "app/api/documents/clio-matter-documents/route.ts";
./scripts/verify-clio-document-list-readonly-safety.mjs:4:const helperPath = "lib/clioDocumentUpload.ts";
./scripts/verify-clio-document-list-readonly-safety.mjs:20:    label: "route uses existing listClioMatterDocuments helper",
./scripts/verify-clio-document-list-readonly-safety.mjs:22:      route.includes("listClioMatterDocuments") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:23:      route.includes('from "@/lib/clioDocumentUpload"') &&
./scripts/verify-clio-document-list-readonly-safety.mjs:24:      helper.includes("export async function listClioMatterDocuments"),
./scripts/verify-clio-document-list-readonly-safety.mjs:30:      route.includes("clioRecordsChanged: false") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:39:    label: "route does not call Clio upload/finalize helpers",
./scripts/verify-clio-document-list-readonly-safety.mjs:41:      !route.includes("uploadBufferToClioMatterDocuments") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:52:    label: "master lawsuit path requires explicit clioMasterMatterId mapping",
./scripts/verify-clio-document-list-readonly-safety.mjs:54:      route.includes("clioMasterMatterId") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:55:      route.includes("No mapped Clio master matter ID exists") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:56:      route.includes("Refusing to list Clio documents without an explicit mapping"),
./scripts/verify-clio-document-list-readonly-safety.mjs:61:      route.includes("clioDocumentId") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:62:      route.includes("clioDocumentName") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:78:    label: "direct matter path resolves real Clio matter id by BRL display number",
./scripts/verify-clio-document-list-readonly-safety.mjs:80:      route.includes("resolveClioMatterByDisplayNumber") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:81:      route.includes("claim-index + clio-display-number-resolution") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:82:      route.includes("clioResolution.clioMatterId") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:88:      route.includes("Could not resolve real Clio matter id") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:106:  console.error(`\nFAIL: ${failed} Clio document read-only safety check(s) failed.`);
./scripts/verify-clio-document-list-readonly-safety.mjs:110:console.log("\nPASS: Clio document listing route is read-only and fail-closed for unmapped master lawsuits.");
./scripts/verify-invoice-detail-frozen-line-display-safety.mjs:83:mustContain("detail route", detailRoute, "This route does not create, finalize, update, void, remit, print, email, queue, mutate source payment rows, update ClaimIndex, or mutate Clio.");
./scripts/verify-invoice-detail-frozen-line-display-safety.mjs:118:mustContain("finalize route", finalizeRoute, "does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records");
./scripts/normalize-provider-client-display-names.mjs:238:  console.log("WRITES_CLIO=false");
./scripts/restore-local-indexes-preview.mjs:51:console.log(`PULLS_DOCUMENTS_FROM_CLIO=${manifest.documentFilePolicy?.pullsDocumentsFromClio ? 'YES' : 'NO'}`);
./scripts/verify-admin-backup-audit-report-safety.mjs:71:console.log('PASS: Backup audit report is read-only with client-side copy/CSV only and no restore/delete/Clio/email/document/print behavior.');
./scripts/verify-direct-matter-document-packet-safety.mjs:34:mustContain("clioCorrectnessDependency false", "clioCorrectnessDependency: false");
./scripts/verify-direct-matter-document-packet-safety.mjs:44:mustContain("local-only refresh reason", "local-direct-matter-document-packet-no-clio-refresh");
./scripts/verify-direct-matter-document-packet-safety.mjs:46:mustNotContain("clioFetch", "clioFetch(");
./scripts/verify-direct-matter-document-packet-safety.mjs:47:mustNotContain("ingestMattersFromClioBatch", "ingestMattersFromClioBatch");
./scripts/verify-direct-matter-document-packet-safety.mjs:50:mustNotContain("Clio refresh warning", "refreshed from Clio");
./scripts/verify-provider-client-invoice-lifecycle-backend-safety.mjs:94:  mustNotMatch(label, body, /from\s+["'][^"']*clio/i, "Clio import");
./scripts/verify-provider-client-invoice-lifecycle-backend-safety.mjs:95:  mustNotMatch(label, body, /\bclioFetch\s*\(/i, "clioFetch call");
./scripts/verify-document-activity-trace-ui-safety.mjs:22:assert(historyRoute.includes("Target ${target}"), "finalization activity label includes target Clio matter");
./scripts/verify-document-activity-trace-ui-safety.mjs:27:assert(historyRoute.includes("clioUploadTarget"), "trace metadata includes clioUploadTarget");
./scripts/verify-reference-import-history-safety.mjs:30:if (!route.includes("noClioRecordsChanged: true")) {
./scripts/verify-reference-import-history-safety.mjs:31:  fail("Import history route must state no Clio records changed.");
./scripts/verify-reference-import-history-safety.mjs:46:  "clioFetch",
./scripts/verify-reference-import-history-safety.mjs:94:if (!page.includes("does not modify local records or Clio")) {
./scripts/verify-reference-import-history-safety.mjs:95:  fail("History panel must state it is read-only and does not modify local records or Clio.");
./scripts/verify-reference-import-history-safety.mjs:118:if (!page.includes("It does not modify local records, Clio, documents, or the print queue")) {
./scripts/verify-reference-import-history-safety.mjs:119:  fail("Import detail popup must clearly state it is read-only and does not modify records or Clio.");
./scripts/verify-local-index-status-route-safety.mjs:44:  { label: 'Clio fetch/helper', re: /clioFetch|fetchMatterFromClio|getMatterFromClio|ingestMatterFromClio|ingestMattersFromClioBatch/u },
./scripts/verify-local-index-status-route-safety.mjs:45:  { label: 'Clio custom fields', re: /custom_field_values|customFieldValues/u },
./scripts/verify-local-index-status-route-safety.mjs:46:  { label: 'legacy matter context', re: /\/api\/clio\/matter-context|matter-context/u },
./scripts/verify-document-artifact-contract-safety.mjs:28:check("safety flags exist", text.includes("noProductionTemplatePretended") && text.includes("noPdfPretended") && text.includes("noClioUploadPretended"));
./scripts/verify-document-artifact-contract-safety.mjs:34:check("helper does not call Clio", !text.includes("uploadDocumentToClio"));
./scripts/verify-admin-lawsuit-cleanup-history-safety.mjs:28:mustContain("preview route reports no Clio writes", route, "writesClio: false");
./scripts/verify-admin-lawsuit-cleanup-history-safety.mjs:29:mustContain("preview route reports no Clio deletes", route, "deletesClio: false");
./scripts/verify-admin-lawsuit-cleanup-history-safety.mjs:34:mustNotContain("preview route must not call Clio", route, "clioFetch");
./scripts/verify-admin-lawsuit-cleanup-history-safety.mjs:40:mustContain("page displays Clio shell status from history", page, "clioStatus");
./scripts/verify-admin-lawsuit-cleanup-history-safety.mjs:51:console.log("EXPECTS_NO_CLIO_CALLS=YES");
./scripts/verify-settled-with-reference-contacts-seed-safety.mjs:106:mustNotContain("settled-with seed", seed, "getValidClioAccessToken");
./scripts/verify-settled-with-reference-contacts-seed-safety.mjs:107:mustNotContain("settled-with seed", seed, "clioFetch");
./scripts/verify-settled-with-reference-contacts-seed-safety.mjs:108:mustNotContain("settled-with seed", seed, "CLIO_API_BASE");
./scripts/verify-maildrop-address-registry-safety.mjs:50:const resolveRoute = read("app/api/documents/clio-maildrop-resolve/route.ts");
./scripts/verify-maildrop-address-registry-safety.mjs:59:  /clioMaildropEmail\s+String\??\s+@unique/,
./scripts/verify-maildrop-address-registry-safety.mjs:60:  "clioMaildropEmail String/String? @unique"
./scripts/verify-maildrop-address-registry-safety.mjs:66:mustContain("prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql", migration, 'CREATE UNIQUE INDEX "MaildropAddress_clioMaildropEmail_key"');
./scripts/verify-maildrop-address-registry-safety.mjs:69:mustContain("prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql", migration, 'ON CONFLICT ("clioMaildropEmail") DO UPDATE');
./scripts/verify-maildrop-address-registry-safety.mjs:87:console.log("=== VERIFY CLIO MAILDROP RESOLVE UPSERTS LOCAL REGISTRY ONLY ===");
./scripts/verify-maildrop-address-registry-safety.mjs:88:mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'import { upsertMaildropAddress } from "@/lib/graph/maildropRegistry";');
./scripts/verify-maildrop-address-registry-safety.mjs:89:mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, "await upsertMaildropAddress");
./scripts/verify-maildrop-address-registry-safety.mjs:90:mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'source: "clio_maildrop_resolve"');
./scripts/verify-maildrop-address-registry-safety.mjs:91:mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'route: "/api/documents/clio-maildrop-resolve"');
./scripts/verify-maildrop-address-registry-safety.mjs:98:  "clio.documents",
./scripts/verify-maildrop-address-registry-safety.mjs:100:  "clioDocumentUpload",
./scripts/verify-maildrop-address-registry-safety.mjs:101:  "settlementClioWriteback",
./scripts/verify-maildrop-address-registry-safety.mjs:115:console.log("MailDrop registry schema, migration, helper, discovery usage, and Clio MailDrop resolve upsert behavior are verified.");
./scripts/verify-maildrop-address-registry-safety.mjs:116:console.log("No draft creation, email sending, Clio document upload, or settlement writeback is wired through the MailDrop registry helper.");
./scripts/verify-document-delivery-draft-preview-safety.mjs:110:  "clioRecordsChanged: false",
./scripts/verify-clio-master-crossref-preview-safety.mjs:28:const routePath = "app/api/documents/clio-master-crossref-preview/route.ts";
./scripts/verify-clio-master-crossref-preview-safety.mjs:34:console.log("=== CLIO MASTER CROSSREF PREVIEW SAFETY VERIFICATION ===");
./scripts/verify-clio-master-crossref-preview-safety.mjs:37:mustContain(routePath, route, 'action: "clio-master-crossref-preview"');
./scripts/verify-clio-master-crossref-preview-safety.mjs:39:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-clio-master-crossref-preview-safety.mjs:44:mustContain(routePath, route, "WRITE CLIO CROSSREF");
./scripts/verify-clio-master-crossref-preview-safety.mjs:47:mustContain(routePath, route, "${masterLawsuitId} / ${clean(lawsuit.clioMasterDisplayNumber)}");
./scripts/verify-clio-master-crossref-preview-safety.mjs:48:mustContain(routePath, route, "readClioMatter");
./scripts/verify-clio-master-crossref-preview-safety.mjs:62:if (packageJson.includes('"verify:clio-master-crossref-preview-safety"')) {
./scripts/verify-clio-master-crossref-preview-safety.mjs:69:  console.error(`=== CLIO MASTER CROSSREF PREVIEW SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-clio-master-crossref-preview-safety.mjs:73:console.log("=== CLIO MASTER CROSSREF PREVIEW SAFETY PASSED ===");
./scripts/verify-provider-client-invoice-finalize-safety.mjs:47:mustContain("route", route, "does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue");
./scripts/verify-provider-client-invoice-finalize-safety.mjs:53:mustNotMatch("route", route, /clioFetch|fetchClio|updateClio|from\s+["'][^"']*clio/i, "Clio operational dependency");
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:12:assert(route.includes("legacyClioOperationalRouteBlocked"), "settlement close preview must be quarantined behind legacyClioOperationalRouteBlocked.");
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:13:assert(route.includes('legacyClioOperationalRouteBlocked("app/api/settlements/close-preview")'), "settlement close preview must identify its blocked route.");
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:16:  "clioFetch",
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:17:  "fetchClio",
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:18:  "getClio",
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:19:  "ingestMattersFromClioBatch",
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:29:console.log("RESULT: settlement close preview Clio eliminated safety");
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:31:console.log("WRITES_CLIO=false");
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:32:console.log("READS_CLIO=false");
./scripts/verify-settlement-close-preview-clio-eliminated-safety.mjs:34:console.log("PASS: settlement close preview is blocked/quarantined with no Clio or local DB mutation.");
./scripts/verify-local-first-payment-safety.mjs:27:    label: "clioFetch import/use",
./scripts/verify-local-first-payment-safety.mjs:28:    pattern: /\bclioFetch\b/,
./scripts/verify-local-first-payment-safety.mjs:35:    label: "direct Clio matter API path",
./scripts/verify-local-first-payment-safety.mjs:47:    label: "Clio custom field write payload",
./scripts/verify-local-first-payment-safety.mjs:51:    label: "Clio system-of-record language",
./scripts/verify-local-first-payment-safety.mjs:52:    pattern: /systemOfRecordAfterWriteback\s*:\s*["']Clio readback["']/,
./scripts/verify-local-first-payment-safety.mjs:62:pass("apply-payment route has no Clio fetch/write or ClaimIndex refresh references.");
./scripts/verify-local-first-payment-safety.mjs:88:    pattern: /clioWriteAttempted\s*:\s*false/,
./scripts/verify-local-first-payment-safety.mjs:117:    label: "old Clio payment writeback void copy",
./scripts/verify-local-first-payment-safety.mjs:118:    pattern: /Clio Payment Voluntary \/ Balance Presuit writeback/,
./scripts/verify-local-document-packet-safety.mjs:33:mustContain("clioCorrectnessDependency false", "clioCorrectnessDependency: false");
./scripts/verify-local-document-packet-safety.mjs:38:mustContain("local-only refresh reason", "local-document-packet-no-clio-refresh");
./scripts/verify-local-document-packet-safety.mjs:48:mustNotContain("ingestMattersFromClioBatch", "ingestMattersFromClioBatch");
./scripts/verify-local-document-packet-safety.mjs:51:mustNotContain("Clio refresh warning", "refreshed from Clio");
./scripts/verify-local-document-packet-safety.mjs:55:mustNotContain("clioFetch in packet route", "clioFetch(");
./scripts/verify-admin-generic-tickler-search-route-safety.mjs:33:mustInclude("no Clio writes flag", route, "clioWritesPerformed: false");
./scripts/verify-admin-generic-tickler-search-route-safety.mjs:93:mustNotInclude("route Clio fetch", route, "clioFetch");
./scripts/verify-admin-backup-log-archive-action-safety.mjs:20:  'does not touch stdout, backups, manifests, database dumps, restore workflows, alert state, Clio, email, documents, or the print queue',
./scripts/verify-admin-backup-log-archive-action-safety.mjs:43:  'clioWrite: false',
./scripts/verify-admin-backup-log-archive-action-safety.mjs:64:  'clioFetch',
./scripts/verify-admin-backup-log-archive-action-safety.mjs:65:  '@/lib/clio',
./scripts/verify-admin-backup-log-archive-action-safety.mjs:89:console.log('PASS: Guarded log archive action only archives launchd.err.log with exact confirmation and no restore/delete/Clio/email/document/print behavior.');
./scripts/verify-print-queue-title-copy-safety.mjs:23:mustNotContain("removed no-Clio-change sentence", "This page does not change Clio documents, upload files, create folders, or modify document contents.");
./scripts/verify-graph-local-thread-preview-safety.mjs:47:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-graph-local-thread-preview-safety.mjs:54:mustContain(routePath, route, "clioMaildropEmailPresent");
./scripts/verify-graph-local-thread-preview-safety.mjs:64:mustNotContain(routePath, route, "clioFetch(");
./scripts/verify-direct-financial-section-readonly-safety.mjs:37:forbidText("old stored-balance fallback", page, "const clioBalance = num(raw)");
./scripts/verify-admin-custom-template-import-ui-safety.mjs:35:check("custom import displays no Clio/email/print safety", page.includes("customTemplateConfirmResult.safety?.clioRecordsChanged"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:41:check("custom UI does not upload files", !page.includes("uploadDocumentToClio") && !page.includes("FormData") && !page.includes("readAsArrayBuffer"));
./scripts/verify-close-paid-settlements-safety.mjs:30:mustContain("settlement close shortcut remains blocked", settlementCloseRoute, "legacyClioOperationalRouteBlocked");
./scripts/verify-close-paid-settlements-safety.mjs:32:mustNotContain("settlement close shortcut must not call guarded helper", settlementCloseRoute, "syncClioMatterClosed");
./scripts/verify-close-paid-settlements-safety.mjs:33:mustNotContain("settlement close shortcut must not call guarded helper", settlementCloseRoute, "syncClioMattersClosed");
./scripts/verify-close-paid-settlements-safety.mjs:36:mustContain("guarded lawsuit close route performs Clio close sync", lawsuitCloseRoute, "syncClioMattersClosed");
./scripts/verify-close-paid-settlements-safety.mjs:37:mustContain("guarded lawsuit close route blocks local commit on Clio failure", lawsuitCloseRoute, "Local lawsuit close was not committed.");
./scripts/verify-close-paid-settlements-safety.mjs:43:mustContain("matter page says Clio sync must succeed first", matterPage, "Clio close sync must succeed before local close records are committed");
./scripts/verify-provider-client-display-normalization-safety.mjs:23:mustContain("script states no Clio writes", script, "WRITES_CLIO=false");
./scripts/verify-provider-client-display-normalization-safety.mjs:38:console.log("EXPECTS_NO_CLIO_WRITE=YES");
./scripts/test-settlement-blocked-audit-local.sh:42:  and .safety.noClioRecordsChanged == true
./scripts/test-settlement-blocked-audit-local.sh:68:  and .safety.noClioRecordsChanged == true
./scripts/test-settlement-blocked-audit-local.sh:99:  and .safety.noClioRecordsChanged == true
./scripts/test-settlement-blocked-audit-local.sh:107:echo "No successful Clio write was requested."
./scripts/verify-local-settlement-tickler-foundation-safety.mjs:55:  "clioRecordsChanged: false",
./scripts/verify-local-settlement-tickler-foundation-safety.mjs:66:  "clio.",
./scripts/verify-local-settlement-tickler-foundation-safety.mjs:67:  "clioDocumentUpload",
./scripts/verify-local-settlement-tickler-foundation-safety.mjs:68:  "fetch(\"https://app.clio.com",
./scripts/verify-admin-template-merge-field-visibility-filter.mjs:28:check("filter does not upload files", !page.includes("uploadDocumentToClio") && !page.includes("FormData") && !page.includes("readAsArrayBuffer"));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:31:check("does not upload file to Clio", !page.includes("uploadDocumentToClio"));
./scripts/verify-provider-fee-defaults-safety.mjs:44:mustContain("provider fee defaults route", route, 'action: "legacy-clio-settlement-route-disabled"');
./scripts/verify-provider-fee-defaults-safety.mjs:48:mustContain("provider fee defaults route", route, "This legacy Clio settlement operational route is disabled.");
./scripts/verify-provider-fee-defaults-safety.mjs:52:mustContain("provider fee defaults route", route, "clioRecordsChanged: false");
./scripts/verify-provider-fee-defaults-safety.mjs:66:mustNotContain("provider fee defaults route", route, "clioFetch(");
./scripts/verify-provider-fee-defaults-safety.mjs:70:console.log("=== VERIFY OLD CLIO PROVIDER DEFAULT CONTRACT IS NOT RESTORED ===");
./scripts/verify-provider-fee-defaults-safety.mjs:100:console.log("Legacy Clio provider fee defaults route remains disabled.");
./scripts/verify-provider-fee-defaults-safety.mjs:101:console.log("No Clio records were changed by this verifier.");
./scripts/verify-direct-document-generation-popup-standard-safety.mjs:91:requireNotIncludes(printQueueFn, "could not identify the lawsuit ID or Clio direct matter ID", "old direct print queue lawsuit-id blocker");
./scripts/verify-direct-matter-email-thread-ui-safety.mjs:111:  'clioRecordsChanged: false',
./scripts/verify-direct-matter-email-thread-ui-safety.mjs:137:console.log("\n=== VERIFY NO DIRECT DRAFT/SEND/CLIO WRITE WIRING INSIDE DIRECT EMAILS PANEL ===");
./scripts/verify-direct-matter-email-thread-ui-safety.mjs:148:mustContain("verifier", read("scripts/verify-direct-matter-email-thread-ui-safety.mjs"), "VERIFY NO DIRECT DRAFT/SEND/CLIO WRITE WIRING INSIDE DIRECT EMAILS PANEL");
./scripts/verify-direct-matter-email-thread-ui-safety.mjs:161:console.log("Opening the panel auto-loads local records only; hidden debug controls do not create drafts, send email, write Clio, or write database records.");
./scripts/verify-clio-maildrop-inspection-safety.mjs:28:const routePath = "app/api/documents/clio-maildrop-inspect/route.ts";
./scripts/verify-clio-maildrop-inspection-safety.mjs:34:console.log("=== CLIO MAILDROP INSPECTION SAFETY VERIFICATION ===");
./scripts/verify-clio-maildrop-inspection-safety.mjs:37:mustContain(routePath, route, 'action: "clio-maildrop-inspection"');
./scripts/verify-clio-maildrop-inspection-safety.mjs:39:mustContain(routePath, route, "clioRecordsChanged: false");
./scripts/verify-clio-maildrop-inspection-safety.mjs:46:mustContain(routePath, route, "clioMasterMatterId");
./scripts/verify-clio-maildrop-inspection-safety.mjs:58:if (packageJson.includes('"verify:clio-maildrop-inspection-safety"')) {
./scripts/verify-clio-maildrop-inspection-safety.mjs:65:  console.error(`=== CLIO MAILDROP INSPECTION SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-clio-maildrop-inspection-safety.mjs:69:console.log("=== CLIO MAILDROP INSPECTION SAFETY PASSED ===");
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:9:  "lib/clioUpdateCustomFields.ts",
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:10:  "lib/clioWrite.ts",
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:12:  "lib/getMasterIdFromClio.ts",
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:15:  "lib/ingestMatterFromClio.ts",
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:28:  "@/lib/clioUpdateCustomFields",
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:29:  "@/lib/clioWrite",
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:31:  "@/lib/getMasterIdFromClio",
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:34:  "@/lib/ingestMatterFromClio",
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:72:  `Forbidden legacy operational Clio references remain in active app/lib code:\n${offenders.join("\n")}`
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:75:console.log("RESULT: legacy operational Clio modules deleted");
./scripts/verify-legacy-operational-clio-modules-deleted.mjs:76:console.log("LEGACY_CLIO_MODULE_DELETE_STATUS=0");
./scripts/smoke-workflow.sh:14:  status="$(curl -s -o /tmp/clio-smoke-body.txt -w "%{http_code}" -I "${BASE_URL}${path}")"
./scripts/smoke-workflow.sh:47:  if { [ "$packet_reason" = "local-document-packet-no-clio-refresh" ] || [ "$packet_has_missing_fixture_errors" = "true" ]; } && [ "$packet_blocking_count" != "0" ]; then
./scripts/smoke-workflow.sh:98:    clioDocumentId
./scripts/verify-clio-master-mapping-schema-safety.mjs:29:const migrationPath = "prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql";
./scripts/verify-clio-master-mapping-schema-safety.mjs:36:console.log("=== CLIO MASTER MAPPING SCHEMA SAFETY VERIFICATION ===");
./scripts/verify-clio-master-mapping-schema-safety.mjs:38:mustContain(schemaPath, schema, "clioMasterMatterId");
./scripts/verify-clio-master-mapping-schema-safety.mjs:39:mustContain(schemaPath, schema, "clioMasterDisplayNumber");
./scripts/verify-clio-master-mapping-schema-safety.mjs:40:mustContain(schemaPath, schema, "clioMasterMatterDescription");
./scripts/verify-clio-master-mapping-schema-safety.mjs:41:mustContain(schemaPath, schema, "clioMasterMappedAt");
./scripts/verify-clio-master-mapping-schema-safety.mjs:42:mustContain(schemaPath, schema, "clioMasterMappingSource");
./scripts/verify-clio-master-mapping-schema-safety.mjs:43:mustContain(schemaPath, schema, "@@index([clioMasterMatterId])");
./scripts/verify-clio-master-mapping-schema-safety.mjs:44:mustContain(schemaPath, schema, "@@index([clioMasterDisplayNumber])");
./scripts/verify-clio-master-mapping-schema-safety.mjs:47:mustContain(migrationPath, migration, 'ADD COLUMN IF NOT EXISTS "clioMasterMatterId" INTEGER');
./scripts/verify-clio-master-mapping-schema-safety.mjs:48:mustContain(migrationPath, migration, 'ADD COLUMN IF NOT EXISTS "clioMasterDisplayNumber" TEXT');
./scripts/verify-clio-master-mapping-schema-safety.mjs:49:mustContain(migrationPath, migration, 'ADD COLUMN IF NOT EXISTS "clioMasterMatterDescription" TEXT');
./scripts/verify-clio-master-mapping-schema-safety.mjs:50:mustContain(migrationPath, migration, 'ADD COLUMN IF NOT EXISTS "clioMasterMappedAt" TIMESTAMP(3)');
./scripts/verify-clio-master-mapping-schema-safety.mjs:51:mustContain(migrationPath, migration, 'ADD COLUMN IF NOT EXISTS "clioMasterMappingSource" TEXT');
./scripts/verify-clio-master-mapping-schema-safety.mjs:52:mustContain(migrationPath, migration, 'CREATE INDEX IF NOT EXISTS "Lawsuit_clioMasterMatterId_idx"');
./scripts/verify-clio-master-mapping-schema-safety.mjs:53:mustContain(migrationPath, migration, 'CREATE INDEX IF NOT EXISTS "Lawsuit_clioMasterDisplayNumber_idx"');
./scripts/verify-clio-master-mapping-schema-safety.mjs:60:if (packageJson.includes('"verify:clio-master-mapping-schema-safety"')) {
./scripts/verify-clio-master-mapping-schema-safety.mjs:67:  console.error(`=== CLIO MASTER MAPPING SCHEMA SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-clio-master-mapping-schema-safety.mjs:71:console.log("=== CLIO MASTER MAPPING SCHEMA SAFETY PASSED ===");
./scripts/verify-master-document-preview-ui-safety.mjs:39:mustContain("explicit no generation language", "It does not generate documents, upload documents, write to Clio, or change the print queue.");
./scripts/verify-master-document-preview-ui-safety.mjs:43:mustNotContain("preview action writing to Clio", "loadMasterDocumentDataPreviewToClio");
./scripts/verify-master-email-thread-ui-safety.mjs:114:  "clioRecordsChanged: false",
./scripts/verify-master-email-thread-ui-safety.mjs:119:console.log("\n=== VERIFY NO DIRECT DRAFT/SEND/CLIO WRITE WIRING IN MASTER EMAILS UI PANEL ===");
./scripts/inventory-claimindex-legacy-status-cache.mjs:43:  ['legacy Clio operational block helper', /legacyClioOperationalRouteBlocked/g],
./scripts/verify-provider-client-invoice-create-preview-safety.mjs:61:mustNotMatch("route", route, /clioFetch|fetchClio|updateClio|from\s+["'][^"']*clio/i, "Clio operational dependency");
./scripts/verify-monitored-backup-launchagent-safety.mjs:24:    '/Users/dbarshay/clio-lawsuit-aggregator',
./scripts/verify-monitored-backup-launchagent-safety.mjs:50:    'clioFetch',
./scripts/verify-monitored-backup-launchagent-safety.mjs:51:    '@/lib/clio',
./scripts/verify-monitored-backup-launchagent-safety.mjs:52:    'CLIO_',
./scripts/verify-monitored-backup-launchagent-safety.mjs:53:    'documents/clio',
./scripts/verify-monitored-backup-launchagent-safety.mjs:89:console.log('PASS: LaunchAgent uses monitored backup with multi-recipient alerts and no restore/delete/Clio/document/print behavior.');
./scripts/verify-direct-matter-clio-operational-callers-removed.mjs:23:assert(source.includes("No Clio records were changed."), "Direct matter local lawsuit success message must confirm no Clio records changed.");
./scripts/verify-direct-matter-clio-operational-callers-removed.mjs:26:assert(!source.includes("FORCE fresh Clio-backed refresh"), "Direct matter close flow must not reference Clio refresh.");
./scripts/verify-direct-matter-clio-operational-callers-removed.mjs:28:console.log("RESULT: direct matter Clio operational callers removed");
./scripts/verify-direct-matter-clio-operational-callers-removed.mjs:29:console.log("DIRECT_MATTER_CLIO_CALLERS_STATUS=0");
./scripts/verify-direct-matter-clio-operational-callers-removed.mjs:33:console.log("CLIO_BACKED_OPERATIONAL_TEXT_REMOVED=true");
./scripts/verify-direct-matter-clio-operational-callers-removed.mjs:34:console.log("POST_CLOSE_CLIO_REFRESH_REMOVED=true");
./scripts/verify-admin-document-readiness-audit-safety.mjs:47:  "missing-master-clio-shell",
./scripts/verify-admin-document-readiness-audit-safety.mjs:48:  "partial-master-clio-shell",
./scripts/verify-admin-document-readiness-audit-safety.mjs:85:  "clioFetch",
./scripts/verify-admin-document-readiness-audit-safety.mjs:90:  "uploadDocumentToClio",
./scripts/verify-admin-document-readiness-audit-safety.mjs:113:  "does not call Clio",
./scripts/verify-admin-document-readiness-audit-safety.mjs:138:  "clioFetch",
./scripts/verify-admin-document-readiness-audit-safety.mjs:168:console.log("PASS: Admin Document Generation Readiness Audit is read-only, local-only, verifier-covered, and exposes no Clio/Graph/document-generation/finalization/upload/email/print/queue/restore/write controls.");
./scripts/verify-settlement-void-safety.mjs:22:mustNotContain("void route does not call Clio", route, "clioFetch");
./scripts/verify-local-settlement-record-preview-safety.mjs:50:  "clioRecordsChanged: false",
./scripts/verify-local-settlement-record-preview-safety.mjs:55:  "does not write the database, write Clio, generate documents, print, queue, or close matters",
./scripts/verify-local-settlement-record-preview-safety.mjs:60:  "clioFetch(",
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:40:console.log("=== LEGACY CLIO SETTLEMENT ROUTES DISABLED SAFETY VERIFICATION ===");
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:46:    'action: "legacy-clio-settlement-route-disabled"',
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:53:    "clioRecordsChanged: false",
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:63:    "clioFetch(",
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:64:    "writeSettlementToClio",
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:65:    "previewSettlementWritebackToClio",
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:70:    "clioRecordsChanged: true",
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:75:mustContain("package.json", packageJson, '"verify:legacy-clio-settlement-routes-disabled-safety"');
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:78:  console.error(`=== LEGACY CLIO SETTLEMENT ROUTES DISABLED SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-legacy-clio-settlement-routes-disabled-safety.mjs:82:console.log("=== LEGACY CLIO SETTLEMENT ROUTES DISABLED SAFETY PASSED ===");
./scripts/verify-clio-rule1-boundary-safety.mjs:34:console.log("=== VERIFY THE GOLDEN RULE CLIO BOUNDARY SAFETY ===");
./scripts/verify-clio-rule1-boundary-safety.mjs:37:  "verify:create-lawsuit-clio-shell-contract",
./scripts/verify-clio-rule1-boundary-safety.mjs:38:  "verify:clio-document-list-readonly-safety",
./scripts/verify-clio-rule1-boundary-safety.mjs:39:  "verify:clio-document-list-ui-safety",
./scripts/verify-clio-rule1-boundary-safety.mjs:40:  "verify:clio-maildrop-resolve-source-scope-safety",
./scripts/verify-clio-rule1-boundary-safety.mjs:52:mustContain("Graph draft", graphDraft, "clioFetch");
./scripts/verify-clio-rule1-boundary-safety.mjs:53:mustContain("Graph draft", graphDraft, "listClioMatterDocuments");
./scripts/verify-clio-rule1-boundary-safety.mjs:55:mustContain("Graph draft", graphDraft, "clioMaildropEmail");
./scripts/verify-clio-rule1-boundary-safety.mjs:57:mustContain("Graph draft", graphDraft, "context.clioMaildropEmail");
./scripts/verify-clio-rule1-boundary-safety.mjs:58:mustContain("Graph draft", graphDraft, "email: context.clioMaildropEmail");
./scripts/verify-clio-rule1-boundary-safety.mjs:59:mustContain("Graph draft", graphDraft, "clioRecordsChanged: false");
./scripts/verify-clio-rule1-boundary-safety.mjs:64:mustNotContain("Graph draft", graphDraft, "ingestMattersFromClioBatch");
./scripts/verify-clio-rule1-boundary-safety.mjs:79:  mustNotContain(file, text, "@/lib/clio");
./scripts/verify-clio-rule1-boundary-safety.mjs:80:  mustNotContain(file, text, "clioFetch(");
./scripts/verify-clio-rule1-boundary-safety.mjs:81:  mustNotContain(file, text, "uploadDocumentToClio");
./scripts/verify-clio-rule1-boundary-safety.mjs:85:const legacyBlocked = read("lib/legacyClioOperationalRouteBlocked.ts");
./scripts/verify-clio-rule1-boundary-safety.mjs:86:mustContain("legacy Clio block helper", legacyBlocked, "writesClio: false");
./scripts/verify-clio-rule1-boundary-safety.mjs:87:mustContain("legacy Clio block helper", legacyBlocked, "updatesClaimIndex: false");
./scripts/verify-clio-rule1-boundary-safety.mjs:104:  mustContain(file, text, "legacyClioOperationalRouteBlocked");
./scripts/verify-clio-rule1-boundary-safety.mjs:108:mustContain("matter close", matterClose, "syncClioMatterClosed");
./scripts/verify-clio-rule1-boundary-safety.mjs:109:mustContain("matter close", matterClose, "clioCloseSync");
./scripts/verify-clio-rule1-boundary-safety.mjs:111:// The Golden Rule requires future guarded Clio close sync from Barsh Matters close workflows.
./scripts/verify-clio-rule1-boundary-safety.mjs:112:pass("matter close implements guarded Clio close sync under The Golden Rule.");
./scripts/verify-clio-rule1-boundary-safety.mjs:115:mustContain("settlement close shortcut", settlementClose, "legacyClioOperationalRouteBlocked");
./scripts/verify-clio-rule1-boundary-safety.mjs:119:console.log("GOLDEN_RULE_CLIO_BOUNDARY=Clio owns IDs/numbers/document vault/MailDrop/operational close status; Barsh Matters owns workflows/local records/templates.");
./scripts/verify-clio-rule1-boundary-safety.mjs:120:console.log("ALLOWED_CLIO_SCOPE=matter shell creation, lawsuit shell creation, document storage/retrieval, MailDrop, guarded close-status sync.");
./scripts/verify-clio-rule1-boundary-safety.mjs:121:console.log("BLOCKED_CLIO_SCOPE=legacy hidden aggregation/deaggregation, generic hidden matter mutation, ClaimIndex hydration dependency, settlement close shortcut.");
./scripts/verify-clio-rule1-boundary-safety.mjs:126:  console.error(`=== GOLDEN RULE CLIO BOUNDARY SAFETY FAILED: ${failures} failure(s) ===`);
./scripts/verify-clio-rule1-boundary-safety.mjs:130:console.log("=== GOLDEN RULE CLIO BOUNDARY SAFETY PASSED ===");
./scripts/verify-advanced-picklists-local-reference-safety.mjs:27:mustContain("picklists route", route, "clioRead: false");
./scripts/verify-advanced-picklists-local-reference-safety.mjs:28:mustContain("picklists route", route, "clioWrite: false");
./scripts/verify-advanced-picklists-local-reference-safety.mjs:36:mustContain("picklists route", route, "noClioReadPerformed: true");
./scripts/verify-advanced-picklists-local-reference-safety.mjs:39:mustNotContain("picklists route no Clio import", route, 'import { clioFetch }');
./scripts/verify-advanced-picklists-local-reference-safety.mjs:40:mustNotContain("picklists route no clioFetch", route, "clioFetch(");
./scripts/verify-advanced-picklists-local-reference-safety.mjs:41:mustNotContain("picklists route no Clio field ids", route, "FIELD_IDS");
./scripts/verify-advanced-picklists-local-reference-safety.mjs:43:mustNotContain("picklists route no Clio custom fields", route, "/api/v4/custom_fields");
./scripts/verify-advanced-picklists-local-reference-safety.mjs:44:mustNotContain("picklists route no Clio matter stages", route, "/api/v4/matter_stages");
./scripts/seed-adversary-attorneys-reference.mjs:194:  console.log("WRITES_CLIO=false");
./scripts/verify-document-delivery-preview-ui-safety.mjs:57:  "Writes Clio: No",
./scripts/verify-admin-document-template-import-ui-safety.mjs:29:check("admin displays no Clio/email/print safety", page.includes("No Clio / email / print"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:32:check("admin does not upload files to Clio", !page.includes("uploadDocumentToClio"));
./scripts/verify-admin-claim-index-audit-safety.mjs:41:  "does not update ClaimIndex, restore data, call Clio, generate documents, send email, print, queue, or write the database",
./scripts/verify-admin-claim-index-audit-safety.mjs:78:  "clioFetch",
./scripts/verify-admin-claim-index-audit-safety.mjs:103:  "call Clio",
./scripts/verify-admin-claim-index-audit-safety.mjs:121:  "clioFetch",
./scripts/verify-admin-claim-index-audit-safety.mjs:150:console.log("PASS: Admin ClaimIndex data-quality audit is read-only, local-only, verifier-covered, and exposes no restore/Clio/document/email/print/write controls.");
./scripts/verify-provider-remittance-docx-safety.mjs:57:console.log("=== VERIFY NO CLIO / DATABASE / FILE / PRINT QUEUE MUTATION ===");
./scripts/verify-provider-remittance-docx-safety.mjs:58:mustContain("provider remittance route", providerRemittanceRoute, "noClioRecordsChanged: true");
./scripts/verify-provider-remittance-docx-safety.mjs:63:mustNotContain("provider remittance route", providerRemittanceRoute, "clioFetch(");
./scripts/verify-provider-remittance-docx-safety.mjs:64:mustNotContain("provider remittance route", providerRemittanceRoute, "uploadBufferToClioMatterDocuments");
./scripts/verify-provider-remittance-docx-safety.mjs:65:mustNotContain("provider remittance route", providerRemittanceRoute, "listClioMatterDocuments");
./scripts/verify-provider-remittance-docx-safety.mjs:100:mustNotContain("settlement documents preview route", previewRoute, "live-clio-read");
./scripts/verify-provider-remittance-docx-safety.mjs:101:mustNotContain("settlement documents preview route", previewRoute, "clioFetch(");
./scripts/verify-provider-remittance-docx-safety.mjs:117:console.log("No Clio records were changed by this verifier.");
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:26:    label: 'user-facing Clio-era rebuild instruction',
./scripts/verify-admin-backup-manifest-detail-safety.mjs:87:console.log('PASS: Backup manifest detail inspector is read-only and avoids restore/delete/Clio/email/document/print behavior.');
./scripts/verify-invoice-step4-finalize-output-safety.mjs:55:mustContain("invoice page", page, "This will not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records.");
./scripts/verify-invoice-step4-finalize-output-safety.mjs:219:mustContain("finalize route", finalizeRoute, "does not mutate Clio, ClaimIndex, source costs, documents, email, print, queue, or remittance records");
./scripts/verify-invoice-step4-finalize-output-safety.mjs:220:mustNotMatch("finalize route", finalizeRoute, /clioFetch|from\s+["'][^"']*clio/i, "Clio operational dependency");
```

## Clio matter identifiers

```text
./prisma/schema.prisma:59:  matter_id               Int     @id
./prisma/schema.prisma:123:  matter_ids              String
./prisma/schema.prisma:259:  matterId             Int
./prisma/schema.prisma:286:  @@index([matterId])
./prisma/schema.prisma:293:  matterId               Int
./prisma/schema.prisma:326:  @@index([matterId])
./prisma/schema.prisma:452:  matterId                  Int?
./prisma/schema.prisma:464:  @@index([matterId])
./prisma/schema.prisma:475:  matterId            Int
./prisma/schema.prisma:485:  @@unique([matterId, fieldName])
./prisma/schema.prisma:486:  @@index([matterId])
./prisma/schema.prisma:570:  matterId            Int?
./prisma/schema.prisma:573:  clioMatterId        Int?
./prisma/schema.prisma:584:  @@index([matterId])
./prisma/schema.prisma:587:  @@index([clioMatterId])
./prisma/schema.prisma:605:  matterId                 Int?
./prisma/schema.prisma:608:  clioMatterId             Int?
./prisma/schema.prisma:622:  @@index([matterId])
./prisma/schema.prisma:625:  @@index([clioMatterId])
./prisma/schema.prisma:733:  matterId            Int?
./prisma/schema.prisma:736:  clioMatterId        Int?
./prisma/schema.prisma:746:  @@index([matterId])
./prisma/schema.prisma:749:  @@index([clioMatterId])
./prisma/schema.prisma:791:  matterId           Int?
./prisma/schema.prisma:807:  @@index([matterId])
./lib/claimIndexLawsuitMetadata.ts:37:  const matterIds = Array.from(
./lib/claimIndexLawsuitMetadata.ts:40:        .map((row) => Number(row.matter_id ?? row.matterId ?? row.id))
./lib/claimIndexLawsuitMetadata.ts:45:  if (!masterIds.length && !matterIds.length) return rows;
./lib/claimIndexLawsuitMetadata.ts:53:  for (const matterId of matterIds) {
./lib/claimIndexLawsuitMetadata.ts:54:    whereClauses.push({ lawsuitMatters: { contains: String(matterId) } });
./lib/claimIndexLawsuitMetadata.ts:80:    for (const matterId of parseMatterIdsFromLawsuitMatters(lawsuit.lawsuitMatters)) {
./lib/claimIndexLawsuitMetadata.ts:81:      byMatterId.set(matterId, lawsuit);
./lib/claimIndexLawsuitMetadata.ts:88:      byMatterId.get(Number(row.matter_id ?? row.matterId ?? row.id));
./lib/claimIndexLawsuitMetadata.ts:110:      clio_master_matter_id: row.clio_master_matter_id || lawsuit.clioMasterMatterId || null,
./lib/settlementPreview.ts:22:  matterId: number;
./lib/settlementPreview.ts:126:        matterId: Number(row.matterId),
./lib/settlementPreview.ts:140:  const billMatters = childMatters.filter((row) => Number.isFinite(row.matterId) && row.matterId > 0);
./lib/settlementPreview.ts:180:      matterId: row.matterId,
./lib/settlementPreview.ts:207:        matterId: row.matterId,
./app/lawsuits/page.tsx:11:function matterId(m: Matter) {
./app/lawsuits/page.tsx:12:  return String(m.matterId ?? m.matter_id ?? m.id ?? "");
./app/lawsuits/page.tsx:16:  return m.displayNumber ?? m.display_number ?? m.matterNumber ?? m.matter_number ?? matterId(m);
./app/lawsuits/page.tsx:157:  return val(m, "clioMasterMatterId", "clio_master_matter_id") || "";
./app/lawsuits/page.tsx:165:  const localMatterId = String(matterId(m) || "").trim();
./app/lawsuits/page.tsx:230:  return Boolean(matterId(m)) && !masterId(m) && !isClosedMatter(m);
./app/lawsuits/page.tsx:640:    const id = matterId(m);
./app/lawsuits/page.tsx:653:    const allSelected = eligible.length > 0 && eligible.every((m) => selected[matterId(m)]);
./app/lawsuits/page.tsx:660:          delete next[matterId(m)];
./app/lawsuits/page.tsx:664:          next[matterId(m)] = m;
./app/lawsuits/page.tsx:732:      const matterIds = selectedMatters.map((m) => Number(matterId(m)));
./app/lawsuits/page.tsx:739:          matterIds,
./app/lawsuits/page.tsx:777:      const matterIds = selectedMatters.map((m) => Number(matterId(m)));
./app/lawsuits/page.tsx:785:          matterIds,
./app/lawsuits/page.tsx:1069:                eligibleRows.length > 0 && eligibleRows.every((m) => selected[matterId(m)]);
./app/lawsuits/page.tsx:1117:                        const id = matterId(m);
./app/lawsuits/page.tsx:1416:                    <tr key={`create-review-${matterId(m)}`}>
./app/page.tsx:103:function matterId(m: any) {
./app/page.tsx:104:  return clean(m?.matterId ?? m?.matter_id ?? m?.id);
./app/page.tsx:113:    matterId(m)
./app/page.tsx:784:  const id = matterId(row);
./app/page.tsx:853:  if (json.displayNumber || json.display_number || json.matterId || json.id) return [json];
./app/page.tsx:926:    const res = await fetch(`/api/claim-index/by-matter?matterId=${encodeURIComponent(base.id)}`, {
./app/page.tsx:938:        matterId: contextMatter?.id ?? base.id,
./app/page.tsx:2004:      const id = resolvedDisplay || matterId(exact);
./lib/claimClusterCache.ts:36:  return parseIds(row.matter_ids);
./lib/claimClusterCache.ts:39:export async function setClaimClusterCache(claim: string, matterIds: number[]) {
./lib/claimClusterCache.ts:40:  if (!claim || matterIds.length === 0) return;
./lib/claimClusterCache.ts:44:    update: { matter_ids: serializeIds(matterIds) },
./lib/claimClusterCache.ts:47:      matter_ids: serializeIds(matterIds),
./lib/claimIndex.ts:57:    where: { matter_id: Number(row.matter_id) },
./lib/claimIndex.ts:60:      matter_id: Number(row.matter_id),
./lib/claimIndex.ts:66:export async function getMatter(matterId: number) {
./lib/claimIndex.ts:68:    where: { matter_id: Number(matterId) },
./lib/claimIndex.ts:75:    orderBy: { matter_id: "asc" },
./app/matter/[id]/page.tsx.bak.guardrails:147:  const [matterId, setMatterId] = useState<string>("");
./app/matter/[id]/page.tsx.bak.guardrails:159:    if (!matterId) return;
./app/matter/[id]/page.tsx.bak.guardrails:163:        `/api/clio/matter-context?matterId=${matterId}`
./app/matter/[id]/page.tsx.bak.guardrails:167:        `/api/aggregation/find-siblings?matterId=${matterId}`
./app/matter/[id]/page.tsx.bak.guardrails:176:        .map((sib: any) => Number(sib.id ?? sib.matterId))
./app/matter/[id]/page.tsx.bak.guardrails:184:            `/api/clio/matter-context?matterId=${id}`
./app/matter/[id]/page.tsx.bak.guardrails:252:  }, [matterId]);
./app/components/BarshHeaderQuickNav.tsx:67:        const matterId = resolvedMatter?.id || json?.matterId || json?.id;
./app/components/BarshHeaderQuickNav.tsx:69:        if (!response.ok || !json?.ok || (!resolvedDisplayNumber && !matterId)) {
./app/components/BarshHeaderQuickNav.tsx:74:        window.location.href = `/matter/${encodeURIComponent(resolvedDisplayNumber || matterId)}`;
./lib/clioWrite.ts.bak.deaggregate:19:async function readMatter(matterId: number): Promise<Matter> {
./lib/clioWrite.ts.bak.deaggregate:24:  const res = await clioFetch(`/api/v4/matters/${matterId}.json?fields=${fields}`);
./lib/clioWrite.ts.bak.deaggregate:29:    throw new Error(`Failed to read matter ${matterId}: ${text}`);
./lib/clioWrite.ts.bak.deaggregate:42:export async function preflightLawsuitMatter(matterId: number) {
./lib/clioWrite.ts.bak.deaggregate:43:  const matter = await readMatter(matterId);
./lib/clioWrite.ts.bak.deaggregate:56:  matterId: number,
./lib/clioWrite.ts.bak.deaggregate:60:  const matter = await readMatter(matterId);
./lib/clioWrite.ts.bak.deaggregate:80:  const res = await clioFetch(`/api/v4/matters/${matterId}`, {
./app/matters/page.tsx:105:function matterId(m: any) {
./app/matters/page.tsx:106:  return clean(m?.matterId ?? m?.matter_id ?? m?.id);
./app/matters/page.tsx:115:    matterId(m)
./app/matters/page.tsx:220:  const id = matterId(row);
./app/matters/page.tsx:690:        row?.matterId ??
./app/matters/page.tsx:691:        row?.matter_id ??
./app/matters/page.tsx:720:        rowId: row?.rowId ?? row?.id ?? row?.matterId ?? row?.matter_id ?? row?.displayNumber ?? row?.display_number,
./app/matters/page.tsx:721:        matterId: row?.matterId ?? row?.matter_id ?? row?.id,
./app/matters/page.tsx:874:        const matterId = Number(row?.matterId || row?.matter_id || row?.id || 0);
./app/matters/page.tsx:878:        if (!matterId) continue;
./app/matters/page.tsx:881:          `/api/matters/apply-payment?matterId=${encodeURIComponent(String(matterId))}&claimAmount=${encodeURIComponent(String(claimAmount))}`,
./app/matters/page.tsx:887:          throw new Error(json?.error || `Payment receipt readback failed for ${display || matterId}.`);
./app/matters/page.tsx:894:            sourceMatterId: matterId,
./app/matters/page.tsx:918:    const matterId = Number(receipt?.sourceMatterId || receipt?.matterId || 0);
./app/matters/page.tsx:923:    if (!receiptId || !matterId) {
./app/matters/page.tsx:947:          matterId,
./app/matters/page.tsx:963:            const rowMatterId = Number(row?.matterId || row?.matter_id || row?.id || 0);
./app/matters/page.tsx:964:            if (rowMatterId !== matterId) return row;
./app/matters/page.tsx:1031:        if (!item.matterId || !item.displayNumber) {
./app/matters/page.tsx:1039:            matterId: item.matterId,
./app/matters/page.tsx:1061:          matterId: item.matterId,
./app/matters/page.tsx:1068:          const matterId = Number(row?.matterId || row?.matter_id || row?.id || 0);
./app/matters/page.tsx:1069:          const result = results.find((item) => Number(item.matterId) === matterId);
./app/matters/page.tsx:2450:        const id = Number(row?.id ?? row?.matterId);
./app/matters/page.tsx:2453:          matterId: Number.isFinite(id) && id > 0 ? id : null,
./app/matters/page.tsx:2458:      .filter((row) => row.matterId || row.displayNumber);
./app/matters/page.tsx:3392:            .map((row) => row.matterId)
./app/matters/page.tsx:3394:          matterId: masterMatter?.matterId || null,
./app/matters/page.tsx:3396:          masterMatterId: masterMatter?.matterId || null,
./app/matters/page.tsx:4589:    const matterId = Number(row?.matterId || row?.matter_id || row?.id || 0);
./app/matters/page.tsx:4596:        const receiptMatterId = Number(receipt?.matterId || 0);
./app/matters/page.tsx:4598:        return (!!matterId && receiptMatterId === matterId) || (!!displayNumber && receiptDisplayNumber === displayNumber);
./app/matters/page.tsx:5068:    const clioMatterId =
./app/matters/page.tsx:5070:      result.clioUploadTarget?.matterId ||
./app/matters/page.tsx:5071:      result.clioUploadTarget?.clioMatterId ||
./app/matters/page.tsx:5072:      source.clioMatterId ||
./app/matters/page.tsx:5074:      masterClioDocumentsResult?.clioMatterId ||
./app/matters/page.tsx:5092:      clioMatterId,
./app/matters/page.tsx:5093:      clioUploadTargetMatterId: clioMatterId,
./app/matters/page.tsx:5145:        clioMatterId:
./app/matters/page.tsx:5146:          selectedCandidate.clioMatterId ||
./app/matters/page.tsx:5149:          masterDocumentFinalizationResult?.clioUploadTarget?.matterId ||
./app/matters/page.tsx:5150:          masterDocumentFinalizationResult?.clioUploadTarget?.clioMatterId ||
./app/matters/page.tsx:5151:          masterClioDocumentsResult?.clioMatterId ||
./app/matters/page.tsx:5155:          selectedCandidate.clioMatterId ||
./app/matters/page.tsx:5157:          masterDocumentFinalizationResult?.clioUploadTarget?.matterId ||
./app/matters/page.tsx:5158:          masterDocumentFinalizationResult?.clioUploadTarget?.clioMatterId ||
./app/matters/page.tsx:5159:          masterClioDocumentsResult?.clioMatterId ||
./app/matters/page.tsx:5178:          matterId: masterLawsuitId,
./app/matters/page.tsx:5316:          matterId: context.masterLawsuitId,
./app/matters/page.tsx:5972:    const targetMatterId = masterDocumentPreviewText(masterFinalizePreview?.clioUploadTarget?.matterId);
./app/matters/page.tsx:7943:                    {masterFinalizePreview?.clioUploadTarget?.matterId
./app/matters/page.tsx:7944:                      ? ` / Matter ID ${masterFinalizePreview.clioUploadTarget.matterId}`
./app/matters/page.tsx:11807:                              <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9", fontWeight: 800 }}>{row.displayNumber || row.matterId}</td>
./app/print-queue/page.tsx:45:function clioMatterUrl(matterId: any): string {
./app/print-queue/page.tsx:46:  const id = textValue(matterId);
./app/print-queue/page.tsx:665:                              href={clioMatterUrl(row.masterMatterId)}
./app/matter/[id]/page.tsx.bak-layout-fix-2026-04-23:6:  matterId?: number;
./app/matter/[id]/page.tsx.bak-layout-fix-2026-04-23:24:  return Number(row.matterId ?? row.id ?? 0);
./app/matter/[id]/page.tsx.bak-layout-fix-2026-04-23:89:        fetch(`/api/clio/matter-context?matterId=${id}`, {
./app/matter/[id]/page.tsx.bak-layout-fix-2026-04-23:92:        fetch(`/api/aggregation/find-siblings?matterId=${id}`, {
./app/matter/[id]/page.tsx.bak-layout-fix-2026-04-23:183:          matterIds: selectedIds,
./app/matter/[id]/page.tsx.bak-layout-fix-2026-04-23:227:          matterIds: idsInGroup,
./app/admin/ticklers/page.tsx:16:  matterId?: number | null;
./app/admin/ticklers/page.tsx:77:  const matterId = text(tickler?.matterId);
./app/admin/ticklers/page.tsx:88:    return `/matter/${encodeURIComponent(matterId || displayNumber.replace(/\D/g, ""))}`;
./app/admin/ticklers/page.tsx:91:  if (matterId) {
./app/admin/ticklers/page.tsx:92:    return `/matter/${encodeURIComponent(matterId)}`;
./app/admin/ticklers/page.tsx:488:        safeExportCell(tickler.caseData?.matter || tickler.masterLawsuitId || tickler.displayNumber || tickler.matterId),
./app/admin/ticklers/page.tsx:1321:                            {(tickler as any).caseData?.matter || tickler.displayNumber || tickler.matterId || "—"}
./app/admin/ticklers/page.tsx:1324:                          (tickler as any).caseData?.matter || tickler.displayNumber || tickler.matterId || "—"
./app/admin/document-readiness/audit/page.tsx:35:  matter_id: number;
./app/admin/document-readiness/audit/page.tsx:242:        child.matter_id,
./app/admin/document-readiness/audit/page.tsx:523:                              <tr key={`${check.id}-${row.matter_id}-${row.issue_detail || ""}`}>
./app/admin/document-readiness/audit/page.tsx:524:                                <td style={tdStyle}>{row.matter_id}</td>
./lib/settlementClioWriteback.ts:13:type ClioMatter = {
./lib/settlementClioWriteback.ts:37:  matterId: number;
./lib/settlementClioWriteback.ts:83:function isMasterMatter(matter: ClioMatter): boolean {
./lib/settlementClioWriteback.ts:93:function findCFV(matter: ClioMatter, fieldId: number): CFV | undefined {
./lib/settlementClioWriteback.ts:164:async function readMatterLive(matterId: number): Promise<ClioMatter> {
./lib/settlementClioWriteback.ts:166:    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(LIVE_FIELDS)}`,
./lib/settlementClioWriteback.ts:178:      `Failed to read matter ${matterId} from Clio: status ${res.status}; body ${body}`
./lib/settlementClioWriteback.ts:185:    throw new Error(`Matter ${matterId} was not returned by Clio.`);
./lib/settlementClioWriteback.ts:192:  matter: ClioMatter;
./lib/settlementClioWriteback.ts:270:  const matterId = Number(params.request.matterId);
./lib/settlementClioWriteback.ts:272:  if (!Number.isFinite(matterId) || matterId <= 0) {
./lib/settlementClioWriteback.ts:273:    throw new Error("Invalid matterId for settlement writeback preview.");
./lib/settlementClioWriteback.ts:276:  const matter = await readMatterLive(matterId);
./lib/settlementClioWriteback.ts:300:    matterId,
./lib/settlementClioWriteback.ts:301:    displayNumber: matter.display_number || params.request.displayNumber || String(matterId),
./lib/settlementClioWriteback.ts:318:export async function writeSettlementToClioMatter(params: {
./lib/settlementClioWriteback.ts:322:  const matterId = Number(params.request.matterId);
./lib/settlementClioWriteback.ts:324:  if (!Number.isFinite(matterId) || matterId <= 0) {
./lib/settlementClioWriteback.ts:325:    throw new Error("Invalid matterId for settlement writeback.");
./lib/settlementClioWriteback.ts:333:      matterId,
./lib/settlementClioWriteback.ts:342:  const matter = await readMatterLive(matterId);
./lib/settlementClioWriteback.ts:346:      `Settlement financial writeback is blocked for master matter ${matter.display_number || matterId}.`
./lib/settlementClioWriteback.ts:352:      `Matter ${matter.display_number || matterId} is missing an ETag and cannot be safely updated.`
./lib/settlementClioWriteback.ts:363:      `Matter ${matter.display_number || matterId} is missing required settlement custom field value record(s): ${payloadPlan.missingRequiredFields
./lib/settlementClioWriteback.ts:369:  const res = await clioFetch(`/api/v4/matters/${matterId}.json`, {
./lib/settlementClioWriteback.ts:387:      `Failed to write settlement fields to Clio matter ${matter.display_number || matterId}: status ${res.status}; body ${body}`
./lib/settlementClioWriteback.ts:391:  const updatedMatter = await readMatterLive(matterId);
./lib/settlementClioWriteback.ts:397:    matterId,
./lib/settlementClioWriteback.ts:398:    displayNumber: updatedMatter.display_number || matter.display_number || String(matterId),
./app/matter/[id]/page.tsx.bak-smart-filter-2026-04-23:6:  matterId?: number;
./app/matter/[id]/page.tsx.bak-smart-filter-2026-04-23:24:  return Number(row.matterId ?? row.id ?? 0);
./app/matter/[id]/page.tsx.bak-smart-filter-2026-04-23:89:        fetch(`/api/clio/matter-context?matterId=${id}`, {
./app/matter/[id]/page.tsx.bak-smart-filter-2026-04-23:92:        fetch(`/api/aggregation/find-siblings?matterId=${id}`, {
./app/matter/[id]/page.tsx.bak-smart-filter-2026-04-23:184:          matterIds: selectedIds,
./app/matter/[id]/page.tsx.bak-smart-filter-2026-04-23:228:          matterIds: idsInGroup,
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:28:mustContain("route uses ClaimIndex snake_case matter id field", route, "matter_id");
./lib/documents/delivery.ts:27:  matterId?: string;
./lib/documents/delivery.ts:49:    clean(context.matterId) ||
./scripts/verify-direct-matter-identity-save-resolved-id-safety.mjs:8:  "matter?.matterId",
./scripts/verify-direct-matter-identity-save-resolved-id-safety.mjs:9:  "matter?.matter_id",
./scripts/verify-direct-matter-identity-save-resolved-id-safety.mjs:12:  "matterId: numericMatterId,",
./scripts/verify-direct-matter-identity-save-resolved-id-safety.mjs:13:  "matterDisplayNumber: textValue(matter?.displayNumber || matter?.display_number || matterId)",
./scripts/verify-direct-matter-identity-save-resolved-id-safety.mjs:17:  "matterId: Number(matterId),\n          matterDisplayNumber: textValue(matter?.displayNumber || matter?.display_number),",
./app/matter/[id]/page.tsx:182:function clioMatterUrl(matterId: any): string {
./app/matter/[id]/page.tsx:183:  return `https://app.clio.com/nc/#/matters/${matterId}`;
./app/matter/[id]/page.tsx:560:  const [matterId, setMatterId] = useState<string>("");
./app/matter/[id]/page.tsx:699:      matterId,
./app/matter/[id]/page.tsx:700:      matter?.matterId,
./app/matter/[id]/page.tsx:701:      matter?.matter_id,
./app/matter/[id]/page.tsx:746:        `/api/documents/clio-matter-documents?matterId=${encodeURIComponent(String(numericMatterId))}`,
./app/matter/[id]/page.tsx:923:      matterId ? `BRL${String(matterId).replace(/^BRL/i, "")}` : "",
./app/matter/[id]/page.tsx:1273:                    Clio Matter ID: {textValue(matterClioDocumentsResult.clioMatterId) || "—"}
./app/matter/[id]/page.tsx:1505:    const numericMatterId = Number(matterId);
./app/matter/[id]/page.tsx:1525:        params.set("matterId", String(numericMatterId));
./app/matter/[id]/page.tsx:1530:      } else if (/^\d+$/.test(String(matterId || ""))) {
./app/matter/[id]/page.tsx:1531:        params.set("matterDisplayNumber", String(matterId));
./app/matter/[id]/page.tsx:1658:        `/api/matters/identity-field?matterId=${encodeURIComponent(String(numericMatterId))}&fieldName=treating_provider`,
./app/matter/[id]/page.tsx:1702:          matterId: numericMatterId,
./app/matter/[id]/page.tsx:1703:          matterDisplayNumber: textValue(matter?.displayNumber || matter?.display_number || matterId),
./app/matter/[id]/page.tsx:1741:    if (!matterId) return;
./app/matter/[id]/page.tsx:1744:  }, [matterId]);
./app/matter/[id]/page.tsx:1978:      matter?.matterId,
./app/matter/[id]/page.tsx:1979:      matter?.matter_id,
./app/matter/[id]/page.tsx:1981:      matterId,
./app/matter/[id]/page.tsx:2019:    const matterIdValue = Number(row.matterId ?? row.matter_id ?? row.id ?? 0);
./app/matter/[id]/page.tsx:2031:      id: matterIdValue,
./app/matter/[id]/page.tsx:2032:      matterId: matterIdValue,
./app/matter/[id]/page.tsx:2033:      matter_id: matterIdValue,
./app/matter/[id]/page.tsx:2210:          matterId: numericMatterId,
./app/matter/[id]/page.tsx:2211:          matterDisplayNumber: textValue(matter?.displayNumber || matter?.display_number || matterId),
./app/matter/[id]/page.tsx:2323:          matterId: resolvedNumericMatterId(),
./app/matter/[id]/page.tsx:2403:          matterId: resolvedNumericMatterId(),
./app/matter/[id]/page.tsx:2572:        matterId: resolvedNumericMatterId(),
./app/matter/[id]/page.tsx:2631:  async function loadPaymentReceipts(matterIdInput?: string) {
./app/matter/[id]/page.tsx:2632:    const targetMatterId = String(matterIdInput || matterId || "").trim();
./app/matter/[id]/page.tsx:2640:        `/api/matters/apply-payment?matterId=${encodeURIComponent(String(Number(matter?.matterId || matter?.matter_id || matter?.id || targetMatterId)))}&claimAmount=${encodeURIComponent(String(num(matter?.claimAmount)))}`,
./app/matter/[id]/page.tsx:2721:          matterId,
./app/matter/[id]/page.tsx:2749:      await loadPaymentReceipts(matterId);
./app/matter/[id]/page.tsx:2847:          matterId: Number(matter?.matterId || matter?.matter_id || matter?.id || matterId),
./app/matter/[id]/page.tsx:2884:      await loadPaymentReceipts(matterId);
./app/matter/[id]/page.tsx:2899:    if (!matterId) return;
./app/matter/[id]/page.tsx:2900:    loadPaymentReceipts(matterId);
./app/matter/[id]/page.tsx:2901:  }, [matterId]);
./app/matter/[id]/page.tsx:2904:    if (!matterId) return;
./app/matter/[id]/page.tsx:2914:        const numericMatterId = Number(matterId);
./app/matter/[id]/page.tsx:2917:          localParams.set("matterId", String(numericMatterId));
./app/matter/[id]/page.tsx:2919:          localParams.set("displayNumber", String(matterId));
./app/matter/[id]/page.tsx:2920:          localParams.set("matterDisplayNumber", String(matterId));
./app/matter/[id]/page.tsx:3003:  }, [matterId]);
./app/matter/[id]/page.tsx:3052:          matterId: Number(closeMatterTarget.id),
./app/matter/[id]/page.tsx:3120:          matterIds: selectedMatterIds,
./app/matter/[id]/page.tsx:3191:          matterIds: selectedMatterIds,
./app/matter/[id]/page.tsx:3219:          matterIds: selectedMatterIds,
./app/matter/[id]/page.tsx:3263:    const currentMatterId = Number(matter?.id || matterId || 0);
./app/matter/[id]/page.tsx:3973:    const targetMatterId = textValue(documentPreview?.clioUploadTarget?.matterId);
./app/matter/[id]/page.tsx:4432:    if (!matterId) {
./app/matter/[id]/page.tsx:4434:        alert("No matterId found.  Open a matter before loading provider fee defaults.");
./app/matter/[id]/page.tsx:4444:        `/api/settlements/provider-fee-defaults?matterId=${encodeURIComponent(String(matterId))}`
./app/matter/[id]/page.tsx:4510:    if (!matterId) return;
./app/matter/[id]/page.tsx:4512:    const matterKey = String(matterId);
./app/matter/[id]/page.tsx:4517:  }, [activeWorkspaceTab, matterId, providerFeeDefaultsAutoLoadedMatterId]);
./app/matter/[id]/page.tsx:4786:      const res = await fetch(`/api/documents/matter-packet?matterId=${encodeURIComponent(String(matterId))}`);
./app/matter/[id]/page.tsx:4824:    const matterDisplay = textValue(templateFields.displayNumber) || String(matterId || "");
./app/matter/[id]/page.tsx:4840:      matterId: matterDisplay,
./app/matter/[id]/page.tsx:4845:    const queryMatterId = encodeURIComponent(String(context.matterId || matterId || ""));
./app/matter/[id]/page.tsx:4846:    const response = await fetch(`/api/documents/clio-maildrop-resolve?source=direct_matter&matterId=${queryMatterId}`);
./app/matter/[id]/page.tsx:5016:          matterId: context.matterId,
./app/matter/[id]/page.tsx:5113:    const clioTargetMatterId = Number(finalizeUploadResult?.clioUploadTarget?.matterId || 0);
./app/matter/[id]/page.tsx:5157:          clioMatterId: printQueueMatterId,
./app/matter/[id]/page.tsx:5166:              clioMatterId: printQueueMatterId,
./app/matter/[id]/page.tsx:5254:    const displayNumber = textValue(matter?.displayNumber || matter?.display_number || matterId);
./app/matter/[id]/page.tsx:5258:    if (matterId) params.set("matterId", String(matterId));
./app/matter/[id]/page.tsx:5285:    const displayNumber = textValue(matter?.displayNumber || matter?.display_number || matterId);
./app/matter/[id]/page.tsx:5294:      matterId: Number(matterId),
./app/matter/[id]/page.tsx:5297:      clioMatterId: Number(matterId),
./app/matter/[id]/page.tsx:5418:    const displayNumber = textValue(matter?.displayNumber || matter?.display_number || matterId);
./app/matter/[id]/page.tsx:7177:    const currentMatterId = Number(matter?.id || matterId || 0);
./app/matter/[id]/page.tsx:7191:  }, [rows, matter, matterId]);
./app/matter/[id]/page.tsx:7456:      .map((row: any) => [String(row?.matterId || ""), row])
./app/matter/[id]/page.tsx:7457:      .filter(([matterId]: any) => matterId)
./app/matter/[id]/page.tsx:7462:      .map((row: any) => [String(row?.matterId || ""), row])
./app/matter/[id]/page.tsx:7463:      .filter(([matterId]: any) => matterId)
./app/matter/[id]/page.tsx:7469:    for (const [matterId, expectedRow] of expectedRowsByMatterId.entries()) {
./app/matter/[id]/page.tsx:7470:      const currentRow = currentRowsByMatterId.get(matterId);
./app/matter/[id]/page.tsx:7474:          `Matter ${textValue((expectedRow as any)?.displayNumber) || matterId} is missing from current Clio readback.`
./app/matter/[id]/page.tsx:7485:            `${textValue((expectedRow as any)?.displayNumber) || matterId}: ${field.label} expected ${money(Number(expectedValue ?? 0) / 100)} but Clio shows ${money(Number(actualValue ?? 0) / 100)}.`
./app/matter/[id]/page.tsx:7903:                {textValue(matter?.displayNumber || matter?.display_number) || matterId || "Matter"}
./app/matter/[id]/page.tsx:7919:                    {textValue(matter?.displayNumber || matter?.display_number) || matterId || "—"}
./app/matter/[id]/page.tsx:7927:                    {matterId || "—"}
./app/matter/[id]/page.tsx:9264:                      displayNumber: textValue(matter?.displayNumber || matter?.display_number || matterId),
./app/matter/[id]/page.tsx:10663:                      <tr key={textValue(row.matterId)}>
./app/matter/[id]/page.tsx:10665:                          {textValue(row.displayNumber) || textValue(row.matterId)}
./app/matter/[id]/page.tsx:11540:                      <tr key={textValue(row.matterId)}>
./app/matter/[id]/page.tsx:11542:                          {textValue(row.displayNumber) || textValue(row.matterId)}
./app/matter/[id]/page.tsx:11739:                        <tr key={textValue(row.matterId)}>
./app/matter/[id]/page.tsx:11741:                            {textValue(row.displayNumber) || textValue(row.matterId)}
./app/matter/[id]/page.tsx:11882:                        <tr key={textValue(row.matterId)}>
./app/matter/[id]/page.tsx:11884:                            {textValue(row.displayNumber) || textValue(row.matterId)}
./app/matter/[id]/page.tsx:12043:                      <tr key={textValue(row.matterId)}>
./app/matter/[id]/page.tsx:12045:                          {textValue(row.displayNumber) || textValue(row.matterId)}
./app/matter/[id]/page.tsx:12931:                {textValue(matter?.displayNumber || matter?.display_number) || matterId || "—"}
./app/matter/[id]/page.tsx:12938:                {matterId || "—"}
./app/matter/[id]/page.tsx:13092:                              {textValue(entry.matterDisplayNumber) || textValue(entry.matterId) || "—"}
./app/admin/ticklers/runner/page.tsx:423:                          <td style={{ padding: 8 }}>{cell(tickler.caseData?.matter || tickler.displayNumber || tickler.matterId)}</td>
./app/api/matters/update-direct-field/route.ts:218:    const matterId = Number(body?.matterId || "");
./app/api/matters/update-direct-field/route.ts:223:    if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/matters/update-direct-field/route.ts:224:      return jsonError("Valid matterId is required.");
./app/api/matters/update-direct-field/route.ts:236:        matter_id: matterId,
./app/api/matters/update-direct-field/route.ts:239:        matter_id: true,
./app/api/matters/update-direct-field/route.ts:264:        matterId,
./app/api/matters/update-direct-field/route.ts:274:          matter_id: matterId,
./app/api/matters/update-direct-field/route.ts:278:          matter_id: true,
./app/api/matters/update-direct-field/route.ts:310:          affectedMatterIds: [matterId],
./app/api/matters/update-direct-field/route.ts:311:          matterId,
./app/api/matters/update-direct-field/route.ts:332:      matterId,
./app/api/audit-log/route.ts:17:      matterId: req.nextUrl.searchParams.get("matterId"),
./app/api/audit-log/route.ts:61:      matterId: body?.matterId,
./lib/claimIndexQuery.ts:4:  matterId?: string;
./lib/claimIndexQuery.ts:20:  const matterId = clean(params.matterId);
./lib/claimIndexQuery.ts:28:  if (matterId) {
./lib/claimIndexQuery.ts:29:    const n = Number(matterId);
./lib/claimIndexQuery.ts:31:      and.push({ matter_id: n });
./lib/claimIndexQuery.ts:191:  matter_id: true,
./lib/graph/maildropForDraft.ts:38:async function readMatterMaildropByClioId(matterId: number): Promise<GraphDraftMaildropResolution> {
./lib/graph/maildropForDraft.ts:40:  const res = await clioFetch(`/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`);
./lib/graph/maildropForDraft.ts:66:export async function resolveMaildropForGraphDraftMatterId(matterId: unknown): Promise<GraphDraftMaildropResolution> {
./lib/graph/maildropForDraft.ts:67:  const raw = clean(matterId);
./lib/graph/maildropForDraft.ts:69:    typeof matterId === "number"
./lib/graph/maildropForDraft.ts:70:      ? matterId
./lib/graph/maildropForDraft.ts:80:  const displayNumber = normalizeDisplayNumber(matterId);
./lib/readMatterFromClio.ts:1:export async function readMatterFromClio(matterId: number) {
./lib/readMatterFromClio.ts:2:  const url = `https://app.clio.com/api/v4/matters/${matterId}.json?fields=id,display_number,description,status,client,custom_field_values`;
./scripts/verify-packet-clio-master-mapping-safety.mjs:18:      route.includes("matterId: lawsuit.clioMasterMatterId") &&
./app/api/matters/close/route.ts:3:import { syncClioMatterClosed } from "@/lib/clioCloseSync";
./app/api/matters/close/route.ts:24:  matterId: number;
./app/api/matters/close/route.ts:32:    matterId: result.matterId,
./app/api/matters/close/route.ts:44:    const matterId = Number(body?.matterId);
./app/api/matters/close/route.ts:49:    if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/matters/close/route.ts:50:      return jsonError("A valid matterId is required.");
./app/api/matters/close/route.ts:59:        matter_id: matterId,
./app/api/matters/close/route.ts:62:        matter_id: true,
./app/api/matters/close/route.ts:77:        matterId,
./app/api/matters/close/route.ts:81:    const clioCloseSync = await syncClioMatterClosed({
./app/api/matters/close/route.ts:82:      matterId,
./app/api/matters/close/route.ts:89:        matterId,
./app/api/matters/close/route.ts:104:          matter_id: matterId,
./app/api/matters/close/route.ts:112:          matter_id: true,
./app/api/matters/close/route.ts:128:          summary: `Closed matter ${claimIndex.display_number || claimIndex.matter_id} locally and in Clio with reason ${closeReason}.`,
./app/api/matters/close/route.ts:146:          affectedMatterIds: [matterId],
./app/api/matters/close/route.ts:147:          matterId,
./app/api/matters/close/route.ts:166:      matterId,
./app/api/matters/close/route.ts:171:        id: updated.matter_id,
./app/api/matters/close/route.ts:172:        matterId: updated.matter_id,
./app/api/matters/close/route.ts:173:        matter_id: updated.matter_id,
./lib/graph/maildropRegistry.ts:20:  matterId?: number | string | null;
./lib/graph/maildropRegistry.ts:23:  clioMatterId?: number | string | null;
./lib/graph/maildropRegistry.ts:36:    matterId: numberOrNull(input.matterId),
./lib/graph/maildropRegistry.ts:39:    clioMatterId: numberOrNull(input.clioMatterId),
./lib/graph/maildropRegistry.ts:53:      matterId: data.matterId,
./lib/graph/maildropRegistry.ts:56:      clioMatterId: data.clioMatterId,
./lib/graph/maildropRegistry.ts:77:      matterId: true,
./lib/graph/maildropRegistry.ts:80:      clioMatterId: true,
./lib/graph/maildropRegistry.ts:109:      matterId: true,
./lib/graph/maildropRegistry.ts:112:      clioMatterId: true,
./app/admin/reference-data/page.tsx:12:  matterId?: string | null;
./app/admin/reference-data/page.tsx:56:      matterId?: string | null;
./app/admin/reference-data/page.tsx:58:      clioMatterId?: string | null;
./app/admin/reference-data/page.tsx:280:      <td style={{ padding: "8px", borderBottom: "1px solid #e5e7eb", verticalAlign: "top" }}>{log.targetId || log.matterId || log.masterLawsuitId || log.graphConversationId || "—"}</td>
./app/admin/reference-data/page.tsx:1315:                          <td style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>{row.matterId || row.masterLawsuitId || row.clioDisplayNumber || row.clioMatterId || "—"}</td>
./prisma/migrations/20260515105500_add_claimindex_treating_provider/migration.sql:12:WHERE mlf."matterId" = ci."matter_id"
./scripts/verify-court-calendar-route-safety.mjs:37:  "matterId =",
./lib/graph/emailPersistence.ts:50:    matterId?: string | number | null;
./lib/graph/emailPersistence.ts:53:    clioMatterId?: string | number | null;
./lib/graph/emailPersistence.ts:96:  const matterId = numberOrNull(context.matterId);
./lib/graph/emailPersistence.ts:97:  const clioMatterId = numberOrNull(context.clioMatterId);
./lib/graph/emailPersistence.ts:121:      matterId,
./lib/graph/emailPersistence.ts:124:      clioMatterId,
./lib/graph/emailPersistence.ts:145:      matterId,
./lib/graph/emailPersistence.ts:148:      clioMatterId,
./lib/graph/emailPersistence.ts:249:      matterId,
./lib/graph/emailPersistence.ts:252:      clioMatterId,
./lib/graph/emailPersistence.ts:333:    matterId?: string | number | null;
./lib/graph/emailPersistence.ts:336:    clioMatterId?: string | number | null;
./lib/graph/emailPersistence.ts:417:  const matterId = numberOrNull(context.matterId);
./lib/graph/emailPersistence.ts:418:  const clioMatterId = numberOrNull(context.clioMatterId);
./lib/graph/emailPersistence.ts:447:      matterId,
./lib/graph/emailPersistence.ts:450:      clioMatterId,
./lib/graph/emailPersistence.ts:472:      matterId,
./lib/graph/emailPersistence.ts:475:      clioMatterId,
./lib/graph/emailPersistence.ts:585:    if (matterId || matterDisplayNumber || masterLawsuitId || clioMatterId || clioDisplayNumber) {
./lib/graph/emailPersistence.ts:599:            matterId,
./lib/graph/emailPersistence.ts:602:            clioMatterId,
./app/api/admin/document-readiness/audit/route.ts:13:  matter_id: number;
./app/api/admin/document-readiness/audit/route.ts:103:  matter_id: true,
./app/api/admin/document-readiness/audit/route.ts:206:    childMatterIds: children.map((child) => child.matter_id),
./app/api/admin/document-readiness/audit/route.ts:273:        orderBy: { matter_id: "asc" },
./lib/claimIndexUpsert.ts:155:    where: { matter_id: id },
./lib/claimIndexUpsert.ts:158:      matter_id: id,
./app/admin/lawsuit-cleanup/page.tsx:7:  matterId: string;
./app/admin/lawsuit-cleanup/page.tsx:285:                    <tr key={row.matterId}>
./app/admin/lawsuit-cleanup/page.tsx:287:                        <a href={`/matter/${encodeURIComponent(row.matterId)}`} style={linkStyle}>
./app/admin/lawsuit-cleanup/page.tsx:399:                              <tr key={child.matterId}>
./app/admin/lawsuit-cleanup/page.tsx:401:                                  <a href={`/matter/${encodeURIComponent(child.matterId)}`} style={linkStyle}>
./scripts/verify-attorney-fee-docx-safety.mjs:64:mustNotContain("attorney fee route", attorneyFeeRoute, "uploadBufferToClioMatterDocuments");
./scripts/verify-attorney-fee-docx-safety.mjs:65:mustNotContain("attorney fee route", attorneyFeeRoute, "listClioMatterDocuments");
./app/api/matters/apply-payment/route.ts:72:async function matterHasLawsuitAggregation(matterId: number, expectedDisplayNumber?: string): Promise<{
./app/api/matters/apply-payment/route.ts:76:  const numericMatterId = Number(matterId);
./app/api/matters/apply-payment/route.ts:86:        { matter_id: numericMatterId },
./app/api/matters/apply-payment/route.ts:171:async function paymentTotalsForMatter(matterId: number, claimAmount: number) {
./app/api/matters/apply-payment/route.ts:173:    where: { matterId },
./app/api/matters/apply-payment/route.ts:183:        { matter_id: matterId },
./app/api/matters/apply-payment/route.ts:228:  matterId: number;
./app/api/matters/apply-payment/route.ts:231:  const matterId = Number(params.matterId);
./app/api/matters/apply-payment/route.ts:234:  if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/matters/apply-payment/route.ts:242:  const totals = await paymentTotalsForMatter(matterId, claimAmount);
./app/api/matters/apply-payment/route.ts:245:    where: { matter_id: matterId },
./app/api/matters/apply-payment/route.ts:276:    Number(params.receipt?.matterId) !== expectedMatterId
./app/api/matters/apply-payment/route.ts:283:        error: `Receipt matterId mismatch.  Refusing payment ${params.actionLabel}.`,
./app/api/matters/apply-payment/route.ts:285:        actualMatterId: params.receipt?.matterId,
./app/api/matters/apply-payment/route.ts:326:    affectedMatterIds: [Number(input.receipt?.matterId)].filter(Boolean),
./app/api/matters/apply-payment/route.ts:327:    matterId: input.receipt?.matterId,
./app/api/matters/apply-payment/route.ts:338:    const matterId = Number(url.searchParams.get("matterId") || "");
./app/api/matters/apply-payment/route.ts:341:    if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/matters/apply-payment/route.ts:343:        { ok: false, error: "Valid matterId is required." },
./app/api/matters/apply-payment/route.ts:348:    const totals = await paymentTotalsForMatter(matterId, claimAmount);
./app/api/matters/apply-payment/route.ts:353:      matterId,
./app/api/matters/apply-payment/route.ts:384:    const matterId = Number(body?.matterId || "");
./app/api/matters/apply-payment/route.ts:407:    if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/matters/apply-payment/route.ts:409:        { ok: false, error: "Valid matterId is required." },
./app/api/matters/apply-payment/route.ts:456:    const lawsuitAggregation = await matterHasLawsuitAggregation(matterId, expectedDisplayNumber);
./app/api/matters/apply-payment/route.ts:469:    const beforeTotals = await paymentTotalsForMatter(matterId, claimAmount);
./app/api/matters/apply-payment/route.ts:495:        matterId,
./app/api/matters/apply-payment/route.ts:541:      where: { matter_id: matterId },
./app/api/matters/apply-payment/route.ts:579:      matterId: String(matterId),
./app/api/matters/apply-payment/route.ts:634:    const expectedMatterId = Number(body?.matterId || "");
./app/api/matters/apply-payment/route.ts:680:    const matterId = Number(receipt.matterId);
./app/api/matters/apply-payment/route.ts:694:    const beforeTotals = await paymentTotalsForMatter(matterId, claimAmount);
./app/api/matters/apply-payment/route.ts:721:          matterId: receipt.matterId,
./app/api/matters/apply-payment/route.ts:733:    const claimIndexMirror = await mirrorLocalPaymentTotalsToClaimIndex({ matterId, claimAmount });
./app/api/matters/apply-payment/route.ts:761:      matterId: String(matterId),
./lib/graph/draft.ts:26:    matterId?: string | number | null;
./lib/graph/draft.ts:29:    clioMatterId?: string | number | null;
./lib/graph/draft.ts:201:    ["String {00020329-0000-0000-C000-000000000046} Name BarshMattersMatterId", matter.matterId],
./lib/graph/draft.ts:204:    ["String {00020329-0000-0000-C000-000000000046} Name BarshMattersClioMatterId", matter.clioMatterId],
./scripts/verify-clio-document-list-ui-safety.mjs:15:check("Direct Matter keeps read-only document loader", direct.includes("loadMatterClioDocuments") && direct.includes("/api/documents/clio-matter-documents?matterId="));
./app/admin/audit-history/page.tsx:11:  matterId?: string | number;
./app/admin/audit-history/page.tsx:211:                        <div>{display(entry.matterId)}</div>
./lib/auditLog.ts:17:  matterId?: number | string | null;
./lib/auditLog.ts:77:      matterId: cleanPositiveNumber(input.matterId),
./lib/auditLog.ts:93:  matterId?: unknown;
./lib/auditLog.ts:99:  const matterId = cleanPositiveNumber(params.matterId);
./lib/auditLog.ts:107:  if (matterId) OR.push({ matterId });
./app/admin/claim-index/page.tsx:11:  matter_id: number;
./app/admin/claim-index/page.tsx:57:  matterId: string;
./app/admin/claim-index/page.tsx:71:  matterId: "",
./app/admin/claim-index/page.tsx:154:  ["Matter ID", "matter_id"],
./app/admin/claim-index/page.tsx:191:    matterId: params.get("matterId") || "",
./app/admin/claim-index/page.tsx:260:    row.matter_id,
./app/admin/claim-index/page.tsx:457:              <input value={filters.matterId} onChange={(event) => setFilter("matterId", event.target.value)} style={inputStyle} placeholder="1876895480" />
./app/admin/claim-index/page.tsx:534:                  <tr key={row.matter_id}>
./app/admin/claim-index/page.tsx:535:                    <td style={tdStyle}>{row.matter_id}</td>
./scripts/verify-clio-master-matter-confirm-safety.mjs:44:mustContain(routePath, route, "findClientFromChildClioMatters");
./scripts/verify-clio-master-matter-confirm-safety.mjs:49:mustContain(routePath, route, "clioMasterMatterId: created.matterId");
./scripts/verify-clio-master-matter-confirm-safety.mjs:61:mustNotContain(routePath, route, "uploadBufferToClioMatterDocuments");
./app/admin/lawsuits/audit/page.tsx:35:  matter_id: number;
./app/admin/lawsuits/audit/page.tsx:240:        child?.matter_id,
./app/admin/lawsuits/audit/page.tsx:522:                              <tr key={`${check.id}-${row.matter_id}`}>
./app/admin/lawsuits/audit/page.tsx:523:                                <td style={tdStyle}>{row.matter_id}</td>
./app/api/documents/finalize-preview/route.ts:6:  listClioMatterDocuments,
./app/api/documents/finalize-preview/route.ts:48:async function resolveClioMatterByDisplayNumber(displayNumberInput: string) {
./app/api/documents/finalize-preview/route.ts:55:      clioMatterId: null,
./app/api/documents/finalize-preview/route.ts:82:      clioMatterId: null,
./app/api/documents/finalize-preview/route.ts:91:    clioMatterId: exact.id,
./app/api/documents/finalize-preview/route.ts:299:      masterMatter.matterId ??
./app/api/documents/finalize-preview/route.ts:308:      matterId: masterMatterId,
./app/api/documents/finalize-preview/route.ts:317:      const directResolution = await resolveClioMatterByDisplayNumber(directDisplay);
./app/api/documents/finalize-preview/route.ts:321:        matterId: directResolution.clioMatterId,
./app/api/documents/finalize-preview/route.ts:325:        wouldUploadToClio: Boolean(validation.canGenerate && directResolution.ok && directResolution.clioMatterId),
./app/api/documents/finalize-preview/route.ts:328:      if (!directResolution.ok || !directResolution.clioMatterId) {
./app/api/documents/finalize-preview/route.ts:335:    const canGenerate = Boolean(validation.canGenerate) && Boolean(uploadTarget.matterId);
./app/api/documents/finalize-preview/route.ts:353:    if (canGenerate && uploadTarget.matterId) {
./app/api/documents/finalize-preview/route.ts:355:        existingClioDocuments = await listClioMatterDocuments(Number(uploadTarget.matterId));
./app/api/documents/finalize-preview/route.ts:421:        attempted: Boolean(canGenerate && uploadTarget.matterId),
./lib/clioCloseSync.ts:4:  matterId: number;
./lib/clioCloseSync.ts:40:export async function syncClioMatterClosed(params: {
./lib/clioCloseSync.ts:41:  matterId: number | string;
./lib/clioCloseSync.ts:45:  const matterId = numericMatterId(params.matterId);
./lib/clioCloseSync.ts:46:  if (!matterId) {
./lib/clioCloseSync.ts:48:      matterId: 0,
./lib/clioCloseSync.ts:57:  const endpoint = `/api/v4/matters/${matterId}.json`;
./lib/clioCloseSync.ts:77:        matterId,
./lib/clioCloseSync.ts:83:        error: `Clio close sync failed for matter ${matterId}: ${response.status} ${response.statusText}`,
./lib/clioCloseSync.ts:88:      matterId,
./lib/clioCloseSync.ts:97:      matterId,
./lib/clioCloseSync.ts:102:      error: error?.message || `Clio close sync failed for matter ${matterId}.`,
./lib/clioCloseSync.ts:107:export async function syncClioMattersClosed(params: {
./lib/clioCloseSync.ts:108:  matterIds: Array<number | string>;
./lib/clioCloseSync.ts:119:    new Set(params.matterIds.map(numericMatterId).filter((id) => id > 0))
./lib/clioCloseSync.ts:123:  for (const matterId of attemptedMatterIds) {
./lib/clioCloseSync.ts:124:    const result = await syncClioMatterClosed({
./lib/clioCloseSync.ts:125:      matterId,
./lib/clioCloseSync.ts:136:    syncedMatterIds: results.filter((result) => result.ok).map((result) => result.matterId),
./app/api/matters/identity-field/route.ts:195:    const matterId = Number(url.searchParams.get("matterId"));
./app/api/matters/identity-field/route.ts:198:    if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/matters/identity-field/route.ts:199:      return jsonError("A valid matterId is required.");
./app/api/matters/identity-field/route.ts:208:        matter_id: matterId,
./app/api/matters/identity-field/route.ts:211:        matter_id: true,
./app/api/matters/identity-field/route.ts:227:        matterId,
./app/api/matters/identity-field/route.ts:242:      matterId: claimIndex.matter_id,
./app/api/matters/identity-field/route.ts:262:    const matterId = Number(body?.matterId);
./app/api/matters/identity-field/route.ts:270:    if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/matters/identity-field/route.ts:271:      return jsonError("A valid matterId is required.");
./app/api/matters/identity-field/route.ts:301:        matter_id: matterId,
./app/api/matters/identity-field/route.ts:304:        matter_id: true,
./app/api/matters/identity-field/route.ts:320:        matterId,
./app/api/matters/identity-field/route.ts:334:        matterId,
./app/api/matters/identity-field/route.ts:355:          matter_id: matterId,
./app/api/matters/identity-field/route.ts:359:          matter_id: true,
./app/api/matters/identity-field/route.ts:396:          affectedMatterIds: [matterId],
./app/api/matters/identity-field/route.ts:397:          matterId,
./app/api/matters/identity-field/route.ts:417:      matterId: updated.matter_id,
./app/admin/claim-index/audit/page.tsx:12:  matter_id: number;
./app/admin/claim-index/audit/page.tsx:225:      row.matter_id,
./app/admin/claim-index/audit/page.tsx:451:                              <tr key={`${check.id}-${row.matter_id}-${row.issue_detail || ""}`}>
./app/admin/claim-index/audit/page.tsx:452:                                <td style={tdStyle}>{row.matter_id}</td>
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:7:  "matterId" INTEGER,
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:10:  "clioMatterId" INTEGER,
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:25:CREATE INDEX "MaildropAddress_matterId_idx" ON "MaildropAddress"("matterId");
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:28:CREATE INDEX "MaildropAddress_clioMatterId_idx" ON "MaildropAddress"("clioMatterId");
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:35:  "matterId",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:38:  "clioMatterId",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:51:  "matterId",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:54:  "clioMatterId",
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:73:  "matterId" = COALESCE(EXCLUDED."matterId", "MaildropAddress"."matterId"),
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql:76:  "clioMatterId" = COALESCE(EXCLUDED."clioMatterId", "MaildropAddress"."clioMatterId"),
./scripts/verify-admin-tickler-no-autoload-simplified-results-safety.mjs:62:mustInclude("result matter caseData cell", "(tickler as any).caseData?.matter || tickler.displayNumber || tickler.matterId || \"—\"");
./lib/clioDocumentUpload.ts:15:export type ClioMatterDocument = {
./lib/clioDocumentUpload.ts:72:export async function uploadBufferToClioMatterDocuments(params: {
./lib/clioDocumentUpload.ts:73:  matterId: number;
./lib/clioDocumentUpload.ts:78:  const matterId = Number(params.matterId);
./lib/clioDocumentUpload.ts:85:  if (!Number.isFinite(matterId) || matterId <= 0) {
./lib/clioDocumentUpload.ts:108:            id: matterId,
./lib/clioDocumentUpload.ts:198:export async function listClioMatterDocuments(matterIdInput: number): Promise<ClioMatterDocument[]> {
./lib/clioDocumentUpload.ts:199:  const matterId = Number(matterIdInput);
./lib/clioDocumentUpload.ts:201:  if (!Number.isFinite(matterId) || matterId <= 0) {
./lib/clioDocumentUpload.ts:215:    `/api/v4/documents.json?matter_id=${encodeURIComponent(String(matterId))}&limit=200&fields=${encodeURIComponent(fields)}`
./lib/clioDocumentUpload.ts:220:    `Clio document lookup failed for matter ${matterId}`
./lib/clioDocumentUpload.ts:252:  existingDocuments: ClioMatterDocument[],
./lib/clioDocumentUpload.ts:254:): ClioMatterDocument[] {
./app/api/documents/packet/route.ts:248:      { matter_id: "asc" },
./app/api/documents/packet/route.ts:458:    matterId: row.matter_id,
./app/api/documents/packet/route.ts:563:          matterId: lawsuit.clioMasterMatterId,
./app/api/documents/packet/route.ts:575:          matterId: master.matter_id,
./app/api/admin/email-automation-status/route.ts:98:    matterId: row?.matterId ?? row?.matterID ?? details.matterId ?? details.matterID ?? null,
./app/api/admin/email-automation-status/route.ts:206:    matterId: firstText(row?.matterId, row?.matterID, details.matterId, details.matterID),
./app/api/admin/email-automation-status/route.ts:208:    clioMatterId: firstText(row?.clioMatterId, row?.clioMatterID, details.clioMatterId, details.clioMatterID),
./scripts/verify-active-operational-clio-routes-removed.mjs:83:assert(matterClose.includes("syncClioMatterClosed"), "matter close must perform guarded Clio close sync.");
./prisma/migrations/20260520213000_add_local_workflow_ticklers/migration.sql:11:    "matterId" INTEGER,
./prisma/migrations/20260520213000_add_local_workflow_ticklers/migration.sql:39:CREATE INDEX "LocalWorkflowTickler_matterId_idx" ON "LocalWorkflowTickler"("matterId");
./prisma/migrations/20260430120000_add_claim_cluster_cache/migration.sql:3:  "matter_ids" TEXT NOT NULL,
./app/api/matters/identity-field/search/route.ts:53:        matter_id: true,
./app/api/matters/identity-field/search/route.ts:75:        matter_id: "asc",
./app/api/matters/identity-field/search/route.ts:86:        id: String(row.matter_id),
./app/api/matters/identity-field/search/route.ts:87:        matterId: row.matter_id,
./app/api/matters/identity-field/search/route.ts:88:        matter_id: row.matter_id,
./scripts/verify-document-delivery-history-safety.mjs:21:  "matterId",
./scripts/verify-document-delivery-history-safety.mjs:23:  "clioMatterId",
./scripts/inventory-claim-index-schema.mjs:40:  if (/patient|provider|insurer|treating|claimnumber|claim_number|dos|dateofservice|date_of_service|claimamount|claim_amount|denial|status|workflow|masterlawsuit|master_lawsuit|search|normalized|bill|matterid|matter_id/.test(hay)) return 'KEEP_IN_CLAIMINDEX_IF_MATTER_IDENTITY_SEARCH';
./prisma/migrations/20260520120500_add_local_settlement_records/migration.sql:48:  "matterId" INTEGER NOT NULL,
./prisma/migrations/20260520120500_add_local_settlement_records/migration.sql:84:CREATE INDEX IF NOT EXISTS "LocalSettlementRow_matterId_idx" ON "LocalSettlementRow"("matterId");
./app/api/documents/print-queue/route.ts:5:  listClioMatterDocuments,
./app/api/documents/print-queue/route.ts:307:          numberOrNull(rawCandidate?.clioMatterId) ||
./app/api/documents/print-queue/route.ts:308:          numberOrNull(body?.clioMatterId) ||
./app/api/documents/print-queue/route.ts:325:        const currentDocuments = await listClioMatterDocuments(masterMatterId);
./prisma/migrations/20260424193040_add_claim_index/migration.sql:3:    "matter_id" INTEGER NOT NULL,
./prisma/migrations/20260424193040_add_claim_index/migration.sql:26:    CONSTRAINT "ClaimIndex_pkey" PRIMARY KEY ("matter_id")
./app/api/claim-index/by-insurer/route.ts:19:    orderBy: { matter_id: "asc" },
./app/api/graph/config-health/route.ts:61:      "matterId",
./app/api/graph/config-health/route.ts:64:      "clioMatterId",
./scripts/verify-audit-log-safety.mjs:21:  "matterId",
./scripts/verify-audit-log-safety.mjs:29:  "@@index([matterId])",
./scripts/verify-clio-operational-routes-quarantined.mjs:111:    ["GET", "/api/aggregation/find-siblings?matterId=1876895480"],
./scripts/verify-clio-operational-routes-quarantined.mjs:112:    ["GET", "/api/aggregation/expand-claim?matterId=1876895480"],
./app/api/documents/matter-packet/route.ts:143:  return Number(row?.matter_id || row?.matterId || 0);
./app/api/documents/matter-packet/route.ts:179:    or.push({ matter_id: numericMatterId });
./app/api/documents/matter-packet/route.ts:192:    const matterIdInput =
./app/api/documents/matter-packet/route.ts:193:      clean(url.searchParams.get("matterId")) ||
./app/api/documents/matter-packet/route.ts:198:    if (!matterIdInput) {
./app/api/documents/matter-packet/route.ts:202:          error: "matterId, matter, displayNumber, or brl is required.",
./app/api/documents/matter-packet/route.ts:211:    const matter = await findMatterRow(matterIdInput);
./app/api/documents/matter-packet/route.ts:217:          error: `No local ClaimIndex row found for ${matterIdInput}.`,
./app/api/documents/matter-packet/route.ts:218:          matterIdInput,
./app/api/documents/matter-packet/route.ts:266:      matterId: numericMatterId || null,
./app/api/documents/matter-packet/route.ts:319:      matterId: numericMatterId || null,
./app/api/documents/matter-packet/route.ts:377:      matterIdInput,
./app/api/court-calendar/events/route.ts:168:      matter_id: true,
./app/api/court-calendar/events/route.ts:229:          matterId: row.matter_id,
./app/api/court-calendar/events/route.ts:509:            matterId: null,
./scripts/verify-master-view-documents-source-labels-safety.mjs:22:      route.includes("resolveClioMatterByDisplayNumber(childDisplay)") &&
./scripts/verify-master-view-documents-source-labels-safety.mjs:28:      route.includes("sourceClioMatterId") &&
./app/api/graph/background-thread-sync/route.ts:136:    matterId: numberOrNull(thread.matterId),
./app/api/graph/background-thread-sync/route.ts:139:    clioMatterId: numberOrNull(thread.clioMatterId),
./app/api/graph/background-thread-sync/route.ts:225:      matterId: true,
./app/api/graph/background-thread-sync/route.ts:228:      clioMatterId: true,
./prisma/migrations/20260428123000_add_webhook_event_key/migration.sql:5:SET "eventKey" = md5("id" || ':' || COALESCE("matterId"::text, '') || ':' || "createdAt"::text)
./app/api/documents/print-queue-preview/route.ts:5:  listClioMatterDocuments,
./app/api/documents/print-queue-preview/route.ts:6:  type ClioMatterDocument,
./app/api/documents/print-queue-preview/route.ts:65:function normalizeClioDocumentMatch(document: ClioMatterDocument) {
./app/api/documents/print-queue-preview/route.ts:77:  existingDocuments: ClioMatterDocument[],
./app/api/documents/print-queue-preview/route.ts:79:): ClioMatterDocument | null {
./app/api/documents/print-queue-preview/route.ts:118:  const documentsByMatterId = new Map<number, ClioMatterDocument[]>();
./app/api/documents/print-queue-preview/route.ts:122:    const matterId = Number(finalization.masterMatterId);
./app/api/documents/print-queue-preview/route.ts:124:    if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/documents/print-queue-preview/route.ts:133:    if (documentsByMatterId.has(matterId)) continue;
./app/api/documents/print-queue-preview/route.ts:136:      const documents = await listClioMatterDocuments(matterId);
./app/api/documents/print-queue-preview/route.ts:137:      documentsByMatterId.set(matterId, documents);
./app/api/documents/print-queue-preview/route.ts:141:        masterMatterId: matterId,
./app/api/documents/print-queue-preview/route.ts:144:      documentsByMatterId.set(matterId, []);
./app/api/documents/print-queue-preview/route.ts:149:    const matterId = Number(finalization.masterMatterId);
./app/api/documents/print-queue-preview/route.ts:150:    const currentDocuments = documentsByMatterId.get(matterId) || [];
./prisma/migrations/20260428120000_create_webhook_event/migration.sql:8:    "matterId" INTEGER,
./prisma/migrations/20260428120000_create_webhook_event/migration.sql:22:CREATE INDEX IF NOT EXISTS "WebhookEvent_matterId_idx" ON "WebhookEvent"("matterId");
./scripts/verify-settlement-summary-docx-safety.mjs:64:mustNotContain("settlement summary route", settlementSummaryRoute, "uploadBufferToClioMatterDocuments");
./scripts/verify-settlement-summary-docx-safety.mjs:65:mustNotContain("settlement summary route", settlementSummaryRoute, "listClioMatterDocuments");
./app/api/claim-index/by-master/route.ts:21:      { matter_id: "asc" },
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:17:    "matterId" INTEGER,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:20:    "clioMatterId" INTEGER,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:111:    "matterId" INTEGER,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:114:    "clioMatterId" INTEGER,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:149:CREATE INDEX IF NOT EXISTS "EmailThread_matterId_idx" ON "EmailThread"("matterId");
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:152:CREATE INDEX IF NOT EXISTS "EmailThread_clioMatterId_idx" ON "EmailThread"("clioMatterId");
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:181:CREATE INDEX IF NOT EXISTS "EmailMatterLink_matterId_idx" ON "EmailMatterLink"("matterId");
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:184:CREATE INDEX IF NOT EXISTS "EmailMatterLink_clioMatterId_idx" ON "EmailMatterLink"("clioMatterId");
./scripts/verify-graph-draft-payload-safety.mjs:47:mustContain(helperPath, helper, "BarshMattersClioMatterId");
./app/api/documents/master-clio-mapping-inspect/route.ts:33:        matter_id: true,
./app/api/documents/master-clio-mapping-inspect/route.ts:50:        localMatterId: row.matter_id,
./app/api/documents/master-clio-mapping-inspect/route.ts:51:        clioMatterId: row.matter_id,
./scripts/verify-claim-index-local-source-contract.mjs:33:  { label: 'Known Clio operational helper', re: /\bfetchMatterFromClio\b|\bgetMatterFromClio\b|\bclioMatterContext\b|\bloadClioMatterContext\b/u },
./scripts/verify-claim-index-local-source-contract.mjs:40:  { label: 'Known Clio operational helper', re: /\bfetchMatterFromClio\b|\bgetMatterFromClio\b|\bclioMatterContext\b|\bloadClioMatterContext\b/u },
./scripts/verify-admin-tickler-result-links-safety.mjs:24:mustNotInclude("raw matter-only td without link", '<td style={{ padding: "10px 8px" }}>{(tickler as any).caseData?.matter || tickler.displayNumber || tickler.matterId || "—"}</td>');
./app/api/graph/draft-payload-preview/route.ts:39:      !clean(context.clioMaildropEmail) && body?.matterId
./app/api/graph/draft-payload-preview/route.ts:40:        ? await resolveMaildropForGraphDraftMatterId(body.matterId)
./app/api/graph/draft-payload-preview/route.ts:81:        matterId: context.matterId,
./app/api/graph/draft-payload-preview/route.ts:84:        clioMatterId: context.clioMatterId,
./app/api/graph/draft-payload-preview/route.ts:104:      maildropResolutionAttempted: Boolean(body?.matterId),
./app/api/graph/create-draft/route.ts:4:import { listClioMatterDocuments } from "@/lib/clioDocumentUpload";
./app/api/graph/create-draft/route.ts:28:async function resolveClioMatterIdForAttachment(attachment: any): Promise<number | null> {
./app/api/graph/create-draft/route.ts:30:    clean(attachment?.clioMatterId || attachment?.clioUploadTargetMatterId || attachment?.matterId)
./app/api/graph/create-draft/route.ts:80:  const matterId = await resolveClioMatterIdForAttachment(attachment);
./app/api/graph/create-draft/route.ts:81:  if (!matterId) return "";
./app/api/graph/create-draft/route.ts:95:  const documents = await listClioMatterDocuments(matterId);
./app/api/graph/create-draft/route.ts:240:    !clean(context.clioMaildropEmail) && body?.matterId
./app/api/graph/create-draft/route.ts:241:      ? await resolveMaildropForGraphDraftMatterId(body.matterId)
./app/api/graph/create-draft/route.ts:285:  const resolvedMatterId = context.matterId || body.matterId || null;
./app/api/graph/create-draft/route.ts:306:            matterId: resolvedMatterId,
./app/api/graph/create-draft/route.ts:309:            clioMatterId: context.clioMatterId,
./app/api/graph/create-draft/route.ts:407:      clioMatterId: clean(attachment?.clioMatterId) || clean(attachment?.clioUploadTargetMatterId) || "",
./app/api/graph/create-draft/route.ts:408:      clioUploadTargetMatterId: clean(attachment?.clioUploadTargetMatterId) || clean(attachment?.clioMatterId) || "",
./app/api/graph/create-draft/route.ts:608:      matterId: resolvedMatterId,
./app/api/graph/create-draft/route.ts:611:      clioMatterId: context.clioMatterId,
./app/api/graph/create-draft/route.ts:624:    maildropResolutionAttempted: Boolean(body?.matterId),
./app/api/claim-index/search/route.ts:28:    orderBy: { matter_id: "asc" },
./app/api/claim-index/by-patient/route.ts:19:    orderBy: { matter_id: "asc" },
./app/api/claim-index/search-grouped/route.ts:30:      const id = Number(row.matter_id);
./app/api/claim-index/search-grouped/route.ts:35:      const isMaster = Number(row.matter_id) === maxId;
./app/api/claim-index/search-grouped/route.ts:117:      clio_master_matter_id: lawsuit.clioMasterMatterId || null,
./app/api/claim-index/search-grouped/route.ts:132:    matterId: clean(req.nextUrl.searchParams.get("matterId")),
./app/api/claim-index/search-grouped/route.ts:167:    orderBy: { matter_id: "asc" },
./app/api/documents/finalize/route.ts:5:  listClioMatterDocuments,
./app/api/documents/finalize/route.ts:6:  uploadBufferToClioMatterDocuments,
./app/api/documents/finalize/route.ts:56:  matterId: number;
./app/api/documents/finalize/route.ts:73:        masterMatterId: params.matterId,
./app/api/documents/finalize/route.ts:139:  const raw = preview?.clioUploadTarget?.matterId;
./app/api/documents/finalize/route.ts:140:  const matterId = Number(raw);
./app/api/documents/finalize/route.ts:142:  if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/documents/finalize/route.ts:146:  return matterId;
./app/api/documents/finalize/route.ts:275:    const matterId = getMasterMatterId(preview);
./app/api/documents/finalize/route.ts:286:    const existingDocuments = await listClioMatterDocuments(matterId);
./app/api/documents/finalize/route.ts:347:          matterId,
./app/api/documents/finalize/route.ts:420:      const result = await uploadBufferToClioMatterDocuments({
./app/api/documents/finalize/route.ts:421:        matterId,
./app/api/documents/finalize/route.ts:466:      matterId,
./app/api/documents/finalize/route.ts:495:        uploadedOnlyToRequestedClioMatterDocumentsTab: true,
./app/api/admin/lawsuits/audit/route.ts:39:  matter_id: number;
./app/api/admin/lawsuits/audit/route.ts:94:  matter_id: true,
./app/api/admin/lawsuits/audit/route.ts:185:      add(obj.matterId);
./app/api/admin/lawsuits/audit/route.ts:186:      add(obj.matter_id);
./app/api/admin/lawsuits/audit/route.ts:188:      add(obj.clioMatterId);
./app/api/admin/lawsuits/audit/route.ts:189:      add(obj.clio_matter_id);
./app/api/admin/lawsuits/audit/route.ts:202:  for (const match of text.matchAll(/\b(?:matterId|matter_id|clioMatterId|clio_matter_id|id)\D{0,12}(\d{6,})\b/gi)) {
./app/api/admin/lawsuits/audit/route.ts:303:        orderBy: [{ master_lawsuit_id: "asc" }, { matter_id: "asc" }],
./app/api/admin/lawsuits/audit/route.ts:397:      const linkedIds = new Set(linkedRows.map((row) => row.matter_id));
./app/api/admin/lawsuits/audit/route.ts:431:          !parsedIds.has(row.matter_id) &&
./app/api/admin/lawsuits/audit/route.ts:440:              .map((row) => row.matter_id)
./app/api/graph/maildrop-discovery/route.ts:182:    matterId: numberOrNull(record.matterId),
./app/api/graph/maildrop-discovery/route.ts:185:    clioMatterId: numberOrNull(record.clioMatterId),
./app/api/graph/maildrop-discovery/route.ts:322:    matterId: record?.matterId ?? null,
./app/api/graph/maildrop-discovery/route.ts:325:    clioMatterId: record?.clioMatterId ?? null,
./app/api/graph/maildrop-discovery/route.ts:358:    matterId: match.maildrop.matterId,
./app/api/graph/maildrop-discovery/route.ts:361:    clioMatterId: match.maildrop.clioMatterId,
./app/api/graph/maildrop-discovery/route.ts:371:    matterId: match.matterId ?? null,
./app/api/graph/maildrop-discovery/route.ts:374:    clioMatterId: match.clioMatterId ?? null,
./app/api/claim-index/by-matter/route.ts:39:    const matterId = Number(url.searchParams.get("matterId") || "");
./app/api/claim-index/by-matter/route.ts:49:    if ((!Number.isFinite(matterId) || matterId <= 0) && !displayNumber) {
./app/api/claim-index/by-matter/route.ts:50:      return jsonError("A valid matterId or displayNumber is required.");
./app/api/claim-index/by-matter/route.ts:53:    const hasValidMatterId = Number.isFinite(matterId) && matterId > 0;
./app/api/claim-index/by-matter/route.ts:66:        ? { matter_id: matterId }
./app/api/claim-index/by-matter/route.ts:69:        matter_id: true,
./app/api/claim-index/by-matter/route.ts:101:        matterId: Number.isFinite(matterId) ? matterId : null,
./app/api/claim-index/by-matter/route.ts:110:      id: rowWithMetadata.matter_id,
./app/api/claim-index/by-matter/route.ts:111:      matterId: rowWithMetadata.matter_id,
./app/api/claim-index/by-matter/route.ts:112:      matter_id: rowWithMetadata.matter_id,
./app/api/claim-index/by-matter/route.ts:175:      matterId: rowWithMetadata.matter_id,
./app/api/claim-index/by-provider/route.ts:20:    orderBy: { matter_id: "asc" },
./scripts/verify-graph-draft-persistence-safety.mjs:64:mustContain(routePath, route, "listClioMatterDocuments");
./scripts/verify-admin-claim-index-viewer-safety.mjs:112:  requireRegex(routePath, route, /orderBy:\s*\[\{\s*\[sort\]: direction\s*\},\s*\{\s*matter_id: "asc"\s*\}\]/s, "safe sorted orderBy");
./app/api/claim-index/local-index-status/route.ts:44:        matter_id: true,
./app/api/claim-index/local-index-status/route.ts:56:        matter_id: "asc",
./app/api/claim-index/local-index-status/route.ts:63:        matterId: row.matter_id,
./app/api/graph/local-thread-preview/route.ts:38:  const matterId = numberOrUndefined(url.searchParams.get("matterId"));
./app/api/graph/local-thread-preview/route.ts:39:  const clioMatterId = numberOrUndefined(url.searchParams.get("clioMatterId"));
./app/api/graph/local-thread-preview/route.ts:56:    matterId === undefined &&
./app/api/graph/local-thread-preview/route.ts:57:    clioMatterId === undefined
./app/api/graph/local-thread-preview/route.ts:65:  if (matterId !== undefined) threadWhere.matterId = matterId;
./app/api/graph/local-thread-preview/route.ts:66:  if (clioMatterId !== undefined) threadWhere.clioMatterId = clioMatterId;
./app/api/graph/local-thread-preview/route.ts:137:      matterId: matterId ?? null,
./app/api/graph/local-thread-preview/route.ts:138:      clioMatterId: clioMatterId ?? null,
./app/api/graph/local-thread-preview/route.ts:163:      matterId: thread.matterId,
./app/api/graph/local-thread-preview/route.ts:166:      clioMatterId: thread.clioMatterId,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:22:    matterId: text(row.matter_id),
./app/api/admin/lawsuits/cleanup-confirm/route.ts:33:async function deleteMappedClioShell(clioMatterId: number) {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:34:  const response = await clioFetch(`/api/v4/matters/${encodeURIComponent(String(clioMatterId))}.json`, {
./app/api/admin/lawsuits/cleanup-confirm/route.ts:41:    clioMatterId,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:119:    orderBy: [{ display_number: "asc" }, { matter_id: "asc" }],
./app/api/admin/lawsuits/cleanup-confirm/route.ts:234:            noChildClioMatterDeletion: true,
./app/api/admin/lawsuits/cleanup-confirm/route.ts:266:    deletedChildClioMatters: false,
./scripts/verify-court-calendar-schema-foundation-safety.mjs:29:  "matterId               Int?",
./scripts/verify-court-calendar-schema-foundation-safety.mjs:30:  "@@index([matterId])",
./scripts/verify-court-calendar-schema-foundation-safety.mjs:43:  '"matterId" INTEGER',
./scripts/verify-court-calendar-schema-foundation-safety.mjs:44:  'CourtCalendarEvent_matterId_idx',
./app/api/graph/thread-sync/route.ts:112:        matterId: thread.matterId,
./app/api/graph/thread-sync/route.ts:115:        clioMatterId: thread.clioMatterId,
./app/api/graph/thread-sync/route.ts:248:    matterId: body.matterId ?? objectValue(body.context).matterId ?? (localContext as any).matterId,
./app/api/graph/thread-sync/route.ts:251:    clioMatterId: numberOrNull(body.clioMatterId ?? objectValue(body.context).clioMatterId ?? (localContext as any).clioMatterId),
./app/api/admin/lawsuits/cleanup-preview/route.ts:18:    matterId: text(row.matter_id),
./app/api/admin/lawsuits/cleanup-preview/route.ts:49:    orderBy: [{ display_number: "asc" }, { matter_id: "asc" }],
./app/api/admin/lawsuits/cleanup-preview/route.ts:59:        orderBy: [{ master_lawsuit_id: "asc" }, { display_number: "asc" }, { matter_id: "asc" }],
./app/api/admin/lawsuits/cleanup-preview/route.ts:99:      clioMatterId: lawsuit.clioMasterMatterId,
./app/api/admin/ticklers/duplicates/route.ts:48:        matterId: true,
./app/api/admin/ticklers/duplicates/route.ts:84:          matterId: row.matterId,
./scripts/verify-guarded-clio-close-sync-safety.mjs:31:mustContain("helper", helper, "export async function syncClioMatterClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:32:mustContain("helper", helper, "export async function syncClioMattersClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:42:mustContain("matter close route", matterClose, 'import { syncClioMatterClosed } from "@/lib/clioCloseSync";');
./scripts/verify-guarded-clio-close-sync-safety.mjs:43:mustContain("matter close route", matterClose, "const clioCloseSync = await syncClioMatterClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:56:mustContain("lawsuit close route", lawsuitClose, 'import { syncClioMattersClosed } from "@/lib/clioCloseSync";');
./scripts/verify-guarded-clio-close-sync-safety.mjs:57:mustContain("lawsuit close route", lawsuitClose, "const clioCloseSync = await syncClioMattersClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:74:mustNotContain("settlement close shortcut remains blocked", settlementClose, "syncClioMatterClosed");
./scripts/verify-guarded-clio-close-sync-safety.mjs:75:mustNotContain("settlement close shortcut remains blocked", settlementClose, "syncClioMattersClosed");
./app/api/admin/ticklers/search/route.ts:37:    const matterId = numberOrNull(url.searchParams.get("matterId"));
./app/api/admin/ticklers/search/route.ts:74:    if (matterId !== null) where.matterId = matterId;
./app/api/admin/ticklers/search/route.ts:182:          matter_id: true,
./app/api/admin/ticklers/search/route.ts:189:      const matterIds = Array.from(new Set(matchingClaims.map((row) => row.matter_id).filter((value) => Number.isFinite(Number(value)))));
./app/api/admin/ticklers/search/route.ts:193:      if (matterIds.length === 0 && displayNumbers.length === 0 && masterLawsuitIds.length === 0) {
./app/api/admin/ticklers/search/route.ts:197:        if (matterIds.length) linkedClauses.push({ matterId: { in: matterIds } });
./app/api/admin/ticklers/search/route.ts:226:        matterId: true,
./app/api/admin/ticklers/search/route.ts:255:          .map((tickler) => Number(tickler.matterId))
./app/api/admin/ticklers/search/route.ts:288:              ...(ticklerMatterIds.length ? [{ matter_id: { in: ticklerMatterIds } }] : []),
./app/api/admin/ticklers/search/route.ts:322:            matterId: true,
./app/api/admin/ticklers/search/route.ts:353:    const claimByMatterId = new Map(relatedClaimRows.map((row: any) => [String(row.matter_id || ""), row]));
./app/api/admin/ticklers/search/route.ts:426:        claimByMatterId.get(String(tickler.matterId || "")) ||
./app/api/admin/ticklers/search/route.ts:447:            : firstText(tickler.displayNumber, claim.display_number, tickler.matterId, claim.matter_id),
./app/api/admin/ticklers/search/route.ts:568:        matterId,
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:47:  "matter_id",
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:82:  "matter_id",
./app/api/settlements/documents-preview/route.ts:100:            { matterId: "asc" },
./app/api/settlements/documents-preview/route.ts:172:        matterId: row.matterId,
./app/api/admin/ticklers/duplicates/cleanup-preview/route.ts:13:  matterId: number | null;
./app/api/admin/ticklers/duplicates/cleanup-preview/route.ts:54:    matterId: row.matterId,
./app/api/admin/ticklers/duplicates/cleanup-preview/route.ts:86:        matterId: true,
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:35:mustContain("confirm route audits no child Clio deletion", route, "noChildClioMatterDeletion: true");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:36:mustContain("confirm route reports child Clio matters not deleted", route, "deletedChildClioMatters: false");
./app/api/documents/packet-summary/route.ts:194:          tableCell(child.displayNumber || child.matterId || ""),
./scripts/verify-document-finalization-target-routing-safety.mjs:14:      finalizePreview.includes("resolveClioMatterByDisplayNumber"),
./scripts/verify-document-finalization-target-routing-safety.mjs:39:      finalizeRoute.includes("uploadedOnlyToRequestedClioMatterDocumentsTab") &&
./app/api/admin/clients/[id]/invoice/create/route.ts:116:    sourceMatterId: clean(lineValue(line, ["sourceMatterId", "matterId", "matter_id", "clioMatterId"])) || null,
./app/api/admin/claim-index/audit/route.ts:13:  matter_id: number;
./app/api/admin/claim-index/audit/route.ts:51:  matter_id: true,
./app/api/admin/claim-index/audit/route.ts:107:    orderBy: [{ matter_id: "asc" }],
./app/api/admin/claim-index/audit/route.ts:239:        orderBy: [{ matter_id: "asc" }],
./app/api/admin/claim-index/audit/route.ts:244:        orderBy: [{ matter_id: "asc" }],
./app/api/admin/claim-index/audit/route.ts:272:          orderBy: [{ display_number: "asc" }, { matter_id: "asc" }],
./scripts/verify-local-lawsuit-generation-create-safety.mjs:49:mustContain("derives Clio client from selected child matter shells", "findClientFromChildClioMatters(selectedRows)");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:50:mustContain("reads child Clio matter client only to assign same Clio client to shell", "readClioMatterClient");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:53:mustContain("stores Clio assigned matter id in local mapping", "clioMasterMatterId: createdClioMatter.matterId");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:54:mustContain("stores Clio assigned display number in local mapping", "clioMasterDisplayNumber: createdClioMatter.displayNumber");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:56:mustContain("response returns created Clio matter shell", "createdClioMatter: {");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:77:mustNotContain("must not use Clio as local identity hydration", "clioMatterToClaimIndex");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:81:const clioMatterEndpointCount = countOccurrences(route, "/api/v4/matters.json");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:87:if (clioMatterEndpointCount !== 1) {
./scripts/verify-local-lawsuit-generation-create-safety.mjs:88:  failures.push(`approved Clio shell scope: expected exactly 1 Clio matter-create endpoint string; found ${clioMatterEndpointCount}`);
./scripts/verify-local-lawsuit-generation-create-safety.mjs:103:console.log("CLIO_MATTER_ENDPOINT_COUNT=" + clioMatterEndpointCount);
./scripts/verify-print-queue-clio-document-null-type-safety.mjs:12:  "let byFilename: ClioMatterDocument",
./app/api/admin/ticklers/run/route.ts:82:        matterId: true,
./app/api/admin/ticklers/run/route.ts:100:      matterId: tickler.matterId,
./app/api/admin/ticklers/run/route.ts:160:        matterId: true,
./app/api/admin/ticklers/run/route.ts:184:        matterId: tickler.matterId,
./app/api/documents/clio-maildrop-inspect/route.ts:56:async function readClioMatterWithFields(matterId: number, fields: string) {
./app/api/documents/clio-maildrop-inspect/route.ts:58:    `/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-maildrop-inspect/route.ts:108:    const matterIds = new Set<number>();
./app/api/documents/clio-maildrop-inspect/route.ts:110:    for (const id of url.searchParams.getAll("matterId")) {
./app/api/documents/clio-maildrop-inspect/route.ts:112:      if (n) matterIds.add(n);
./app/api/documents/clio-maildrop-inspect/route.ts:119:        if (id) matterIds.add(id);
./app/api/documents/clio-maildrop-inspect/route.ts:124:    if (mappedMasterMatterId) matterIds.add(mappedMasterMatterId);
./app/api/documents/clio-maildrop-inspect/route.ts:129:        matter_id: true,
./app/api/documents/clio-maildrop-inspect/route.ts:137:      const id = numberOrNull(row.matter_id);
./app/api/documents/clio-maildrop-inspect/route.ts:138:      if (id) matterIds.add(id);
./app/api/documents/clio-maildrop-inspect/route.ts:153:    for (const matterId of matterIds) {
./app/api/documents/clio-maildrop-inspect/route.ts:156:        reads.push(await readClioMatterWithFields(matterId, fields));
./app/api/documents/clio-maildrop-inspect/route.ts:160:        matterId,
./app/api/documents/clio-maildrop-inspect/route.ts:181:      matterIds: Array.from(matterIds),
./scripts/verify-clio-master-matter-preview-safety.mjs:39:mustContain(routePath, route, "createsClioMatter: false");
./scripts/verify-clio-master-matter-preview-safety.mjs:49:mustContain(routePath, route, "findClientFromChildClioMatters");
./scripts/verify-clio-master-matter-preview-safety.mjs:58:mustContain(routePath, route, "readClioMatterClient");
./app/api/admin/claim-index/search/route.ts:7:  | "matter_id"
./app/api/admin/claim-index/search/route.ts:20:  "matter_id",
./app/api/admin/claim-index/search/route.ts:34:  matter_id: true,
./app/api/admin/claim-index/search/route.ts:94:  const matterId = clean(params.get("matterId"));
./app/api/admin/claim-index/search/route.ts:107:    const qMatterId = numberFilter("matter_id", q);
./app/api/admin/claim-index/search/route.ts:130:  if (matterId) {
./app/api/admin/claim-index/search/route.ts:131:    const matterIdFilter = numberFilter("matter_id", matterId);
./app/api/admin/claim-index/search/route.ts:132:    if (matterIdFilter) and.push(matterIdFilter);
./app/api/admin/claim-index/search/route.ts:195:        orderBy: [{ [sort]: direction }, { matter_id: "asc" }],
./app/api/documents/clio-master-crossref-preview/route.ts:51:async function readClioMatter(matterId: number) {
./app/api/documents/clio-master-crossref-preview/route.ts:61:    `/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-master-crossref-preview/route.ts:74:    throw new Error(`Could not read Clio matter ${matterId}: status ${res.status}; body ${bodyText || "(empty)"}`);
./app/api/documents/clio-master-crossref-preview/route.ts:126:        matter_id: true,
./app/api/documents/clio-master-crossref-preview/route.ts:141:      .map((row) => numberOrNull(row.matter_id))
./app/api/documents/clio-master-crossref-preview/route.ts:174:    for (const matterId of targetMatterIds) {
./app/api/documents/clio-master-crossref-preview/route.ts:176:        const matter = await readClioMatter(matterId);
./app/api/documents/clio-master-crossref-preview/route.ts:204:          matterId,
./app/api/documents/clio-master-crossref-preview/route.ts:207:          isMasterClioMatter: matterId === masterMatterId,
./app/api/documents/clio-master-crossref-preview/route.ts:216:          matterId,
./scripts/verify-local-close-workflows-safety.mjs:34:mustContain("matter close route performs guarded Clio close sync", matterClose, "syncClioMatterClosed");
./scripts/verify-local-close-workflows-safety.mjs:53:mustContain("lawsuit close route performs guarded Clio close sync", lawsuitClose, "syncClioMattersClosed");
./scripts/verify-graph-thread-sync-persistence-safety.mjs:80:  'uploadBufferToClioMatterDocuments',
./app/api/settlements/local-preview/route.ts:8:  matter_id: number;
./app/api/settlements/local-preview/route.ts:25:  matterId: number;
./app/api/settlements/local-preview/route.ts:59:  matterId: number;
./app/api/settlements/local-preview/route.ts:122:      return a.row.matterId - b.row.matterId;
./app/api/settlements/local-preview/route.ts:149:    matterId: row.matterId,
./app/api/settlements/local-preview/route.ts:222:        matter_id: "asc",
./app/api/settlements/local-preview/route.ts:225:        matter_id: true,
./app/api/settlements/local-preview/route.ts:286:        matterId: row.matter_id,
./app/api/settlements/local-preview/route.ts:418:        matterId: row.matterId,
./scripts/verify-local-settlement-persistence-schema-safety.mjs:61:  '"LocalSettlementRow_matterId_idx"',
./app/api/documents/clio-master-crossref-confirm/route.ts:33:  const matterId = Number(target?.matterId);
./app/api/documents/clio-master-crossref-confirm/route.ts:34:  if (!Number.isFinite(matterId) || matterId <= 0) {
./app/api/documents/clio-master-crossref-confirm/route.ts:45:        `${target?.displayNumber || matterId}: ${field.fieldLabel || "Custom field"} is missing an existing custom field value id.`
./app/api/documents/clio-master-crossref-confirm/route.ts:57:    throw new Error(`${target?.displayNumber || matterId}: no planned custom field values to write.`);
./app/api/documents/clio-master-crossref-confirm/route.ts:62:  const res = await clioFetch(`/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`, {
./app/api/documents/clio-master-crossref-confirm/route.ts:85:      `Failed to write Clio cross-reference fields to ${target?.displayNumber || matterId}: status ${res.status}; body ${bodyText || "(empty)"}`
./app/api/documents/clio-master-crossref-confirm/route.ts:90:    matterId,
./scripts/verify-settlement-finalized-email-safety.mjs:139:      page.includes("masterClioDocumentsResult?.clioMatterId") &&
./scripts/verify-settlement-finalized-email-safety.mjs:154:      createDraftRoute.includes("listClioMatterDocuments(matterId)") &&
./scripts/verify-settlement-finalized-email-safety.mjs:155:      createDraftRoute.includes("resolveClioMatterIdForAttachment"),
./scripts/verify-settlement-finalized-email-safety.mjs:160:      page.includes("clioMatterId:") &&
./scripts/verify-settlement-finalized-email-safety.mjs:167:      createDraftRoute.includes("resolveClioMatterIdForAttachment") &&
./scripts/verify-settlement-finalized-email-safety.mjs:170:      createDraftRoute.includes("listClioMatterDocuments(matterId)"),
./app/api/admin/clients/[id]/route.ts:185:  return clean(row.display_number || row.displayNumber || row.matter_display_number || row.matterDisplayNumber || row.matterId || row.id);
./app/api/admin/clients/[id]/route.ts:304:  return clean(row.matterId || row.matter_id || row.claimIndexMatterId || row.claimIndexId || row.clioMatterId || row.displayNumber || row.display_number);
./app/api/admin/clients/[id]/route.ts:376:      OR.push({ matterId: numeric });
./app/api/admin/clients/[id]/route.ts:686:            row.matterId,
./app/api/admin/clients/[id]/route.ts:687:            row.matter_id,
./app/api/admin/clients/[id]/route.ts:688:            row.clioMatterId,
./app/api/admin/clients/[id]/route.ts:689:            row.clio_matter_id,
./app/api/admin/clients/[id]/route.ts:720:        claim.matterId,
./app/api/admin/clients/[id]/route.ts:721:        claim.matter_id,
./app/api/admin/clients/[id]/route.ts:722:        claim.clioMatterId,
./app/api/admin/clients/[id]/route.ts:723:        claim.clio_matter_id,
./app/api/admin/clients/[id]/route.ts:786:          lawsuit.matterId,
./app/api/admin/clients/[id]/route.ts:787:          lawsuit.matter_id,
./app/api/admin/clients/[id]/route.ts:789:          lawsuit.master_matter_id,
./app/api/admin/clients/[id]/route.ts:796:          options.matterId,
./app/api/admin/clients/[id]/route.ts:797:          options.matter_id,
./app/api/admin/clients/[id]/route.ts:799:          options.master_matter_id,
./app/api/admin/clients/[id]/route.ts:812:          ...(Array.isArray(options.matterIds) ? options.matterIds : []),
./app/api/admin/clients/[id]/route.ts:813:          ...(Array.isArray(options.matter_ids) ? options.matter_ids : []),
./app/api/admin/clients/[id]/route.ts:821:          ...splitMetadataList(options.lawsuit_matter_ids),
./app/api/admin/clients/[id]/route.ts:822:          ...splitMetadataList(options.indexAaaNumberClioMatterIds),
./app/api/admin/clients/[id]/route.ts:823:          ...splitMetadataList(options.index_aaa_number_clio_matter_ids),
./app/api/admin/clients/[id]/route.ts:827:          ...splitMetadataList(options.lawsuit_matter_display_numbers_missing_field_matter_ids),
./app/api/documents/clio-maildrop-resolve/route.ts:57:async function readMatterMaildropById(matterId: number) {
./app/api/documents/clio-maildrop-resolve/route.ts:60:    `/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-maildrop-resolve/route.ts:73:    throw new Error(`Could not read Clio matter ${matterId}: status ${res.status}; body ${bodyText || "(empty)"}`);
./app/api/documents/clio-maildrop-resolve/route.ts:80:  const rawMatterId = clean(url.searchParams.get("matterId"));
./app/api/documents/clio-maildrop-resolve/route.ts:146:      matterId: source === "direct_matter" ? Number(clean(url.searchParams.get("matterId")) || 0) || null : null,
./app/api/documents/clio-maildrop-resolve/route.ts:148:      clioMatterId: Number(matter?.id || 0) || null,
./app/api/documents/summons-complaint/route.ts:283:          tableCell(child.displayNumber || child.matterId || ""),
./scripts/verify-graph-create-draft-safety.mjs:72:mustContain(routePath, route, "listClioMatterDocuments");
./app/api/documents/delivery-draft-preview/route.ts:73:    matterId: clean(raw.matterId) || undefined,
./app/api/documents/delivery-draft-preview/route.ts:113:            clioMatterId: clean((context as any).clioMatterId),
./app/api/documents/delivery-draft-preview/route.ts:114:            clioUploadTargetMatterId: clean((context as any).clioUploadTargetMatterId) || clean((context as any).clioMatterId),
./app/api/documents/delivery-draft-preview/route.ts:134:            clioMatterId: clean((context as any).clioMatterId),
./app/api/documents/delivery-draft-preview/route.ts:135:            clioUploadTargetMatterId: clean((context as any).clioUploadTargetMatterId) || clean((context as any).clioMatterId),
./app/api/documents/delivery-draft-preview/route.ts:163:        matterId: graphContext.matterId,
./app/api/documents/delivery-draft-preview/route.ts:166:        clioMatterId: graphContext.clioMatterId,
./app/api/settlements/settlement-summary/route.ts:261:          tableCell(row?.displayNumber || row?.matterId, { width: 14 }),
./app/api/ticklers/settlement-payment-due/route.ts:38:          orderBy: [{ displayNumber: "asc" }, { matterId: "asc" }],
./app/api/ticklers/settlement-payment-due/route.ts:55:          orderBy: [{ displayNumber: "asc" }, { matterId: "asc" }],
./app/api/ticklers/settlement-payment-due/route.ts:208:      .map((row) => row.displayNumber || (row.matterId ? `Matter ${row.matterId}` : ""))
./app/api/ticklers/settlement-payment-due/route.ts:237:      matterId: null,
./app/api/ticklers/settlement-payment-due/route.ts:250:          matterId: row.matterId,
./scripts/verify-direct-payment-backend-balance-guard-canonical-safety.mjs:8:  "{ matter_id: matterId }",
./app/api/lawsuits/local-generation-create/route.ts:40:  return text(row?.display_number) || String(row?.matter_id || "");
./app/api/lawsuits/local-generation-create/route.ts:54:function buildClioMatterDescription(masterLawsuitId: string) {
./app/api/lawsuits/local-generation-create/route.ts:66:async function readClioMatterClient(matterId: number | string) {
./app/api/lawsuits/local-generation-create/route.ts:67:  const id = Number(matterId);
./app/api/lawsuits/local-generation-create/route.ts:86:      matterId: id,
./app/api/lawsuits/local-generation-create/route.ts:98:      matterId: id,
./app/api/lawsuits/local-generation-create/route.ts:106:    matterId: id,
./app/api/lawsuits/local-generation-create/route.ts:113:async function findClientFromChildClioMatters(rows: Array<{ matter_id: number | null; display_number?: string | null }>) {
./app/api/lawsuits/local-generation-create/route.ts:116:      matterId: Number(row.matter_id),
./app/api/lawsuits/local-generation-create/route.ts:119:    .filter((row) => Number.isFinite(row.matterId) && row.matterId > 0);
./app/api/lawsuits/local-generation-create/route.ts:124:    const result = await readClioMatterClient(candidate.matterId);
./app/api/lawsuits/local-generation-create/route.ts:135:        sourceMatterId: result.matterId,
./app/api/lawsuits/local-generation-create/route.ts:190:  const matterId = positiveNumber(matter?.id);
./app/api/lawsuits/local-generation-create/route.ts:194:  if (!matterId) {
./app/api/lawsuits/local-generation-create/route.ts:204:    matterId,
./app/api/lawsuits/local-generation-create/route.ts:216:    const selectedMatterIds = normalizeMatterIds(body?.matterIds || body?.selectedMatterIds);
./app/api/lawsuits/local-generation-create/route.ts:301:        matter_id: {
./app/api/lawsuits/local-generation-create/route.ts:308:    const foundIds = new Set(selectedRows.map((row) => Number(row.matter_id)));
./app/api/lawsuits/local-generation-create/route.ts:362:          blockedMatterIds: blockedRows.map((row) => Number(row.matter_id)),
./app/api/lawsuits/local-generation-create/route.ts:376:    const childClient = await findClientFromChildClioMatters(selectedRows);
./app/api/lawsuits/local-generation-create/route.ts:401:      matterId: Number(row.matter_id),
./app/api/lawsuits/local-generation-create/route.ts:417:    const clioMatterDescription = buildClioMatterDescription(masterLawsuitId);
./app/api/lawsuits/local-generation-create/route.ts:419:    const createdClioMatter = await createClioMasterMatter({
./app/api/lawsuits/local-generation-create/route.ts:421:      description: clioMatterDescription,
./app/api/lawsuits/local-generation-create/route.ts:447:            clioMasterMatterId: createdClioMatter.matterId,
./app/api/lawsuits/local-generation-create/route.ts:448:            clioMasterDisplayNumber: createdClioMatter.displayNumber,
./app/api/lawsuits/local-generation-create/route.ts:449:            clioMasterMatterDescription: createdClioMatter.description || clioMatterDescription,
./app/api/lawsuits/local-generation-create/route.ts:467:          clioMasterMatterId: createdClioMatter.matterId,
./app/api/lawsuits/local-generation-create/route.ts:468:          clioMasterDisplayNumber: createdClioMatter.displayNumber,
./app/api/lawsuits/local-generation-create/route.ts:469:          clioMasterMatterDescription: createdClioMatter.description || clioMatterDescription,
./app/api/lawsuits/local-generation-create/route.ts:477:          matter_id: {
./app/api/lawsuits/local-generation-create/route.ts:517:      createdClioMatter: {
./app/api/lawsuits/local-generation-create/route.ts:518:        id: createdClioMatter.matterId,
./app/api/lawsuits/local-generation-create/route.ts:519:        displayNumber: createdClioMatter.displayNumber,
./app/api/lawsuits/local-generation-create/route.ts:520:        description: createdClioMatter.description || clioMatterDescription,
./scripts/verify-admin-tickler-lawsuit-level-display-dedupe-safety.mjs:24:mustInclude("table displays enriched matter", page, "(tickler as any).caseData?.matter || tickler.displayNumber || tickler.matterId");
./scripts/verify-admin-tickler-lawsuit-level-display-dedupe-safety.mjs:27:mustNotInclude("table displays raw displayNumber only", page, "{tickler.displayNumber || tickler.matterId || \"—\"}");
./app/api/documents/clio-master-matter-preview/route.ts:30:function buildClioMatterDescription(masterLawsuitId: string) {
./app/api/documents/clio-master-matter-preview/route.ts:34:async function readClioMatterClient(matterId: number | string) {
./app/api/documents/clio-master-matter-preview/route.ts:35:  const id = Number(matterId);
./app/api/documents/clio-master-matter-preview/route.ts:54:      matterId: id,
./app/api/documents/clio-master-matter-preview/route.ts:66:      matterId: id,
./app/api/documents/clio-master-matter-preview/route.ts:74:    matterId: id,
./app/api/documents/clio-master-matter-preview/route.ts:81:async function findClientFromChildClioMatters(rows: Array<{ matter_id: number | null; display_number?: string | null }>) {
./app/api/documents/clio-master-matter-preview/route.ts:84:      matterId: Number(row.matter_id),
./app/api/documents/clio-master-matter-preview/route.ts:87:    .filter((row) => Number.isFinite(row.matterId) && row.matterId > 0);
./app/api/documents/clio-master-matter-preview/route.ts:92:    const result = await readClioMatterClient(candidate.matterId);
./app/api/documents/clio-master-matter-preview/route.ts:103:        sourceMatterId: result.matterId,
./app/api/documents/clio-master-matter-preview/route.ts:126:    clioMatterId: "TO_BE_ASSIGNED_BY_CLIO",
./app/api/documents/clio-master-matter-preview/route.ts:128:    clioMatterDescription: buildClioMatterDescription(masterLawsuitId),
./app/api/documents/clio-master-matter-preview/route.ts:150:        matter_id: true,
./app/api/documents/clio-master-matter-preview/route.ts:180:    const childClient = await findClientFromChildClioMatters(claimIndexRows);
./app/api/documents/clio-master-matter-preview/route.ts:182:    const plannedClioMatterPayload = {
./app/api/documents/clio-master-matter-preview/route.ts:184:        description: buildClioMatterDescription(masterLawsuitId),
./app/api/documents/clio-master-matter-preview/route.ts:211:      createsClioMatter: false,
./app/api/documents/clio-master-matter-preview/route.ts:227:      plannedClioMatterPayload,
./app/api/documents/clio-master-matter-preview/route.ts:237:        mustCaptureClioMatterId: true,
./app/api/documents/clio-master-matter-preview/route.ts:253:        createsClioMatter: false,
./scripts/verify-close-paid-settlements-safety.mjs:32:mustNotContain("settlement close shortcut must not call guarded helper", settlementCloseRoute, "syncClioMatterClosed");
./scripts/verify-close-paid-settlements-safety.mjs:33:mustNotContain("settlement close shortcut must not call guarded helper", settlementCloseRoute, "syncClioMattersClosed");
./scripts/verify-close-paid-settlements-safety.mjs:36:mustContain("guarded lawsuit close route performs Clio close sync", lawsuitCloseRoute, "syncClioMattersClosed");
./app/api/lawsuits/local-generation-preview/route.ts:33:  return text(row?.display_number) || String(row?.matter_id || "");
./app/api/lawsuits/local-generation-preview/route.ts:52:    const selectedMatterIds = normalizeMatterIds(body?.matterIds || body?.selectedMatterIds);
./app/api/lawsuits/local-generation-preview/route.ts:98:        matter_id: {
./app/api/lawsuits/local-generation-preview/route.ts:105:    const foundIds = new Set(selectedRows.map((row) => Number(row.matter_id)));
./app/api/lawsuits/local-generation-preview/route.ts:162:    const blockedMatterIds = selectedExistingMasterRows.map((row) => Number(row.matter_id));
./app/api/lawsuits/local-generation-preview/route.ts:172:          matterIds: [] as number[],
./app/api/lawsuits/local-generation-preview/route.ts:177:        current.matterIds.push(Number(row.matter_id));
./app/api/lawsuits/local-generation-preview/route.ts:181:      }, new Map<string, { masterLawsuitId: string; count: number; matterIds: number[]; displayNumbers: string[] }>())
./app/api/lawsuits/local-generation-preview/route.ts:184:      matterIds: group.matterIds.sort((a, b) => a - b),
./app/api/lawsuits/local-generation-preview/route.ts:189:      matterId: Number(row.matter_id),
./app/api/lawsuits/local-generation-preview/route.ts:206:      matterId: Number(row.matter_id),
./app/api/settlements/provider-remittance-breakdown/route.ts:217:          tableCell(row?.displayNumber || row?.matterId, { width: 13 }),
./app/api/documents/clio-master-matter-confirm/route.ts:20:function buildClioMatterDescription(masterLawsuitId: string) {
./app/api/documents/clio-master-matter-confirm/route.ts:24:async function readClioMatterClient(matterId: number | string) {
./app/api/documents/clio-master-matter-confirm/route.ts:25:  const id = Number(matterId);
./app/api/documents/clio-master-matter-confirm/route.ts:44:      matterId: id,
./app/api/documents/clio-master-matter-confirm/route.ts:56:      matterId: id,
./app/api/documents/clio-master-matter-confirm/route.ts:64:    matterId: id,
./app/api/documents/clio-master-matter-confirm/route.ts:71:async function findClientFromChildClioMatters(rows: Array<{ matter_id: number | null; display_number?: string | null }>) {
./app/api/documents/clio-master-matter-confirm/route.ts:74:      matterId: Number(row.matter_id),
./app/api/documents/clio-master-matter-confirm/route.ts:77:    .filter((row) => Number.isFinite(row.matterId) && row.matterId > 0);
./app/api/documents/clio-master-matter-confirm/route.ts:82:    const result = await readClioMatterClient(candidate.matterId);
./app/api/documents/clio-master-matter-confirm/route.ts:93:        sourceMatterId: result.matterId,
./app/api/documents/clio-master-matter-confirm/route.ts:178:  const matterId = positiveNumber(matter?.id);
./app/api/documents/clio-master-matter-confirm/route.ts:182:  if (!matterId) {
./app/api/documents/clio-master-matter-confirm/route.ts:192:    matterId,
./app/api/documents/clio-master-matter-confirm/route.ts:215:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:233:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:247:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:273:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:286:        matter_id: true,
./app/api/documents/clio-master-matter-confirm/route.ts:293:    const childClient = await findClientFromChildClioMatters(claimIndexRows);
./app/api/documents/clio-master-matter-confirm/route.ts:300:          createsClioMatter: false,
./app/api/documents/clio-master-matter-confirm/route.ts:310:    const description = buildClioMatterDescription(masterLawsuitId);
./app/api/documents/clio-master-matter-confirm/route.ts:320:        clioMasterMatterId: created.matterId,
./app/api/documents/clio-master-matter-confirm/route.ts:331:      createsClioMatter: true,
./app/api/documents/clio-master-matter-confirm/route.ts:339:      createdClioMatter: {
./app/api/documents/clio-master-matter-confirm/route.ts:340:        id: created.matterId,
./app/api/documents/clio-master-matter-confirm/route.ts:365:        createsClioMatter: false,
./app/api/documents/clio-matter-documents/route.ts:4:import { listClioMatterDocuments } from "@/lib/clioDocumentUpload";
./app/api/documents/clio-matter-documents/route.ts:48:async function resolveClioMatterByDisplayNumber(displayNumberInput: string) {
./app/api/documents/clio-matter-documents/route.ts:55:      clioMatterId: null,
./app/api/documents/clio-matter-documents/route.ts:84:      clioMatterId: null,
./app/api/documents/clio-matter-documents/route.ts:94:    clioMatterId: exact.id,
./app/api/documents/clio-matter-documents/route.ts:102:  clioMatterId: number | null;
./app/api/documents/clio-matter-documents/route.ts:113:    sourceClioMatterId: source.clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:140:    const rawMatterId = url.searchParams.get("matterId");
./app/api/documents/clio-matter-documents/route.ts:143:    const matterId = numberOrNull(rawMatterId);
./app/api/documents/clio-matter-documents/route.ts:146:    if (matterId && masterLawsuitId) {
./app/api/documents/clio-matter-documents/route.ts:159:          error: "Use either matterId or masterLawsuitId, not both.",
./app/api/documents/clio-matter-documents/route.ts:165:    if (!matterId && !masterLawsuitId) {
./app/api/documents/clio-matter-documents/route.ts:178:          error: "Missing matterId or masterLawsuitId.",
./app/api/documents/clio-matter-documents/route.ts:184:    let clioMatterId: number | null = null;
./app/api/documents/clio-matter-documents/route.ts:189:    if (matterId) {
./app/api/documents/clio-matter-documents/route.ts:193:        where: { matter_id: matterId },
./app/api/documents/clio-matter-documents/route.ts:195:          matter_id: true,
./app/api/documents/clio-matter-documents/route.ts:205:      const localDisplayNumber = normalizeBrl(claimIndexRow?.display_number) || inferDisplayNumber(matterId);
./app/api/documents/clio-matter-documents/route.ts:206:      const clioResolution = await resolveClioMatterByDisplayNumber(localDisplayNumber);
./app/api/documents/clio-matter-documents/route.ts:208:      if (!clioResolution.ok || !clioResolution.clioMatterId) {
./app/api/documents/clio-matter-documents/route.ts:223:            matterId,
./app/api/documents/clio-matter-documents/route.ts:224:            localMatterId: matterId,
./app/api/documents/clio-matter-documents/route.ts:241:      clioMatterId = clioResolution.clioMatterId;
./app/api/documents/clio-matter-documents/route.ts:271:          matter_id: true,
./app/api/documents/clio-matter-documents/route.ts:279:        orderBy: [{ display_number: "asc" }, { matter_id: "asc" }],
./app/api/documents/clio-matter-documents/route.ts:283:      clioMatterId = numberOrNull(lawsuit?.clioMasterMatterId);
./app/api/documents/clio-matter-documents/route.ts:315:      if (!clioMatterId) {
./app/api/documents/clio-matter-documents/route.ts:340:    if (!clioMatterId) {
./app/api/documents/clio-matter-documents/route.ts:364:      const masterDocuments = await listClioMatterDocuments(clioMatterId);
./app/api/documents/clio-matter-documents/route.ts:366:        clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:383:        const childDisplay = normalizeBrl(child?.display_number) || inferDisplayNumber(child?.matter_id);
./app/api/documents/clio-matter-documents/route.ts:387:        const childResolution = await resolveClioMatterByDisplayNumber(childDisplay);
./app/api/documents/clio-matter-documents/route.ts:388:        if (!childResolution.ok || !childResolution.clioMatterId) {
./app/api/documents/clio-matter-documents/route.ts:390:            clioMatterId: null,
./app/api/documents/clio-matter-documents/route.ts:400:        const childDocuments = await listClioMatterDocuments(childResolution.clioMatterId);
./app/api/documents/clio-matter-documents/route.ts:402:          clioMatterId: childResolution.clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:415:      const directDocuments = await listClioMatterDocuments(clioMatterId);
./app/api/documents/clio-matter-documents/route.ts:417:        clioMatterId,
./app/api/documents/clio-matter-documents/route.ts:443:      matterId: matterId || null,
./app/api/documents/clio-matter-documents/route.ts:444:      localMatterId: matterId || null,
./app/api/documents/clio-matter-documents/route.ts:446:      clioMatterId,
./app/api/lawsuits/update-metadata/route.ts:61:  const matterIds = parseMatterIds(params.lawsuitMatters);
./app/api/lawsuits/update-metadata/route.ts:71:        selectedMatterCount: matterIds.length,
./app/api/lawsuits/update-metadata/route.ts:72:        components: matterIds.map((matterId) => ({
./app/api/lawsuits/update-metadata/route.ts:73:          matterId,
./app/api/lawsuits/update-metadata/route.ts:81:    matterIds.length > 0
./app/api/lawsuits/update-metadata/route.ts:84:            matter_id: {
./app/api/lawsuits/update-metadata/route.ts:85:              in: matterIds,
./app/api/lawsuits/update-metadata/route.ts:94:    matterId: Number(row.matter_id),
./app/api/lawsuits/update-metadata/route.ts:95:    displayNumber: row.display_number || String(row.matter_id),
./app/api/lawsuits/update-metadata/route.ts:111:      missingMatterIds: matterIds.filter(
./app/api/lawsuits/update-metadata/route.ts:112:        (matterId) => !rows.some((row) => Number(row.matter_id) === matterId)
./app/api/documents/finalization-history/route.ts:77:    cleanActivityText(target.matterId) ||
./app/api/documents/finalization-history/route.ts:116:    const matterId = parsePositiveInt(req.nextUrl.searchParams.get("matterId"));
./app/api/documents/finalization-history/route.ts:118:    const clioMatterId = parsePositiveInt(req.nextUrl.searchParams.get("clioMatterId"));
./app/api/documents/finalization-history/route.ts:124:      matterId ? String(matterId) : "",
./app/api/documents/finalization-history/route.ts:126:      clioMatterId ? String(clioMatterId) : "",
./app/api/documents/finalization-history/route.ts:136:            "Missing lookup. Provide masterLawsuitId, matterId, matterDisplayNumber, clioMatterId, or clioDisplayNumber.",
./app/api/documents/finalization-history/route.ts:159:    if (matterId) {
./app/api/documents/finalization-history/route.ts:160:      finalizationOr.push({ masterMatterId: matterId });
./app/api/documents/finalization-history/route.ts:161:      printQueueOr.push({ masterMatterId: matterId });
./app/api/documents/finalization-history/route.ts:162:      emailThreadOr.push({ matterId });
./app/api/documents/finalization-history/route.ts:163:      emailMatterLinkOr.push({ matterId });
./app/api/documents/finalization-history/route.ts:171:    if (clioMatterId) {
./app/api/documents/finalization-history/route.ts:172:      emailThreadOr.push({ clioMatterId });
./app/api/documents/finalization-history/route.ts:173:      emailMatterLinkOr.push({ clioMatterId });
./app/api/documents/finalization-history/route.ts:232:      if (thread.clioMatterId) targetIds.add(String(thread.clioMatterId));
./app/api/documents/finalization-history/route.ts:244:      if (link.clioMatterId) targetIds.add(String(link.clioMatterId));
./app/api/documents/finalization-history/route.ts:249:    if (matterId) targetIds.add(String(matterId));
./app/api/documents/finalization-history/route.ts:251:    if (clioMatterId) targetIds.add(String(clioMatterId));
./app/api/documents/finalization-history/route.ts:339:      matterId: thread.matterId,
./app/api/documents/finalization-history/route.ts:342:      clioMatterId: thread.clioMatterId,
./app/api/documents/finalization-history/route.ts:381:      matterId: link.matterId,
./app/api/documents/finalization-history/route.ts:384:      clioMatterId: link.clioMatterId,
./app/api/documents/finalization-history/route.ts:471:        matterId,
./app/api/documents/finalization-history/route.ts:473:        clioMatterId,
./app/api/settlements/local-history/route.ts:235:            { matterId: "asc" },
./app/api/settlements/local-history/route.ts:297:          matterId: row.matterId,
./app/api/documents/direct-finalize-preview/route.ts:5:  listClioMatterDocuments,
./app/api/documents/direct-finalize-preview/route.ts:47:async function resolveClioMatterByDisplayNumber(displayNumberInput: string) {
./app/api/documents/direct-finalize-preview/route.ts:54:      clioMatterId: null,
./app/api/documents/direct-finalize-preview/route.ts:81:      clioMatterId: null,
./app/api/documents/direct-finalize-preview/route.ts:90:    clioMatterId: exact.id,
./app/api/documents/direct-finalize-preview/route.ts:197:async function loadMatterPacket(req: NextRequest, matterIdInput: string) {
./app/api/documents/direct-finalize-preview/route.ts:199:  packetUrl.searchParams.set("matterId", matterIdInput);
./app/api/documents/direct-finalize-preview/route.ts:229:    const directMatterId = numberOrNull(req.nextUrl.searchParams.get("directMatterId") || req.nextUrl.searchParams.get("matterId"));
./app/api/documents/direct-finalize-preview/route.ts:242:    const matterIdInput = directMatterId ? String(directMatterId) : directMatterDisplayNumber;
./app/api/documents/direct-finalize-preview/route.ts:243:    const packet = await loadMatterPacket(req, matterIdInput);
./app/api/documents/direct-finalize-preview/route.ts:247:    const clioResolution = await resolveClioMatterByDisplayNumber(resolvedDisplay);
./app/api/documents/direct-finalize-preview/route.ts:255:    if (!clioResolution.ok || !clioResolution.clioMatterId) {
./app/api/documents/direct-finalize-preview/route.ts:260:    const canGenerate = Boolean(validation.canGenerate && clioResolution.clioMatterId);
./app/api/documents/direct-finalize-preview/route.ts:272:    if (canGenerate && clioResolution.clioMatterId) {
./app/api/documents/direct-finalize-preview/route.ts:274:        existingClioDocuments = await listClioMatterDocuments(Number(clioResolution.clioMatterId));
./app/api/documents/direct-finalize-preview/route.ts:303:        matterId: clioResolution.clioMatterId,
./scripts/verify-matter-page-local-id-hydration-safety.mjs:22:          localParams.set("matterId", String(numericMatterId));
./scripts/verify-matter-page-local-id-hydration-safety.mjs:24:          localParams.set("displayNumber", String(matterId));
./scripts/verify-matter-page-local-id-hydration-safety.mjs:25:          localParams.set("matterDisplayNumber", String(matterId));
./scripts/verify-matter-page-local-id-hydration-safety.mjs:30:  "numeric route id sends only matterId while display fallback sends displayNumber/matterDisplayNumber",
./scripts/verify-matter-page-local-id-hydration-safety.mjs:41:          localParams.set("matterId", String(numericMatterId));
./scripts/verify-matter-page-local-id-hydration-safety.mjs:42:          localParams.set("matterDisplayNumber", String(matterId));
./scripts/verify-matter-page-local-id-hydration-safety.mjs:47:  "by-matter route computes valid matterId",
./scripts/verify-matter-page-local-id-hydration-safety.mjs:50:  "const hasValidMatterId = Number.isFinite(matterId) && matterId > 0;"
./scripts/verify-matter-page-local-id-hydration-safety.mjs:54:  "by-matter route prefers valid matterId",
./app/api/documents/bill-schedule/route.ts:198:        tableCell(matter.displayNumber || matter.matterId || ""),
./app/api/lawsuits/close/route.ts:3:import { syncClioMattersClosed } from "@/lib/clioCloseSync";
./app/api/lawsuits/close/route.ts:42:    matterId: number;
./app/api/lawsuits/close/route.ts:50:    matterId: number;
./app/api/lawsuits/close/route.ts:63:      matterId: item.matterId,
./app/api/lawsuits/close/route.ts:71:      matterId: item.matterId,
./app/api/lawsuits/close/route.ts:115:    const clioMatterIdsToClose = Array.from(
./app/api/lawsuits/close/route.ts:122:    if (!clioMatterIdsToClose.length) {
./app/api/lawsuits/close/route.ts:136:    const clioCloseSync = await syncClioMattersClosed({
./app/api/lawsuits/close/route.ts:137:      matterIds: clioMatterIdsToClose,
./app/api/lawsuits/close/route.ts:194:              matter_id: {
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:21:mustContain("uses child Clio matter client", "findClientFromChildClioMatters(selectedRows)");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:22:mustContain("stores Clio matter id on local Lawsuit row", "clioMasterMatterId: createdClioMatter.matterId");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:23:mustContain("stores Clio display number on local Lawsuit row", "clioMasterDisplayNumber: createdClioMatter.displayNumber");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:25:mustContain("returns created Clio matter in response", "createdClioMatter: {");
./scripts/verify-direct-treating-provider-load-resolved-id-safety.mjs:33:  "matterId=${encodeURIComponent(String(numericMatterId))}&fieldName=treating_provider"
./scripts/verify-direct-treating-provider-load-resolved-id-safety.mjs:38:  'matterId: numericMatterId,\n          matterDisplayNumber: textValue(matter?.displayNumber || matter?.display_number || matterId),\n          fieldName: "treating_provider"'
./scripts/verify-direct-treating-provider-load-resolved-id-safety.mjs:42:  "old treating provider GET used route param matterId",
./scripts/verify-direct-treating-provider-load-resolved-id-safety.mjs:43:  "matterId=${encodeURIComponent(String(matterId))}&fieldName=treating_provider"
./scripts/verify-direct-treating-provider-load-resolved-id-safety.mjs:48:  'matterId: resolvedNumericMatterId(),\n          matterDisplayNumber: textValue(matter?.displayNumber || matter?.display_number || matterId),\n          fieldName: "treating_provider"'
./scripts/verify-no-operational-clio-hydration-regression.mjs:58:    re: /\bfetchMatterFromClio\b|\bgetMatterFromClio\b|\bclioMatterContext\b|\bloadClioMatterContext\b/iu,
./app/api/settlements/documents-finalize-local/route.ts:5:  listClioMatterDocuments,
./app/api/settlements/documents-finalize-local/route.ts:6:  uploadBufferToClioMatterDocuments,
./app/api/settlements/documents-finalize-local/route.ts:308:          orderBy: [{ matterId: "asc" }, { billNumber: "asc" }],
./app/api/settlements/documents-finalize-local/route.ts:408:    const clioMatterId = Number(lawsuit?.clioMasterMatterId || 0);
./app/api/settlements/documents-finalize-local/route.ts:412:    if (!Number.isFinite(clioMatterId) || clioMatterId <= 0) {
./app/api/settlements/documents-finalize-local/route.ts:517:    const existingClioDocuments = await listClioMatterDocuments(clioMatterId);
./app/api/settlements/documents-finalize-local/route.ts:574:      const uploadResult = await uploadBufferToClioMatterDocuments({
./app/api/settlements/documents-finalize-local/route.ts:575:        matterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:634:      clioUploadTargetMatterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:644:        masterMatterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:652:          matterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:741:        matterId: clioMatterId,
./app/api/settlements/documents-finalize-local/route.ts:761:        uploadedOnlyToMappedMasterClioMatterDocumentsTab: true,
./app/api/settlements/local-record/route.ts:97:    .map((row: any) => Number(row?.matterId || 0))
./app/api/settlements/local-record/route.ts:98:    .filter((matterId: number, index: number, all: number[]) => matterId > 0 && all.indexOf(matterId) !== index);
./app/api/settlements/local-record/route.ts:241:            matterId: Number(row?.matterId || 0),
./scripts/verify-admin-tickler-advanced-search-fields-safety.mjs:56:mustInclude("route links matter ids", route, "matterId: { in: matterIds }");
./scripts/verify-admin-client-remittance-source-safety.mjs:75:mustContain("admin client detail route", route, "OR.push({ matterId: numeric })");
./scripts/verify-lawsuit-sibling-local-data-contract.mjs:62:  if (!/ClaimIndex|claimIndex|matter|matters|matterId|matterIds|selected/i.test(text)) {
./scripts/verify-clio-master-crossref-confirm-safety.mjs:53:mustNotContain(routePath, route, "uploadBufferToClioMatterDocuments");
./app/api/settlements/attorney-fee-breakdown/route.ts:218:          tableCell(row?.displayNumber || row?.matterId, { width: 13 }),
./scripts/verify-clio-document-list-readonly-safety.mjs:20:    label: "route uses existing listClioMatterDocuments helper",
./scripts/verify-clio-document-list-readonly-safety.mjs:22:      route.includes("listClioMatterDocuments") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:24:      helper.includes("export async function listClioMatterDocuments"),
./scripts/verify-clio-document-list-readonly-safety.mjs:41:      !route.includes("uploadBufferToClioMatterDocuments") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:73:      route.includes('url.searchParams.get("matterId")') &&
./scripts/verify-clio-document-list-readonly-safety.mjs:80:      route.includes("resolveClioMatterByDisplayNumber") &&
./scripts/verify-clio-document-list-readonly-safety.mjs:82:      route.includes("clioResolution.clioMatterId") &&
./scripts/verify-direct-matter-direct-field-save-resolved-id-safety.mjs:27:requireText("DOS direct-field save uses resolved numeric id", 'matterId: resolvedNumericMatterId(),\n          field: "dos",');
./scripts/verify-direct-matter-direct-field-save-resolved-id-safety.mjs:28:requireText("picklist direct-field body uses resolved numeric id", "const body: any = {\n        matterId: resolvedNumericMatterId(),\n        field,\n      };");
./scripts/verify-direct-matter-direct-field-save-resolved-id-safety.mjs:31:forbidText("old DOS route-param matterId save", 'matterId,\n          field: "dos",');
./scripts/verify-direct-matter-direct-field-save-resolved-id-safety.mjs:32:forbidText("old picklist route-param matterId save", "const body: any = {\n        matterId,\n        field,\n      };");
./scripts/verify-admin-tickler-xls-export-safety.mjs:29:mustInclude("exports matter value", "safeExportCell(tickler.caseData?.matter || tickler.masterLawsuitId || tickler.displayNumber || tickler.matterId)");
./scripts/verify-provider-remittance-docx-safety.mjs:64:mustNotContain("provider remittance route", providerRemittanceRoute, "uploadBufferToClioMatterDocuments");
./scripts/verify-provider-remittance-docx-safety.mjs:65:mustNotContain("provider remittance route", providerRemittanceRoute, "listClioMatterDocuments");
./app/api/settlements/local-record-preview/route.ts:105:      .map((row: any) => Number(row?.matterId || 0))
./app/api/settlements/local-record-preview/route.ts:106:      .filter((matterId: number, index: number, all: number[]) => matterId > 0 && all.indexOf(matterId) !== index);
./app/api/settlements/local-record-preview/route.ts:144:        matterId: Number(row?.matterId || 0),
./app/api/advanced-search/candidates/route.ts:143:  const matterIds = Array.from(
./app/api/advanced-search/candidates/route.ts:146:        .map((row) => Number(row?.matter_id ?? row?.matterId))
./app/api/advanced-search/candidates/route.ts:151:  if (!masterIds.length && !matterIds.length) return rows;
./app/api/advanced-search/candidates/route.ts:159:  for (const matterId of matterIds) {
./app/api/advanced-search/candidates/route.ts:160:    whereClauses.push({ lawsuitMatters: { contains: String(matterId) } });
./app/api/advanced-search/candidates/route.ts:181:    for (const matterId of parseMatterIdsFromLawsuitMatters(lawsuit.lawsuitMatters)) {
./app/api/advanced-search/candidates/route.ts:182:      byMatterId.set(matterId, lawsuit);
./app/api/advanced-search/candidates/route.ts:189:      byMatterId.get(Number(row?.matter_id ?? row?.matterId));
./app/api/advanced-search/candidates/route.ts:338:      matter_id: "desc",
./scripts/verify-clio-master-crossref-preview-safety.mjs:48:mustContain(routePath, route, "readClioMatter");
./scripts/verify-admin-generic-tickler-search-route-safety.mjs:22:mustInclude("tickler matter field", schema, "matterId");
./scripts/verify-admin-generic-tickler-search-route-safety.mjs:43:mustInclude("matter id filter", route, 'url.searchParams.get("matterId")');
./scripts/verify-admin-generic-tickler-search-route-safety.mjs:50:mustInclude("blank matterId remains null", route, "if (!raw) return null;");
./scripts/verify-admin-generic-tickler-search-route-safety.mjs:51:mustInclude("matterId parser cleans value first", route, "const raw = clean(value);");
./scripts/verify-settlement-tickler-lawsuit-level-context-safety.mjs:19:mustInclude("settlement tickler does not attach matter id", creationRoute, "matterId: null");
./scripts/verify-settlement-tickler-lawsuit-level-context-safety.mjs:23:mustInclude("related matter id preserved in metadata", creationRoute, "matterId: row.matterId");
./scripts/verify-settlement-tickler-lawsuit-level-context-safety.mjs:26:mustNotInclude("settlement tickler attaches first child matter", creationRoute, "matterId: firstRow?.matterId || null");
./scripts/smoke-workflow.sh:29:  childMatters: [.packet.childMatters[]? | {matterId, displayNumber, claimAmount, balancePresuit}],
./scripts/smoke-workflow.sh:30:  masterMatter: {matterId: .packet.masterMatter.matterId, displayNumber: .packet.masterMatter.displayNumber}
./scripts/verify-clio-rule1-boundary-safety.mjs:53:mustContain("Graph draft", graphDraft, "listClioMatterDocuments");
./scripts/verify-clio-rule1-boundary-safety.mjs:108:mustContain("matter close", matterClose, "syncClioMatterClosed");
```

## Clio file numbers

```text
```

## Matter creation calls

```text
./BARSH_MATTERS_BROWSER_HISTORY_STATE_CONTRACT.txt:12:- This rule applies across Barsh Matters pages, including /lawsuits, /matters, /matter/[id], admin ticklers, and reference data workflows.
./BARSH_MATTERS_BROWSER_HISTORY_STATE_CONTRACT.txt:16:2. /matters search/filter state.
./package.json:123:    "verify:direct-matter-create-lawsuit-routing-safety": "node scripts/verify-direct-matter-create-lawsuit-routing-safety.mjs",
./lib/clioCloseSync.ts:57:  const endpoint = `/api/v4/matters/${matterId}.json`;
./lib/clioWrite.ts.bak.deaggregate:24:  const res = await clioFetch(`/api/v4/matters/${matterId}.json?fields=${fields}`);
./lib/clioWrite.ts.bak.deaggregate:80:  const res = await clioFetch(`/api/v4/matters/${matterId}`, {
./docs/implementation/clio-storage-refactor-phase1-checklist.md:4:- [ ] One master Clio matter will be created manually by admin.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:5:- [ ] BM will create bucket folders under the master Clio matter.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:6:- [ ] BM will create one folder per BM matter.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:15:- [ ] Identify where BM currently creates Clio matters.
./docs/implementation/clio-storage-refactor-phase1-checklist.md:17:- [ ] Identify where lawsuit aggregation creates a Clio matter.
./lib/clio.ts:48:    normalized.includes("/matters.json?") ||
./lib/clio.ts:49:    normalized.includes("/matters?") ||
./lib/clio.ts:50:    normalized.includes("/matters.json")
./lib/clio.ts:55:  if (normalized.includes("/matters/")) return "matter";
./lib/readMatterFromClio.ts:2:  const url = `https://app.clio.com/api/v4/matters/${matterId}.json?fields=id,display_number,description,status,client,custom_field_values`;
./lib/settlementClioWriteback.ts:166:    `/api/v4/matters/${matterId}.json?fields=${encodeURIComponent(LIVE_FIELDS)}`,
./lib/settlementClioWriteback.ts:369:  const res = await clioFetch(`/api/v4/matters/${matterId}.json`, {
./lib/auditLog.ts:48:export async function createMatterAuditLogEntry(input: MatterAuditLogInput) {
./scripts/verify-admin-users-phase3-create-user-ui-safety.mjs:59:  requireIncludes(routeFile, 'createMatterAuditLogEntry', "route still audit logs apply");
./lib/graph/emailPersistence.ts:256:      createdBy: "barsh_matters_graph",
./lib/graph/emailPersistence.ts:606:            createdBy: "barsh_matters_graph_sync",
./lib/graph/maildropForDraft.ts:40:  const res = await clioFetch(`/matters/${matterId}.json?fields=${encodeURIComponent(fields)}`);
./lib/graph/maildropForDraft.ts:54:  const res = await clioFetch(`/matters.json?${params.toString()}`);
./scripts/verify-settlement-popup-column-entry-safety.mjs:23:const page = read("app/matters/page.tsx");
./scripts/verify-settlement-popup-column-entry-safety.mjs:90:].forEach((needle) => mustContain("app/matters/page.tsx", page, needle));
./scripts/verify-document-view-open-behavior-safety.cjs:4:const master = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-info-edit-popup-safety.cjs:2:const s = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-reference-import-preview-safety.mjs:62:  "createMatterAuditLogEntry",
./app/components/BarshHeaderQuickNav.tsx:42:        window.location.href = `/matters?master=${encodeURIComponent(raw)}`;
./app/court-calendar/page.tsx:1009:                      <a href={`/matters?master=${encodeURIComponent(text(event.displayNumber || event.masterLawsuitId))}`} style={{ color: "#1d4ed8", fontWeight: 900, textDecoration: "underline", display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "top" }}>
./app/lawsuits/page.tsx:607:        pickAny(matter, ["createdAt", "created_at", "openedAt", "opened_at"]),
./app/lawsuits/page.tsx:755:        throw new Error(previewJson.blockingReason || "Selected matters cannot be used to create a new local lawsuit.");
./app/lawsuits/page.tsx:814:          href: `/matters?master=${encodeURIComponent(createdMasterLawsuitId)}`,
./app/lawsuits/page.tsx:1416:                    <tr key={`create-review-${matterId(m)}`}>
./docs/adr/0001-clio-single-master-storage.md:7:Barsh Matters currently uses Clio in a matter-centered manner. The existing test implementation creates individual Clio matters for BM files and creates additional Clio matters/file numbers upon lawsuit aggregation.
./docs/adr/0001-clio-single-master-storage.md:12:Barsh Matters will use one manually created Clio master matter/file as the document repository for the Barsh Matters project. Barsh Matters will automatically create bucket folders under that master Clio matter. Each bucket will contain individual BM folders. Each BM matter will have one flat Clio folder containing generated documents, scans, uploaded emails, attachments, and other matter-specific documents. Templates will remain exclusively in Barsh Matters. Clio will store only generated or uploaded matter documents.
./docs/adr/0001-clio-single-master-storage.md:35:3. Clio does not create individual matters for BM files.
./docs/adr/0001-clio-single-master-storage.md:36:4. Clio does not create lawsuit aggregation matters.
./docs/adr/0001-clio-single-master-storage.md:40:8. Barsh Matters creates one Clio folder per BM matter.
./docs/adr/0001-clio-single-master-storage.md:46:Preferred flow: BM matter is created by Barsh Matters without a Clio folder. On first generated or uploaded document, BM resolves or creates the correct bucket folder, resolves or creates the BM matter folder, uploads the document, and stores the Clio document ID and folder ID.
./scripts/verify-transaction-type-management-contract-safety.mjs:9:  masterPage: "app/matters/page.tsx",
./scripts/verify-transaction-type-management-contract-safety.mjs:57:mustContain("entities route", entitiesRoute, "createMatterAuditLogEntry");
./scripts/verify-master-costs-claim-status-layout-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./app/print-queue/page.tsx:47:  return id ? `https://app.clio.com/nc/#/matters/${id}` : "";
./app/print-queue/page.tsx:87:    return `/matters?master=${encodeURIComponent(textValue(row?.masterLawsuitId))}`;
./scripts/verify-settlement-payment-due-tickler-ui-safety.mjs:3:const pagePath = "app/matters/page.tsx";
./app/matters/page.tsx:364:  return `/matters?${params.toString()}`;
./app/matters/page.tsx:881:          `/api/matters/apply-payment?matterId=${encodeURIComponent(String(matterId))}&claimAmount=${encodeURIComponent(String(claimAmount))}`,
./app/matters/page.tsx:942:      const response = await fetch("/api/matters/apply-payment", {
./app/matters/page.tsx:1035:        const response = await fetch("/api/matters/apply-payment", {
./app/matters/page.tsx:4760:                ? `/api/matters/identity-field/search?fieldName=treating_provider&value=${encodeURIComponent(filter.value)}`
./app/matters/page.tsx:6973:                  Graph messages: {Number(syncCounts.graphMessages || 0)} · Messages upserted: {Number(masterGraphThreadSyncResult.persisted?.messagesUpserted || 0)} · Matter links created: {Number(masterGraphThreadSyncResult.persisted?.matterLinksCreated || 0)}
./app/api/lawsuits/local-generation-create/route.ts:72:    `/api/v4/matters/${encodeURIComponent(String(id))}.json?fields=${encodeURIComponent(fields)}`
./app/api/lawsuits/local-generation-create/route.ts:160:  const res = await clioFetch(`/api/v4/matters.json?fields=${encodeURIComponent(fields)}`, {
./app/api/lawsuits/local-generation-create/route.ts:185:      `Failed to create Clio master matter: status ${res.status}; body ${bodyText || "(empty)"}`
./app/api/lawsuits/local-generation-create/route.ts:195:    throw new Error("Clio created matter response did not include a valid matter id.");
./app/api/lawsuits/local-generation-create/route.ts:199:    throw new Error("Clio created matter response did not include a display number / BRL number.");
./app/api/lawsuits/local-generation-create/route.ts:447:            clioMasterMatterId: createdClioMatter.matterId,
./app/api/lawsuits/local-generation-create/route.ts:467:          clioMasterMatterId: createdClioMatter.matterId,
./app/api/lawsuits/local-generation-create/route.ts:471:          clioMasterMappingSource: "barsh-matters-create-lawsuit-confirm",
./app/api/lawsuits/local-generation-create/route.ts:518:        id: createdClioMatter.matterId,
./app/page.tsx:1836:    return `/matters?${params.toString()}`;
./app/page.tsx:2039:      window.location.href = `/matters?master=${encodeURIComponent(q)}`;
./app/page.tsx:2150:    window.location.href = `/matters?workflow=patient&patient=${encodeURIComponent(q)}`;
./app/page.tsx:2156:    window.location.href = `/matters?workflow=claim&claim=${encodeURIComponent(q)}`;
./app/page.tsx:2678:                                  href={`/matters?master=${encodeURIComponent(row.masterLawsuitId)}`}
./scripts/verify-payment-required-label-asterisks-removed-safety.mjs:4:const lawsuitPage = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-note-popup-persistence-safety.cjs:2:const s = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-settlement-document-dialog-mode.mjs:4:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-clio-maildrop-delivery-safety.mjs:31:const masterPath = "app/matters/page.tsx";
./scripts/verify-admin-button-direct-navigation-safety.mjs:7:  'app/matters/page.tsx',
./app/api/matters/update-direct-field/route.ts:263:      return jsonError("No local matter index row exists for this matter. Import or locally create the matter before saving direct fields.", 404, {
./scripts/verify-clio-document-list-ui-safety.mjs:4:const masterPath = "app/matters/page.tsx";
./scripts/verify-document-generation-action-button-clickable-safety.mjs:12:    pagePath: "app/matters/page.tsx",
./scripts/verify-settlement-edit-word-web-hash-sync-safety.mjs:3:const pagePath = "app/matters/page.tsx";
./scripts/verify-clio-master-matter-confirm-safety.mjs:37:mustContain(routePath, route, 'action: "clio-master-matter-create-confirm"');
./scripts/verify-clio-master-matter-confirm-safety.mjs:42:mustContain(routePath, route, "Refusing to create a duplicate Clio master matter");
./scripts/verify-clio-master-matter-confirm-safety.mjs:43:mustContain(routePath, route, "clioFetch(`/api/v4/matters.json");
./scripts/verify-clio-master-matter-confirm-safety.mjs:49:mustContain(routePath, route, "clioMasterMatterId: created.matterId");
./app/admin/reference-data/page.tsx:314:    ["Matter links created", details.matterLinksCreated],
./app/api/settlements/documents-preview/route.ts:195:        "Preview-only local settlement document plan.  This route reads Barsh Matters LocalSettlementRecord and LocalSettlementRow only.  It does not read Clio settlement values, write Clio, generate documents, create files, create drafts, change the print queue, close matters, or send email.",
./app/matter/[id]/page.tsx:183:  return `https://app.clio.com/nc/#/matters/${matterId}`;
./app/matter/[id]/page.tsx:1658:        `/api/matters/identity-field?matterId=${encodeURIComponent(String(numericMatterId))}&fieldName=treating_provider`,
./app/matter/[id]/page.tsx:1696:      const response = await fetch("/api/matters/identity-field", {
./app/matter/[id]/page.tsx:2204:      const response = await fetch("/api/matters/identity-field", {
./app/matter/[id]/page.tsx:2317:      const response = await fetch("/api/matters/update-direct-field", {
./app/matter/[id]/page.tsx:2397:      const response = await fetch("/api/matters/update-direct-field", {
./app/matter/[id]/page.tsx:2589:      const response = await fetch("/api/matters/update-direct-field", {
./app/matter/[id]/page.tsx:2640:        `/api/matters/apply-payment?matterId=${encodeURIComponent(String(Number(matter?.matterId || matter?.matter_id || matter?.id || targetMatterId)))}&claimAmount=${encodeURIComponent(String(num(matter?.claimAmount)))}`,
./app/matter/[id]/page.tsx:2716:      const response = await fetch("/api/matters/apply-payment", {
./app/matter/[id]/page.tsx:2841:      const response = await fetch("/api/matters/apply-payment", {
./app/matter/[id]/page.tsx:3048:      const res = await fetch("/api/matters/close", {
./app/matter/[id]/page.tsx:3138:        setStartLawsuitError(previewJson.blockingReason || "Selected matters cannot be used to create a new local lawsuit.");
./app/matter/[id]/page.tsx:3207:        alert(previewJson.blockingReason || "Selected matters cannot be used to create a new local lawsuit.");
./app/matter/[id]/page.tsx:3245:      const createdMasterLawsuitUrl = new URL("/matters", window.location.origin);
./app/matter/[id]/page.tsx:4093:        note: "Working DOCX created from the direct matter packet. Edit and save in Word Web, then finalize to create the PDF delivery document.",
./app/matter/[id]/page.tsx:4158:        note: "Working DOCX created from the direct matter packet for temporary PDF preview.",
./app/matter/[id]/page.tsx:7820:              href={`/matters?master=${encodeURIComponent(textValue(matter?.masterLawsuitId))}`}
./app/matter/[id]/page.tsx:8594:                  href={`/matters?patient=${encodeURIComponent(textValue(matter?.patient?.name || matter?.patient))}`}
./app/matter/[id]/page.tsx:8623:                  href={`/matters?provider=${encodeURIComponent(providerValue(matter))}`}
./app/matter/[id]/page.tsx:8679:                      href={`/matters?treatingProvider=${encodeURIComponent(localTreatingProviderName())}`}
./app/matter/[id]/page.tsx:8697:                  href={`/matters?insurer=${encodeURIComponent(insurerValue(matter))}`}
./app/matter/[id]/page.tsx:8726:                  href={`/matters?claim=${encodeURIComponent(textValue(matter?.claimNumber))}`}
./app/matter/[id]/page.tsx:8782:                        href={`/matters?dateOfLoss=${encodeURIComponent(textValue(matter?.dateOfLoss || matter?.date_of_loss))}`}
./app/matter/[id]/page.tsx:10164:              Use the Start Lawsuit button in Matter Actions to create a lawsuit from this individual matter.
./app/matter/[id]/page.tsx:12547:            Settlement writebacks now create local audit/history records.  Final save still requires preview, readiness validation, and explicit confirmation, and writes only child/bill matters.
./scripts/verify-provider-client-notes-add-edit-delete-safety.mjs:69:mustAvoidPattern("client page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation on hub page");
./scripts/verify-lawsuit-post-payment-workflow-safety.mjs:26:const page = read("app/matters/page.tsx");
./app/api/ticklers/settlement-payment-due/route.ts:323:        "Created a Barsh Matters local payment due follow-up tickler.  This does not create a Clio task, calendar event, email, document, print queue item, or matter closure.",
./app/api/matters/apply-payment/route.ts:4:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/matters/apply-payment/route.ts:318:  await createMatterAuditLogEntry({
./app/api/matters/apply-payment/route.ts:493:    const receipt = await prisma.matterPaymentReceipt.create({
./scripts/verify-provider-client-invoice-cost-ledger-ui-safety.mjs:57:mustNotMatch("route", route, /matterPaymentReceipt\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "MatterPaymentReceipt mutation");
./scripts/verify-settlement-provider-fee-defaults-local-ui-safety.mjs:4:const pagePath = "app/matters/page.tsx";
./app/api/matters/identity-field/route.ts:319:      return jsonError("No local matter index row exists for this matter. Import or locally create the matter before saving local identity fields.", 404, {
./app/admin/ticklers/page.tsx:80:    return `/matters?master=${encodeURIComponent(caseMaster)}`;
./app/admin/ticklers/page.tsx:84:    return `/matters?master=${encodeURIComponent(caseMatter)}`;
./app/admin/ticklers/page.tsx:100:  return master ? `/matters?master=${encodeURIComponent(master)}` : "";
./scripts/verify-matter-local-field-safety.mjs:3:const identityPath = "app/api/matters/identity-field/route.ts";
./scripts/verify-matter-local-field-safety.mjs:4:const directPath = "app/api/matters/update-direct-field/route.ts";
./scripts/verify-matter-local-field-safety.mjs:26:check("matter page calls local field routes", page.includes("/api/matters/identity-field") || page.includes("/api/matters/update-direct-field"));
./scripts/verify-clio-operational-routes-quarantined.mjs:25:  "/api/v4/matters",
./prisma/migrations/20260428123000_add_webhook_event_key/migration.sql:5:SET "eventKey" = md5("id" || ':' || COALESCE("matterId"::text, '') || ':' || "createdAt"::text)
./scripts/verify-master-generate-documents-popup-safety.cjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-view-documents-source-labels-safety.mjs:4:const masterPagePath = "app/matters/page.tsx";
./scripts/verify-admin-tickler-result-links-safety.mjs:17:mustInclude("master lawsuit route", "/matters?master=");
./scripts/verify-administrator-menu-items-direct-after-gate.mjs:7:  "app/matters/page.tsx",
./scripts/verify-administrator-menu-items-direct-after-gate.mjs:47:const master = fs.readFileSync("app/matters/page.tsx", "utf8");
./app/api/reference-data/entities/route.ts:3:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/reference-data/entities/route.ts:159:    await createMatterAuditLogEntry({
./app/api/reference-data/entities/route.ts:274:    await createMatterAuditLogEntry({
./scripts/verify-local-settlement-record-save-safety.mjs:26:const page = read("app/matters/page.tsx");
./scripts/verify-local-settlement-record-save-safety.mjs:63:]) mustContain("app/matters/page.tsx", page, needle);
./scripts/verify-settlement-documents-preview-safety.mjs:38:const matterPage = read("app/matters/page.tsx");
./scripts/verify-settlement-documents-preview-safety.mjs:108:mustContain("matter page", matterPage, "No final file is created until the workflow is finalized.");
./scripts/verify-reference-import-cleanup-confirm-safety.mjs:50:if (!route.includes("createMatterAuditLogEntry")) {
./app/api/audit-log/route.ts:4:  createMatterAuditLogEntry,
./app/api/audit-log/route.ts:50:    const entry = await createMatterAuditLogEntry({
./scripts/verify-claim-index-local-source-contract.mjs:18:  'app/api/matters/update-direct-field/route.ts',
./scripts/verify-claim-index-local-source-contract.mjs:23:  'app/matters/page.tsx',
./scripts/verify-claim-index-local-source-contract.mjs:89:    l.includes('createcliomastermatter') ||
./scripts/verify-claim-index-local-source-contract.mjs:92:    l.includes('createdcliomatter') ||
./scripts/verify-claim-index-local-source-contract.mjs:94:    l.includes('createscliomastermatter') ||
./app/api/reference-data/import-confirm/route.ts:2:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/reference-data/import-confirm/route.ts:168:    await createMatterAuditLogEntry({
./scripts/verify-admin-users-phase6-audit-visibility-readiness-safety.mjs:26:    "createMatterAuditLogEntry",
./scripts/verify-settlement-clear-retainers-safety.mjs:4:const pagePath = "app/matters/page.tsx";
./scripts/verify-settlement-document-local-print-queue-safety.mjs:20:const pagePath = "app/matters/page.tsx";
./scripts/verify-settlement-document-popup-copy-simplified.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-reference-import-confirm-safety.mjs:84:if (!confirmRoute.includes("createMatterAuditLogEntry")) {
./scripts/verify-direct-payment-backend-balance-guard-canonical-safety.mjs:3:const route = fs.readFileSync("app/api/matters/apply-payment/route.ts", "utf8");
./scripts/verify-lawsuits-master-link-target-safety.mjs:22:must("lawsuits page supports direct master navigation/search", lawsuitsPage, ["/matters", "masterLawsuitId", "openMaster"]);
./app/admin/lawsuit-cleanup/page.tsx:321:                      <a href={`/matters?master=${encodeURIComponent(lawsuit.masterLawsuitId)}`} style={linkStyle}>
./app/admin/lawsuit-cleanup/page.tsx:338:                          delete this local Lawsuit row, and create an AuditLog entry.  It will not delete child/bill Clio matters.
./app/api/reference-data/aliases/route.ts:2:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/reference-data/aliases/route.ts:83:    await createMatterAuditLogEntry({
./app/api/reference-data/aliases/route.ts:188:    await createMatterAuditLogEntry({
./scripts/verify-provider-client-notes-eyebrow-removed-safety.mjs:40:mustAvoidPattern("client page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation on hub page");
./scripts/verify-master-close-lawsuit-popup-safety.cjs:2:const s = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-provider-client-invoice-create-draft-safety.mjs:44:mustNotMatch("route", route, /matterPaymentReceipt\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "MatterPaymentReceipt mutation");
./scripts/verify-settlement-document-print-docx-route-ui-safety.mjs:3:const pagePath = "app/matters/page.tsx";
./scripts/verify-local-close-workflows-safety.mjs:25:const matterClose = read("app/api/matters/close/route.ts");
./scripts/verify-local-close-workflows-safety.mjs:28:const mattersPage = read("app/matters/page.tsx");
./scripts/verify-local-close-workflows-safety.mjs:36:mustContain("matter close route writes audit", matterClose, "auditLog.create");
./scripts/verify-local-close-workflows-safety.mjs:65:mustContain("direct matter close modal uses close route", matterPage, "/api/matters/close");
./scripts/verify-admin-users-phase3-completion-safety.mjs:103:  requireIncludes(file, 'createMatterAuditLogEntry', `${file} audit logs apply`);
./scripts/verify-provider-client-invoice-detail-safety.mjs:51:mustNotMatch("route", route, /matterPaymentReceipt\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "MatterPaymentReceipt mutation");
./scripts/verify-direct-post-payment-workflow-safety.mjs:26:const route = read("app/api/matters/apply-payment/route.ts");
./scripts/verify-direct-post-payment-workflow-safety.mjs:28:const mattersPage = read("app/matters/page.tsx");
./scripts/verify-provider-client-invoice-ui-lifecycle-safety.mjs:104:mustAvoidPattern("invoice page", invoicePage, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in UI");
./scripts/verify-invoice-step1-preview-card-polish-safety.mjs:56:mustAvoidPattern("invoice page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in UI");
./scripts/verify-payment-popup-ux-polish-safety.mjs:4:const matters = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-stored-db-docx-step2-copy-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-placeholder-document-template-labels-safety.mjs:5:const mattersPage = fs.readFileSync("app/matters/page.tsx", "utf8");
./app/api/reference-data/import-cleanup-confirm/route.ts:2:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/reference-data/import-cleanup-confirm/route.ts:146:    await createMatterAuditLogEntry({
./scripts/verify-settlement-delivery-green-info-box-removed.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-settled-with-person-contact-safety.mjs:38:  const masterPage = read("app/matters/page.tsx");
./scripts/verify-admin-session-aware-action-gates-safety.mjs:4:const files = ["app/matters/page.tsx", "app/matter/[id]/page.tsx"];
./scripts/verify-direct-claim-amount-edit-safety.mjs:4:const route = fs.readFileSync("app/api/matters/update-direct-field/route.ts", "utf8");
./scripts/verify-local-lawsuit-generation-preview-safety.mjs:9:  "app/matters/page.tsx",
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:28:mustContain("confirm route limits Clio shell mapping source", route, "barsh-matters-create-lawsuit-confirm");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:30:mustContain("confirm route deletes Clio matter shell endpoint", route, "/api/v4/matters/");
./scripts/verify-admin-lawsuit-cleanup-confirm-safety.mjs:44:mustNotContain("confirm route must not delete all Clio matters", route, "/api/v4/matters.json");
./scripts/verify-admin-users-phase3-remove-role-route-safety.mjs:47:  requireIncludes(routeFile, 'createMatterAuditLogEntry', "audit logging helper used");
./scripts/verify-active-operational-clio-routes-removed.mjs:69:const matterClose = fs.readFileSync("app/api/matters/close/route.ts", "utf8");
./scripts/verify-active-operational-clio-routes-removed.mjs:91:  "/api/v4/matters",
./scripts/verify-active-operational-clio-routes-removed.mjs:104:  "app/api/matters/close/route.ts",
./scripts/verify-invoice-step3-draft-line-freeze-safety.mjs:96:  /(?:tx|prisma)\.matterPaymentReceipt\.(?:update|updateMany|create|upsert|delete|deleteMany)\s*\(/i,
./scripts/verify-master-view-documents-button-separation.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-admin-users-phase3-permission-override-ui-safety.mjs:63:  requireIncludes(overrideRouteFile, 'createMatterAuditLogEntry', "override route still audit logs apply");
./scripts/verify-master-court-dates-edit-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-claim-results-table-columns-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-admin-users-phase3-assign-role-route-safety.mjs:49:  requireIncludes(routeFile, 'createMatterAuditLogEntry', "audit logging helper used");
./scripts/verify-invoice-draft-action-merged-into-review-safety.mjs:70:mustAvoidPattern("invoice page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in UI");
./scripts/verify-clio-master-matter-preview-safety.mjs:37:mustContain(routePath, route, 'action: "clio-master-matter-create-preview"');
./scripts/verify-clio-master-matter-preview-safety.mjs:52:mustContain(routePath, route, "POST /api/v4/matters.json");
./scripts/verify-reference-import-cleanup-preview-safety.mjs:55:  "createMatterAuditLogEntry",
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:34:const directRoute = read("app/api/matters/update-direct-field/route.ts");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:35:const identityRoute = read("app/api/matters/identity-field/route.ts");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:36:const identitySearchRoute = read("app/api/matters/identity-field/search/route.ts");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:37:const paymentRoute = read("app/api/matters/apply-payment/route.ts");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:39:const mattersPage = read("app/matters/page.tsx");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:265:mustContain("matter page uses direct field route", matterPage, "/api/matters/update-direct-field");
./scripts/verify-claimindex-ui-field-write-contract-safety.mjs:266:mustContain("matter page uses identity field route", matterPage, "/api/matters/identity-field");
./scripts/verify-settlement-tickler-auto-create-display-only-page-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-start-lawsuit-popup-polish-safety.mjs:30:mustContain("direct create notes identify Start Lawsuit", page, "Created from Start Lawsuit individual matter workflow.");
./scripts/verify-transaction-reference-dropdowns-safety.mjs:22:const masterPage = read("app/matters/page.tsx");
./app/admin/clients/[id]/page.tsx:441:    return target ? `/matters?master=${encodeURIComponent(target)}` : "";
./app/admin/clients/[id]/page.tsx:446:    return target ? `/matters?${field}=${encodeURIComponent(target)}` : "";
./app/admin/clients/[id]/page.tsx:1441:            This panel is a local summary grouped from matched child matters. It does not create lawsuits, edit lawsuit metadata, write payments, or update Clio.
./scripts/verify-adversary-attorney-reference-safety.mjs:18:const matters = read("app/matters/page.tsx");
./scripts/verify-invoice-cost-balance-ledger-access-safety.mjs:58:mustNotMatch("invoice page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in UI");
./scripts/verify-court-calendar-page-safety.mjs:16:  "/matters?master=",
./scripts/verify-matters-master-tab-history-safety.mjs:5:const pagePath = "app/matters/page.tsx";
./app/api/admin/users/permission-override/route.ts:4:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/admin/users/permission-override/route.ts:322:      await createMatterAuditLogEntry({
./scripts/inspect-close-reason.ts:55:    "/api/v4/matters.json?query=BRL30085&fields=id,display_number,status,custom_field_values{id,value,custom_field{id,name}}&limit=5"
./scripts/verify-local-settlement-persistence-schema-safety.mjs:27:const page = read("app/matters/page.tsx");
./scripts/verify-local-settlement-persistence-schema-safety.mjs:65:mustContain("app/matters/page.tsx", page, "data-barsh-record-local-settlement-guarded-button");
./scripts/verify-local-settlement-persistence-schema-safety.mjs:66:mustContain("app/matters/page.tsx", page, "/api/settlements/local-record");
./scripts/verify-local-settlement-persistence-schema-safety.mjs:67:mustContain("app/matters/page.tsx", page, "Barsh Matters local settlement tables only");
./scripts/verify-master-court-dates-status-box-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-guarded-clio-close-sync-safety.mjs:26:const matterClose = read("app/api/matters/close/route.ts");
./scripts/verify-guarded-clio-close-sync-safety.mjs:35:mustContain("helper", helper, "/api/v4/matters/");
./scripts/verify-settlement-finalized-email-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-settlement-finalized-email-safety.mjs:154:      createDraftRoute.includes("listClioMatterDocuments(matterId)") &&
./scripts/verify-settlement-finalized-email-safety.mjs:168:      createDraftRoute.includes("/api/v4/matters.json?") &&
./scripts/verify-settlement-finalized-email-safety.mjs:169:      createDraftRoute.includes("/matters.json?") &&
./scripts/verify-settlement-finalized-email-safety.mjs:170:      createDraftRoute.includes("listClioMatterDocuments(matterId)"),
./scripts/verify-lawsuit-payment-transaction-order-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-matters-results-final-status-column-safety.mjs:19:const page = read("app/matters/page.tsx");
./app/api/admin/users/create/route.ts:4:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/admin/users/create/route.ts:228:      await createMatterAuditLogEntry({
./scripts/verify-administrator-header-opens-admin-home-only.mjs:6:  "app/matters/page.tsx",
./scripts/verify-print-queue-accessible-header.mjs:7:  "app/matters/page.tsx",
./scripts/verify-print-queue-accessible-header.mjs:63:const master = fs.readFileSync("app/matters/page.tsx", "utf8");
./app/api/settlements/documents-finalize-local/route.ts:765:          ? "Created a persistent local Barsh Matters DocumentFinalization record and automatically uploaded the finalized settlement PDF to the mapped master Clio matter Documents tab. No Outlook draft was created, no email was sent, and no print queue item was written."
./app/api/settlements/documents-finalize-local/route.ts:766:          : "Created a persistent local Barsh Matters DocumentFinalization record. Clio upload was skipped because an exact filename duplicate already exists in the mapped master Clio matter Documents tab. No Outlook draft was created, no email was sent, and no print queue item was written.",
./scripts/verify-settlement-recorded-panel-copy-simplified.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-settlement-percent-normalization-safety.mjs:4:const mattersPage = readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-settlement-percent-normalization-safety.mjs:27:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-local-settlement-history-ui-safety.mjs:2:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-browser-history-ui-state-contract.mjs:8:const mattersPagePath = "app/matters/page.tsx";
./scripts/verify-browser-history-ui-state-contract.mjs:67:mustContain("/matters has master tab URL parser", mattersPage, "function masterWorkspaceTabFromUrl(): MasterWorkspaceTab");
./scripts/verify-browser-history-ui-state-contract.mjs:68:mustContain("/matters reads tab from URL", mattersPage, 'new URLSearchParams(window.location.search).get("tab")');
./scripts/verify-browser-history-ui-state-contract.mjs:69:mustContain("/matters writes tab to URL", mattersPage, 'url.searchParams.set("tab", tab);');
./scripts/verify-browser-history-ui-state-contract.mjs:70:mustContain("/matters pushes tab history", mattersPage, "window.history.pushState({ barshMattersMattersMasterTab: true }, \"\", nextUrl);");
./scripts/verify-browser-history-ui-state-contract.mjs:71:mustContain("/matters listens to popstate", mattersPage, 'window.addEventListener("popstate", applyMasterWorkspaceTabFromUrl);');
./scripts/verify-browser-history-ui-state-contract.mjs:72:mustContain("/matters restores tab from URL", mattersPage, "setActiveMasterWorkspaceTabState(masterWorkspaceTabFromUrl());");
./scripts/verify-document-template-dialog-api-wiring.mjs:4:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-invoice-cost-ledger-collapsed-default-safety.mjs:52:mustNotMatch("invoice page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in UI");
./scripts/verify-settlement-document-workflow-ui-safety.mjs:3:const pagePath = "app/matters/page.tsx";
./scripts/verify-master-payment-popup-safety.cjs:2:const s = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-invoice-history-actions-safety.mjs:55:mustAvoidPattern("history page", historyPage, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in history page");
./scripts/verify-document-generation-action-launch-safety.mjs:4:const masterPath = "app/matters/page.tsx";
./scripts/verify-local-lawsuit-generation-create-safety.mjs:52:mustContain("uses Clio matter create endpoint for shell creation", "/api/v4/matters.json");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:53:mustContain("stores Clio assigned matter id in local mapping", "clioMasterMatterId: createdClioMatter.matterId");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:55:mustContain("stores Clio shell mapping source", 'clioMasterMappingSource: "barsh-matters-create-lawsuit-confirm"');
./scripts/verify-local-lawsuit-generation-create-safety.mjs:56:mustContain("response returns created Clio matter shell", "createdClioMatter: {");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:81:const clioMatterEndpointCount = countOccurrences(route, "/api/v4/matters.json");
./scripts/verify-local-lawsuit-generation-create-safety.mjs:88:  failures.push(`approved Clio shell scope: expected exactly 1 Clio matter-create endpoint string; found ${clioMatterEndpointCount}`);
./scripts/verify-master-status-section-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:20:mustContain("creates Clio matter through Clio matters endpoint", "clioFetch(`/api/v4/matters.json?fields=");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:22:mustContain("stores Clio matter id on local Lawsuit row", "clioMasterMatterId: createdClioMatter.matterId");
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:24:mustContain("stores mapping source", 'clioMasterMappingSource: "barsh-matters-create-lawsuit-confirm"');
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:25:mustContain("returns created Clio matter in response", "createdClioMatter: {");
./scripts/verify-settlement-payment-due-followup-date-label-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-no-operational-clio-hydration-regression.mjs:11:  'app/api/matters/update-direct-field',
./scripts/verify-no-operational-clio-hydration-regression.mjs:13:  'app/matters/page.tsx',
./scripts/verify-master-workspace-tab-type-narrowing-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-admin-users-phase3-create-user-route-safety.mjs:45:  requireIncludes(routeFile, 'createMatterAuditLogEntry', "audit logging helper used");
./app/api/admin/users/assign-role/route.ts:4:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/admin/users/assign-role/route.ts:351:      await createMatterAuditLogEntry({
./scripts/verify-unified-topline-header-safety.mjs:37:  ["Master Matters", "app/matters/page.tsx"],
./scripts/verify-provider-client-notes-header-actions-safety.mjs:46:mustAvoidPattern("client page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation on hub page");
./scripts/verify-home-search-results-table-safety.mjs:55:mustContain("Home results Lawsuit ID opens master lawsuit page", home, 'href={`/matters?master=${encodeURIComponent(row.masterLawsuitId)}`}');
./scripts/verify-administrator-header-menu-gate.mjs:7:  "app/matters/page.tsx",
./scripts/verify-administrator-header-menu-gate.mjs:36:const master = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-payment-types-clean-taxonomy-safety.mjs:10:const master = read("app/matters/page.tsx");
./scripts/verify-admin-users-phase3-remove-role-ui-safety.mjs:60:  requireIncludes(removeRouteFile, 'createMatterAuditLogEntry', "remove route still audit logs apply");
./scripts/verify-settlement-delivery-void-notice-hidden-email-purple.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-direct-matter-direct-field-save-resolved-id-safety.mjs:29:requireText("direct-field route is still used", 'fetch("/api/matters/update-direct-field"');
./app/api/admin/users/remove-role/route.ts:4:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/admin/users/remove-role/route.ts:355:      await createMatterAuditLogEntry({
./scripts/verify-reference-data-safety.mjs:86:mustContain("entity route", entityRoute, "createMatterAuditLogEntry");
./scripts/verify-reference-data-safety.mjs:107:mustContain("alias route", aliasRoute, "createMatterAuditLogEntry");
./scripts/verify-provider-client-hub-page-polish-safety.mjs:55:mustAvoidPattern("client page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation on hub page");
./scripts/verify-local-first-settlement-preview-ui-safety.mjs:2:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./app/api/documents/finalize-preview/route.ts:66:  const res = await clioFetch(`/matters.json?${params.toString()}`);
./scripts/verify-invoice-detail-frozen-line-display-safety.mjs:130:  /matterPaymentReceipt\.(?:create|update|updateMany|upsert|delete|deleteMany)\s*\(/i,
./scripts/verify-admin-users-phase3-permission-override-route-safety.mjs:50:  requireIncludes(routeFile, 'createMatterAuditLogEntry', "audit logging helper used");
./scripts/verify-provider-client-invoice-lifecycle-backend-safety.mjs:99:mustNotMatch("preview route", previewRoute, /matterPaymentReceipt\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/i, "MatterPaymentReceipt write");
./scripts/verify-email-maildrop-unified-ui-safety.mjs:26:const masterPath = "app/matters/page.tsx";
./scripts/verify-master-field-edit-popup-standard-modal-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-provider-client-invoice-cost-expended-reinvoice-safety.mjs:57:mustNotMatch("preview route", preview, /matterPaymentReceipt\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "MatterPaymentReceipt mutation in preview");
./scripts/verify-adversary-attorney-document-merge-data-safety.mjs:27:const matters = read("app/matters/page.tsx");
./scripts/verify-master-document-dropdown-stored-db-template-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-document-history-ui-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-admin-client-remittance-source-safety.mjs:116:mustContain("admin client detail route", route, "createMatterAuditLogEntry");
./scripts/verify-admin-client-remittance-source-safety.mjs:125:mustNotMatch("admin client detail route", route, /matterPaymentReceipt\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/i, "MatterPaymentReceipt write");
./scripts/verify-master-action-area-option-e-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-view-documents-button-safety.mjs:3:const pagePath = "app/matters/page.tsx";
./scripts/verify-create-lawsuit-success-notice-history-safety.mjs:20:mustContain("success notice link targets master lawsuit aggregation page", "`/matters?master=${encodeURIComponent(createdMasterLawsuitId)}`");
./scripts/verify-date-only-display-safety.mjs:9:  "app/matters/page.tsx",
./scripts/verify-date-only-display-safety.mjs:48:const mattersPage = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-info-claimindex-persistence-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./app/api/admin/lawsuits/cleanup-confirm/route.ts:8:const APPROVED_CLIO_SHELL_MAPPING_SOURCE = "barsh-matters-create-lawsuit-confirm";
./app/api/admin/lawsuits/cleanup-confirm/route.ts:34:  const response = await clioFetch(`/api/v4/matters/${encodeURIComponent(String(clioMatterId))}.json`, {
./scripts/verify-settlement-void-safety.mjs:5:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-direct-matter-clio-operational-callers-removed.mjs:22:assert(source.includes("/api/lawsuits/local-generation-create"), "Direct matter page must call local lawsuit create route.");
./scripts/verify-settlement-save-finalized-pdf-safety.mjs:3:const pagePath = "app/matters/page.tsx";
./scripts/verify-admin-users-phase3-assign-role-ui-safety.mjs:61:  requireIncludes(assignRouteFile, 'createMatterAuditLogEntry', "assign route still audit logs apply");
./scripts/verify-provider-client-identity-nowrap-safety.mjs:50:mustAvoidPattern("client page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation on hub page");
./scripts/verify-reference-import-history-safety.mjs:47:  "createMatterAuditLogEntry",
./scripts/verify-master-template-repository-load-category-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-claimcluster-cache-contract.mjs:69:  'app/api/matters/update-direct-field/route.ts',
./scripts/verify-claimcluster-cache-contract.mjs:70:  'app/api/matters/identity-field/route.ts',
./scripts/verify-claimcluster-cache-contract.mjs:72:  'app/matters/page.tsx',
./scripts/verify-local-first-payment-safety.mjs:3:const routePath = "app/api/matters/apply-payment/route.ts";
./scripts/verify-local-first-payment-safety.mjs:36:    pattern: /\/api\/v4\/matters/,
./scripts/verify-local-first-payment-safety.mjs:71:    pattern: /\bcreateMatterAuditLogEntry\b/,
./scripts/verify-local-settlement-record-preview-safety.mjs:32:const pagePath = "app/matters/page.tsx";
./scripts/verify-administrator-button-gates-menu.mjs:7:  "app/matters/page.tsx",
./scripts/verify-administrator-button-gates-menu.mjs:34:const master = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-shared-matter-status-options-safety.mjs:21:const masterPage = read("app/matters/page.tsx");
./scripts/verify-master-document-preview-ui-safety.mjs:3:const pagePath = "app/matters/page.tsx";
./scripts/verify-settlement-history-display-contract.mjs:3:const mattersPage = readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-settlement-popup-safety.cjs:2:const s = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-document-generation-action-button-clickable.mjs:3:const pagePath = "app/matters/page.tsx";
./scripts/verify-invoice-history-page-safety.mjs:63:mustAvoidPattern("history page", historyPage, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in history page");
./scripts/verify-provider-client-invoice-finalize-safety.mjs:68:mustNotMatch("invoice page", page, /matterPaymentReceipt\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "direct MatterPaymentReceipt mutation in UI");
./scripts/verify-populated-reference-table-targets-safety.mjs:3:const matters = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-direct-matter-create-lawsuit-routing-safety.mjs:40:  "direct create routes to matters page",
./scripts/verify-direct-matter-create-lawsuit-routing-safety.mjs:42:  'const createdMasterLawsuitUrl = new URL("/matters", window.location.origin);'
./scripts/verify-direct-matter-create-lawsuit-routing-safety.mjs:71:  "direct create must not reload current matter page after create",
./scripts/verify-invoice-table3-cost-history-pickup-safety.mjs:43:const mattersPagePath = "app/matters/page.tsx";
./scripts/verify-document-activity-trace-ui-safety.mjs:17:const masterPage = read("app/matters/page.tsx");
./scripts/verify-editable-reference-wiring-safety.mjs:100:    file: "app/matters/page.tsx",
./scripts/verify-editable-reference-wiring-safety.mjs:108:    file: "app/matters/page.tsx",
./scripts/verify-editable-reference-wiring-safety.mjs:116:    file: "app/matters/page.tsx",
./scripts/verify-master-payment-close-prompt-safety.cjs:2:const s = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-direct-matter-date-of-loss-claim-info-safety.mjs:4:const route = fs.readFileSync("app/api/matters/identity-field/route.ts", "utf8");
./scripts/verify-direct-matter-date-of-loss-claim-info-safety.mjs:27:  'href={`/matters?dateOfLoss=${encodeURIComponent',
./app/api/documents/print-queue-preview/route.ts:318:        "This endpoint proposes print candidates from local DocumentFinalization audit records only after verifying that each candidate still has a matching current document in the Clio master matter Documents tab.  It does not create print records or change Clio.",
./scripts/verify-settlement-void-deletes-payment-due-tickler-safety.mjs:4:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-master-email-thread-ui-safety.mjs:62:const pagePath = "app/matters/page.tsx";
./scripts/verify-clio-rule1-boundary-safety.mjs:107:const matterClose = read("app/api/matters/close/route.ts");
./scripts/verify-document-delivery-preview-ui-safety.mjs:34:const pagePath = "app/matters/page.tsx";
./scripts/verify-settlement-finalization-record-green-box-removed.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-provider-client-invoice-create-preview-safety.mjs:59:mustNotMatch("route", route, /matterPaymentReceipt\.(update|updateMany|create|upsert|delete|deleteMany)\s*\(/i, "MatterPaymentReceipt write");
./scripts/verify-claim-results-sortable-columns-safety.mjs:3:const page = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-provider-client-hub-nowrap-safety.mjs:42:mustAvoidPattern("client page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation on hub page");
./scripts/verify-invoice-step2-review-card-polish-safety.mjs:57:mustAvoidPattern("invoice page", page, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in UI");
./scripts/verify-admin-home-page-and-menu.mjs:5:const headerFiles = ["app/page.tsx", "app/matter/[id]/page.tsx", "app/matters/page.tsx"];
./scripts/verify-barsh-header-logo-layout.mjs:11:const master = fs.readFileSync("app/matters/page.tsx", "utf8");
./scripts/verify-document-delivery-draft-preview-safety.mjs:46:const pagePath = "app/matters/page.tsx";
./scripts/verify-provider-fee-defaults-safety.mjs:37:const matterPage = read("app/matters/page.tsx");
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:8:  'app/api/matters/identity-field/route.ts',
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:9:  'app/api/matters/update-direct-field/route.ts',
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:11:  'app/matters/page.tsx',
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:19:    re: /Rebuild or index the matter|Rebuild or locally create the matter|rebuild or index the matter|rebuild or locally create the matter/u,
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:49:    file: 'app/api/matters/identity-field/route.ts',
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:50:    phrase: 'No local matter index row exists for this matter. Import or locally create the matter before saving local identity fields.',
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:53:    file: 'app/api/matters/update-direct-field/route.ts',
./scripts/verify-no-user-facing-claimindex-rebuild-wording.mjs:54:    phrase: 'No local matter index row exists for this matter. Import or locally create the matter before saving direct fields.',
./scripts/verify-invoice-client-costs-ledger-page-safety.mjs:57:mustAvoidPattern("ledger page", ledgerPage, /matterPaymentReceipt\.(create|update|delete|upsert)\s*\(/i, "direct MatterPaymentReceipt mutation in ledger page");
./app/api/documents/clio-matter-documents/route.ts:68:  const res = await clioFetch(`/matters.json?${params.toString()}`);
./app/api/admin/clients/[id]/route.ts:3:import { createMatterAuditLogEntry } from "@/lib/auditLog";
./app/api/admin/clients/[id]/route.ts:559:    await createMatterAuditLogEntry({
./app/api/documents/direct-finalize-preview/route.ts:65:  const res = await clioFetch(`/matters.json?${params.toString()}`);
./app/api/documents/clio-maildrop-inspect/route.ts:58:    `/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-maildrop-inspect/route.ts:87:  const res = await clioFetch(`/api/v4/matters.json?${params.toString()}`);
./app/api/documents/clio-maildrop-resolve/route.ts:45:  const res = await clioFetch(`/api/v4/matters.json?${params.toString()}`);
./app/api/documents/clio-maildrop-resolve/route.ts:60:    `/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-master-matter-preview/route.ts:40:    `/api/v4/matters/${encodeURIComponent(String(id))}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-master-matter-preview/route.ts:209:      action: "clio-master-matter-create-preview",
./app/api/documents/clio-master-matter-preview/route.ts:236:        clioCreateEndpoint: "POST /api/v4/matters.json",
./app/api/documents/clio-master-matter-preview/route.ts:245:        "Preview only.  This route plans the Clio master matter creation and Barsh Matters mapping needed for document storage, Maildrop Cc, document retrieval, and future Outlook/Microsoft Graph attachments.  It does not create a Clio matter and does not write to the database.",
./app/api/documents/clio-master-matter-preview/route.ts:251:        action: "clio-master-matter-create-preview",
./app/api/documents/clio-master-matter-preview/route.ts:256:        error: error?.message || "Clio master matter create preview failed.",
./scripts/verify-start-lawsuit-button-workflow-safety.mjs:23:mustContain("lower workspace directs user to Start Lawsuit", "Use the Start Lawsuit button in Matter Actions to create a lawsuit from this individual matter.");
./app/api/documents/clio-master-crossref-preview/route.ts:61:    `/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-master-crossref-confirm/route.ts:62:  const res = await clioFetch(`/api/v4/matters/${encodeURIComponent(String(matterId))}.json?fields=${encodeURIComponent(fields)}`, {
./app/api/documents/clio-master-matter-confirm/route.ts:30:    `/api/v4/matters/${encodeURIComponent(String(id))}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-master-matter-confirm/route.ts:148:  const res = await clioFetch(`/api/v4/matters.json?fields=${encodeURIComponent(fields)}`, {
./app/api/documents/clio-master-matter-confirm/route.ts:173:      `Failed to create Clio master matter: status ${res.status}; body ${bodyText || "(empty)"}`
./app/api/documents/clio-master-matter-confirm/route.ts:183:    throw new Error("Clio created matter response did not include a valid matter id.");
./app/api/documents/clio-master-matter-confirm/route.ts:187:    throw new Error("Clio created matter response did not include a display number / BRL number.");
./app/api/documents/clio-master-matter-confirm/route.ts:211:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:232:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:246:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:257:            "This local master lawsuit already has a Clio master matter mapping.  Refusing to create a duplicate Clio master matter.",
./app/api/documents/clio-master-matter-confirm/route.ts:272:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:299:          action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:320:        clioMasterMatterId: created.matterId,
./app/api/documents/clio-master-matter-confirm/route.ts:330:      action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:340:        id: created.matterId,
./app/api/documents/clio-master-matter-confirm/route.ts:353:        "Read the created Clio matter to identify its Maildrop field/address.",
./app/api/documents/clio-master-matter-confirm/route.ts:364:        action: "clio-master-matter-create-confirm",
./app/api/documents/clio-master-matter-confirm/route.ts:366:        error: error?.message || "Clio master matter create confirm failed.",
./app/api/graph/create-draft/route.ts:48:    `/api/v4/matters.json?${params.toString()}`,
./app/api/graph/create-draft/route.ts:49:    `/api/v4/matters?${params.toString()}`,
./app/api/graph/create-draft/route.ts:50:    `/matters.json?${params.toString()}`,
```

## Lawsuit aggregation references

```text
./app/api/matters/apply-payment/route.ts:456:    const lawsuitAggregation = await matterHasLawsuitAggregation(matterId, expectedDisplayNumber);
./app/api/matters/apply-payment/route.ts:458:    if (lawsuitAggregation.aggregated && !isLawsuitAllocation) {
./app/api/matters/apply-payment/route.ts:463:          masterLawsuitId: lawsuitAggregation.masterLawsuitId,
```

## Document upload/retrieval references

```text
./lib/documents/templateImport.ts:4:} from "@/lib/documents/templateRegistry";
./app/print-queue/page.tsx:61:  return "/api/documents/clio-document-open?" + params.toString();
./app/print-queue/page.tsx:192:      const url = new URL("/api/documents/print-queue", window.location.origin);
./app/print-queue/page.tsx:274:      const res = await fetch("/api/documents/print-queue", {
./app/admin/document-templates/page.tsx:296:      const response = await fetch(`/api/documents/templates?category=${encodeURIComponent(nextCategory)}`, {
./app/admin/document-templates/page.tsx:322:      const response = await fetch("/api/documents/templates/import-preview", {
./app/admin/document-templates/page.tsx:356:      const response = await fetch("/api/documents/templates/import-confirm", {
./app/admin/document-templates/page.tsx:518:      const response = await fetch("/api/documents/templates/import-preview", {
./app/admin/document-templates/page.tsx:578:      const response = await fetch("/api/documents/templates/import-confirm", {
./app/admin/document-templates/page.tsx:641:    window.open(`/api/documents/templates/stored-docx?versionId=${encodeURIComponent(versionId)}`, "_blank", "noopener,noreferrer");
./app/api/settlements/documents-preview/route.ts:3:import { buildSettlementPlannedDocuments } from "@/lib/documents/templateRegistry";
./app/admin/document-templates/[key]/page.tsx:152:      const response = await fetch("/api/documents/templates/replace-version", {
./app/admin/document-templates/[key]/page.tsx:200:        `/api/documents/templates/detail?key=${encodeURIComponent(key)}&category=all`,
./lib/clioDocumentUpload.ts:98:    "/api/v4/documents.json?fields=id,name,latest_document_version{uuid,put_url,put_headers}",
./lib/clioDocumentUpload.ts:160:    `/api/v4/documents/${documentId}.json?fields=id,name,latest_document_version{fully_uploaded}`,
./lib/clioDocumentUpload.ts:215:    `/api/v4/documents.json?matter_id=${encodeURIComponent(String(matterId))}&limit=200&fields=${encodeURIComponent(fields)}`
./app/api/settlements/preview/route.ts:14:  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
./scripts/verify-document-view-open-behavior-safety.cjs:2:const route = fs.readFileSync("app/api/documents/clio-document-open/route.ts", "utf8");
./app/api/settlements/provider-remittance-breakdown/route.ts:267:    const previewUrl = new URL("/api/settlements/documents-preview", req.nextUrl.origin);
./app/matters/page.tsx:9:import { documentDeliverySafetyNote, resolvePrintableUrl, type DocumentDeliveryContext } from "@/lib/documents/delivery";
./app/matters/page.tsx:1284:        const response = await fetch(`/api/documents/templates?ts=${Date.now()}`, { cache: "no-store" });
./app/matters/page.tsx:1337:        `/api/documents/clio-matter-documents?masterLawsuitId=${encodeURIComponent(masterId)}`,
./app/matters/page.tsx:1472:                    <button key={id || masterDocumentPreviewText(doc.clioDocumentName)} type="button" title={opensInline ? "Select and open PDF in a new tab." : opensEmail ? "Select and open email as PDF." : opensWord ? "Select and open document in Word." : "Select document."} onClick={() => { if (!id) return; setMasterSelectedViewDocumentId(id); const params = new URLSearchParams(); params.set("documentId", id); params.set("filename", displayName); if (opensInline) { params.set("mode", "inline"); window.open("/api/documents/clio-document-open?" + params.toString(), "_blank", "noopener,noreferrer"); return; } if (opensEmail) { params.set("mode", "email-pdf"); window.open("/api/documents/clio-document-open?" + params.toString(), "_blank", "noopener,noreferrer"); return; } if (opensWord) { params.set("mode", "edit"); const editUrl = window.location.origin + "/api/documents/clio-document-open?" + params.toString(); window.location.href = "ms-word:ofe|u|" + editUrl; return; } }} style={{ display: "block", width: "100%", textAlign: "left", border: 0, borderBottom: "1px solid #e5e7eb", background: selected ? "#eff6ff" : "#ffffff", color: "#0f172a", padding: 12, cursor: id ? "pointer" : "not-allowed", opacity: id ? 1 : 0.6 }}>
./app/matters/page.tsx:3101:        `/api/documents/finalization-history?masterLawsuitId=${encodeURIComponent(lookupMasterLawsuitId)}&limit=50`,
./app/matters/page.tsx:4837:        ? `/api/settlements/documents-preview?masterLawsuitId=${encodeURIComponent(previewMasterLawsuitId)}${settlementRecordId ? `&settlementRecordId=${encodeURIComponent(settlementRecordId)}` : ""}`
./app/matters/page.tsx:4838:        : `/api/documents/packet?masterLawsuitId=${encodeURIComponent(previewMasterLawsuitId)}`;
./app/matters/page.tsx:4872:      const response = await fetch(`/api/documents/templates?category=${encodeURIComponent(category)}`);
./app/matters/page.tsx:4964:    const response = await fetch(`/api/documents/clio-maildrop-resolve?source=master_lawsuit&masterLawsuitId=${queryMasterLawsuitId}`);
./app/matters/page.tsx:5172:      const response = await fetch("/api/documents/delivery-draft-preview", {
./app/matters/page.tsx:5258:      const response = await fetch("/api/documents/delivery-draft-preview", {
./app/matters/page.tsx:5418:      return `/api/documents/clio-document-open?${params.toString()}`;
./app/matters/page.tsx:5447:    const response = await fetch("/api/documents/print-queue-preview?" + params.toString(), {
./app/matters/page.tsx:5919:      const res = await fetch(`/api/documents/finalize-preview?${params.toString()}`);
./app/matters/page.tsx:5994:      const res = await fetch("/api/documents/finalize", {
./app/matters/page.tsx:6044:      return "/api/documents/bill-schedule?" + params.toString();
./app/matters/page.tsx:6048:      return "/api/documents/packet-summary?" + params.toString();
./app/matters/page.tsx:6052:      return "/api/documents/summons-complaint?" + params.toString();
./app/matters/page.tsx:6072:      const response = await fetch("/api/documents/working-docx", {
./app/matters/page.tsx:6174:        const workingResponse = await fetch("/api/documents/working-docx", {
./app/matters/page.tsx:6210:      const previewResponse = await fetch("/api/documents/preview-pdf", {
./app/matters/page.tsx:6278:        const latestResponse = await fetch("/api/documents/working-docx-latest?" + params.toString(), {
./app/matters/page.tsx:6314:      const res = await fetch("/api/documents/finalize", {
./app/matters/page.tsx:6410:      const response = await fetch("/api/settlements/documents-finalize-local", {
./app/matters/page.tsx:6485:        const response = await fetch("/api/settlements/documents-print-queue-local", {
./app/matters/page.tsx:6538:      const response = await fetch("/api/documents/print-queue", {
./app/matters/page.tsx:7525:                        : "Template source: /api/documents/templates.  Settlement mode uses settlement templates; lawsuit mode loads all stored local DOCX templates first."}
./app/matter/[id]/page.tsx:11:import { documentDeliverySafetyNote, resolvePrintableUrl, type DocumentDeliveryContext } from "@/lib/documents/delivery";
./app/matter/[id]/page.tsx:746:        `/api/documents/clio-matter-documents?matterId=${encodeURIComponent(String(numericMatterId))}`,
./app/matter/[id]/page.tsx:817:      window.open("/api/documents/clio-document-open?" + params.toString(), "_blank", "noopener,noreferrer");
./app/matter/[id]/page.tsx:822:      window.open("/api/documents/clio-document-open?" + params.toString(), "_blank", "noopener,noreferrer");
./app/matter/[id]/page.tsx:827:      const editUrl = window.location.origin + "/api/documents/clio-document-open?" + params.toString();
./app/matter/[id]/page.tsx:981:        `/api/documents/finalization-history?matterDisplayNumber=${encodeURIComponent(lookupMatterDisplayNumber)}&limit=50`,
./app/matter/[id]/page.tsx:3322:      `/api/documents/packet?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`
./app/matter/[id]/page.tsx:3612:        `/api/documents/generate-preview?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`
./app/matter/[id]/page.tsx:3650:        `/api/documents/finalization-history?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}&limit=10`
./app/matter/[id]/page.tsx:3685:        `/api/documents/print-queue-preview?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}&limit=10`
./app/matter/[id]/page.tsx:3725:      const url = new URL("/api/documents/print-queue", window.location.origin);
./app/matter/[id]/page.tsx:3781:      const res = await fetch("/api/documents/print-queue", {
./app/matter/[id]/page.tsx:3848:      const res = await fetch("/api/documents/print-queue", {
./app/matter/[id]/page.tsx:3919:      const res = await fetch(`/api/documents/finalize-preview?${params.toString()}`);
./app/matter/[id]/page.tsx:3995:      const res = await fetch("/api/documents/finalize", {
./app/matter/[id]/page.tsx:4058:      const response = await fetch("/api/documents/working-docx", {
./app/matter/[id]/page.tsx:4131:      const workingResponse = await fetch("/api/documents/working-docx", {
./app/matter/[id]/page.tsx:4161:      const previewResponse = await fetch("/api/documents/preview-pdf", {
./app/matter/[id]/page.tsx:4233:      const res = await fetch("/api/documents/finalize", {
./app/matter/[id]/page.tsx:4284:      `/api/documents/bill-schedule?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./app/matter/[id]/page.tsx:4299:      `/api/documents/packet-summary?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./app/matter/[id]/page.tsx:4314:      `/api/documents/summons-complaint?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./app/matter/[id]/page.tsx:4786:      const res = await fetch(`/api/documents/matter-packet?matterId=${encodeURIComponent(String(matterId))}`);
./app/matter/[id]/page.tsx:4846:    const response = await fetch(`/api/documents/clio-maildrop-resolve?source=direct_matter&matterId=${queryMatterId}`);
./app/matter/[id]/page.tsx:4878:    return "/api/documents/clio-document-open?" + params.toString();
./app/matter/[id]/page.tsx:4970:      const response = await fetch("/api/documents/delivery-draft-preview", {
./app/matter/[id]/page.tsx:5151:      const response = await fetch("/api/documents/print-queue", {
./app/matter/[id]/page.tsx:6868:        `/api/settlements/documents-preview?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`
./app/api/settlements/documents-finalize-local/route.ts:12:} from "@/lib/documents/graphWorkingDocuments";
./app/api/settlements/documents-finalize-local/route.ts:13:import { buildSettlementPlannedDocuments } from "@/lib/documents/templateRegistry";
./app/api/settlements/documents-finalize-local/route.ts:14:import { buildPlaceholderSeededDocxRouteArtifact } from "@/lib/documents/artifactContract";
./app/api/settlements/settlement-summary/route.ts:308:    const previewUrl = new URL("/api/settlements/documents-preview", req.nextUrl.origin);
./scripts/verify-document-delivery-history-safety.mjs:3:const routePath = "app/api/documents/finalization-history/route.ts";
./scripts/verify-document-template-detail-workflow-safety.mjs:16:const detailRoute = read("app/api/documents/templates/detail/route.ts");
./scripts/verify-document-template-detail-workflow-safety.mjs:17:const storedDocxRoute = read("app/api/documents/templates/stored-docx/route.ts");
./app/api/settlements/attorney-fee-breakdown/route.ts:272:    const previewUrl = new URL("/api/settlements/documents-preview", req.nextUrl.origin);
./app/api/documents/preview-pdf/route.ts:2:import { convertWorkingDocxDriveItemToPdf } from "@/lib/documents/graphWorkingDocuments";
./scripts/verify-admin-lawsuit-cleanup-preview-safety.mjs:41:mustNotContain("route must not call upload function", route, "uploadDocument");
./scripts/verify-verifier-contract-locks.mjs:101:  mustContain(file, text, "lib/documents/templateRegistry.ts");
./app/api/documents/direct-finalize-preview/route.ts:165:        sourceEndpoint: `/api/documents/templates/stored-docx?versionId=${encodeURIComponent(currentVersion.id)}`,
./app/api/documents/direct-finalize-preview/route.ts:198:  const packetUrl = new URL("/api/documents/matter-packet", req.nextUrl.origin);
./scripts/verify-settlement-document-dialog-mode.mjs:9:  ["settlement preview endpoint used", "/api/settlements/documents-preview"],
./app/api/documents/finalize-preview/route.ts:184:        sourceEndpoint: `/api/documents/templates/stored-docx?versionId=${encodeURIComponent(currentVersion.id)}`,
./app/api/documents/finalize-preview/route.ts:222:      sourceEndpoint: `/api/documents/bill-schedule?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./app/api/documents/finalize-preview/route.ts:232:      sourceEndpoint: `/api/documents/packet-summary?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./app/api/documents/finalize-preview/route.ts:242:      sourceEndpoint: `/api/documents/summons-complaint?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./app/api/documents/finalize-preview/route.ts:260:  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
./app/api/graph/create-draft/route.ts:133:      ? `/api/v4/documents/${encodeURIComponent(clioDocumentId)}/download`
./scripts/verify-clio-document-list-ui-safety.mjs:15:check("Direct Matter keeps read-only document loader", direct.includes("loadMatterClioDocuments") && direct.includes("/api/documents/clio-matter-documents?matterId="));
./scripts/verify-clio-document-list-ui-safety.mjs:19:check("Master keeps read-only document loader", master.includes("loadMasterClioDocuments") && master.includes("/api/documents/clio-matter-documents?masterLawsuitId="));
./app/api/documents/bill-schedule/route.ts:250:  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
./scripts/verify-admin-document-template-repository-page.mjs:11:  ["uses templates API", page.includes("/api/documents/templates?category=")],
./scripts/verify-graph-background-thread-sync-safety.mjs:76:  "uploadDocument",
./app/api/documents/print-queue/route.ts:80:    `/api/v4/documents/${encodeURIComponent(cleanDocumentId)}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/print-queue/route.ts:121:  const previewUrl = new URL("/api/documents/print-queue-preview", req.nextUrl.origin);
./scripts/verify-clio-master-matter-confirm-safety.mjs:28:const routePath = "app/api/documents/clio-master-matter-confirm/route.ts";
./scripts/verify-settlement-edit-word-web-hash-sync-safety.mjs:4:const workingRoutePath = "app/api/documents/working-docx/route.ts";
./scripts/verify-settlement-edit-word-web-hash-sync-safety.mjs:5:const finalizeRoutePath = "app/api/settlements/documents-finalize-local/route.ts";
./app/api/documents/packet-summary/route.ts:214:  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
./app/api/documents/print-queue-preview/route.ts:108:  const url = new URL("/api/documents/clio-document-open", req.nextUrl.origin);
./app/api/documents/working-docx-latest/route.ts:2:import { findLatestWorkingDocxInGraph } from "@/lib/documents/graphWorkingDocuments";
./app/api/documents/finalize/route.ts:8:import { convertWorkingDocxDriveItemToPdf } from "@/lib/documents/graphWorkingDocuments";
./app/api/documents/finalize/route.ts:107:  const previewUrl = new URL("/api/documents/finalize-preview", req.nextUrl.origin);
./app/api/documents/finalize/route.ts:239:            const previewUrl = new URL("/api/documents/direct-finalize-preview", req.nextUrl.origin);
./scripts/verify-attorney-fee-docx-safety.mjs:37:const previewRoute = read("app/api/settlements/documents-preview/route.ts");
./scripts/verify-attorney-fee-docx-safety.mjs:38:const templateRegistry = read("lib/documents/templateRegistry.ts");
./scripts/verify-attorney-fee-docx-safety.mjs:52:mustContain("attorney fee route", attorneyFeeRoute, "/api/settlements/documents-preview");
./app/api/documents/clio-maildrop-resolve/route.ts:153:        route: "/api/documents/clio-maildrop-resolve",
./scripts/verify-email-automation-status-safety.mjs:56:  "uploadDocument",
./app/api/documents/generate-preview/route.ts:33:  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
./app/api/documents/generate-preview/route.ts:75:      endpoint: `/api/documents/bill-schedule?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./app/api/documents/generate-preview/route.ts:83:      endpoint: `/api/documents/packet-summary?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./app/api/documents/generate-preview/route.ts:91:      endpoint: `/api/documents/summons-complaint?masterLawsuitId=${encodeURIComponent(masterLawsuitId)}`,
./scripts/verify-settlement-document-local-print-queue-safety.mjs:19:const routePath = "app/api/settlements/documents-print-queue-local/route.ts";
./scripts/verify-settlement-document-local-print-queue-safety.mjs:38:  mustNotInclude(routePath, "uploadDocumentToClio", "Clio document upload");
./scripts/verify-settlement-document-local-print-queue-safety.mjs:45:mustInclude(pagePath, "/api/settlements/documents-print-queue-local");
./scripts/verify-master-view-documents-source-labels-safety.mjs:3:const routePath = "app/api/documents/clio-matter-documents/route.ts";
./scripts/verify-admin-template-merge-field-visibility-display.mjs:29:check("admin display does not upload files", !page.includes("uploadDocumentToClio") && !page.includes("FormData") && !page.includes("readAsArrayBuffer"));
./scripts/verify-packet-clio-master-mapping-safety.mjs:3:const path = "app/api/documents/packet/route.ts";
./scripts/verify-admin-readiness-dashboard-safety.mjs:70:  "fetch(`/api/documents",
./scripts/verify-admin-readiness-dashboard-safety.mjs:71:  "fetch('/api/documents",
./app/api/documents/clio-master-crossref-confirm/route.ts:15:  const previewUrl = new URL("/api/documents/clio-master-crossref-preview", req.nextUrl.origin);
./app/api/documents/clio-document-open/route.ts:113:async function getDocumentMetadata(documentId: string) {
./app/api/documents/clio-document-open/route.ts:116:    `/api/v4/documents/${encodeURIComponent(documentId)}.json?fields=${encodeURIComponent(fields)}`
./app/api/documents/clio-document-open/route.ts:163:    const metadata = await getDocumentMetadata(documentId);
./app/api/documents/clio-document-open/route.ts:175:        downloadPath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}`,
./app/api/documents/clio-document-open/route.ts:176:        inlinePath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}&mode=inline`,
./app/api/documents/clio-document-open/route.ts:177:        editPath: `/api/documents/clio-document-open?documentId=${encodeURIComponent(documentId)}&filename=${encodeURIComponent(metadata.filename)}&mode=edit`,
./app/api/documents/clio-document-open/route.ts:187:    const downloadRes = await clioFetch(`/api/v4/documents/${encodeURIComponent(documentId)}/download`);
./scripts/verify-settlement-summary-docx-safety.mjs:37:const previewRoute = read("app/api/settlements/documents-preview/route.ts");
./scripts/verify-settlement-summary-docx-safety.mjs:38:const templateRegistry = read("lib/documents/templateRegistry.ts");
./scripts/verify-settlement-summary-docx-safety.mjs:52:mustContain("settlement summary route", settlementSummaryRoute, "/api/settlements/documents-preview");
./app/api/documents/delivery-draft-preview/route.ts:7:} from "@/lib/documents/delivery";
./scripts/verify-document-template-import-routes-safety.mjs:18:const helper = read("lib/documents/templateImport.ts");
./scripts/verify-document-template-import-routes-safety.mjs:19:const preview = read("app/api/documents/templates/import-preview/route.ts");
./scripts/verify-document-template-import-routes-safety.mjs:20:const confirm = read("app/api/documents/templates/import-confirm/route.ts");
./scripts/verify-document-template-import-routes-safety.mjs:44:  check(`${label} does not import Clio`, !text.includes("@/lib/clio") && !text.includes("uploadDocumentToClio"));
./app/api/documents/templates/detail/route.ts:7:} from "@/lib/documents/templateRegistry";
./app/api/documents/templates/detail/route.ts:51:        ? `/api/documents/templates/stored-docx?versionId=${encodeURIComponent(version.id)}`
./scripts/verify-settlement-documents-preview-safety.mjs:36:const route = read("app/api/settlements/documents-preview/route.ts");
./scripts/verify-settlement-documents-preview-safety.mjs:37:const templateRegistry = read("lib/documents/templateRegistry.ts");
./scripts/verify-settlement-documents-preview-safety.mjs:103:mustContain("matter page", matterPage, "/api/settlements/documents-preview?masterLawsuitId=");
./app/api/documents/templates/import-preview/route.ts:8:} from "@/lib/documents/templateImport";
./scripts/verify-local-settlement-documents-preview-safety.mjs:2:const route = fs.readFileSync("app/api/settlements/documents-preview/route.ts", "utf8");
./scripts/verify-local-settlement-documents-preview-safety.mjs:10:check("documents preview does not upload to Clio", !route.includes("uploadDocumentToClio"));
./app/api/documents/templates/route.ts:7:} from "@/lib/documents/templateRegistry";
./scripts/verify-clio-maildrop-delivery-safety.mjs:28:const routePath = "app/api/documents/clio-maildrop-resolve/route.ts";
./scripts/verify-clio-maildrop-delivery-safety.mjs:29:const helperPath = "lib/documents/delivery.ts";
./app/api/documents/working-docx/route.ts:3:import { uploadWorkingDocxToGraph } from "@/lib/documents/graphWorkingDocuments";
./app/api/documents/working-docx/route.ts:35:    settlementMode ? "/api/settlements/documents-preview" : "/api/documents/finalize-preview",
./app/api/documents/working-docx/route.ts:149:            const previewUrl = new URL("/api/documents/direct-finalize-preview", req.nextUrl.origin);
./scripts/verify-document-template-merge-field-visibility-safety.mjs:3:const helper = fs.readFileSync("lib/documents/templateImport.ts", "utf8");
./scripts/verify-document-template-merge-field-visibility-safety.mjs:4:const confirm = fs.readFileSync("app/api/documents/templates/import-confirm/route.ts", "utf8");
./scripts/verify-document-template-merge-field-visibility-safety.mjs:35:check("no Clio call introduced", !helper.includes("uploadDocumentToClio") && !confirm.includes("uploadDocumentToClio"));
./scripts/verify-template-docx-db-storage-safety.mjs:4:const confirm = fs.readFileSync("app/api/documents/templates/import-confirm/route.ts", "utf8");
./scripts/verify-template-docx-db-storage-safety.mjs:5:const route = fs.readFileSync("app/api/documents/templates/route.ts", "utf8");
./scripts/verify-template-docx-db-storage-safety.mjs:52:  "fetch(\"/api/documents/finalize",
./scripts/verify-template-docx-db-storage-safety.mjs:54:  "fetch(\"/api/documents/print-queue",
./scripts/verify-direct-view-documents-button-safety.mjs:38:mustContain("Direct matter packet endpoint", "/api/documents/matter-packet");
./scripts/verify-clio-master-matter-preview-safety.mjs:28:const routePath = "app/api/documents/clio-master-matter-preview/route.ts";
./app/api/documents/summons-complaint/route.ts:302:  const packetUrl = new URL("/api/documents/packet", req.nextUrl.origin);
./scripts/verify-clio-maildrop-resolve-source-scope-safety.mjs:3:const routePath = "app/api/documents/clio-maildrop-resolve/route.ts";
./scripts/verify-print-queue-clio-document-null-type-safety.mjs:3:const route = fs.readFileSync("app/api/documents/print-queue/route.ts", "utf8");
./app/api/documents/templates/import-confirm/route.ts:8:} from "@/lib/documents/templateImport";
./scripts/verify-placeholder-document-template-labels-safety.mjs:3:const finalizePreview = fs.readFileSync("app/api/documents/finalize-preview/route.ts", "utf8");
./scripts/verify-placeholder-document-template-labels-safety.mjs:4:const printQueue = fs.readFileSync("app/api/documents/print-queue/route.ts", "utf8");
./app/api/documents/clio-master-matter-confirm/route.ts:122:  const previewUrl = new URL("/api/documents/clio-master-matter-preview", req.nextUrl.origin);
./scripts/verify-document-template-registry-foundation.mjs:4:const registryPath = "lib/documents/templateRegistry.ts";
./scripts/verify-document-template-registry-foundation.mjs:5:const routePath = "app/api/settlements/documents-preview/route.ts";
./scripts/verify-settlement-document-print-docx-route-ui-safety.mjs:21:check("finalized document URL resolver builds Clio document open route", page.includes("/api/documents/clio-document-open?") && page.includes('params.set("documentId", String(clioDocumentId))'));
./scripts/verify-settlement-document-print-docx-route-ui-safety.mjs:31:check("does not add Clio upload from print", !page.includes("uploadDocumentToClio"));
./scripts/verify-direct-matter-document-preview-ui-safety.mjs:33:mustContain("direct matter packet endpoint", "/api/documents/matter-packet");
./scripts/verify-graph-create-draft-safety.mjs:73:mustContain(routePath, route, "/api/v4/documents/");
./scripts/verify-document-finalization-target-routing-safety.mjs:4:const finalizePreview = fs.readFileSync("app/api/documents/finalize-preview/route.ts", "utf8");
./scripts/verify-document-finalization-target-routing-safety.mjs:5:const finalizeRoute = fs.readFileSync("app/api/documents/finalize/route.ts", "utf8");
./scripts/verify-template-stored-docx-download-safety.mjs:3:const route = fs.readFileSync("app/api/documents/templates/stored-docx/route.ts", "utf8");
./scripts/verify-template-stored-docx-download-safety.mjs:24:  "/api/documents/templates/stored-docx?versionId=",
./scripts/verify-document-template-repository-api-foundation.mjs:4:const registryPath = "lib/documents/templateRegistry.ts";
./scripts/verify-document-template-repository-api-foundation.mjs:5:const routePath = "app/api/documents/templates/route.ts";
./scripts/verify-settlement-finalized-email-safety.mjs:4:const finalizeRoute = fs.readFileSync("app/api/settlements/documents-finalize-local/route.ts", "utf8");
./scripts/verify-settlement-finalized-email-safety.mjs:18:    ok: page.includes('fetch("/api/documents/delivery-draft-preview"'),
./scripts/verify-settlement-finalized-email-safety.mjs:190:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("normalizeRawSource") &&
./scripts/verify-settlement-finalized-email-safety.mjs:191:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("settlementFinalizedPdfDelivery = rawSource === \"settlement_finalized_pdf_delivery\"") &&
./scripts/verify-settlement-finalized-email-safety.mjs:192:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("source: rawSource"),
./scripts/verify-settlement-finalized-email-safety.mjs:197:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("const attachmentPlan = attachmentCandidates as any[]") &&
./scripts/verify-settlement-finalized-email-safety.mjs:198:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("attachmentPlan,") &&
./scripts/verify-settlement-finalized-email-safety.mjs:199:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("graphUploadRequired: rawSource === \"settlement_finalized_pdf_delivery\""),
./scripts/verify-settlement-finalized-email-safety.mjs:204:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("subject,") &&
./scripts/verify-settlement-finalized-email-safety.mjs:205:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("body: emailBody") &&
./scripts/verify-settlement-finalized-email-safety.mjs:206:      fs.readFileSync("app/api/documents/delivery-draft-preview/route.ts", "utf8").includes("hasFinalizedSettlementPdfAttachment"),
./scripts/verify-document-template-dialog-api-wiring.mjs:9:  ["templates API called", page.includes("/api/documents/templates?category=")],
./scripts/verify-document-template-dialog-api-wiring.mjs:13:  ["settlement source copy references repository", page.includes("Template source: /api/documents/templates?category=settlement")],
./scripts/verify-admin-lawsuit-audit-safety.mjs:132:  "fetch(`/api/documents",
./scripts/verify-admin-lawsuit-audit-safety.mjs:133:  "fetch('/api/documents",
./scripts/verify-preview-pdf-body-type-safety.mjs:3:const route = fs.readFileSync("app/api/documents/preview-pdf/route.ts", "utf8");
./scripts/verify-settlement-document-workflow-ui-safety.mjs:17:check("settlement document preview endpoint is used", page.includes("/api/settlements/documents-preview"));
./scripts/verify-create-lawsuit-clio-shell-contract.mjs:33:mustNotContain("must not call separate clio-master confirm route", "/api/documents/clio-master-matter-confirm");
./scripts/verify-direct-matter-document-packet-safety.mjs:3:const routePath = "app/api/documents/matter-packet/route.ts";
./scripts/verify-clio-master-crossref-confirm-safety.mjs:28:const routePath = "app/api/documents/clio-master-crossref-confirm/route.ts";
./scripts/verify-date-only-display-safety.mjs:11:  "app/api/settlements/documents-print-local/route.ts",
./scripts/verify-date-only-display-safety.mjs:83:    file: "app/api/settlements/documents-print-local/route.ts",
./scripts/verify-master-document-preview-ui-safety.mjs:34:mustContain("master packet endpoint", "/api/documents/packet?masterLawsuitId=");
./scripts/verify-master-template-repository-load-category-safety.mjs:8:  "/api/documents/templates?category=",
./scripts/verify-master-template-repository-load-category-safety.mjs:16:  "fetch(`/api/documents/finalize",
./scripts/verify-master-template-repository-load-category-safety.mjs:18:  "fetch(`/api/documents/print-queue",
./scripts/verify-master-document-history-ui-safety.mjs:16:  "/api/documents/finalization-history?masterLawsuitId=",
./scripts/verify-master-document-history-ui-safety.mjs:34:  "fetch(`/api/documents/print-queue",
./scripts/verify-master-document-history-ui-safety.mjs:35:  "fetch(`/api/documents/finalize",
./scripts/verify-maildrop-address-registry-safety.mjs:50:const resolveRoute = read("app/api/documents/clio-maildrop-resolve/route.ts");
./scripts/verify-maildrop-address-registry-safety.mjs:88:mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'import { upsertMaildropAddress } from "@/lib/graph/maildropRegistry";');
./scripts/verify-maildrop-address-registry-safety.mjs:89:mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, "await upsertMaildropAddress");
./scripts/verify-maildrop-address-registry-safety.mjs:90:mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'source: "clio_maildrop_resolve"');
./scripts/verify-maildrop-address-registry-safety.mjs:91:mustContain("app/api/documents/clio-maildrop-resolve/route.ts", resolveRoute, 'route: "/api/documents/clio-maildrop-resolve"');
./scripts/verify-maildrop-address-registry-safety.mjs:99:  "uploadDocument",
./scripts/verify-graph-maildrop-discovery-safety.mjs:92:  "uploadDocument",
./scripts/verify-document-template-replacement-versioning-safety.mjs:16:const route = read("app/api/documents/templates/replace-version/route.ts");
./scripts/verify-document-template-replacement-versioning-safety.mjs:37:assert(detailPage.includes("/api/documents/templates/replace-version"), "template detail page calls replacement route");
./scripts/verify-settlement-document-artifact-contract-usage-safety.mjs:3:const routePath = "app/api/settlements/documents-finalize-local/route.ts";
./scripts/verify-settlement-document-artifact-contract-usage-safety.mjs:4:const helperPath = "lib/documents/artifactContract.ts";
./scripts/verify-settlement-document-artifact-contract-usage-safety.mjs:19:check("settlement route imports artifact contract", route.includes("@/lib/documents/artifactContract"));
./scripts/verify-settlement-document-artifact-contract-usage-safety.mjs:28:check("settlement route does not upload to Clio", !route.includes("uploadDocumentToClio"));
./scripts/verify-admin-backup-restore-preview-safety.mjs:79:  [/settlements\/documents-print-queue/i, 'references settlement print queue'],
./scripts/verify-document-artifact-contract-safety.mjs:3:const path = "lib/documents/artifactContract.ts";
./scripts/verify-document-artifact-contract-safety.mjs:34:check("helper does not call Clio", !text.includes("uploadDocumentToClio"));
./scripts/verify-provider-remittance-docx-safety.mjs:37:const previewRoute = read("app/api/settlements/documents-preview/route.ts");
./scripts/verify-provider-remittance-docx-safety.mjs:38:const templateRegistry = read("lib/documents/templateRegistry.ts");
./scripts/verify-provider-remittance-docx-safety.mjs:52:mustContain("provider remittance route", providerRemittanceRoute, "/api/settlements/documents-preview");
./scripts/verify-clio-document-list-readonly-safety.mjs:3:const routePath = "app/api/documents/clio-matter-documents/route.ts";
./scripts/verify-local-lawsuit-generation-create-safety.mjs:70:mustNotContain("must not call separate Clio master confirm route", "/api/documents/clio-master-matter-confirm");
./scripts/verify-admin-template-merge-field-visibility-filter.mjs:28:check("filter does not upload files", !page.includes("uploadDocumentToClio") && !page.includes("FormData") && !page.includes("readAsArrayBuffer"));
./scripts/verify-document-activity-trace-ui-safety.mjs:16:const historyRoute = read("app/api/documents/finalization-history/route.ts");
./scripts/verify-document-activity-trace-ui-safety.mjs:29:assert(masterPage.includes("/api/documents/finalization-history"), "master page still reads finalization-history endpoint");
./scripts/verify-master-view-documents-button-safety.mjs:38:mustContain("Master packet endpoint", "/api/documents/packet?masterLawsuitId=");
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:31:check("does not upload file to Clio", !page.includes("uploadDocumentToClio"));
./scripts/verify-master-document-dropdown-stored-db-template-safety.mjs:17:  "fetch(`/api/documents/finalize",
./scripts/verify-master-document-dropdown-stored-db-template-safety.mjs:19:  "fetch(`/api/documents/print-queue",
./scripts/verify-admin-claim-index-audit-safety.mjs:117:  "fetch(`/api/documents",
./scripts/verify-admin-claim-index-audit-safety.mjs:118:  "fetch('/api/documents",
./scripts/verify-admin-custom-template-import-ui-safety.mjs:28:check("custom import calls preview route", page.includes("/api/documents/templates/import-preview"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:29:check("custom import calls confirm route", page.includes("/api/documents/templates/import-confirm"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:41:check("custom UI does not upload files", !page.includes("uploadDocumentToClio") && !page.includes("FormData") && !page.includes("readAsArrayBuffer"));
./scripts/verify-document-delivery-draft-preview-safety.mjs:47:const routePath = "app/api/documents/delivery-draft-preview/route.ts";
./scripts/verify-document-delivery-draft-preview-safety.mjs:80:  "/api/documents/delivery-draft-preview",
./scripts/verify-graph-working-docx-body-type-safety.mjs:3:const file = fs.readFileSync("lib/documents/graphWorkingDocuments.ts", "utf8");
./scripts/verify-clio-maildrop-inspection-safety.mjs:28:const routePath = "app/api/documents/clio-maildrop-inspect/route.ts";
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:3:const route = fs.readFileSync("app/api/documents/finalize-preview/route.ts", "utf8");
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:11:  "/api/documents/templates/stored-docx?versionId=",
./scripts/verify-adversary-attorney-document-merge-data-safety.mjs:26:const packet = read("app/api/documents/packet/route.ts");
./scripts/verify-direct-matter-document-activity-ui-safety.mjs:16:  "/api/documents/finalization-history?matterDisplayNumber=",
./scripts/verify-direct-matter-document-activity-ui-safety.mjs:34:  "fetch(`/api/documents/print-queue",
./scripts/verify-direct-matter-document-activity-ui-safety.mjs:35:  "fetch(`/api/documents/finalize",
./scripts/verify-document-delivery-preview-ui-safety.mjs:71:  "/api/documents/delivery-draft-preview",
./scripts/verify-admin-document-readiness-audit-safety.mjs:90:  "uploadDocumentToClio",
./scripts/verify-admin-document-readiness-audit-safety.mjs:134:  "fetch(`/api/documents",
./scripts/verify-admin-document-readiness-audit-safety.mjs:135:  "fetch('/api/documents",
./scripts/verify-local-document-packet-safety.mjs:3:const routePath = "app/api/documents/packet/route.ts";
./scripts/verify-stored-db-docx-generation-path-safety.mjs:16:const finalizePreview = read("app/api/documents/finalize-preview/route.ts");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:17:const workingDocx = read("app/api/documents/working-docx/route.ts");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:18:const finalize = read("app/api/documents/finalize/route.ts");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:19:const storedDocx = read("app/api/documents/templates/stored-docx/route.ts");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:23:assert(finalizePreview.includes('sourceEndpoint: `/api/documents/templates/stored-docx?versionId=${encodeURIComponent(currentVersion.id)}`'), "finalize-preview uses stored-docx route as sourceEndpoint");
./scripts/verify-direct-document-generation-popup-standard-safety.mjs:58:requireIncludes(previewFn, "/api/documents/working-docx", "direct preview creates working DOCX");
./scripts/verify-direct-document-generation-popup-standard-safety.mjs:59:requireIncludes(previewFn, "/api/documents/preview-pdf", "direct preview converts working DOCX to PDF");
./scripts/verify-direct-document-generation-popup-standard-safety.mjs:63:requireIncludes(editFn, "/api/documents/working-docx", "direct edit creates working DOCX");
./scripts/verify-direct-document-generation-popup-standard-safety.mjs:74:requireIncludes(finalizeFn, "/api/documents/finalize", "direct finalization uploads finalized PDF");
./scripts/verify-admin-document-template-import-ui-safety.mjs:20:check("admin calls import-preview route", page.includes("/api/documents/templates/import-preview"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:21:check("admin calls import-confirm route", page.includes("/api/documents/templates/import-confirm"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:32:check("admin does not upload files to Clio", !page.includes("uploadDocumentToClio"));
./scripts/verify-clio-rule1-boundary-safety.mjs:60:mustContain("Graph draft", graphDraft, "/api/v4/documents/");
./scripts/verify-clio-rule1-boundary-safety.mjs:69:  "app/api/documents/templates/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:70:  "app/api/documents/templates/detail/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:71:  "app/api/documents/templates/import-preview/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:72:  "app/api/documents/templates/import-confirm/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:73:  "app/api/documents/templates/replace-version/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:74:  "app/api/documents/templates/stored-docx/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:81:  mustNotContain(file, text, "uploadDocumentToClio");
./scripts/verify-clio-rule1-boundary-safety.mjs:82:  mustNotContain(file, text, "/api/v4/documents");
./scripts/verify-stored-db-docx-workflow-safety.mjs:17:const importConfirm = read("app/api/documents/templates/import-confirm/route.ts");
./scripts/verify-stored-db-docx-workflow-safety.mjs:18:const templatesRoute = read("app/api/documents/templates/route.ts");
./scripts/verify-stored-db-docx-workflow-safety.mjs:19:const workingDocxRoute = read("app/api/documents/working-docx/route.ts");
./scripts/verify-stored-db-docx-workflow-safety.mjs:20:const graphWorking = read("lib/documents/graphWorkingDocuments.ts");
./scripts/verify-stored-db-docx-workflow-safety.mjs:21:const storedDocxRoute = read("app/api/documents/templates/stored-docx/route.ts");
./scripts/smoke-workflow.sh:24:packet="$(curl -s "${BASE_URL}/api/documents/packet?masterLawsuitId=${MASTER_LAWSUIT_ID}")"
./scripts/smoke-workflow.sh:83:queue="$(curl -s "${BASE_URL}/api/documents/print-queue?status=queued&limit=20")"
./scripts/verify-clio-master-crossref-preview-safety.mjs:28:const routePath = "app/api/documents/clio-master-crossref-preview/route.ts";
```

## Folder references

```text
./lib/documentGenerator.ts:10:function todayFolderParts() {
./lib/documentGenerator.ts:19:    dateFolder: `${mm}-${dd}-${yyyy}`,
./lib/documentGenerator.ts:23:export function buildSharedFolderPath(masterId: string) {
./lib/documentGenerator.ts:30:  const { year, dateFolder } = todayFolderParts();
./lib/documentGenerator.ts:32:  const fullPath = path.join(base, year, dateFolder, masterId);
./lib/documentGenerator.ts:45:  const folder = buildSharedFolderPath(masterId);
./lib/documents/graphWorkingDocuments.ts:38:  parentFolderWebUrl: string;
./lib/documents/graphWorkingDocuments.ts:42:  const parentFolderWebUrl = clean(params.parentFolderWebUrl);
./lib/documents/graphWorkingDocuments.ts:46:  if (parentFolderWebUrl && filename) {
./lib/documents/graphWorkingDocuments.ts:47:    return `${parentFolderWebUrl.replace(/\/$/, "")}/${encodeSharePointPathSegment(filename)}`;
./lib/documents/graphWorkingDocuments.ts:197:  const parentFolderWebUrl = await getDriveItemWebUrl({
./lib/documents/graphWorkingDocuments.ts:204:    parentFolderWebUrl,
./lib/documents/graphWorkingDocuments.ts:216:    parentFolderWebUrl,
./lib/documents/graphWorkingDocuments.ts:395:  const parentFolderWebUrl = await getDriveItemWebUrl({
./lib/documents/graphWorkingDocuments.ts:401:    parentFolderWebUrl,
./lib/documents/graphWorkingDocuments.ts:414:    parentFolderWebUrl,
./docs/adr/0001-clio-single-master-storage.md:45:## Lazy Folder Creation
./prisma/schema.prisma:25:  sharedFolderPath            String
./prisma/schema.prisma:649:  folderId                 String?
./prisma/schema.prisma:708:  folderId                 String?
./app/admin/backup-restore/page.tsx:46:      backsUpActualDocumentFolders?: boolean;
./app/admin/backup-restore/page.tsx:219:      backsUpActualDocumentFolders?: boolean;
./app/admin/backup-restore/page.tsx:418:    ["Backs up actual document folders", baseline?.manifest?.documentFilePolicy?.backsUpActualDocumentFolders ?? "", comparison?.manifest?.documentFilePolicy?.backsUpActualDocumentFolders ?? ""],
./app/admin/backup-restore/page.tsx:1956:                        detailRow("Backs up actual document folders", passFail(detailBackup.manifest?.documentFilePolicy?.backsUpActualDocumentFolders)),
./lib/graph/emailPersistence.ts:313:  folderId?: string | null;
./lib/graph/emailPersistence.ts:528:        folderId: clean(message.folderId) || null,
./lib/graph/emailPersistence.ts:562:        folderId: clean(message.folderId) || null,
./app/api/admin/backups/status/route.ts:53:    backsUpActualDocumentFolders?: boolean;
./app/api/graph/thread-sync-preview/route.ts:41:      "parentFolderId",
./app/api/graph/thread-sync-preview/route.ts:74:    folderId: clean(message?.parentFolderId) || null,
./app/api/graph/thread-sync/route.ts:54:      "parentFolderId",
./app/api/graph/thread-sync/route.ts:87:    folderId: clean(message?.parentFolderId) || null,
./prisma/migrations/20260424191943_init_postgres/migration.sql:19:    "sharedFolderPath" TEXT NOT NULL,
./app/api/lawsuits/local-generation-create/route.ts:431:          sharedFolderPath: "",
./app/api/documents/finalize-preview/route.ts:437:        noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalize-preview/route.ts:456:          noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalization-history/route.ts:507:        noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalization-history/route.ts:522:          noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/packet/route.ts:223:      sharedFolderPath: true,
./app/api/documents/packet/route.ts:539:          sharedFolderPath: lawsuit.sharedFolderPath,
./app/api/documents/print-queue/route.ts:232:        noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:245:          noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:274:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:291:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:430:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:520:        noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:533:          noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:559:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:578:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:597:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:619:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:658:        noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue/route.ts:672:          noOneDriveOrSharePointFoldersCreated: true,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:49:    "folderId" TEXT,
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql:92:    "folderId" TEXT,
./app/api/documents/print-queue-preview/route.ts:315:        noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/print-queue-preview/route.ts:332:          noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalize/route.ts:229:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalize/route.ts:268:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalize/route.ts:374:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalize/route.ts:392:            noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalize/route.ts:494:        noOneDriveOrSharePointFoldersCreated: true,
./app/api/documents/finalize/route.ts:511:          noOneDriveOrSharePointFoldersCreated: true,
./scripts/verify-dedicated-mac-backup-readiness.mjs:153:      ["documentFilePolicy.backsUpActualDocumentFolders", manifest.documentFilePolicy?.backsUpActualDocumentFolders, false],
./scripts/verify-admin-backup-prisma-model-archive-coverage.mjs:97:  backsUpActualDocumentFolders: false,
./scripts/backup-local-indexes.mjs:345:      backsUpActualDocumentFolders: false,
./scripts/verify-dropbox-backup-mirror-safety.mjs:110:    ["documentFilePolicy.backsUpActualDocumentFolders", manifest.documentFilePolicy?.backsUpActualDocumentFolders, false],
./scripts/restore-local-indexes-preview.mjs:50:console.log(`BACKS_UP_ACTUAL_DOCUMENT_FOLDERS=${manifest.documentFilePolicy?.backsUpActualDocumentFolders ? 'YES' : 'NO'}`);
```

## Template references

```text
./package.json:39:    "verify:admin-custom-template-import-ui-safety": "node scripts/verify-admin-custom-template-import-ui-safety.mjs",
./package.json:41:    "verify:admin-document-template-import-ui-safety": "node scripts/verify-admin-document-template-import-ui-safety.mjs",
./package.json:42:    "verify:admin-document-template-repository-page": "node scripts/verify-admin-document-template-repository-page.mjs",
./package.json:56:    "verify:admin-template-custom-import-demoted-safety": "node scripts/verify-admin-template-custom-import-demoted-safety.mjs",
./package.json:57:    "verify:admin-template-file-placeholder-ui-safety": "node scripts/verify-admin-template-file-placeholder-ui-safety.mjs",
./package.json:58:    "verify:admin-template-merge-field-visibility-display": "node scripts/verify-admin-template-merge-field-visibility-display.mjs",
./package.json:59:    "verify:admin-template-merge-field-visibility-filter": "node scripts/verify-admin-template-merge-field-visibility-filter.mjs",
./package.json:141:    "verify:document-template-db-schema-foundation": "node scripts/verify-document-template-db-schema-foundation.mjs",
./package.json:142:    "verify:document-template-detail-workflow-safety": "node scripts/verify-document-template-detail-workflow-safety.mjs",
./package.json:143:    "verify:document-template-import-routes-safety": "node scripts/verify-document-template-import-routes-safety.mjs",
./package.json:144:    "verify:document-template-merge-field-visibility-safety": "node scripts/verify-document-template-merge-field-visibility-safety.mjs",
./package.json:145:    "verify:document-template-replacement-versioning-safety": "node scripts/verify-document-template-replacement-versioning-safety.mjs",
./package.json:146:    "verify:document-template-repository-api-foundation": "node scripts/verify-document-template-repository-api-foundation.mjs",
./package.json:147:    "verify:document-templates-browser-history-safety": "node scripts/verify-document-templates-browser-history-safety.mjs",
./package.json:211:    "verify:placeholder-document-template-labels-safety": "node scripts/verify-placeholder-document-template-labels-safety.mjs",
./prisma/schema.prisma:873:model DocumentTemplate {
./prisma/schema.prisma:889:  versions              DocumentTemplateVersion[]
./prisma/schema.prisma:890:  mergeFields           DocumentTemplateMergeField[]
./prisma/schema.prisma:896:model DocumentTemplateVersion {
./prisma/schema.prisma:898:  templateId    String
./prisma/schema.prisma:901:  bodyFormat    String           @default("docx-template")
./prisma/schema.prisma:908:  template      DocumentTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
./prisma/schema.prisma:910:  @@unique([templateId, versionNumber])
./prisma/schema.prisma:911:  @@index([templateId])
./prisma/schema.prisma:915:model DocumentTemplateMergeField {
./prisma/schema.prisma:917:  templateId   String
./prisma/schema.prisma:927:  template     DocumentTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
./prisma/schema.prisma:929:  @@unique([templateId, key])
./prisma/schema.prisma:930:  @@index([templateId])
./README.md:34:The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
./package-lock.json:88:        "@babel/template": "^7.28.6",
./package-lock.json:219:        "@babel/template": "^7.28.6",
./package-lock.json:242:    "node_modules/@babel/template": {
./package-lock.json:244:      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.28.6.tgz",
./package-lock.json:268:        "@babel/template": "^7.28.6",
./package-lock.json:4293:    "node_modules/expand-template": {
./package-lock.json:4295:      "resolved": "https://registry.npmjs.org/expand-template/-/expand-template-2.0.3.tgz",
./package-lock.json:6770:        "expand-template": "^2.0.3",
./docs/implementation/clio-storage-refactor-phase1-checklist.md:8:- [ ] Templates remain exclusively in BM.
./docs/dedicated-mac-secrets-inventory-template.md:1:# Barsh Matters Dedicated Mac Secrets Inventory Template
./app/admin/document-readiness/audit/page.tsx:83:    localDocumentTemplateCount: number;
./app/admin/document-readiness/audit/page.tsx:84:    localDocumentTemplateVersionCount: number;
./app/admin/document-readiness/audit/page.tsx:85:    localDocumentTemplateMergeFieldCount: number;
./app/admin/document-readiness/audit/page.tsx:386:            adversary attorney details, linked child matter fields, master Clio shell mapping, and local template/finalization
./app/admin/document-readiness/audit/page.tsx:423:            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
./app/admin/document-readiness/audit/page.tsx:426:              <SummaryCard label="Template versions" value={result.summary?.localDocumentTemplateVersionCount ?? 0} note={`${result.summary?.localDocumentTemplateCount ?? 0} templates`} />
./app/admin/document-readiness/audit/page.tsx:433:            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
./lib/documents/artifactContract.ts:1:export type BarshDocumentTemplateSource =
./lib/documents/artifactContract.ts:3:  | "template-repository-db"
./lib/documents/artifactContract.ts:4:  | "uploaded-production-template"
./lib/documents/artifactContract.ts:10:  | "template-repository-generated-docx-route"
./lib/documents/artifactContract.ts:26:  templateSource: BarshDocumentTemplateSource;
./lib/documents/artifactContract.ts:27:  templateKey: string;
./lib/documents/artifactContract.ts:28:  templateLabel?: string | null;
./lib/documents/artifactContract.ts:29:  templateId?: string | null;
./lib/documents/artifactContract.ts:30:  templateVersionId?: string | null;
./lib/documents/artifactContract.ts:31:  productionTemplateReady?: boolean;
./lib/documents/artifactContract.ts:58:  const templateSource = input.templateSource || "unknown";
./lib/documents/artifactContract.ts:63:  const productionTemplateReady = Boolean(input.productionTemplateReady);
./lib/documents/artifactContract.ts:70:    templateSource,
./lib/documents/artifactContract.ts:71:    templateKey: clean(input.templateKey),
./lib/documents/artifactContract.ts:72:    templateLabel: clean(input.templateLabel),
./lib/documents/artifactContract.ts:73:    templateId: clean(input.templateId) || null,
./lib/documents/artifactContract.ts:74:    templateVersionId: clean(input.templateVersionId) || null,
./lib/documents/artifactContract.ts:75:    productionTemplateReady,
./lib/documents/artifactContract.ts:100:      placeholderOnly: templateSource === "placeholder-seeded" || !finalProductionDocument,
./lib/documents/artifactContract.ts:102:      noProductionTemplatePretended: !productionTemplateReady || !finalProductionDocument,
./lib/documents/artifactContract.ts:116:  templateKey: string;
./lib/documents/artifactContract.ts:117:  templateLabel?: string | null;
./lib/documents/artifactContract.ts:126:    templateSource: "placeholder-seeded",
./lib/documents/artifactContract.ts:127:    templateKey: input.templateKey,
./lib/documents/artifactContract.ts:128:    templateLabel: input.templateLabel,
./lib/documents/artifactContract.ts:129:    productionTemplateReady: false,
./lib/documents/artifactContract.ts:144:      "Placeholder-seeded DOCX route artifact for testing document workflow. This is not a final production template/document.",
./lib/documents/artifactContract.ts:149:export function buildTemplateRepositoryDocxRouteArtifact(input: {
./lib/documents/artifactContract.ts:151:  templateKey: string;
./lib/documents/artifactContract.ts:152:  templateLabel?: string | null;
./lib/documents/artifactContract.ts:153:  templateId?: string | null;
./lib/documents/artifactContract.ts:154:  templateVersionId?: string | null;
./lib/documents/artifactContract.ts:155:  productionTemplateReady: boolean;
./lib/documents/artifactContract.ts:163:    artifactKind: "template-repository-generated-docx-route",
./lib/documents/artifactContract.ts:165:    templateSource: "template-repository-db",
./lib/documents/artifactContract.ts:166:    templateKey: input.templateKey,
./lib/documents/artifactContract.ts:167:    templateLabel: input.templateLabel,
./lib/documents/artifactContract.ts:168:    templateId: input.templateId,
./lib/documents/artifactContract.ts:169:    templateVersionId: input.templateVersionId,
./lib/documents/artifactContract.ts:170:    productionTemplateReady: input.productionTemplateReady,
./lib/documents/artifactContract.ts:186:        ? "Template repository DOCX route artifact from a production-ready template."
./lib/documents/artifactContract.ts:187:        : "Template repository DOCX route artifact from a non-production or draft template.",
./lib/documents/templateRegistry.ts:1:export type BarshDocumentTemplateCategory =
./lib/documents/templateRegistry.ts:16:export type BarshDocumentTemplateDefinition = {
./lib/documents/templateRegistry.ts:19:  category: BarshDocumentTemplateCategory;
./lib/documents/templateRegistry.ts:32:export const SETTLEMENT_DOCUMENT_TEMPLATES: BarshDocumentTemplateDefinition[] = [
./lib/documents/templateRegistry.ts:181:export function mergeFieldsForTemplate(template: BarshDocumentTemplateDefinition) {
./lib/documents/templateRegistry.ts:182:  if (template.mergeFieldSet === "settlement") return SETTLEMENT_MERGE_FIELDS;
./lib/documents/templateRegistry.ts:186:export function documentTemplatesForCategory(category?: BarshDocumentTemplateCategory | "all") {
./lib/documents/templateRegistry.ts:187:  const allTemplates = [
./lib/documents/templateRegistry.ts:191:  return allTemplates.filter((template) => {
./lib/documents/templateRegistry.ts:192:    if (!template.enabled) return false;
./lib/documents/templateRegistry.ts:194:    return template.category === category;
./lib/documents/templateRegistry.ts:198:export function templateRepositoryRecords(category?: BarshDocumentTemplateCategory | "all") {
./lib/documents/templateRegistry.ts:199:  return documentTemplatesForCategory(category).map((template) => ({
./lib/documents/templateRegistry.ts:200:    ...template,
./lib/documents/templateRegistry.ts:202:    repositoryStatus: "seed-template",
./lib/documents/templateRegistry.ts:204:    editableLater: template.editableInRepository,
./lib/documents/templateRegistry.ts:205:    mergeFields: mergeFieldsForTemplate(template),
./lib/documents/templateRegistry.ts:209:export function enabledSettlementDocumentTemplates() {
./lib/documents/templateRegistry.ts:210:  return SETTLEMENT_DOCUMENT_TEMPLATES.filter((template) => template.enabled);
./lib/documents/templateRegistry.ts:222:  return enabledSettlementDocumentTemplates().map((template) => ({
./lib/documents/templateRegistry.ts:223:    key: template.key,
./lib/documents/templateRegistry.ts:224:    label: template.label,
./lib/documents/templateRegistry.ts:225:    description: template.description,
./lib/documents/templateRegistry.ts:226:    filename: `${baseName} - ${template.defaultFilenameSuffix}.docx`,
./lib/documents/templateRegistry.ts:227:    status: ready ? "ready-local-settlement-template-docx" : "blocked",
./lib/documents/templateRegistry.ts:230:    sourceEndpoint: `${template.generationEndpoint}?masterLawsuitId=${encodedMasterLawsuitId}`,
./lib/documents/templateRegistry.ts:231:    generationEndpoint: template.generationEndpoint,
./lib/documents/templateRegistry.ts:233:    category: template.category,
./lib/documents/templateRegistry.ts:234:    outputFormat: template.outputFormat,
./lib/documents/templateRegistry.ts:235:    sourceOfTruth: template.sourceOfTruth,
./lib/documents/templateRegistry.ts:236:    requiresFinalizationBeforeDelivery: template.requiresFinalizationBeforeDelivery,
./lib/documents/templateRegistry.ts:237:    mergeFieldSet: template.mergeFieldSet,
./lib/documents/templateRegistry.ts:238:    templateRepositorySource: "barsh-matters-code-registry",
./lib/documents/templateRegistry.ts:239:    templateRepositoryFuture: "database-backed editable template repository",
./docs/adr/0001-clio-single-master-storage.md:9:That structure is unnecessary because Clio is not the user-facing system and is not being used for billing, permissions, account/provider management, deadlines, templates, or matter-level workflows. Ordinary users do not access Clio directly. Users access documents through the Barsh Matters UI. Barsh Matters controls matter access, document visibility, templates, generated documents, scans, uploaded emails, and user permissions.
./docs/adr/0001-clio-single-master-storage.md:12:Barsh Matters will use one manually created Clio master matter/file as the document repository for the Barsh Matters project. Barsh Matters will automatically create bucket folders under that master Clio matter. Each bucket will contain individual BM folders. Each BM matter will have one flat Clio folder containing generated documents, scans, uploaded emails, attachments, and other matter-specific documents. Templates will remain exclusively in Barsh Matters. Clio will store only generated or uploaded matter documents.
./docs/adr/0001-clio-single-master-storage.md:38:6. Clio does not store templates.
./docs/dedicated-mac-backup-restore-handoff.md:17:The PostgreSQL backup is expected to restore local Barsh Matters data, including ClaimIndex, lawsuits, payment records, settlement records, ticklers, audit/history, reference data, email/maildrop metadata, document-template rows, and local document workflow metadata.
./app/matters/page.tsx:1226:  const [masterDocumentTemplateQuery, setMasterDocumentTemplateQuery] = useState("");
./app/matters/page.tsx:1227:  const [masterSelectedDocumentTemplateKey, setMasterSelectedDocumentTemplateKey] = useState("");
./app/matters/page.tsx:1231:  const [masterDocumentRepositoryTemplates, setMasterDocumentRepositoryTemplates] = useState<any[]>([]);
./app/matters/page.tsx:1232:  const [masterDocumentRepositoryTemplatesLoading, setMasterDocumentRepositoryTemplatesLoading] = useState(false);
./app/matters/page.tsx:1233:  const [masterDocumentRepositoryTemplatesError, setMasterDocumentRepositoryTemplatesError] = useState("");
./app/matters/page.tsx:1279:    async function loadMasterDocumentRepositoryTemplates() {
./app/matters/page.tsx:1280:      setMasterDocumentRepositoryTemplatesLoading(true);
./app/matters/page.tsx:1281:      setMasterDocumentRepositoryTemplatesError("");
./app/matters/page.tsx:1284:        const response = await fetch(`/api/documents/templates?ts=${Date.now()}`, { cache: "no-store" });
./app/matters/page.tsx:1288:          throw new Error(json?.error || "Document-template repository lookup failed.");
./app/matters/page.tsx:1291:        const templates =
./app/matters/page.tsx:1292:          Array.isArray(json.templates) ? json.templates :
./app/matters/page.tsx:1293:          Array.isArray(json.documentTemplates) ? json.documentTemplates :
./app/matters/page.tsx:1300:          setMasterDocumentRepositoryTemplates(templates);
./app/matters/page.tsx:1304:          setMasterDocumentRepositoryTemplates([]);
./app/matters/page.tsx:1305:          setMasterDocumentRepositoryTemplatesError(error?.message || String(error));
./app/matters/page.tsx:1309:          setMasterDocumentRepositoryTemplatesLoading(false);
./app/matters/page.tsx:1314:    loadMasterDocumentRepositoryTemplates();
./app/matters/page.tsx:2806:        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, minWidth: 0 }}>
./app/matters/page.tsx:2812:        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, minWidth: 0 }}>
./app/matters/page.tsx:3227:              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matters/page.tsx:3272:                gridTemplateColumns: "170px 170px 150px 1fr",
./app/matters/page.tsx:3302:                    gridTemplateColumns: "170px 170px 150px 1fr",
./app/matters/page.tsx:4864:  async function loadMasterDocumentRepositoryTemplates(options?: { mode?: "lawsuit" | "settlement" }) {
./app/matters/page.tsx:4868:    setMasterDocumentRepositoryTemplatesLoading(true);
./app/matters/page.tsx:4869:    setMasterDocumentRepositoryTemplatesError("");
./app/matters/page.tsx:4872:      const response = await fetch(`/api/documents/templates?category=${encodeURIComponent(category)}`);
./app/matters/page.tsx:4876:        throw new Error(json?.error || "Document template repository preview failed.");
./app/matters/page.tsx:4879:      setMasterDocumentRepositoryTemplates(Array.isArray(json.templates) ? json.templates : []);
./app/matters/page.tsx:4881:      setMasterDocumentRepositoryTemplates([]);
./app/matters/page.tsx:4882:      setMasterDocumentRepositoryTemplatesError(error?.message || "Document template repository preview failed.");
./app/matters/page.tsx:4884:      setMasterDocumentRepositoryTemplatesLoading(false);
./app/matters/page.tsx:4894:    setMasterDocumentTemplateQuery("");
./app/matters/page.tsx:4895:    setMasterSelectedDocumentTemplateKey("");
./app/matters/page.tsx:4905:      loadMasterDocumentRepositoryTemplates({ mode }),
./app/matters/page.tsx:4909:  function buildMasterDocumentDeliveryContext(selectedTemplate: { key: string; label: string; description: string } | null): DocumentDeliveryContext {
./app/matters/page.tsx:4915:    const templateFields = documentData?.templateFields || {};
./app/matters/page.tsx:4925:    const documentLabel = selectedTemplate?.label || "Document";
./app/matters/page.tsx:4929:      masterDocumentPreviewText(templateFields.masterLawsuitId) ||
./app/matters/page.tsx:4934:      : masterDocumentPreviewText(templateFields.providerName || claimIndexFields.providerName);
./app/matters/page.tsx:4937:      : masterDocumentPreviewText(templateFields.patientName || claimIndexFields.patientName);
./app/matters/page.tsx:4940:      : masterDocumentPreviewText(templateFields.insurerName || claimIndexFields.insurerName);
./app/matters/page.tsx:4944:      documentKey: selectedTemplate?.key || (isSettlementDocumentMode ? "settlement-document" : "master-lawsuit-document"),
./app/matters/page.tsx:4949:      indexNumber: masterDocumentPreviewText(templateFields.indexAaaNumber || uiFields.indexAaaNumber),
./app/matters/page.tsx:5224:  async function launchMasterDocumentEmail(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:5230:      const baseContext = buildMasterDocumentDeliveryContext(selectedTemplate);
./app/matters/page.tsx:5231:      const { selectedCandidate } = await loadSelectedMasterFinalizedDocumentCandidate(selectedTemplate);
./app/matters/page.tsx:5251:          documentLabel: selectedTemplate?.label || "Document",
./app/matters/page.tsx:5274:        documentLabel: context.documentLabel || selectedTemplate?.label || "Document",
./app/matters/page.tsx:5326:            `Document: ${context.documentLabel || selectedTemplate?.label || "Document"}\n` +
./app/matters/page.tsx:5367:        context: buildMasterDocumentDeliveryContext(selectedTemplate),
./app/matters/page.tsx:5368:        documentLabel: selectedTemplate?.label || "Document",
./app/matters/page.tsx:5436:  async function loadSelectedMasterFinalizedDocumentCandidate(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:5462:    const selectedKey = String(selectedTemplate?.key || "").trim().toLowerCase();
./app/matters/page.tsx:5463:    const selectedLabel = String(selectedTemplate?.label || "").trim().toLowerCase();
./app/matters/page.tsx:5519:  async function launchMasterDocumentEdit(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:5522:        await loadSelectedMasterFinalizedDocumentCandidate(selectedTemplate);
./app/matters/page.tsx:5531:      const filename = String(selectedCandidate?.filename || selectedCandidate?.clioDocumentName || selectedTemplate?.label || "Document");
./app/matters/page.tsx:5564:          selectedTemplate?.label ||
./app/matters/page.tsx:5695:  async function saveMasterSettlementDocumentLocally(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:5697:    const context = buildMasterDocumentDeliveryContext(selectedTemplate);
./app/matters/page.tsx:5764:  async function launchMasterDocumentPrint(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:5766:    const context = buildMasterDocumentDeliveryContext(selectedTemplate);
./app/matters/page.tsx:5838:        await loadSelectedMasterFinalizedDocumentCandidate(selectedTemplate);
./app/matters/page.tsx:5876:          selectedTemplate?.label ||
./app/matters/page.tsx:6034:  function masterGeneratedDocumentRouteForTemplate(selectedTemplate: { key: string; label: string; description: string } | null): string {
./app/matters/page.tsx:6037:    if (!masterLawsuitId || !selectedTemplate?.key) return "";
./app/matters/page.tsx:6043:    if (selectedTemplate.key === "bill-schedule") {
./app/matters/page.tsx:6047:    if (selectedTemplate.key === "packet-summary") {
./app/matters/page.tsx:6051:    if (selectedTemplate.key === "summons-complaint") {
./app/matters/page.tsx:6058:  async function launchMasterStep2GeneratedDocumentEdit(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:6061:    if (!masterLawsuitId || !selectedTemplate?.key) {
./app/matters/page.tsx:6084:          documentKeys: [selectedTemplate.key],
./app/matters/page.tsx:6123:  async function launchMasterStep2PdfPreview(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:6124:    if (!selectedTemplate?.key) {
./app/matters/page.tsx:6187:            documentKeys: [selectedTemplate.key],
./app/matters/page.tsx:6217:          workingDocumentName: workingDocumentForPreview.name || selectedTemplate.label,
./app/matters/page.tsx:6218:          filename: workingDocumentForPreview.originalFilename || workingDocumentForPreview.name || selectedTemplate.label,
./app/matters/page.tsx:6245:  async function finalizeMasterDocumentFromStep2(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:6248:    if (!selectedTemplate?.key) {
./app/matters/page.tsx:6259:      await finalizeMasterSettlementDocumentPlaceholder(selectedTemplate);
./app/matters/page.tsx:6275:        params.set("templateKey", selectedTemplate.key);
./app/matters/page.tsx:6276:        params.set("templateLabel", selectedTemplate.label || selectedTemplate.key);
./app/matters/page.tsx:6289:              key: selectedTemplate.key,
./app/matters/page.tsx:6290:              label: selectedTemplate.label,
./app/matters/page.tsx:6323:          documentKeys: [selectedTemplate.key],
./app/matters/page.tsx:6325:          workingDocumentKey: masterDocumentFinalizationResult?.selectedDocument?.key || selectedTemplate.key,
./app/matters/page.tsx:6369:  async function finalizeMasterSettlementDocumentPlaceholder(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:6370:    const context = buildMasterDocumentDeliveryContext(selectedTemplate);
./app/matters/page.tsx:6381:    if (!selectedTemplate?.key) {
./app/matters/page.tsx:6416:          templateKey: selectedTemplate.key,
./app/matters/page.tsx:6417:          templateLabel: selectedTemplate.label || context.documentLabel,
./app/matters/page.tsx:6422:          workingDocumentKey: masterDocumentFinalizationResult?.selectedDocument?.key || selectedTemplate.key,
./app/matters/page.tsx:6465:  async function sendMasterDocumentToPrintQueue(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matters/page.tsx:6467:    const context = buildMasterDocumentDeliveryContext(selectedTemplate);
./app/matters/page.tsx:6527:        "Document: " + (context.documentLabel || selectedTemplate?.label || "Selected finalized document(s)") + "\n\n" +
./app/matters/page.tsx:6878:            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matters/page.tsx:6902:          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8, marginBottom: 14, fontSize: 12 }}>
./app/matters/page.tsx:6926:                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8, fontSize: 12 }}>
./app/matters/page.tsx:6957:                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8, fontSize: 12 }}>
./app/matters/page.tsx:7110:                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, minWidth: 0 }}>
./app/matters/page.tsx:7220:    const templateFields = documentData?.templateFields || {};
./app/matters/page.tsx:7224:    const query = masterDocumentTemplateQuery.trim().toLowerCase();
./app/matters/page.tsx:7226:    const templateOptions = [
./app/matters/page.tsx:7244:    const sortedTemplateOptions = [...templateOptions].sort((a, b) => a.label.localeCompare(b.label));
./app/matters/page.tsx:7248:    const repositoryDocumentOptions = Array.isArray(masterDocumentRepositoryTemplates)
./app/matters/page.tsx:7249:      ? masterDocumentRepositoryTemplates.map((template: any) => {
./app/matters/page.tsx:7250:          const currentVersion = template?.currentVersion || null;
./app/matters/page.tsx:7254:            template?.storageKind === "db-docx-base64"
./app/matters/page.tsx:7257:            key: String(template?.key || ""),
./app/matters/page.tsx:7258:            label: String(template?.label || template?.key || "Document"),
./app/matters/page.tsx:7260:              template?.description ? String(template.description) : "",
./app/matters/page.tsx:7261:              hasStoredDocx ? `Stored DOCX: ${currentVersion?.storedDocxBytes || currentVersion?.sizeBytes || currentVersion?.fileSize || currentVersion?.contentLength || template?.storedDocxBytes || 0} bytes` : "",
./app/matters/page.tsx:7262:              template?.mergeFieldSet ? `Merge fields: ${template.mergeFieldSet}` : "",
./app/matters/page.tsx:7263:              template?.repositorySource ? `Repository: ${template.repositorySource}` : "Repository: Barsh Matters template repository",
./app/matters/page.tsx:7264:              template?.editableLater ? "Editable/versioned repository support planned." : "",
./app/matters/page.tsx:7266:            availableNow: template?.enabled !== false,
./app/matters/page.tsx:7267:            filename: template?.defaultFilenameSuffix ? `${template.defaultFilenameSuffix}.docx` : "",
./app/matters/page.tsx:7268:            repositorySource: template?.repositorySource || "barsh-matters-template-repository-api",
./app/matters/page.tsx:7269:            repositoryStatus: template?.repositoryStatus || "",
./app/matters/page.tsx:7272:            storedDocxBytes: currentVersion?.storedDocxBytes || currentVersion?.sizeBytes || currentVersion?.fileSize || currentVersion?.contentLength || template?.storedDocxBytes || 0,
./app/matters/page.tsx:7273:            templateSource: hasStoredDocx ? "barsh-matters-db-template-repository" : "barsh-matters-template-repository",
./app/matters/page.tsx:7274:            mergeFields: Array.isArray(template?.mergeFields) ? template.mergeFields : [],
./app/matters/page.tsx:7276:        }).filter((template: any) => template.key)
./app/matters/page.tsx:7298:    const displayedTemplateOptions = isSettlementDocumentMode
./app/matters/page.tsx:7302:          ...sortedTemplateOptions,
./app/matters/page.tsx:7304:    const filteredDisplayedTemplateOptions = displayedTemplateOptions.filter((option: any) => {
./app/matters/page.tsx:7309:    const displayedSelectedTemplate =
./app/matters/page.tsx:7310:      displayedTemplateOptions.find((option: any) => option.key === masterSelectedDocumentTemplateKey) ||
./app/matters/page.tsx:7311:      displayedTemplateOptions.find((option: any) => option.label.toLowerCase() === masterDocumentTemplateQuery.trim().toLowerCase()) ||
./app/matters/page.tsx:7314:    const selectedTemplate =
./app/matters/page.tsx:7315:      displayedSelectedTemplate || null;
./app/matters/page.tsx:7318:      Boolean(selectedTemplate) &&
./app/matters/page.tsx:7454:              gridTemplateColumns: "90px minmax(0, 1fr) 90px",
./app/matters/page.tsx:7517:                  Select the document template for this matter.
./app/matters/page.tsx:7520:                  <p style={{ margin: "6px 0 0", color: masterDocumentRepositoryTemplatesError ? "#991b1b" : "#64748b", lineHeight: 1.45, fontWeight: masterDocumentRepositoryTemplatesError ? 900 : 700 }}>
./app/matters/page.tsx:7521:                    {masterDocumentRepositoryTemplatesLoading
./app/matters/page.tsx:7522:                      ? "Loading document-template repository..."
./app/matters/page.tsx:7523:                      : masterDocumentRepositoryTemplatesError
./app/matters/page.tsx:7524:                        ? `Template repository warning: ${masterDocumentRepositoryTemplatesError}.  Falling back to the settlement preview document plan.`
./app/matters/page.tsx:7525:                        : "Template source: /api/documents/templates.  Settlement mode uses settlement templates; lawsuit mode loads all stored local DOCX templates first."}
./app/matters/page.tsx:7532:                  value={masterDocumentTemplateQuery}
./app/matters/page.tsx:7533:                  list="master-document-template-options"
./app/matters/page.tsx:7536:                    setMasterDocumentTemplateQuery(value);
./app/matters/page.tsx:7537:                    const match = displayedTemplateOptions.find(
./app/matters/page.tsx:7541:                      setMasterSelectedDocumentTemplateKey(match.key);
./app/matters/page.tsx:7544:                      setMasterSelectedDocumentTemplateKey("");
./app/matters/page.tsx:7548:                  placeholder="Select document template"
./app/matters/page.tsx:7559:                <datalist id="master-document-template-options">
./app/matters/page.tsx:7560:                  {displayedTemplateOptions.map((option: any) => (
./app/matters/page.tsx:7565:                {displayedSelectedTemplate && (
./app/matters/page.tsx:7576:                    <strong>Selected:</strong> {displayedSelectedTemplate.label}
./app/matters/page.tsx:7577:                    {displayedSelectedTemplate.hasStoredDocx && (
./app/matters/page.tsx:7582:                    <div style={{ marginTop: 4, color: "#475569" }}>{displayedSelectedTemplate.description}</div>
./app/matters/page.tsx:7586:                {displayedSelectedTemplate && masterDocumentWorkflowStage === "select" && (
./app/matters/page.tsx:7597:                {masterDocumentTemplateQuery.trim() && displayedTemplateOptions.length === 0 && (
./app/matters/page.tsx:7599:                    No matching document templates.
./app/matters/page.tsx:7665:                  {displayedSelectedTemplate
./app/matters/page.tsx:7666:                    ? `Selected: ${displayedSelectedTemplate?.label || "Selected document"}`
./app/matters/page.tsx:7674:                  () => launchMasterStep2PdfPreview(displayedSelectedTemplate),
./app/matters/page.tsx:7675:                  !displayedSelectedTemplate,
./app/matters/page.tsx:7676:                  !displayedSelectedTemplate ? "Select a document first." : "PDF preview will be enabled after PDF generation/conversion is wired."
./app/matters/page.tsx:7680:                  () => launchMasterStep2GeneratedDocumentEdit(displayedSelectedTemplate),
./app/matters/page.tsx:7681:                  !displayedSelectedTemplate,
./app/matters/page.tsx:7682:                  !displayedSelectedTemplate ? "Select a document first." : "Open the generated DOCX in Microsoft Word."
./app/matters/page.tsx:7686:                  () => finalizeMasterDocumentFromStep2(displayedSelectedTemplate),
./app/matters/page.tsx:7687:                  !displayedSelectedTemplate || masterFinalizeUploadLoading || masterDocumentFinalizing,
./app/matters/page.tsx:7688:                  !displayedSelectedTemplate ? "Select a document first." : "Finalize and upload the selected document to Clio."
./app/matters/page.tsx:7706:                    {actionButton(masterFinalizeUploadLoading || masterDocumentFinalizing ? "Finalizing..." : "Finalize Document", () => finalizeMasterDocumentFromStep2(displayedSelectedTemplate), masterFinalizeUploadLoading || masterDocumentFinalizing)}
./app/matters/page.tsx:7711:              {masterDocumentWorkflowStage === "edit" && displayedSelectedTemplate && (
./app/matters/page.tsx:7725:                    <strong>Working Word document:</strong> {masterDocumentFinalizationResult?.workingDocument?.name || displayedSelectedTemplate?.label || "Selected document"} was created in the Barsh Matters working-docs folder.  Use Word Web for editing.  Desktop Word remains available as an experimental option, but Word Web is the reliable editing path for this SharePoint/OneDrive working document.  Save your edits in Word Web, then return here and click Finalize Document.
./app/matters/page.tsx:7939:                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
./app/matters/page.tsx:8040:                        () => sendMasterDocumentToPrintQueue(displayedSelectedTemplate),
./app/matters/page.tsx:8045:                        () => saveMasterSettlementDocumentLocally(displayedSelectedTemplate),
./app/matters/page.tsx:8050:                        () => launchMasterDocumentPrint(displayedSelectedTemplate),
./app/matters/page.tsx:8112:                        () => launchMasterDocumentEmail(displayedSelectedTemplate),
./app/matters/page.tsx:8116:                      {actionButton("Print Document", () => launchMasterDocumentPrint(displayedSelectedTemplate), false, "Open the finalized PDF/printable document.")}
./app/matters/page.tsx:8117:                      {actionButton("Send to Print Queue", () => sendMasterDocumentToPrintQueue(displayedSelectedTemplate), false, "Send this finalized document to the shared Barsh Matters print queue.")}
./app/matters/page.tsx:8220:                <h3 style={{ margin: 0, fontSize: 16 }}>Template Data Review</h3>
./app/matters/page.tsx:8222:                  Read-only local data available for future Master Lawsuit templates.  It does not generate documents, upload documents, write to Clio, or change the print queue.
./app/matters/page.tsx:8237:                  {JSON.stringify({ templateFields, referenceData, documentData }, null, 2)}
./app/matters/page.tsx:8498:    const templateFields = documentData?.templateFields || {};
./app/matters/page.tsx:8506:    const query = masterDocumentTemplateQuery.trim().toLowerCase();
./app/matters/page.tsx:8507:    const templateOptions = [
./app/matters/page.tsx:8524:    const sortedTemplateOptions = [...templateOptions].sort((a, b) => a.label.localeCompare(b.label));
./app/matters/page.tsx:8525:    const repositoryDocumentOptions = Array.isArray(masterDocumentRepositoryTemplates)
./app/matters/page.tsx:8526:      ? masterDocumentRepositoryTemplates.map((template: any) => {
./app/matters/page.tsx:8527:          const currentVersion = template?.currentVersion || null;
./app/matters/page.tsx:8530:            key: String(template?.key || ""),
./app/matters/page.tsx:8531:            label: String(template?.label || template?.key || "Document"),
./app/matters/page.tsx:8533:              template?.description ? String(template.description) : "",
./app/matters/page.tsx:8535:              template?.mergeFieldSet ? `Merge fields: ${template.mergeFieldSet}` : "",
./app/matters/page.tsx:8536:              template?.repositorySource ? `Repository: ${template.repositorySource}` : "Repository: Barsh Matters template repository",
./app/matters/page.tsx:8541:            templateSource: hasStoredDocx ? "barsh-matters-db-template-repository" : "barsh-matters-template-repository",
./app/matters/page.tsx:8543:        }).filter((template: any) => template.key)
./app/matters/page.tsx:8559:    const displayedTemplateOptions = isSettlementDocumentMode
./app/matters/page.tsx:8563:          ...sortedTemplateOptions,
./app/matters/page.tsx:8565:    const displayedSelectedTemplate =
./app/matters/page.tsx:8566:      displayedTemplateOptions.find((option: any) => option.key === masterSelectedDocumentTemplateKey) ||
./app/matters/page.tsx:8567:      displayedTemplateOptions.find((option: any) => option.label.toLowerCase() === query) ||
./app/matters/page.tsx:8684:                  onClick={() => launchMasterDocumentEmail(displayedSelectedTemplate)}
./app/matters/page.tsx:8685:                  disabled={!displayedSelectedTemplate}
./app/matters/page.tsx:8686:                  title={!displayedSelectedTemplate ? "Select a document before opening delivery options." : undefined}
./app/matters/page.tsx:8687:                  style={displayedSelectedTemplate ? deliveryButtonStyle : pendingButtonStyle}
./app/matters/page.tsx:8694:                  onClick={() => launchMasterDocumentEdit(displayedSelectedTemplate)}
./app/matters/page.tsx:8695:                  disabled={!displayedSelectedTemplate}
./app/matters/page.tsx:8696:                  title={!displayedSelectedTemplate ? "Select a finalized document before editing." : undefined}
./app/matters/page.tsx:8697:                  style={displayedSelectedTemplate ? secondaryDeliveryButtonStyle : pendingButtonStyle}
./app/matters/page.tsx:8704:                  onClick={() => launchMasterDocumentPrint(displayedSelectedTemplate)}
./app/matters/page.tsx:8705:                  disabled={!displayedSelectedTemplate}
./app/matters/page.tsx:8706:                  title={!displayedSelectedTemplate ? "Select a finalized document before printing." : undefined}
./app/matters/page.tsx:8707:                  style={displayedSelectedTemplate ? secondaryDeliveryButtonStyle : pendingButtonStyle}
./app/matters/page.tsx:8714:                  onClick={() => sendMasterDocumentToPrintQueue(displayedSelectedTemplate)}
./app/matters/page.tsx:8715:                  disabled={!displayedSelectedTemplate || masterDocumentPrintQueueLoading}
./app/matters/page.tsx:8716:                  title={!displayedSelectedTemplate ? "Select a finalized document before sending it to the print queue." : undefined}
./app/matters/page.tsx:8717:                  style={displayedSelectedTemplate && !masterDocumentPrintQueueLoading ? secondaryDeliveryButtonStyle : pendingButtonStyle}
./app/matters/page.tsx:8789:                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
./app/matters/page.tsx:8793:                        <div><strong>Document:</strong> {previewState?.documentLabel || context?.documentLabel || displayedSelectedTemplate?.label || "Document"}</div>
./app/matters/page.tsx:8922:    const templateFields = documentData?.templateFields || {};
./app/matters/page.tsx:8943:            <h3 style={{ margin: 0, fontSize: 18 }}>Template Data Review</h3>
./app/matters/page.tsx:8945:              This is a read-only review of the data available for future Master Lawsuit templates.  It reads local Lawsuit metadata, ClaimIndex, and local reference data only.  It does not generate documents, upload documents, write to Clio, or change the print queue.
./app/matters/page.tsx:8979:                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
./app/matters/page.tsx:8986:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewText(templateFields.masterLawsuitId) || previewMasterLawsuitId || "—"}</div>
./app/matters/page.tsx:8989:                <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Ready for Templates</div>
./app/matters/page.tsx:8990:                <div style={{ fontWeight: 900 }}>{documentData.readyForTemplates ? "Yes" : "No"}</div>
./app/matters/page.tsx:9005:                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
./app/matters/page.tsx:9012:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewText(templateFields.providerName) || masterDocumentPreviewText(claimIndexFields.providerName) || "—"}</div>
./app/matters/page.tsx:9016:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewText(templateFields.patientName) || masterDocumentPreviewText(claimIndexFields.patientName) || "—"}</div>
./app/matters/page.tsx:9020:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewText(templateFields.insurerName) || masterDocumentPreviewText(claimIndexFields.insurerName) || "—"}</div>
./app/matters/page.tsx:9024:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewText(templateFields.claimNumber) || masterDocumentPreviewText(claimIndexFields.claimNumber) || "—"}</div>
./app/matters/page.tsx:9028:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewText(templateFields.courtName) || masterDocumentPreviewText(uiFields.courtName) || "—"}</div>
./app/matters/page.tsx:9032:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewText(templateFields.indexAaaNumber) || masterDocumentPreviewText(uiFields.indexAaaNumber) || "—"}</div>
./app/matters/page.tsx:9036:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewDate(templateFields.dateOfLoss || uiFields.dateOfLoss) || "—"}</div>
./app/matters/page.tsx:9040:                <div style={{ fontWeight: 900 }}>{masterDocumentPreviewDate(templateFields.dateFiled || uiFields.dateFiled) || "—"}</div>
./app/matters/page.tsx:9044:                <div style={{ fontWeight: 900 }}>{money(templateFields.courtCostsTotal ?? uiFields.courtCostsTotal)}</div>
./app/matters/page.tsx:9049:              <summary style={{ cursor: "pointer", fontWeight: 900 }}>Raw Template Fields</summary>
./app/matters/page.tsx:9051:                {JSON.stringify(templateFields, null, 2)}
./app/matters/page.tsx:9065:                {JSON.stringify(uiFields.selectedCourtDetails || templateFields.courtDetails || null, null, 2)}
./app/matters/page.tsx:9836:                  gridTemplateColumns: "minmax(0, 1fr) 520px",
./app/matters/page.tsx:9853:                      gridTemplateColumns: "minmax(0, 1fr) 680px",
./app/matters/page.tsx:9897:                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
./app/matters/page.tsx:10005:                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matters/page.tsx:10144:                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
./app/matters/page.tsx:10164:                                    gridTemplateColumns: "1fr auto",
./app/matters/page.tsx:10413:                        gridTemplateColumns: "1fr",
./app/matters/page.tsx:10521:                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matters/page.tsx:10633:                              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
./app/matters/page.tsx:10911:                            <div key={`master-payment-receipt-${receipt.sourceDisplayNumber || receipt.displayNumber}-${receipt.id}`} style={{ display: "grid", gridTemplateColumns: receipt.voided ? "1fr auto" : "1fr auto auto", gap: 6, padding: "8px 9px", border: receipt.voided ? "1px solid #fecaca" : "1px solid #dbe4f0", borderRadius: 12, background: receipt.voided ? "#fff7f7" : "#ffffff" }}>
./app/matters/page.tsx:11269:                      gridTemplateColumns: "32px minmax(0, 1fr) 32px",
./app/matters/page.tsx:11748:                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(130px, 1fr))", gap: 10 }}>
./app/matters/page.tsx:11941:                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "start" }}>
./app/matters/page.tsx:12039:                      gridTemplateColumns: "1fr 1fr 1fr",
./app/matters/page.tsx:12073:                            gridTemplateColumns: "0.65fr auto auto auto 0.85fr",
./app/matters/page.tsx:12271:                      gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
./app/matters/page.tsx:12481:                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
./app/matters/page.tsx:12511:                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
./app/matters/page.tsx:12544:                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
./app/matters/page.tsx:12868:                                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matters/page.tsx:12941:                      gridTemplateColumns: "38px minmax(0, 1fr) 38px",
./app/matters/page.tsx:12973:                      gridTemplateColumns: "1.25fr 1fr 1fr",
./app/matters/page.tsx:13124:                      gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1fr)",
./app/matters/page.tsx:13749:  gridTemplateColumns: "500px minmax(0, 1fr) 330px",
./app/matters/page.tsx:13838:  gridTemplateColumns: "minmax(0, 1fr) auto",
./app/matters/page.tsx:14053:  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
./app/matters/page.tsx:14200:  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
./app/matters/page.tsx:14291:  gridTemplateColumns: "1.25fr 0.75fr 0.75fr 0.85fr 0.85fr 0.75fr 1fr 1.25fr 1.2fr",
./app/matters/page.tsx:14408:  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
./lib/adminPermissions.ts:22:  | "admin.documentTemplates.view"
./lib/adminPermissions.ts:23:  | "admin.documentTemplates.manage"
./lib/adminPermissions.ts:77:  { key: "admin.documentTemplates.view", label: "Document Templates", description: "View document template repository records.", category: "Documents", defaultAdminAllowed: true },
./lib/adminPermissions.ts:78:  { key: "admin.documentTemplates.manage", label: "Manage Document Templates", description: "Import, replace, or manage document templates.", category: "Documents", defaultAdminAllowed: true },
./lib/adminPermissions.ts:104:  { pattern: "/admin/document-templates", permission: "admin.documentTemplates.view", accessType: "page", enforcementPlanned: false },
./lib/adminPermissions.ts:105:  { pattern: "/admin/document-templates/:key", permission: "admin.documentTemplates.view", accessType: "page", enforcementPlanned: false },
./app/admin/page.tsx:41:      "Read-only audit for document-generation readiness across local master metadata, child matter fields, templates, and final delivery prerequisites.",
./app/admin/page.tsx:90:    label: "Document Templates",
./app/admin/page.tsx:91:    href: "/admin/document-templates",
./app/admin/page.tsx:93:      "Read-only document-template repository view, including categories, repository source, versions, and merge fields.",
./app/admin/page.tsx:191:            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
./app/admin/readiness-dashboard/page.tsx:68:    description: "Master metadata, child matter fields, templates, finalization records, and delivery prerequisites.",
./app/admin/readiness-dashboard/page.tsx:71:    primaryMetricLabel: "Template versions",
./app/admin/readiness-dashboard/page.tsx:72:    primaryMetricKey: "localDocumentTemplateVersionCount",
./app/admin/readiness-dashboard/page.tsx:303:        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
./app/admin/readiness-dashboard/page.tsx:311:        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
./app/admin/readiness-dashboard/page.tsx:337:                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
./app/admin/document-templates/page.tsx:5:type TemplateCategory = "all" | "settlement" | "lawsuit" | "direct_matter" | "payment" | "general";
./app/admin/document-templates/page.tsx:7:type TemplateRecord = {
./app/admin/document-templates/page.tsx:39:    uploadedTemplateFile?: any;
./app/admin/document-templates/page.tsx:44:type TemplateApiResponse = {
./app/admin/document-templates/page.tsx:54:  templates?: TemplateRecord[];
./app/admin/document-templates/page.tsx:60:const categories: Array<{ key: TemplateCategory; label: string }> = [
./app/admin/document-templates/page.tsx:141:type TemplateVisibilityFilter = "all" | "visible_ui" | "hidden_internal" | "computed" | "system";
./app/admin/document-templates/page.tsx:143:type DocumentTemplateUrlState = {
./app/admin/document-templates/page.tsx:144:  category: TemplateCategory;
./app/admin/document-templates/page.tsx:145:  visibility: TemplateVisibilityFilter;
./app/admin/document-templates/page.tsx:148:function normalizeTemplateCategory(value: unknown): TemplateCategory {
./app/admin/document-templates/page.tsx:150:  return categories.some((item) => item.key === raw) ? (raw as TemplateCategory) : "settlement";
./app/admin/document-templates/page.tsx:153:function normalizeTemplateVisibility(value: unknown): TemplateVisibilityFilter {
./app/admin/document-templates/page.tsx:156:    ? (raw as TemplateVisibilityFilter)
./app/admin/document-templates/page.tsx:160:function documentTemplateStateFromUrl(): DocumentTemplateUrlState {
./app/admin/document-templates/page.tsx:168:    category: normalizeTemplateCategory(params.get("category")),
./app/admin/document-templates/page.tsx:169:    visibility: normalizeTemplateVisibility(params.get("visibility")),
./app/admin/document-templates/page.tsx:173:function documentTemplateUrlForState(state: DocumentTemplateUrlState) {
./app/admin/document-templates/page.tsx:179:  return params.toString() ? `/admin/document-templates?${params.toString()}` : "/admin/document-templates";
./app/admin/document-templates/page.tsx:182:export default function AdminDocumentTemplatesPage() {
./app/admin/document-templates/page.tsx:183:  const initialTemplateUrlState = documentTemplateStateFromUrl();
./app/admin/document-templates/page.tsx:184:  const [category, setCategoryState] = useState<TemplateCategory>(initialTemplateUrlState.category);
./app/admin/document-templates/page.tsx:185:  const [data, setData] = useState<TemplateApiResponse | null>(null);
./app/admin/document-templates/page.tsx:192:  const [mergeFieldVisibilityFilter, setMergeFieldVisibilityFilterState] = useState<TemplateVisibilityFilter>(initialTemplateUrlState.visibility);
./app/admin/document-templates/page.tsx:193:  const [customTemplateRowsText, setCustomTemplateRowsText] = useState(`[
./app/admin/document-templates/page.tsx:195:    "key": "harmless-stored-docx-test-template",
./app/admin/document-templates/page.tsx:196:    "label": "Example Production Template",
./app/admin/document-templates/page.tsx:198:    "description": "Harmless stored DOCX test-template metadata import with visible and hidden merge fields.",
./app/admin/document-templates/page.tsx:199:    "defaultFilenameSuffix": "Example Production Template",
./app/admin/document-templates/page.tsx:206:    "repositorySource": "barsh-matters-template-import",
./app/admin/document-templates/page.tsx:207:    "repositoryStatus": "draft-template-import",
./app/admin/document-templates/page.tsx:208:    "productionTemplateReady": false,
./app/admin/document-templates/page.tsx:211:      "templateSource": "template-repository-db",
./app/admin/document-templates/page.tsx:212:      "notes": "Replace this harmless test template with user-provided production template metadata."
./app/admin/document-templates/page.tsx:235:  const [customTemplatePreview, setCustomTemplatePreview] = useState<any>(null);
./app/admin/document-templates/page.tsx:236:  const [customTemplateConfirmResult, setCustomTemplateConfirmResult] = useState<any>(null);
./app/admin/document-templates/page.tsx:237:  const [customTemplateLoading, setCustomTemplateLoading] = useState(false);
./app/admin/document-templates/page.tsx:238:  const [customTemplateError, setCustomTemplateError] = useState("");
./app/admin/document-templates/page.tsx:239:  const [templateFilePlaceholder, setTemplateFilePlaceholder] = useState<any>(null);
./app/admin/document-templates/page.tsx:240:  const [templateFilePlaceholderError, setTemplateFilePlaceholderError] = useState("");
./app/admin/document-templates/page.tsx:243:  function pushDocumentTemplateUrl(nextState: DocumentTemplateUrlState) {
./app/admin/document-templates/page.tsx:246:    const nextUrl = documentTemplateUrlForState(nextState);
./app/admin/document-templates/page.tsx:250:      window.history.pushState({ barshMattersDocumentTemplates: true }, "", nextUrl);
./app/admin/document-templates/page.tsx:254:  function setCategory(categoryValue: TemplateCategory, options: { updateUrl?: boolean } = {}) {
./app/admin/document-templates/page.tsx:255:    const nextCategory = normalizeTemplateCategory(categoryValue);
./app/admin/document-templates/page.tsx:259:      pushDocumentTemplateUrl({ category: nextCategory, visibility: mergeFieldVisibilityFilter });
./app/admin/document-templates/page.tsx:263:  function setMergeFieldVisibilityFilter(value: TemplateVisibilityFilter, options: { updateUrl?: boolean } = {}) {
./app/admin/document-templates/page.tsx:264:    const nextVisibility = normalizeTemplateVisibility(value);
./app/admin/document-templates/page.tsx:268:      pushDocumentTemplateUrl({ category, visibility: nextVisibility });
./app/admin/document-templates/page.tsx:275:    function applyDocumentTemplateStateFromUrl() {
./app/admin/document-templates/page.tsx:276:      const urlState = documentTemplateStateFromUrl();
./app/admin/document-templates/page.tsx:279:      void loadTemplates(urlState.category);
./app/admin/document-templates/page.tsx:282:    applyDocumentTemplateStateFromUrl();
./app/admin/document-templates/page.tsx:283:    window.addEventListener("popstate", applyDocumentTemplateStateFromUrl);
./app/admin/document-templates/page.tsx:286:      window.removeEventListener("popstate", applyDocumentTemplateStateFromUrl);
./app/admin/document-templates/page.tsx:291:  async function loadTemplates(nextCategory = category) {
./app/admin/document-templates/page.tsx:296:      const response = await fetch(`/api/documents/templates?category=${encodeURIComponent(nextCategory)}`, {
./app/admin/document-templates/page.tsx:302:        throw new Error(json?.error || "Document template repository load failed.");
./app/admin/document-templates/page.tsx:308:      setError(err?.message || "Document template repository load failed.");
./app/admin/document-templates/page.tsx:315:  async function previewSeededTemplateImport() {
./app/admin/document-templates/page.tsx:322:      const response = await fetch("/api/documents/templates/import-preview", {
./app/admin/document-templates/page.tsx:334:        throw new Error(json?.error || "Could not preview seeded template import.");
./app/admin/document-templates/page.tsx:339:      setImportError(err?.message || "Could not preview seeded template import.");
./app/admin/document-templates/page.tsx:345:  async function confirmSeededTemplateImport() {
./app/admin/document-templates/page.tsx:347:      setImportError("Preview a valid seeded template import before confirming.");
./app/admin/document-templates/page.tsx:356:      const response = await fetch("/api/documents/templates/import-confirm", {
./app/admin/document-templates/page.tsx:369:        throw new Error(json?.error || "Could not confirm seeded template import.");
./app/admin/document-templates/page.tsx:373:      await loadTemplates(category);
./app/admin/document-templates/page.tsx:375:      setImportError(err?.message || "Could not confirm seeded template import.");
./app/admin/document-templates/page.tsx:381:  function applyTemplateFilePlaceholderToCustomJson(fileInfo: any) {
./app/admin/document-templates/page.tsx:382:    const rows = parseCustomTemplateRows();
./app/admin/document-templates/page.tsx:387:      key: firstRow.key || "uploaded-template-placeholder",
./app/admin/document-templates/page.tsx:388:      label: firstRow.label || fileInfo.baseName || fileInfo.name || "Uploaded Template Placeholder",
./app/admin/document-templates/page.tsx:390:      defaultFilenameSuffix: firstRow.defaultFilenameSuffix || fileInfo.baseName || "Uploaded Template Placeholder",
./app/admin/document-templates/page.tsx:395:      repositorySource: "barsh-matters-template-upload-db",
./app/admin/document-templates/page.tsx:396:      repositoryStatus: "uploaded-docx-template",
./app/admin/document-templates/page.tsx:397:      productionTemplateReady: false,
./app/admin/document-templates/page.tsx:401:        templateSource: "uploaded-production-template",
./app/admin/document-templates/page.tsx:404:        productionTemplateReady: false,
./app/admin/document-templates/page.tsx:406:        uploadedTemplateFile: fileInfo,
./app/admin/document-templates/page.tsx:407:        note: "DOCX file content is captured as base64 and stored in the local DocumentTemplateVersion.contentText field when confirmed.  This does not generate documents, upload to Clio, create drafts, send email, print, or queue documents.",
./app/admin/document-templates/page.tsx:412:    setCustomTemplateRowsText(JSON.stringify([nextRow], null, 2));
./app/admin/document-templates/page.tsx:413:    setCustomTemplatePreview(null);
./app/admin/document-templates/page.tsx:414:    setCustomTemplateConfirmResult(null);
./app/admin/document-templates/page.tsx:431:  async function handleTemplateFilePlaceholderChange(event: React.ChangeEvent<HTMLInputElement>) {
./app/admin/document-templates/page.tsx:432:    setTemplateFilePlaceholderError("");
./app/admin/document-templates/page.tsx:436:      setTemplateFilePlaceholder(null);
./app/admin/document-templates/page.tsx:443:      setTemplateFilePlaceholder(null);
./app/admin/document-templates/page.tsx:444:      setTemplateFilePlaceholderError("Use a .docx Word template file for this template-storage workflow.");
./app/admin/document-templates/page.tsx:467:      setTemplateFilePlaceholder(fileInfo);
./app/admin/document-templates/page.tsx:468:      applyTemplateFilePlaceholderToCustomJson(fileInfo);
./app/admin/document-templates/page.tsx:470:      setTemplateFilePlaceholder(null);
./app/admin/document-templates/page.tsx:471:      setTemplateFilePlaceholderError(error?.message || "Could not read the selected DOCX file.");
./app/admin/document-templates/page.tsx:475:  function parseCustomTemplateRows() {
./app/admin/document-templates/page.tsx:476:    const parsed = JSON.parse(customTemplateRowsText || "[]");
./app/admin/document-templates/page.tsx:478:      throw new Error("Template import JSON must be an array of template row objects.");
./app/admin/document-templates/page.tsx:485:      const uploadedTemplateFile = row?.metadata?.uploadedTemplateFile;
./app/admin/document-templates/page.tsx:486:      if (!uploadedTemplateFile?.contentBase64) return row;
./app/admin/document-templates/page.tsx:488:      const { contentBase64, ...safeUploadedTemplateFile } = uploadedTemplateFile;
./app/admin/document-templates/page.tsx:493:          uploadedTemplateFile: {
./app/admin/document-templates/page.tsx:494:            ...safeUploadedTemplateFile,
./app/admin/document-templates/page.tsx:496:            contentBase64Length: uploadedTemplateFile.contentBase64Length || contentBase64.length,
./app/admin/document-templates/page.tsx:503:  async function previewCustomTemplateRowsImport() {
./app/admin/document-templates/page.tsx:504:    setCustomTemplateLoading(true);
./app/admin/document-templates/page.tsx:505:    setCustomTemplateError("");
./app/admin/document-templates/page.tsx:506:    setCustomTemplatePreview(null);
./app/admin/document-templates/page.tsx:507:    setCustomTemplateConfirmResult(null);
./app/admin/document-templates/page.tsx:510:      const rows = parseCustomTemplateRows();
./app/admin/document-templates/page.tsx:518:      const response = await fetch("/api/documents/templates/import-preview", {
./app/admin/document-templates/page.tsx:536:            `Could not preview custom template import. Status ${response.status}. Preview payload ${previewPayloadBytes} bytes. Response: ${bodyPreview || "empty response"}`
./app/admin/document-templates/page.tsx:540:      setCustomTemplatePreview({
./app/admin/document-templates/page.tsx:548:      setCustomTemplateError(err?.message || "Could not preview custom template import. Check that the JSON is an array of template row objects.");
./app/admin/document-templates/page.tsx:550:      setCustomTemplateLoading(false);
./app/admin/document-templates/page.tsx:554:  async function confirmCustomTemplateRowsImport() {
./app/admin/document-templates/page.tsx:555:    if (!customTemplatePreview?.ok) {
./app/admin/document-templates/page.tsx:556:      setCustomTemplateError("Preview a valid custom template import before confirming.");
./app/admin/document-templates/page.tsx:560:    if (customTemplateConfirmBlocked) {
./app/admin/document-templates/page.tsx:561:      setCustomTemplateError(customTemplateConfirmBlockReason || "Custom import confirm is blocked for this payload. Use the Template Detail replacement workflow instead.");
./app/admin/document-templates/page.tsx:565:    setCustomTemplateLoading(true);
./app/admin/document-templates/page.tsx:566:    setCustomTemplateError("");
./app/admin/document-templates/page.tsx:567:    setCustomTemplateConfirmResult(null);
./app/admin/document-templates/page.tsx:570:      const rows = parseCustomTemplateRows();
./app/admin/document-templates/page.tsx:578:      const response = await fetch("/api/documents/templates/import-confirm", {
./app/admin/document-templates/page.tsx:596:            `Could not confirm custom template import. Status ${response.status}. Confirm payload ${confirmPayloadBytes} bytes. Response: ${bodyPreview || "empty response"}`
./app/admin/document-templates/page.tsx:600:      setCustomTemplateConfirmResult({
./app/admin/document-templates/page.tsx:607:      await loadTemplates(category);
./app/admin/document-templates/page.tsx:609:      setCustomTemplateError(err?.message || "Could not confirm custom template import. Check the response status and payload size.");
./app/admin/document-templates/page.tsx:611:      setCustomTemplateLoading(false);
./app/admin/document-templates/page.tsx:615:  const customTemplateConfirmPayloadBytes = byteLengthForText(JSON.stringify({
./app/admin/document-templates/page.tsx:619:        return parseCustomTemplateRows();
./app/admin/document-templates/page.tsx:626:  const customTemplateContainsStoredDocxBase64 = customImportContainsStoredDocxBase64(customTemplateRowsText);
./app/admin/document-templates/page.tsx:627:  const customTemplateConfirmBlocked =
./app/admin/document-templates/page.tsx:628:    customTemplateContainsStoredDocxBase64 ||
./app/admin/document-templates/page.tsx:629:    customTemplateConfirmPayloadBytes > ADVANCED_CUSTOM_IMPORT_CONFIRM_MAX_BYTES;
./app/admin/document-templates/page.tsx:630:  const customTemplateConfirmBlockReason = customTemplateContainsStoredDocxBase64
./app/admin/document-templates/page.tsx:631:    ? "Confirming base64-stored DOCX payloads through this legacy JSON importer is blocked. Use Open Template Detail → Replace Current DOCX Template instead."
./app/admin/document-templates/page.tsx:632:    : customTemplateConfirmPayloadBytes > ADVANCED_CUSTOM_IMPORT_CONFIRM_MAX_BYTES
./app/admin/document-templates/page.tsx:633:      ? `This legacy JSON import payload is too large (${customTemplateConfirmPayloadBytes} bytes). Use Open Template Detail → Replace Current DOCX Template instead.`
./app/admin/document-templates/page.tsx:636:  const templates = useMemo(() => (Array.isArray(data?.templates) ? data.templates : []), [data]);
./app/admin/document-templates/page.tsx:638:  function openStoredTemplateDocx(template: TemplateRecord) {
./app/admin/document-templates/page.tsx:639:    const versionId = template.currentVersion?.id;
./app/admin/document-templates/page.tsx:640:    if (!versionId || !template.currentVersion?.hasStoredDocx) return;
./app/admin/document-templates/page.tsx:641:    window.open(`/api/documents/templates/stored-docx?versionId=${encodeURIComponent(versionId)}`, "_blank", "noopener,noreferrer");
./app/admin/document-templates/page.tsx:654:      data-barsh-admin-document-template-repository="true"
./app/admin/document-templates/page.tsx:688:                Document Template Repository
./app/admin/document-templates/page.tsx:691:                Read-only admin view for document templates, categories, repository source, versions, and merge fields.  This page does not edit templates, seed templates, upload files, generate documents, send email, print, queue documents, or write to Clio.
./app/admin/document-templates/page.tsx:724:              onClick={() => loadTemplates(category)}
./app/admin/document-templates/page.tsx:760:            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
./app/admin/document-templates/page.tsx:768:            ["Template Count", String(data?.count ?? templates.length)],
./app/admin/document-templates/page.tsx:811:              <h2 style={{ margin: 0, fontSize: 20 }}>Templates</h2>
./app/admin/document-templates/page.tsx:820:              Loading document-template repository...
./app/admin/document-templates/page.tsx:833:            <h2 style={{ margin: "0 0 12px 0", fontSize: 20 }}>Seeded Template Import</h2>
./app/admin/document-templates/page.tsx:835:              Preview and confirm importing the current seeded document-template definitions into the local
./app/admin/document-templates/page.tsx:836:              Barsh Matters template repository.  Seeded definitions are placeholder/test templates only;
./app/admin/document-templates/page.tsx:837:              they are not final production templates and should later be replaced by user-provided production
./app/admin/document-templates/page.tsx:838:              templates.
./app/admin/document-templates/page.tsx:844:                onClick={previewSeededTemplateImport}
./app/admin/document-templates/page.tsx:860:                onClick={confirmSeededTemplateImport}
./app/admin/document-templates/page.tsx:887:              <strong>Placeholder warning:</strong> Current seeded templates are only workflow/testing
./app/admin/document-templates/page.tsx:888:              placeholders.  Confirming this import creates local DB template records, versions, and merge
./app/admin/document-templates/page.tsx:889:              fields, but it does not make them final production templates, generate documents, upload to
./app/admin/document-templates/page.tsx:923:                  <div><strong>Templates processed:</strong> {importConfirmResult.results?.length ?? 0}</div>
./app/admin/document-templates/page.tsx:934:            data-barsh-advanced-custom-template-import="true"
./app/admin/document-templates/page.tsx:945:                <h2 style={{ margin: "0 0 8px 0", fontSize: 20 }}>Advanced / Debug Template Row Import</h2>
./app/admin/document-templates/page.tsx:948:                  For normal template replacement, open a template detail page and use <strong>Replace Current DOCX Template</strong>.
./app/admin/document-templates/page.tsx:980:              Recommended production path: use <strong>Open Template Detail</strong> in the table below, then
./app/admin/document-templates/page.tsx:981:              <strong> Replace Current DOCX Template</strong>.  That creates a new version, preserves old versions,
./app/admin/document-templates/page.tsx:986:              <div data-barsh-advanced-custom-template-import-panel="true" style={{ marginTop: 14 }}>
./app/admin/document-templates/page.tsx:988:                  Paste JSON template rows to preview and confirm local DocumentTemplate, DocumentTemplateVersion,
./app/admin/document-templates/page.tsx:989:                  and DocumentTemplateMergeField records.  This supports both visible UI merge fields and hidden/internal
./app/admin/document-templates/page.tsx:1005:              <strong>Template DOCX Storage:</strong> Select a .docx file to capture the file content into the custom
./app/admin/document-templates/page.tsx:1006:              template JSON.  On confirmed import, the DOCX is stored locally in DocumentTemplateVersion.contentText
./app/admin/document-templates/page.tsx:1010:                  htmlFor="template-docx-storage-file-input"
./app/admin/document-templates/page.tsx:1027:                  Choose DOCX Template
./app/admin/document-templates/page.tsx:1030:                  {templateFilePlaceholder?.name || "No DOCX selected"}
./app/admin/document-templates/page.tsx:1033:                  id="template-docx-storage-file-input"
./app/admin/document-templates/page.tsx:1036:                  onChange={handleTemplateFilePlaceholderChange}
./app/admin/document-templates/page.tsx:1050:              {templateFilePlaceholderError && (
./app/admin/document-templates/page.tsx:1052:                  {templateFilePlaceholderError}
./app/admin/document-templates/page.tsx:1055:              {templateFilePlaceholder && (
./app/admin/document-templates/page.tsx:1057:                  <div><strong>File:</strong> {templateFilePlaceholder.name}</div>
./app/admin/document-templates/page.tsx:1058:                  <div><strong>Size:</strong> {templateFilePlaceholder.size} bytes</div>
./app/admin/document-templates/page.tsx:1059:                  <div><strong>Actual file stored:</strong> {String(Boolean(templateFilePlaceholder.actualFileStored))}</div>
./app/admin/document-templates/page.tsx:1060:                  <div><strong>Storage kind:</strong> {templateFilePlaceholder.storageKind}</div>
./app/admin/document-templates/page.tsx:1061:                  <div><strong>Base64 length:</strong> {templateFilePlaceholder.contentBase64Length ?? "—"}</div>
./app/admin/document-templates/page.tsx:1067:              value={customTemplateRowsText}
./app/admin/document-templates/page.tsx:1069:                setCustomTemplateRowsText(event.target.value);
./app/admin/document-templates/page.tsx:1070:                setCustomTemplatePreview(null);
./app/admin/document-templates/page.tsx:1071:                setCustomTemplateConfirmResult(null);
./app/admin/document-templates/page.tsx:1072:                setCustomTemplateError("");
./app/admin/document-templates/page.tsx:1091:                onClick={previewCustomTemplateRowsImport}
./app/admin/document-templates/page.tsx:1092:                disabled={customTemplateLoading}
./app/admin/document-templates/page.tsx:1095:                  background: customTemplateLoading ? "#dbeafe" : "#eff6ff",
./app/admin/document-templates/page.tsx:1100:                  cursor: customTemplateLoading ? "default" : "pointer",
./app/admin/document-templates/page.tsx:1103:                {customTemplateLoading ? "Working..." : "Preview Custom Import"}
./app/admin/document-templates/page.tsx:1107:                onClick={confirmCustomTemplateRowsImport}
./app/admin/document-templates/page.tsx:1108:                disabled={customTemplateLoading || !customTemplatePreview?.ok || customTemplateConfirmBlocked}
./app/admin/document-templates/page.tsx:1110:                  border: customTemplateLoading || !customTemplatePreview?.ok || customTemplateConfirmBlocked ? "1px solid #cbd5e1" : "1px solid #16a34a",
./app/admin/document-templates/page.tsx:1111:                  background: customTemplateLoading || !customTemplatePreview?.ok || customTemplateConfirmBlocked ? "#f1f5f9" : "#f0fdf4",
./app/admin/document-templates/page.tsx:1112:                  color: customTemplateLoading || !customTemplatePreview?.ok || customTemplateConfirmBlocked ? "#64748b" : "#166534",
./app/admin/document-templates/page.tsx:1116:                  cursor: customTemplateLoading || !customTemplatePreview?.ok || customTemplateConfirmBlocked ? "not-allowed" : "pointer",
./app/admin/document-templates/page.tsx:1123:            {customTemplateConfirmBlocked && (
./app/admin/document-templates/page.tsx:1125:                <strong>Advanced import confirm blocked:</strong> {customTemplateConfirmBlockReason}
./app/admin/document-templates/page.tsx:1127:                  Current estimated confirm payload: {customTemplateConfirmPayloadBytes} bytes.
./app/admin/document-templates/page.tsx:1132:            {customTemplateError && (
./app/admin/document-templates/page.tsx:1134:                {customTemplateError}
./app/admin/document-templates/page.tsx:1138:            {customTemplatePreview && (
./app/admin/document-templates/page.tsx:1139:              <div style={{ border: customTemplatePreview.ok ? "1px solid #bfdbfe" : "1px solid #fecaca", background: customTemplatePreview.ok ? "#eff6ff" : "#fef2f2", borderRadius: 14, padding: 12, marginBottom: 12 }}>
./app/admin/document-templates/page.tsx:1142:                  <div><strong>Rows:</strong> {customTemplatePreview.summary?.totalRows ?? 0}</div>
./app/admin/document-templates/page.tsx:1143:                  <div><strong>Valid:</strong> {customTemplatePreview.summary?.validRows ?? 0}</div>
./app/admin/document-templates/page.tsx:1144:                  <div><strong>Create:</strong> {customTemplatePreview.summary?.rowsToCreate ?? 0}</div>
./app/admin/document-templates/page.tsx:1145:                  <div><strong>Update:</strong> {customTemplatePreview.summary?.rowsToUpdate ?? 0}</div>
./app/admin/document-templates/page.tsx:1146:                  <div><strong>Production-ready rows:</strong> {customTemplatePreview.summary?.productionReadyRows ?? 0}</div>
./app/admin/document-templates/page.tsx:1147:                  <div><strong>Final production rows:</strong> {customTemplatePreview.summary?.finalProductionRows ?? 0}</div>
./app/admin/document-templates/page.tsx:1148:                  <div><strong>Visible UI merge fields:</strong> {customTemplatePreview.summary?.visibleMergeFields ?? 0}</div>
./app/admin/document-templates/page.tsx:1149:                  <div><strong>Hidden/internal merge fields:</strong> {customTemplatePreview.summary?.hiddenInternalMergeFields ?? 0}</div>
./app/admin/document-templates/page.tsx:1150:                  <div><strong>Computed merge fields:</strong> {customTemplatePreview.summary?.computedMergeFields ?? 0}</div>
./app/admin/document-templates/page.tsx:1151:                  <div><strong>System merge fields:</strong> {customTemplatePreview.summary?.systemMergeFields ?? 0}</div>
./app/admin/document-templates/page.tsx:1152:                  <div><strong>Database changed:</strong> {String(Boolean(customTemplatePreview.safety?.databaseRecordsChanged))}</div>
./app/admin/document-templates/page.tsx:1153:                  <div><strong>Preview payload bytes:</strong> {customTemplatePreview.clientPreviewDiagnostics?.previewPayloadBytes ?? "—"}</div>
./app/admin/document-templates/page.tsx:1154:                  <div><strong>Base64 omitted from preview:</strong> {String(Boolean(customTemplatePreview.clientPreviewDiagnostics?.base64OmittedFromPreview))}</div>
./app/admin/document-templates/page.tsx:1159:            {customTemplateConfirmResult && (
./app/admin/document-templates/page.tsx:1163:                  <div><strong>Templates processed:</strong> {customTemplateConfirmResult.results?.length ?? 0}</div>
./app/admin/document-templates/page.tsx:1164:                  <div><strong>Rows created:</strong> {customTemplateConfirmResult.summary?.rowsToCreate ?? 0}</div>
./app/admin/document-templates/page.tsx:1165:                  <div><strong>Rows updated:</strong> {customTemplateConfirmResult.summary?.rowsToUpdate ?? 0}</div>
./app/admin/document-templates/page.tsx:1166:                  <div><strong>Database changed:</strong> {String(Boolean(customTemplateConfirmResult.safety?.databaseRecordsChanged))}</div>
./app/admin/document-templates/page.tsx:1167:                  <div><strong>No Clio / email / print:</strong> {String(!customTemplateConfirmResult.safety?.clioRecordsChanged && !customTemplateConfirmResult.safety?.emailsSent && !customTemplateConfirmResult.safety?.printQueueChanged)}</div>
./app/admin/document-templates/page.tsx:1168:                  <div><strong>Confirm payload bytes:</strong> {customTemplateConfirmResult.clientConfirmDiagnostics?.confirmPayloadBytes ?? "—"}</div>
./app/admin/document-templates/page.tsx:1169:                  <div><strong>Includes base64 payload:</strong> {String(Boolean(customTemplateConfirmResult.clientConfirmDiagnostics?.includesBase64Payload))}</div>
./app/admin/document-templates/page.tsx:1177:          {!loading && templates.length === 0 && (
./app/admin/document-templates/page.tsx:1179:              No templates found for this category.
./app/admin/document-templates/page.tsx:1183:          {!loading && templates.length > 0 && (
./app/admin/document-templates/page.tsx:1226:          {!loading && templates.length > 0 && (
./app/admin/document-templates/page.tsx:1231:                    <th style={{ textAlign: "left", padding: "11px 12px", borderBottom: "1px solid #e5e7eb" }}>Template</th>
./app/admin/document-templates/page.tsx:1240:                  {templates.map((template) => {
./app/admin/document-templates/page.tsx:1241:                    const mergeFields = Array.isArray(template.mergeFields) ? template.mergeFields : [];
./app/admin/document-templates/page.tsx:1248:                      <tr key={template.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
./app/admin/document-templates/page.tsx:1250:                          <div style={{ fontWeight: 950 }}>{display(template.label)}</div>
./app/admin/document-templates/page.tsx:1251:                          <div style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>{display(template.key)}</div>
./app/admin/document-templates/page.tsx:1254:                              href={`/admin/document-templates/${encodeURIComponent(template.key)}`}
./app/admin/document-templates/page.tsx:1257:                              Open Template Detail
./app/admin/document-templates/page.tsx:1260:                          {template.description && (
./app/admin/document-templates/page.tsx:1262:                              {template.description}
./app/admin/document-templates/page.tsx:1266:                            <span style={statusBadgeStyle(template.enabled === false ? "warn" : "ok")}>
./app/admin/document-templates/page.tsx:1267:                              {template.enabled === false ? "Disabled" : "Enabled"}
./app/admin/document-templates/page.tsx:1269:                            <span style={statusBadgeStyle(template.editableNow ? "ok" : "neutral")}>
./app/admin/document-templates/page.tsx:1270:                              {template.editableNow ? "Editable now" : "Read-only now"}
./app/admin/document-templates/page.tsx:1272:                            {template.editableLater && (
./app/admin/document-templates/page.tsx:1278:                          {display(template.category)}
./app/admin/document-templates/page.tsx:1281:                          <div>{display(template.repositorySource)}</div>
./app/admin/document-templates/page.tsx:1283:                            {display(template.repositoryStatus)}
./app/admin/document-templates/page.tsx:1287:                          {template.currentVersion ? (
./app/admin/document-templates/page.tsx:1289:                              <div style={{ fontWeight: 900 }}>v{template.currentVersion.versionNumber}</div>
./app/admin/document-templates/page.tsx:1290:                              <div style={{ color: "#64748b", fontSize: 13 }}>{template.currentVersion.status}</div>
./app/admin/document-templates/page.tsx:1291:                              <div style={{ color: "#64748b", fontSize: 13 }}>{template.currentVersion.storageKind}</div>
./app/admin/document-templates/page.tsx:1292:                              {template.currentVersion.hasStoredDocx && (
./app/admin/document-templates/page.tsx:1295:                                    Stored DOCX · {template.currentVersion.storedDocxBytes || 0} bytes
./app/admin/document-templates/page.tsx:1299:                                    onClick={() => openStoredTemplateDocx(template)}
./app/admin/document-templates/page.tsx:1322:                          <div>{display(template.outputFormat)}</div>
./app/admin/document-templates/page.tsx:1324:                            {display(template.defaultFilenameSuffix)}
./app/admin/document-templates/page.tsx:1386:          <strong>Safety:</strong> This admin function is read-only.  The endpoint may read local database template records or fallback registry records, but it does not seed, edit, delete, upload, generate, email, print, queue, or write Clio data.
./lib/documents/templateImport.ts:2:  BarshDocumentTemplateCategory,
./lib/documents/templateImport.ts:3:  templateRepositoryRecords,
./lib/documents/templateImport.ts:4:} from "@/lib/documents/templateRegistry";
./lib/documents/templateImport.ts:6:export type TemplateMergeFieldVisibility =
./lib/documents/templateImport.ts:12:export type TemplateImportRow = {
./lib/documents/templateImport.ts:15:  category: BarshDocumentTemplateCategory;
./lib/documents/templateImport.ts:26:  productionTemplateReady?: boolean;
./lib/documents/templateImport.ts:36:    visibility?: TemplateMergeFieldVisibility;
./lib/documents/templateImport.ts:52:function category(value: unknown): BarshDocumentTemplateCategory {
./lib/documents/templateImport.ts:60:export function mergeFieldVisibility(value: unknown, fallback: TemplateMergeFieldVisibility = "visible_ui"): TemplateMergeFieldVisibility {
./lib/documents/templateImport.ts:85:export function safetyTemplateImportPreview() {
./lib/documents/templateImport.ts:87:    action: "document-template-import-preview",
./lib/documents/templateImport.ts:89:    sourceOfTruth: "barsh-matters-local-template-repository",
./lib/documents/templateImport.ts:92:    templateRepositoryWrites: false,
./lib/documents/templateImport.ts:98:    productionTemplateReadinessChanged: false,
./lib/documents/templateImport.ts:102:export function safetyTemplateImportConfirm(databaseRecordsChanged = true) {
./lib/documents/templateImport.ts:104:    action: "document-template-import-confirm",
./lib/documents/templateImport.ts:106:    sourceOfTruth: "barsh-matters-local-template-repository",
./lib/documents/templateImport.ts:109:    templateRepositoryWrites: databaseRecordsChanged,
./lib/documents/templateImport.ts:115:    productionTemplateReadinessChanged: databaseRecordsChanged,
./lib/documents/templateImport.ts:119:export function normalizeTemplateImportRows(inputRows: unknown[]): TemplateImportRow[] {
./lib/documents/templateImport.ts:134:      repositorySource: clean(row.repositorySource || row.repository_source || "barsh-matters-template-import"),
./lib/documents/templateImport.ts:135:      repositoryStatus: clean(row.repositoryStatus || row.repository_status || "imported-template"),
./lib/documents/templateImport.ts:136:      productionTemplateReady: bool(row.productionTemplateReady ?? row.production_template_ready, false),
./lib/documents/templateImport.ts:149:              source: clean(field.source || "manual-template-import"),
./lib/documents/templateImport.ts:154:                source: field.source || "manual-template-import",
./lib/documents/templateImport.ts:168:export function seededTemplateImportRows(category?: BarshDocumentTemplateCategory | "all"): TemplateImportRow[] {
./lib/documents/templateImport.ts:169:  return templateRepositoryRecords(category || "all").map((row: any) => ({
./lib/documents/templateImport.ts:183:    productionTemplateReady: false,
./lib/documents/templateImport.ts:186:      templateSource: "placeholder-seeded",
./lib/documents/templateImport.ts:187:      productionTemplateReady: false,
./lib/documents/templateImport.ts:189:      note: "Seeded placeholder template record. This is not a final production template/document.",
./lib/documents/templateImport.ts:205:export function buildTemplateImportPreview(params: {
./lib/documents/templateImport.ts:206:  rows: TemplateImportRow[];
./lib/documents/templateImport.ts:214:    if (!row.key) errors.push("Missing template key.");
./lib/documents/templateImport.ts:215:    if (!row.label) errors.push("Missing template label.");
./lib/documents/templateImport.ts:216:    if (seen.has(row.key)) errors.push("Duplicate template key in import payload.");
./lib/documents/templateImport.ts:217:    if (params.existingKeys.has(row.key)) warnings.push("Template key already exists and will be updated.");
./lib/documents/templateImport.ts:218:    if (row.finalProductionDocument && !row.productionTemplateReady) {
./lib/documents/templateImport.ts:219:      errors.push("finalProductionDocument cannot be true unless productionTemplateReady is true.");
./lib/documents/templateImport.ts:233:      productionTemplateReady: row.productionTemplateReady,
./lib/documents/templateImport.ts:256:      productionReadyRows: rowPreviews.filter((row) => row.productionTemplateReady).length,
./app/admin/ticklers/page.tsx:1054:          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 12 }}>
./app/admin/ticklers/page.tsx:1093:          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(160px, 1fr))", gap: 12 }}>
./app/admin/ticklers/page.tsx:1122:          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: 12 }}>
./app/admin/ticklers/page.tsx:1153:          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: 12 }}>
./app/admin/ticklers/page.tsx:1171:          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: 12 }}>
./app/admin/document-templates/[key]/page.tsx:60:export default function AdminDocumentTemplateDetailPage() {
./app/admin/document-templates/[key]/page.tsx:100:      setReplacementError("Use a .docx Word template file for replacement versioning.");
./app/admin/document-templates/[key]/page.tsx:139:        "This will create a new template version and make it the current version. Prior versions will be preserved. Continue?"
./app/admin/document-templates/[key]/page.tsx:152:      const response = await fetch("/api/documents/templates/replace-version", {
./app/admin/document-templates/[key]/page.tsx:156:          templateKey: key,
./app/admin/document-templates/[key]/page.tsx:159:          note: confirm ? "Confirmed from template detail page." : "Preview from template detail page.",
./app/admin/document-templates/[key]/page.tsx:176:            `Template replacement ${action} failed. Status ${response.status}. Response: ${bodyPreview || "empty response"}`
./app/admin/document-templates/[key]/page.tsx:183:        await loadTemplateDetail();
./app/admin/document-templates/[key]/page.tsx:188:      setReplacementError(err?.message || `Template replacement ${action} failed.`);
./app/admin/document-templates/[key]/page.tsx:194:  async function loadTemplateDetail() {
./app/admin/document-templates/[key]/page.tsx:200:        `/api/documents/templates/detail?key=${encodeURIComponent(key)}&category=all`,
./app/admin/document-templates/[key]/page.tsx:205:        throw new Error(json?.error || "Template detail lookup failed.");
./app/admin/document-templates/[key]/page.tsx:209:      setError(err?.message || "Template detail lookup failed.");
./app/admin/document-templates/[key]/page.tsx:217:    loadTemplateDetail();
./app/admin/document-templates/[key]/page.tsx:221:  const template = data?.template || {};
./app/admin/document-templates/[key]/page.tsx:222:  const versions = Array.isArray(template?.versions) ? template.versions : [];
./app/admin/document-templates/[key]/page.tsx:223:  const mergeFields = Array.isArray(template?.mergeFields) ? template.mergeFields : [];
./app/admin/document-templates/[key]/page.tsx:224:  const currentVersion = template?.currentVersion || null;
./app/admin/document-templates/[key]/page.tsx:228:      data-barsh-admin-document-template-detail="true"
./app/admin/document-templates/[key]/page.tsx:241:              <a href="/admin/document-templates" style={{ color: "#4f46e5", fontWeight: 900, textDecoration: "none" }}>
./app/admin/document-templates/[key]/page.tsx:242:                ← Back to Document Templates
./app/admin/document-templates/[key]/page.tsx:245:                {display(template?.label, "Document Template Detail")}
./app/admin/document-templates/[key]/page.tsx:247:              <div style={{ color: "#64748b", fontWeight: 800 }}>{display(template?.key || key)}</div>
./app/admin/document-templates/[key]/page.tsx:250:              <span style={statusBadgeStyle(template?.repositorySource === "barsh-matters-db" ? "ok" : "warn")}>
./app/admin/document-templates/[key]/page.tsx:251:                {display(template?.repositorySource, "Unknown source")}
./app/admin/document-templates/[key]/page.tsx:253:              <span style={statusBadgeStyle(template?.enabled === false ? "warn" : "ok")}>
./app/admin/document-templates/[key]/page.tsx:254:                {template?.enabled === false ? "Disabled" : "Enabled"}
./app/admin/document-templates/[key]/page.tsx:258:                onClick={loadTemplateDetail}
./app/admin/document-templates/[key]/page.tsx:275:            Read-only template detail view for repository architecture, current version, prior versions,
./app/admin/document-templates/[key]/page.tsx:280:          {loading && <div style={{ color: "#64748b", fontWeight: 800 }}>Loading template detail...</div>}
./app/admin/document-templates/[key]/page.tsx:290:            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
./app/admin/document-templates/[key]/page.tsx:292:                ["Category", template?.category],
./app/admin/document-templates/[key]/page.tsx:293:                ["Output Format", template?.outputFormat],
./app/admin/document-templates/[key]/page.tsx:294:                ["Default Filename Suffix", template?.defaultFilenameSuffix],
./app/admin/document-templates/[key]/page.tsx:295:                ["Generation Endpoint", template?.generationEndpoint],
./app/admin/document-templates/[key]/page.tsx:296:                ["Source of Truth", template?.sourceOfTruth],
./app/admin/document-templates/[key]/page.tsx:297:                ["Repository Status", template?.repositoryStatus],
./app/admin/document-templates/[key]/page.tsx:332:                <div style={{ color: "#64748b", fontWeight: 800 }}>No DB version exists for this fallback template.</div>
./app/admin/document-templates/[key]/page.tsx:336:            <section data-barsh-template-replacement-workflow="true" style={cardStyle()}>
./app/admin/document-templates/[key]/page.tsx:337:              <h2 style={{ margin: "0 0 10px", fontSize: 22 }}>Replace Current DOCX Template</h2>
./app/admin/document-templates/[key]/page.tsx:340:                changing the database.  Confirm creates a new DocumentTemplateVersion, preserves prior versions,
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:2:CREATE TABLE "DocumentTemplate" (
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:19:    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:23:CREATE TABLE "DocumentTemplateVersion" (
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:25:    "templateId" TEXT NOT NULL,
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:28:    "bodyFormat" TEXT NOT NULL DEFAULT 'docx-template',
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:36:    CONSTRAINT "DocumentTemplateVersion_pkey" PRIMARY KEY ("id")
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:40:CREATE TABLE "DocumentTemplateMergeField" (
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:42:    "templateId" TEXT NOT NULL,
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:53:    CONSTRAINT "DocumentTemplateMergeField_pkey" PRIMARY KEY ("id")
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:57:CREATE UNIQUE INDEX "DocumentTemplate_key_key" ON "DocumentTemplate"("key");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:60:CREATE INDEX "DocumentTemplate_category_idx" ON "DocumentTemplate"("category");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:63:CREATE INDEX "DocumentTemplate_enabled_idx" ON "DocumentTemplate"("enabled");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:66:CREATE UNIQUE INDEX "DocumentTemplateVersion_templateId_versionNumber_key" ON "DocumentTemplateVersion"("templateId", "versionNumber");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:69:CREATE INDEX "DocumentTemplateVersion_templateId_idx" ON "DocumentTemplateVersion"("templateId");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:72:CREATE INDEX "DocumentTemplateVersion_status_idx" ON "DocumentTemplateVersion"("status");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:75:CREATE UNIQUE INDEX "DocumentTemplateMergeField_templateId_key_key" ON "DocumentTemplateMergeField"("templateId", "key");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:78:CREATE INDEX "DocumentTemplateMergeField_templateId_idx" ON "DocumentTemplateMergeField"("templateId");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:81:CREATE INDEX "DocumentTemplateMergeField_source_idx" ON "DocumentTemplateMergeField"("source");
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:84:ALTER TABLE "DocumentTemplateVersion" ADD CONSTRAINT "DocumentTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql:87:ALTER TABLE "DocumentTemplateMergeField" ADD CONSTRAINT "DocumentTemplateMergeField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
./app/admin/reference-data/page.tsx:323:      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
./app/admin/reference-data/page.tsx:332:      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
./app/admin/reference-data/page.tsx:1262:            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
./app/admin/reference-data/page.tsx:1434:          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
./app/admin/reference-data/page.tsx:1519:            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 16, alignItems: "start" }}>
./app/admin/reference-data/page.tsx:1638:                          gridTemplateColumns: "minmax(0, 1fr) 260px",
./app/admin/reference-data/page.tsx:1779:                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
./app/admin/reference-data/page.tsx:2162:              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
./app/admin/reference-data/page.tsx:2313:              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
./app/admin/reference-data/page.tsx:2339:              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
./app/admin/reference-data/page.tsx:2511:                  gridTemplateColumns: "minmax(0, 1fr) 180px",
./app/admin/reference-data/page.tsx:2722:            gridTemplateColumns: "360px minmax(0, 1fr)",
./app/admin/reference-data/page.tsx:3059:                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 16 }}>
./app/court-calendar/page.tsx:616:    const html = "<!doctype html><html><head><meta charset=\"utf-8\" /><title>" + safeHtml(reportTitle) + "</title><style>@page { size: landscape; margin: 0.28in 0.22in; } * { box-sizing: border-box; } body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; font-size: 9px; } .report-title { text-align: center; font-size: 22px; font-weight: 900; margin: 0 0 14px; } .report-meta { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; font-size: 8px; color: #334155; } .court-heading { display: grid; grid-template-columns: 115px 1fr; align-items: end; gap: 8px; font-size: 12px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding: 0 0 3px; margin: 0 0 3px; } .court-group { margin-bottom: 14px; } .court-appearance-report { margin-top: 4px; } table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: auto; } thead { display: table-header-group; } tfoot { display: table-footer-group; } tbody { display: table-row-group; } tr { page-break-inside: avoid; break-inside: avoid; } tbody tr { page-break-inside: avoid; break-inside: avoid; } th { text-align: left; vertical-align: bottom; font-size: 7.5px; font-weight: 900; color: #475569; border-bottom: 1px solid #cbd5e1; padding: 2px 3px; line-height: 1.05; page-break-inside: avoid; break-inside: avoid; } td { vertical-align: top; border-bottom: 1px solid #d7dde5; padding: 3px 3px; line-height: 1.08; word-break: break-word; overflow-wrap: anywhere; page-break-inside: avoid; break-inside: avoid; } .money { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; } .trial-result { white-space: nowrap; } .result-line { display: grid; grid-template-columns: 34px 1fr; align-items: end; gap: 2px; line-height: 1.08; } .blank-line { border-bottom: 1px solid #9ca3af; height: 8px; min-width: 72px; } .appearance-date { text-align: center; font-size: 17px; font-weight: 950; margin: 4px 0 18px; } .result-cell { font-size: 7.5px; line-height: 1.12; } .adj-line { display: grid; grid-template-columns: 28px 1fr; gap: 5px; align-items: end; margin-bottom: 4px; } .date-write-line { border-bottom: 1px solid #111827; min-width: 70px; height: 14px; } .scan-choice { display: grid; grid-template-columns: 38px 8px 16px 8px 14px; gap: 2px; align-items: center; margin-top: 1px; white-space: nowrap; } .bubble { display: inline-block; width: 7px; height: 7px; border: 1px solid #111827; border-radius: 999px; } .trial-report th:nth-child(1), .trial-report td:nth-child(1) { width: 5.8%; } .trial-report th:nth-child(2), .trial-report td:nth-child(2) { width: 9.3%; } .trial-report th:nth-child(3), .trial-report td:nth-child(3) { width: 9.3%; } .trial-report th:nth-child(4), .trial-report td:nth-child(4) { width: 9.3%; } .trial-report th:nth-child(5), .trial-report td:nth-child(5) { width: 7.2%; } .trial-report th:nth-child(6), .trial-report td:nth-child(6) { width: 7.4%; } .trial-report th:nth-child(7), .trial-report td:nth-child(7) { width: 17.8%; } .trial-report th:nth-child(8), .trial-report td:nth-child(8) { width: 10%; } .trial-report th:nth-child(9), .trial-report td:nth-child(9) { width: 8.7%; } .trial-report th:nth-child(10), .trial-report td:nth-child(10) { width: 15.2%; } .appearance-report th:nth-child(1), .appearance-report td:nth-child(1) { width: 7.2%; } .appearance-report th:nth-child(2), .appearance-report td:nth-child(2) { width: 5.2%; } .appearance-report th:nth-child(3), .appearance-report td:nth-child(3) { width: 5.4%; } .appearance-report th:nth-child(4), .appearance-report td:nth-child(4) { width: 9%; } .appearance-report th:nth-child(5), .appearance-report td:nth-child(5) { width: 8.2%; } .appearance-report th:nth-child(6), .appearance-report td:nth-child(6) { width: 8.5%; } .appearance-report th:nth-child(7), .appearance-report td:nth-child(7) { width: 7%; } .appearance-report th:nth-child(8), .appearance-report td:nth-child(8) { width: 7%; } .appearance-report th:nth-child(9), .appearance-report td:nth-child(9) { width: 24%; } .appearance-report th:nth-child(10), .appearance-report td:nth-child(10) { width: 8%; } .appearance-report th:nth-child(11), .appearance-report td:nth-child(11) { width: 10.5%; } .court-appearance-report th, .court-appearance-report td { font-size: 9.6px; line-height: 1.18; padding: 5px 5px; } .court-appearance-report tbody tr { min-height: 74px; } .court-appearance-report th { text-align: center; } .court-appearance-report th:nth-child(1), .court-appearance-report td:nth-child(1) { width: 3.2%; white-space: nowrap; } .court-appearance-report th:nth-child(2), .court-appearance-report td:nth-child(2) { width: 6.3%; white-space: nowrap; } .court-appearance-report th:nth-child(3), .court-appearance-report td:nth-child(3) { width: 6.2%; white-space: normal; overflow-wrap: anywhere; } .court-appearance-report th:nth-child(4), .court-appearance-report td:nth-child(4) { width: 8%; } .court-appearance-report th:nth-child(5), .court-appearance-report td:nth-child(5) { width: 5%; white-space: nowrap; text-align: right; } .court-appearance-report th:nth-child(6), .court-appearance-report td:nth-child(6) { width: 5%; white-space: nowrap; text-align: right; } .court-appearance-report th:nth-child(7), .court-appearance-report td:nth-child(7) { width: 30%; padding-left: 10px; } .court-appearance-report th:nth-child(8), .court-appearance-report td:nth-child(8) { width: 12%; } .court-appearance-report th:nth-child(9), .court-appearance-report td:nth-child(9) { width: 7%; } .court-appearance-report th:nth-child(10), .court-appearance-report td:nth-child(10) { width: 16.3%; } .court-appearance-report .result-cell { font-size: 9.2px; line-height: 1.36; white-space: nowrap; padding-top: 8px; padding-bottom: 8px; } .court-appearance-report .scan-choice { grid-template-columns: 54px 14px 22px 14px 20px; column-gap: 5px; row-gap: 7px; margin-top: 8px; margin-bottom: 6px; } .court-appearance-report .bubble { width: 14px; height: 14px; border-width: 1.4px; } .court-appearance-report th:nth-child(2), .court-appearance-report td:nth-child(2), .court-appearance-report th:nth-child(3), .court-appearance-report td:nth-child(3) { white-space: nowrap; word-break: keep-all; overflow-wrap: normal; } .court-appearance-report th:nth-child(4), .court-appearance-report td:nth-child(4) { padding-left: 10px; } .court-appearance-report th:nth-child(9), .court-appearance-report td:nth-child(9) { white-space: nowrap; word-break: keep-all; overflow-wrap: normal; } .court-appearance-report .caption-insurer-line { display: block; margin-top: 2px; } .court-appearance-report .caption { line-height: 1.08; } .all-report th:nth-child(1), .all-report td:nth-child(1) { width: 6.5%; } .all-report th:nth-child(2), .all-report td:nth-child(2) { width: 4.8%; } .all-report th:nth-child(3), .all-report td:nth-child(3) { width: 5%; } .all-report th:nth-child(4), .all-report td:nth-child(4) { width: 8.2%; } .all-report th:nth-child(5), .all-report td:nth-child(5) { width: 7.8%; } .all-report th:nth-child(6), .all-report td:nth-child(6) { width: 7%; } .all-report th:nth-child(7), .all-report td:nth-child(7) { width: 8%; } .all-report th:nth-child(8), .all-report td:nth-child(8) { width: 6.5%; } .all-report th:nth-child(9), .all-report td:nth-child(9) { width: 6.5%; } .all-report th:nth-child(10), .all-report td:nth-child(10) { width: 31.7%; } .all-report th:nth-child(11), .all-report td:nth-child(11) { width: 8%; } .screen-only { margin: 10px 0; text-align: center; } @media print { .screen-only { display: none; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }</style></head><body><div class=\"screen-only\"><button onclick=\"window.print()\">Print / Save PDF</button></div>" + (activeReportType === "appearance-calendar" ? "" : "<h1 class=\"report-title\">" + safeHtml(reportTitle) + "</h1>") + (activeReportType === "appearance-calendar" ? "" : "<div class=\"report-meta\"><div>" + safeHtml(filterSummary) + "</div><div>" + safeHtml(events.length) + " matters from current filtered results · Generated " + safeHtml(generatedAt) + "</div></div>") + groupsHtml + "<script>setTimeout(() => window.print(), 250);</script></body></html>";
./app/court-calendar/page.tsx:718:  function webCivilImportTemplateText() {
./app/court-calendar/page.tsx:732:  async function copyWebCivilImportTemplate() {
./app/court-calendar/page.tsx:733:    const template = webCivilImportTemplateText();
./app/court-calendar/page.tsx:734:    setWebCivilImportText(template);
./app/court-calendar/page.tsx:736:      await navigator.clipboard.writeText(template);
./app/court-calendar/page.tsx:739:      setWebCivilImportResult({ ok: true, previewOnly: true, parsedRowCount: events.length, importableRowCount: 0, skippedRowCount: 0, rows: [], error: "Template filled below. Browser clipboard permission was not available.", safety: { clipboardOnly: true, clioRecordsChanged: false, externalWebCivilCalled: false } });
./app/court-calendar/page.tsx:818:        <div style={{ display: "grid", gridTemplateColumns: "130px 130px minmax(210px, 1fr) 180px minmax(250px, 1.1fr) minmax(220px, 0.95fr) 190px", gap: 10, marginTop: 14 }} data-barsh-court-calendar-exact-filter-screen="true" onKeyDown={handleCalendarFilterKeyDown}>
./app/court-calendar/page.tsx:867:                Manual paste/import only. Copy the template from the currently loaded calendar results, look up the calendar numbers in WebCivil Local, paste the completed rows here, preview, then apply. This updates only local Court Calendar events by Event ID.
./app/court-calendar/page.tsx:873:            <button type="button" onClick={() => void copyWebCivilImportTemplate()} style={secondaryButtonStyle} disabled={!events.length} data-barsh-court-calendar-webcivil-local-copy-template="true">Copy Import Template</button>
./app/court-calendar/page.tsx:913:          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: 10 }}>
./app/admin/ticklers/runner/page.tsx:258:        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 12 }}>
./app/admin/ticklers/runner/page.tsx:366:                      gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
./app/admin/invoices/page.tsx:107:        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1.5fr) repeat(3, minmax(140px, 1fr)) auto", gap: 10, alignItems: "end" }}>
./app/page.tsx:3074:  gridTemplateColumns: "500px minmax(0, 1fr) 330px",
./app/page.tsx:3375:  gridTemplateColumns: "minmax(0, 1fr) auto",
./app/page.tsx:3457:  gridTemplateColumns: "minmax(120px, 0.85fr) minmax(190px, 1.2fr) minmax(160px, 1fr) minmax(95px, 0.5fr)",
./app/page.tsx:3464:  gridTemplateColumns: "minmax(120px, 0.85fr) minmax(190px, 1.2fr) minmax(160px, 1fr) minmax(95px, 0.5fr) minmax(120px, 0.65fr)",
./app/page.tsx:3577:  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/page.tsx:3584:  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
./app/page.tsx:3597:  gridTemplateColumns: "auto minmax(0, 1fr)",
./app/page.tsx:3697:  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/page.tsx:3718:  gridTemplateColumns: "500px minmax(0, 1fr) 330px",
./app/page.tsx:3766:  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
./app/admin/clients/page.tsx:226:            gridTemplateColumns: "minmax(360px, 1fr) 220px",
./app/lawsuits/page.tsx:901:          gridTemplateColumns: "500px minmax(0, 1fr) 330px",
./app/lawsuits/page.tsx:1055:      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
./app/lawsuits/page.tsx:1324:            <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 520px)", gap: 12, marginBottom: 12 }}>
./app/lawsuits/page.tsx:1488:  gridTemplateColumns: "repeat(4, 1fr) 220px",
./app/globals.css:44:  grid-template-columns: minmax(0, 1fr);
./app/globals.css:54:  grid-template-columns: 1.25fr 1fr 1fr 1.45fr;
./app/globals.css:224:  grid-template-columns: minmax(0, 1fr) auto;
./app/globals.css:313:  grid-template-columns: 84px minmax(0, 1fr);
./app/globals.css:403:  grid-template-columns: 1fr auto;
./app/globals.css:661:  grid-template-columns: 32px minmax(0, 1fr) 32px !important;
./app/globals.css:772:  grid-template-columns: 32px minmax(0, 1fr) 32px !important;
./app/admin/users/page.tsx:69:  "admin.documentTemplates.view",
./app/admin/users/page.tsx:70:  "admin.documentTemplates.manage",
./app/admin/users/page.tsx:344:          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
./app/admin/users/page.tsx:394:          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
./app/admin/users/page.tsx:439:          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
./app/admin/users/page.tsx:487:          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
./app/print-queue/page.tsx:368:          gridTemplateColumns: "500px minmax(0, 1fr) 330px",
./app/print-queue/page.tsx:460:        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 120px auto", gap: 8, alignItems: "center" }}>
./app/admin/lawsuit-cleanup/page.tsx:561:  gridTemplateColumns: "minmax(240px, 320px) repeat(3, minmax(180px, 1fr))",
./app/admin/lawsuit-cleanup/page.tsx:613:  gridTemplateColumns: "repeat(5, minmax(140px, 1fr))",
./app/admin/lawsuit-cleanup/page.tsx:721:  gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
./scripts/verify-settlement-document-dialog-mode.mjs:12:  ["uses displayed options in datalist", "displayedTemplateOptions.map"],
./app/components/BarshHeaderQuickNav.tsx:93:        gridTemplateColumns: "minmax(170px, 230px) auto auto",
./scripts/verify-document-template-detail-workflow-safety.mjs:16:const detailRoute = read("app/api/documents/templates/detail/route.ts");
./scripts/verify-document-template-detail-workflow-safety.mjs:17:const storedDocxRoute = read("app/api/documents/templates/stored-docx/route.ts");
./scripts/verify-document-template-detail-workflow-safety.mjs:18:const detailPage = read("app/admin/document-templates/[key]/page.tsx");
./scripts/verify-document-template-detail-workflow-safety.mjs:19:const adminPage = read("app/admin/document-templates/page.tsx");
./scripts/verify-document-template-detail-workflow-safety.mjs:21:assert(detailRoute.includes("document-template-detail-preview"), "template detail API identifies read-only preview action");
./scripts/verify-document-template-detail-workflow-safety.mjs:22:assert(detailRoute.includes("database-first-detail-read-only"), "template detail API is database-first read-only");
./scripts/verify-document-template-detail-workflow-safety.mjs:23:assert(detailRoute.includes("templateRepositoryWrites: false"), "template detail API safety blocks template writes");
./scripts/verify-document-template-detail-workflow-safety.mjs:24:assert(detailRoute.includes("clioWrites: false"), "template detail API safety blocks Clio writes");
./scripts/verify-document-template-detail-workflow-safety.mjs:25:assert(detailRoute.includes("graphWrites: false"), "template detail API safety blocks Graph writes");
./scripts/verify-document-template-detail-workflow-safety.mjs:26:assert(detailRoute.includes("versioning"), "template detail API exposes planned versioning workflow");
./scripts/verify-document-template-detail-workflow-safety.mjs:27:assert(detailRoute.includes("mergeFields"), "template detail API exposes merge-field detail");
./scripts/verify-document-template-detail-workflow-safety.mjs:29:assert(storedDocxRoute.includes("document-template-stored-docx-download"), "stored DOCX route identifies download action");
./scripts/verify-document-template-detail-workflow-safety.mjs:34:assert(detailPage.includes("data-barsh-admin-document-template-detail"), "admin template detail page has stable verifier marker");
./scripts/verify-document-template-detail-workflow-safety.mjs:35:assert(detailPage.includes("Version History"), "admin template detail page shows version history");
./scripts/verify-document-template-detail-workflow-safety.mjs:36:assert(detailPage.includes("Merge Fields"), "admin template detail page shows merge fields");
./scripts/verify-document-template-detail-workflow-safety.mjs:37:assert(detailPage.includes("Download Stored DOCX"), "admin template detail page links stored DOCX downloads");
./scripts/verify-document-template-detail-workflow-safety.mjs:39:assert(adminPage.includes("Open Template Detail"), "admin template list links to detail page");
./scripts/verify-document-template-detail-workflow-safety.mjs:40:assert(!adminPage.includes('"example-production-template"'), "admin template sample no longer uses old example-production-template key");
./scripts/verify-document-template-detail-workflow-safety.mjs:43:  console.error("Document template detail workflow safety verification failed.");
./scripts/verify-document-template-detail-workflow-safety.mjs:47:console.log("Document template detail workflow safety verification passed.");
./app/admin/claim-index/page.tsx:446:          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
./scripts/verify-verifier-contract-locks.mjs:101:  mustContain(file, text, "lib/documents/templateRegistry.ts");
./scripts/verify-settlement-popup-column-entry-safety.mjs:46:  "gridTemplateColumns: \"0.65fr auto auto auto 0.85fr\"",
./scripts/verify-settlement-popup-column-entry-safety.mjs:73:  "gridTemplateColumns: \"1fr 1fr 1fr\"",
./scripts/verify-settlement-popup-column-entry-safety.mjs:89:  `gridTemplateColumns: "1fr 1fr 1fr"`,
./app/admin/backup-restore/page.tsx:1001:        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
./app/admin/backup-restore/page.tsx:1061:          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
./app/admin/backup-restore/page.tsx:1162:          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
./app/admin/backup-restore/page.tsx:1234:          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
./app/admin/backup-restore/page.tsx:1311:          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
./app/admin/backup-restore/page.tsx:1561:          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
./app/admin/backup-restore/page.tsx:1673:          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
./app/admin/backup-restore/page.tsx:1897:              <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
./app/admin/backup-restore/page.tsx:1933:              <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
./app/admin/clients/[id]/invoice/page.tsx:724:    .topline { display: grid; grid-template-columns: 390px minmax(720px, 1fr) 340px; gap: 34px; align-items: stretch; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
./app/admin/clients/[id]/invoice/page.tsx:739:    .grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 12px; margin: 16px 0; }
./app/admin/clients/[id]/invoice/page.tsx:1071:        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(160px, 1fr))", gap: 10, marginTop: 12 }}>
./app/admin/clients/[id]/invoice/page.tsx:1143:      gridTemplateColumns: "minmax(0, 1fr) auto",
./app/admin/clients/[id]/invoice/page.tsx:1194:          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 18, alignItems: "center", marginTop: 14, padding: "16px 14px", borderRadius: 14, background: "#0f172a", color: "#ffffff", fontSize: 18, fontWeight: 950, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}>
./app/admin/clients/[id]/invoice/page.tsx:1440:              gridTemplateColumns: "minmax(320px, 1.25fr) minmax(210px, 0.8fr) minmax(190px, 0.7fr) minmax(440px, 1.35fr)",
./app/admin/clients/[id]/invoice/page.tsx:1607:            gridTemplateColumns: "minmax(190px, 1fr) minmax(220px, 1fr) minmax(180px, 0.9fr) minmax(180px, 0.9fr)",
./app/admin/clients/[id]/invoice/page.tsx:1690:                gridTemplateColumns: "repeat(4, minmax(190px, 1fr))",
./app/admin/clients/[id]/invoice/page.tsx:1940:            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(150px, 1fr))", gap: 10, margin: "12px 0", padding: 12, border: "1px solid #bfdbfe", borderRadius: 12, background: "#eff6ff" }}>
./app/admin/clients/[id]/invoice/page.tsx:1952:          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(140px, 1fr))", gap: 12, margin: "12px 0" }}>
./app/matter/[id]/page.tsx.bak.guardrails:390:          gridTemplateColumns: "220px minmax(0, 1fr) 360px",
./app/matter/[id]/page.tsx.bak.guardrails:499:              gridTemplateColumns: "1fr auto",
./app/admin/claim-index/audit/page.tsx:382:            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
./app/admin/claim-index/audit/page.tsx:391:            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
./scripts/verify-direct-view-documents-popup-header-standard-safety.mjs:16:  'gridTemplateColumns: "90px minmax(0, 1fr) 90px"',
./scripts/verify-document-template-import-routes-safety.mjs:18:const helper = read("lib/documents/templateImport.ts");
./scripts/verify-document-template-import-routes-safety.mjs:19:const preview = read("app/api/documents/templates/import-preview/route.ts");
./scripts/verify-document-template-import-routes-safety.mjs:20:const confirm = read("app/api/documents/templates/import-confirm/route.ts");
./scripts/verify-document-template-import-routes-safety.mjs:23:check("helper defines preview safety", helper.includes("safetyTemplateImportPreview"));
./scripts/verify-document-template-import-routes-safety.mjs:24:check("helper defines confirm safety", helper.includes("safetyTemplateImportConfirm"));
./scripts/verify-document-template-import-routes-safety.mjs:25:check("helper normalizes import rows", helper.includes("normalizeTemplateImportRows"));
./scripts/verify-document-template-import-routes-safety.mjs:26:check("helper supports seeded template rows", helper.includes("seededTemplateImportRows"));
./scripts/verify-document-template-import-routes-safety.mjs:27:check("helper blocks final production without production ready", helper.includes("finalProductionDocument cannot be true unless productionTemplateReady is true"));
./scripts/verify-document-template-import-routes-safety.mjs:29:check("preview route exists", preview.includes("document-template-import-preview"));
./scripts/verify-document-template-import-routes-safety.mjs:30:check("preview route reads existing template keys", preview.includes("prisma.documentTemplate.findMany"));
./scripts/verify-document-template-import-routes-safety.mjs:32:check("preview route does not write templates", !preview.includes("documentTemplate.upsert") && !preview.includes("documentTemplate.create") && !preview.includes("documentTemplate.update"));
./scripts/verify-document-template-import-routes-safety.mjs:34:check("confirm route exists", confirm.includes("document-template-import-confirm"));
./scripts/verify-document-template-import-routes-safety.mjs:37:check("confirm route writes DocumentTemplate", confirm.includes("tx.documentTemplate.upsert"));
./scripts/verify-document-template-import-routes-safety.mjs:38:check("confirm route writes DocumentTemplateVersion", confirm.includes("tx.documentTemplateVersion.create"));
./scripts/verify-document-template-import-routes-safety.mjs:39:check("confirm route writes DocumentTemplateMergeField", confirm.includes("tx.documentTemplateMergeField.upsert"));
./scripts/verify-document-template-import-routes-safety.mjs:41:check("confirm route metadata includes production readiness", confirm.includes("productionTemplateReady") && confirm.includes("finalProductionDocument"));
./scripts/verify-document-template-import-routes-safety.mjs:50:check("package script registered", pkg.includes("verify:document-template-import-routes-safety"));
./scripts/verify-document-template-import-routes-safety.mjs:53:  console.error(`FAIL: document template import routes safety verifier (${failures.length} failure(s))`);
./scripts/verify-document-template-import-routes-safety.mjs:57:console.log("PASS: document template import routes safety verifier");
./app/admin/clients/[id]/invoice/history/page.tsx:300:        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(130px, 1fr))", gap: 12, marginTop: 18 }}>
./app/admin/lawsuits/audit/page.tsx:417:            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
./app/admin/lawsuits/audit/page.tsx:426:            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
./scripts/verify-direct-view-emails-popup-modal-safety.mjs:47:  'gridTemplateColumns: "repeat(4, minmax(0, 1fr))"',
./scripts/verify-direct-view-emails-popup-modal-safety.mjs:76:  'gridTemplateColumns: "repeat(3, minmax(0, 1fr))"',
./app/admin/clients/[id]/page.tsx:787:        <dd style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr auto", gap: 6, alignItems: options?.multiline ? "start" : "center", lineHeight: 1.2 }}>
./app/admin/clients/[id]/page.tsx:816:        <dd style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr auto", gap: 6, alignItems: "center", lineHeight: 1.2 }}>
./app/admin/clients/[id]/page.tsx:869:          gridTemplateColumns: "minmax(450px, 1.05fr) minmax(440px, 1fr) minmax(320px, 0.85fr)",
./app/admin/clients/[id]/page.tsx:906:          <dl style={{ display: "grid", gridTemplateColumns: "100px max-content", gap: "8px 18px", margin: 0, alignItems: "start" }}>
./app/admin/clients/[id]/page.tsx:958:          <dl style={{ display: "grid", gridTemplateColumns: "205px max-content", gap: "4px 18px", margin: 0, alignItems: "start" }}>
./app/admin/clients/[id]/page.tsx:1148:                  <div key={`note-editor-${noteIndex}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "start" }}>
./app/admin/clients/[id]/invoice/client-costs-ledger/page.tsx:202:        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 12, marginTop: 18 }}>
./app/matter/[id]/page.tsx:448:  gridTemplateColumns: "500px minmax(0, 1fr) 330px",
./app/matter/[id]/page.tsx:624:  const [matterDocumentTemplateQuery, setMatterDocumentTemplateQuery] = useState("");
./app/matter/[id]/page.tsx:625:  const [matterSelectedDocumentTemplateKey, setMatterSelectedDocumentTemplateKey] = useState("");
./app/matter/[id]/page.tsx:849:          <div data-barsh-direct-view-documents-header-standard="true" style={{ display: "grid", gridTemplateColumns: "90px minmax(0, 1fr) 90px", alignItems: "center", gap: 14, padding: "16px 20px", background: "#1e3a8a", color: "#ffffff", textAlign: "center", borderBottom: "1px solid #1e3a8a", borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
./app/matter/[id]/page.tsx:1068:                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:1113:                gridTemplateColumns: "170px 170px 150px 1fr",
./app/matter/[id]/page.tsx:1143:                    gridTemplateColumns: "170px 170px 150px 1fr",
./app/matter/[id]/page.tsx:4039:  async function launchMatterStep2GeneratedDocumentEdit(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matter/[id]/page.tsx:4040:    if (!selectedTemplate?.key) {
./app/matter/[id]/page.tsx:4068:          documentKeys: [selectedTemplate.key],
./app/matter/[id]/page.tsx:4104:  async function launchMatterStep2PdfPreview(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matter/[id]/page.tsx:4105:    if (!selectedTemplate?.key) {
./app/matter/[id]/page.tsx:4141:          documentKeys: [selectedTemplate.key],
./app/matter/[id]/page.tsx:4168:          workingDocumentName: working.name || selectedTemplate.label,
./app/matter/[id]/page.tsx:4169:          filename: working.originalFilename || working.name || selectedTemplate.label,
./app/matter/[id]/page.tsx:4195:  async function finalizeMatterDocumentFromStep2(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matter/[id]/page.tsx:4198:    if (!selectedTemplate?.key) {
./app/matter/[id]/page.tsx:4223:      textValue(selectedTemplate.key);
./app/matter/[id]/page.tsx:4226:      textValue(selectedTemplate.label);
./app/matter/[id]/page.tsx:4806:    setMatterDocumentTemplateQuery("");
./app/matter/[id]/page.tsx:4807:    setMatterSelectedDocumentTemplateKey("");
./app/matter/[id]/page.tsx:4813:  function buildMatterDocumentDeliveryContext(selectedTemplate: { key: string; label: string; description: string } | null): DocumentDeliveryContext {
./app/matter/[id]/page.tsx:4815:    const templateFields = documentData?.templateFields || {};
./app/matter/[id]/page.tsx:4823:    const documentLabel = selectedTemplate?.label || "Document";
./app/matter/[id]/page.tsx:4824:    const matterDisplay = textValue(templateFields.displayNumber) || String(matterId || "");
./app/matter/[id]/page.tsx:4828:      documentKey: selectedTemplate?.key || "direct-matter-document",
./app/matter/[id]/page.tsx:4830:      providerName: textValue(templateFields.providerName),
./app/matter/[id]/page.tsx:4831:      patientName: textValue(templateFields.patientName),
./app/matter/[id]/page.tsx:4832:      insurerName: textValue(templateFields.insurerName),
./app/matter/[id]/page.tsx:4833:      indexNumber: textValue(templateFields.indexAaaNumber),
./app/matter/[id]/page.tsx:4836:        textValue(templateFields.patientName) ||
./app/matter/[id]/page.tsx:4837:        textValue(templateFields.insurerName) ||
./app/matter/[id]/page.tsx:4881:  function selectedFinalizedMatterDocumentCandidate(selectedTemplate: { key: string; label: string; description: string } | null): any {
./app/matter/[id]/page.tsx:4882:    const selectedKey = textValue(selectedTemplate?.key).toLowerCase();
./app/matter/[id]/page.tsx:4883:    const selectedLabel = textValue(selectedTemplate?.label).toLowerCase();
./app/matter/[id]/page.tsx:4934:  function buildMatterFinalizedPdfDeliveryContext(selectedTemplate: { key: string; label: string; description: string } | null): DocumentDeliveryContext {
./app/matter/[id]/page.tsx:4935:    const context = buildMatterDocumentDeliveryContext(selectedTemplate);
./app/matter/[id]/page.tsx:4936:    const candidate = selectedFinalizedMatterDocumentCandidate(selectedTemplate);
./app/matter/[id]/page.tsx:4961:  async function launchMatterDocumentEmail(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matter/[id]/page.tsx:4962:    const context = await resolveMatterMaildropForDelivery(buildMatterFinalizedPdfDeliveryContext(selectedTemplate));
./app/matter/[id]/page.tsx:5026:            `Document: ${context.documentLabel || selectedTemplate?.label || "Document"}\n` +
./app/matter/[id]/page.tsx:5057:          `Document: ${context.documentLabel || selectedTemplate?.label || "Document"}\n` +
./app/matter/[id]/page.tsx:5069:  function launchMatterDocumentPrint(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matter/[id]/page.tsx:5070:    const candidate = selectedFinalizedMatterDocumentCandidate(selectedTemplate);
./app/matter/[id]/page.tsx:5108:  async function sendMatterDocumentToPrintQueue(selectedTemplate: { key: string; label: string; description: string } | null) {
./app/matter/[id]/page.tsx:5109:    const context = buildMatterFinalizedPdfDeliveryContext(selectedTemplate);
./app/matter/[id]/page.tsx:5110:    const candidate = selectedFinalizedMatterDocumentCandidate(selectedTemplate);
./app/matter/[id]/page.tsx:5143:        "Document: " + (context.documentLabel || selectedTemplate?.label || "Selected finalized document") + "\n\n" +
./app/matter/[id]/page.tsx:5162:              key: candidate.key || selectedTemplate?.key,
./app/matter/[id]/page.tsx:5163:              label: candidate.label || selectedTemplate?.label,
./app/matter/[id]/page.tsx:5549:            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:5764:                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:5944:    const templateFields = documentData?.templateFields || {};
./app/matter/[id]/page.tsx:5946:    const query = matterDocumentTemplateQuery.trim().toLowerCase();
./app/matter/[id]/page.tsx:5948:    const templateOptions = [
./app/matter/[id]/page.tsx:5966:    const sortedTemplateOptions = [...templateOptions].sort((a, b) => a.label.localeCompare(b.label));
./app/matter/[id]/page.tsx:5968:    const filteredTemplateOptions = sortedTemplateOptions.filter((option) => {
./app/matter/[id]/page.tsx:5973:    const selectedTemplate =
./app/matter/[id]/page.tsx:5974:      sortedTemplateOptions.find((option) => option.key === matterSelectedDocumentTemplateKey) || null;
./app/matter/[id]/page.tsx:5977:      Boolean(selectedTemplate) &&
./app/matter/[id]/page.tsx:6085:        setMatterSelectedDocumentTemplateKey("");
./app/matter/[id]/page.tsx:6086:        setMatterDocumentTemplateQuery("");
./app/matter/[id]/page.tsx:6129:              gridTemplateColumns: "90px minmax(0, 1fr) 90px",
./app/matter/[id]/page.tsx:6192:                  Select the document template for this matter.
./app/matter/[id]/page.tsx:6198:                  value={matterDocumentTemplateQuery}
./app/matter/[id]/page.tsx:6199:                  list="matter-document-template-options"
./app/matter/[id]/page.tsx:6202:                    setMatterDocumentTemplateQuery(value);
./app/matter/[id]/page.tsx:6203:                    const match = sortedTemplateOptions.find(
./app/matter/[id]/page.tsx:6207:                      setMatterSelectedDocumentTemplateKey(match.key);
./app/matter/[id]/page.tsx:6210:                      setMatterSelectedDocumentTemplateKey("");
./app/matter/[id]/page.tsx:6214:                  placeholder="Select document template"
./app/matter/[id]/page.tsx:6225:                <datalist id="matter-document-template-options">
./app/matter/[id]/page.tsx:6226:                  {sortedTemplateOptions.map((option) => (
./app/matter/[id]/page.tsx:6231:                {matterSelectedDocumentTemplateKey && selectedTemplate && (
./app/matter/[id]/page.tsx:6242:                    <strong>Selected:</strong> {selectedTemplate.label}
./app/matter/[id]/page.tsx:6243:                    <div style={{ marginTop: 4, color: "#475569" }}>{selectedTemplate.description}</div>
./app/matter/[id]/page.tsx:6247:                {matterDocumentTemplateQuery.trim() && filteredTemplateOptions.length === 0 && (
./app/matter/[id]/page.tsx:6249:                    No matching document templates.
./app/matter/[id]/page.tsx:6268:                  {selectedTemplate
./app/matter/[id]/page.tsx:6269:                    ? `Selected: ${selectedTemplate?.label || "Selected document"}`
./app/matter/[id]/page.tsx:6277:                  () => launchMatterStep2PdfPreview(selectedTemplate),
./app/matter/[id]/page.tsx:6278:                  !selectedTemplate,
./app/matter/[id]/page.tsx:6279:                  !selectedTemplate ? "Select a document first." : "Open a temporary PDF preview without uploading to Clio."
./app/matter/[id]/page.tsx:6283:                  () => launchMatterStep2GeneratedDocumentEdit(selectedTemplate),
./app/matter/[id]/page.tsx:6284:                  !selectedTemplate,
./app/matter/[id]/page.tsx:6285:                  !selectedTemplate ? "Select a document first." : "Create a working DOCX and edit it in Word Web."
./app/matter/[id]/page.tsx:6289:                  () => finalizeMatterDocumentFromStep2(selectedTemplate),
./app/matter/[id]/page.tsx:6290:                  !selectedTemplate || documentPreviewLoading || finalizeUploadLoading,
./app/matter/[id]/page.tsx:6291:                  !selectedTemplate ? "Select a document first." : "Finalize and upload the selected document to Clio."
./app/matter/[id]/page.tsx:6297:            {(showPreviewStep || showEditStep || showFinalizeStep) && selectedTemplate && (
./app/matter/[id]/page.tsx:6408:                    () => finalizeMatterDocumentFromStep2(selectedTemplate),
./app/matter/[id]/page.tsx:6416:            {matterDocumentWorkflowStage === "finalize" && selectedTemplate && (
./app/matter/[id]/page.tsx:6452:                      () => launchMatterDocumentEmail(selectedTemplate),
./app/matter/[id]/page.tsx:6456:                    {actionButton("Print Document", () => launchMatterDocumentPrint(selectedTemplate), false, "Open the finalized PDF/printable document and show the print dialog when available.")}
./app/matter/[id]/page.tsx:6457:                    {actionButton("Send to Print Queue", () => sendMatterDocumentToPrintQueue(selectedTemplate), false, "Send this finalized document to the shared Barsh Matters print queue when backend support is available.")}
./app/matter/[id]/page.tsx:6500:                      () => launchMatterDocumentEmail(selectedTemplate),
./app/matter/[id]/page.tsx:6504:                    {actionButton("Print Document", () => launchMatterDocumentPrint(selectedTemplate), false, "Open the finalized PDF/printable document and show the print dialog when available.")}
./app/matter/[id]/page.tsx:6505:                    {actionButton("Send to Print Queue", () => sendMatterDocumentToPrintQueue(selectedTemplate), false, "Send this finalized document to the shared Barsh Matters print queue when backend support is available.")}
./app/matter/[id]/page.tsx:6530:                <h3 style={{ margin: 0, fontSize: 16 }}>Template Data Review</h3>
./app/matter/[id]/page.tsx:6532:                  Read-only local data available for future direct matter templates.  It does not generate documents, upload documents, write to Clio, or change the print queue.
./app/matter/[id]/page.tsx:6547:                  {JSON.stringify({ templateFields, referenceData, documentData }, null, 2)}
./app/matter/[id]/page.tsx:6649:              gridTemplateColumns: "90px minmax(0, 1fr) 90px",
./app/matter/[id]/page.tsx:6713:    const templateFields = documentData?.templateFields || {};
./app/matter/[id]/page.tsx:6731:            <h3 style={{ margin: 0, fontSize: 18 }}>Template Data Review</h3>
./app/matter/[id]/page.tsx:6733:              This is a read-only review of the data available for future Direct Matter templates.  It reads ClaimIndex and local reference data only.  It does not generate documents, upload documents, write to Clio, or change the print queue.
./app/matter/[id]/page.tsx:6767:                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
./app/matter/[id]/page.tsx:6777:                <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Ready for Templates</div>
./app/matter/[id]/page.tsx:6778:                <div style={{ fontWeight: 900 }}>{documentData.readyForTemplates ? "Yes" : "No"}</div>
./app/matter/[id]/page.tsx:6793:                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
./app/matter/[id]/page.tsx:6800:                <div style={{ fontWeight: 900 }}>{textValue(templateFields.displayNumber) || "—"}</div>
./app/matter/[id]/page.tsx:6804:                <div style={{ fontWeight: 900 }}>{textValue(templateFields.providerName) || "—"}</div>
./app/matter/[id]/page.tsx:6808:                <div style={{ fontWeight: 900 }}>{textValue(templateFields.patientName) || "—"}</div>
./app/matter/[id]/page.tsx:6812:                <div style={{ fontWeight: 900 }}>{textValue(templateFields.insurerName) || "—"}</div>
./app/matter/[id]/page.tsx:6816:                <div style={{ fontWeight: 900 }}>{textValue(templateFields.claimNumber) || "—"}</div>
./app/matter/[id]/page.tsx:6820:                <div style={{ fontWeight: 900 }}>{money(templateFields.claimAmount)}</div>
./app/matter/[id]/page.tsx:6824:                <div style={{ fontWeight: 900 }}>{money(templateFields.balancePresuit)}</div>
./app/matter/[id]/page.tsx:6828:                <div style={{ fontWeight: 900 }}>{textValue(templateFields.treatingProviderName) || "—"}</div>
./app/matter/[id]/page.tsx:6833:              <summary style={{ cursor: "pointer", fontWeight: 900 }}>Raw Template Fields</summary>
./app/matter/[id]/page.tsx:6835:                {JSON.stringify(templateFields, null, 2)}
./app/matter/[id]/page.tsx:7911:                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:8035:                              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:8251:              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
./app/matter/[id]/page.tsx:8552:                gridTemplateColumns: "minmax(0, 1fr) 520px",
./app/matter/[id]/page.tsx:8561:                  gridTemplateColumns: "minmax(0, 1fr) 340px",
./app/matter/[id]/page.tsx:8571:                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
./app/matter/[id]/page.tsx:9028:                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:9067:                          gridTemplateColumns: "132px 132px",
./app/matter/[id]/page.tsx:9363:                        gridTemplateColumns: "1.25fr 1fr 1fr",
./app/matter/[id]/page.tsx:9656:                          gridTemplateColumns: "44px minmax(0, 1fr) 44px",
./app/matter/[id]/page.tsx:10003:              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
./app/matter/[id]/page.tsx:10101:              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:10269:                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:10361:              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:10463:                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:10603:                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:10713:              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:10783:                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:11018:                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:11175:                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:11301:                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:11384:                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:11489:                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:11669:                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:11980:                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:12131:                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
./app/matter/[id]/page.tsx:12288:                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:12423:                            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:12922:              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:13046:                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:13084:                              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
./app/matter/[id]/page.tsx:13217:                          gridTemplateColumns: "1fr auto 1fr",
./app/matter/[id]/page.tsx:13695:          <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 520px)", gap: 12, marginBottom: 12 }}>
./scripts/verify-attorney-fee-docx-safety.mjs:38:const templateRegistry = read("lib/documents/templateRegistry.ts");
./scripts/verify-attorney-fee-docx-safety.mjs:80:mustContain("template registry", templateRegistry, "buildSettlementPlannedDocuments");
./scripts/verify-attorney-fee-docx-safety.mjs:81:mustContain("template registry", templateRegistry, "Settlement Summary");
./scripts/verify-attorney-fee-docx-safety.mjs:82:mustContain("template registry", templateRegistry, "Provider Remittance Breakdown");
./scripts/verify-attorney-fee-docx-safety.mjs:83:mustContain("template registry", templateRegistry, "Attorney Fee Breakdown");
./scripts/verify-attorney-fee-docx-safety.mjs:84:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/settlement-summary"');
./scripts/verify-attorney-fee-docx-safety.mjs:85:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/provider-remittance-breakdown"');
./scripts/verify-attorney-fee-docx-safety.mjs:86:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/attorney-fee-breakdown"');
./scripts/verify-attorney-fee-docx-safety.mjs:87:mustContain("template registry", templateRegistry, "routeOnly: true");
./scripts/verify-direct-matter-actions-box-style-safety.mjs:23:  'gridTemplateColumns: "132px 132px"',
./app/api/admin/document-readiness/audit/route.ts:250:      storedTemplateCount,
./app/api/admin/document-readiness/audit/route.ts:251:      storedTemplateVersionCount,
./app/api/admin/document-readiness/audit/route.ts:260:      prisma.documentTemplate.count().catch(() => 0),
./app/api/admin/document-readiness/audit/route.ts:261:      prisma.documentTemplateVersion.count().catch(() => 0),
./app/api/admin/document-readiness/audit/route.ts:262:      prisma.documentTemplateMergeField.count().catch(() => 0),
./app/api/admin/document-readiness/audit/route.ts:471:    const templateRepositoryEmpty = storedTemplateCount <= 0;
./app/api/admin/document-readiness/audit/route.ts:473:      id: "no-local-document-templates",
./app/api/admin/document-readiness/audit/route.ts:474:      label: "No local document templates",
./app/api/admin/document-readiness/audit/route.ts:476:      count: templateRepositoryEmpty ? 1 : 0,
./app/api/admin/document-readiness/audit/route.ts:477:      description: "Document generation depends on the local Barsh Matters template repository.",
./app/api/admin/document-readiness/audit/route.ts:478:      sampleRows: templateRepositoryEmpty ? rows.slice(0, 1).map((row) => withDetail(row, "No DocumentTemplate rows found.")) : [],
./app/api/admin/document-readiness/audit/route.ts:481:    const templateVersionsEmpty = storedTemplateVersionCount <= 0;
./app/api/admin/document-readiness/audit/route.ts:483:      id: "no-local-template-versions",
./app/api/admin/document-readiness/audit/route.ts:484:      label: "No local document template versions",
./app/api/admin/document-readiness/audit/route.ts:486:      count: templateVersionsEmpty ? 1 : 0,
./app/api/admin/document-readiness/audit/route.ts:487:      description: "Stored template versions are needed to select and generate documents from the local repository.",
./app/api/admin/document-readiness/audit/route.ts:488:      sampleRows: templateVersionsEmpty ? rows.slice(0, 1).map((row) => withDetail(row, "No DocumentTemplateVersion rows found.")) : [],
./app/api/admin/document-readiness/audit/route.ts:508:      sourceOfTruth: "Local Lawsuit, ClaimIndex, DocumentTemplate, DocumentFinalization, and DocumentPrintQueueItem tables",
./app/api/admin/document-readiness/audit/route.ts:513:        localDocumentTemplateCount: storedTemplateCount,
./app/api/admin/document-readiness/audit/route.ts:514:        localDocumentTemplateVersionCount: storedTemplateVersionCount,
./app/api/admin/document-readiness/audit/route.ts:515:        localDocumentTemplateMergeFieldCount: storedMergeFieldCount,
./scripts/verify-master-costs-claim-status-layout-safety.mjs:35:mustContain("master status column is vertical", 'gridTemplateColumns: "1fr"');
./scripts/verify-master-costs-claim-status-layout-safety.mjs:36:mustContain("master costs section uses three columns", 'gridTemplateColumns: "repeat(3, minmax(0, 1fr))"');
./scripts/verify-admin-permissions-registry-safety.mjs:34:  "admin.documentTemplates.view",
./scripts/verify-admin-permissions-registry-safety.mjs:35:  "admin.documentTemplates.manage",
./scripts/verify-admin-permissions-registry-safety.mjs:67:  "/admin/document-templates",
./scripts/verify-admin-document-template-repository-page.mjs:4:const pagePath = "app/admin/document-templates/page.tsx";
./scripts/verify-admin-document-template-repository-page.mjs:9:  ["admin-only marker exists", page.includes('data-barsh-admin-document-template-repository="true"')],
./scripts/verify-admin-document-template-repository-page.mjs:10:  ["admin heading exists", page.includes("Document Template Repository")],
./scripts/verify-admin-document-template-repository-page.mjs:11:  ["uses templates API", page.includes("/api/documents/templates?category=")],
./scripts/verify-admin-document-template-repository-page.mjs:14:  ["no edit controls", !page.includes("Save Template") && !page.includes("Delete Template") && !page.includes("Upload Template")],
./scripts/verify-admin-document-template-repository-page.mjs:30:console.log("PASS: admin document template repository page verifier");
./scripts/verify-master-generate-documents-popup-safety.cjs:21:mustContain("step1_direct_text", popup, `Select the document template for this matter.`);
./scripts/verify-master-generate-documents-popup-safety.cjs:22:mustContain("step1_placeholder", popup, `placeholder="Select document template"`);
./scripts/verify-master-generate-documents-popup-safety.cjs:42:mustContain("preview_stage_not_gated_by_selected_template", popup, `{masterDocumentWorkflowStage === "preview" && (`);
./scripts/verify-master-generate-documents-popup-safety.cjs:43:mustNotContain("preview_stage_not_gated_by_selected_template_old", popup, `{masterDocumentWorkflowStage === "preview" && displayedSelectedTemplate && (`);
./scripts/verify-master-generate-documents-popup-safety.cjs:51:else { const delivery = popup.slice(deliveryMarkers[deliveryMarkers.length - 1]); mustContain("delivery_step_heading", delivery, `Document Delivery`); mustContain("delivery_step_print_queue", delivery, `Send to Print Queue`); mustContain("delivery_step_save_locally", delivery, `"Save Locally"`); mustContain("delivery_step_print_finalized", delivery, `Print Finalized Document`); mustContain("delivery_step_email_finalized", delivery, `Email Finalized Document`); mustContain("delivery_step_save_handler", delivery, `saveMasterSettlementDocumentLocally(displayedSelectedTemplate)`); mustContain("delivery_step_print_handler", delivery, `launchMasterDocumentPrint(displayedSelectedTemplate)`); mustContain("delivery_step_queue_handler", delivery, `sendMasterDocumentToPrintQueue(displayedSelectedTemplate)`); mustContain("delivery_step_email_handler", delivery, `launchSettlementFinalizedDocumentEmail()`); mustNotContain("delivery_step_not_standalone_popup", delivery, `aria-label="Master Lawsuit Document Delivery"`); pass("delivery_step_preserved"); }
./scripts/verify-master-generate-documents-popup-safety.cjs:98:mustContain("delivery_email_uses_preview_handler", popup, `() => launchMasterDocumentEmail(displayedSelectedTemplate)`);
./scripts/verify-master-generate-documents-popup-safety.cjs:104:  mustContain("delivery_email_uses_preview_handler_scoped", deliveryEmailButtonBlock, `() => launchMasterDocumentEmail(displayedSelectedTemplate)`);
./scripts/verify-settlement-summary-docx-safety.mjs:38:const templateRegistry = read("lib/documents/templateRegistry.ts");
./scripts/verify-settlement-summary-docx-safety.mjs:80:mustContain("template registry", templateRegistry, "buildSettlementPlannedDocuments");
./scripts/verify-settlement-summary-docx-safety.mjs:81:mustContain("template registry", templateRegistry, "Settlement Summary");
./scripts/verify-settlement-summary-docx-safety.mjs:82:mustContain("template registry", templateRegistry, "Provider Remittance Breakdown");
./scripts/verify-settlement-summary-docx-safety.mjs:83:mustContain("template registry", templateRegistry, "Attorney Fee Breakdown");
./scripts/verify-settlement-summary-docx-safety.mjs:84:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/settlement-summary"');
./scripts/verify-settlement-summary-docx-safety.mjs:85:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/provider-remittance-breakdown"');
./scripts/verify-settlement-summary-docx-safety.mjs:86:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/attorney-fee-breakdown"');
./scripts/verify-settlement-summary-docx-safety.mjs:87:mustContain("template registry", templateRegistry, "routeOnly: true");
./scripts/verify-administrator-menu-items-direct-after-gate.mjs:38:  check(`${file} menu has Templates`, menu.includes("📄 Templates"));
./scripts/verify-administrator-menu-items-direct-after-gate.mjs:41:  check(`${file} Templates menu item direct navigates`, menu.includes('window.location.href = "/admin/document-templates"'));
./scripts/verify-administrator-menu-items-direct-after-gate.mjs:42:  check(`${file} menu items do not call gated opener functions`, !menu.includes("openAdminHome") && !menu.includes("openReferenceImportsAdmin") && !menu.includes("openDocumentTemplatesAdmin") && !menu.includes("runAdministratorGate"));
./scripts/inventory-claim-index-schema.mjs:26:  if (/template|document|docx|pdf|print|email|draft|maildrop/.test(hay)) return 'DOCUMENT_METADATA_TABLE_OR_WORKFLOW_TABLE';
./scripts/inventory-claim-index-schema.mjs:44:  if (/document|template|docx|pdf|print|email|draft/.test(hay)) return 'DOCUMENT_METADATA_OR_WORKFLOW_FIELD_NOT_DOCUMENT_CONTENT';
./scripts/verify-direct-payment-popup-header-standard-safety.mjs:39:  'gridTemplateColumns: "38px minmax(0, 1fr) 38px"',
./scripts/verify-settlement-documents-preview-safety.mjs:37:const templateRegistry = read("lib/documents/templateRegistry.ts");
./scripts/verify-settlement-documents-preview-safety.mjs:90:mustContain("template registry", templateRegistry, "buildSettlementPlannedDocuments");
./scripts/verify-settlement-documents-preview-safety.mjs:91:mustContain("template registry", templateRegistry, "Settlement Summary");
./scripts/verify-settlement-documents-preview-safety.mjs:92:mustContain("template registry", templateRegistry, "Provider Remittance Breakdown");
./scripts/verify-settlement-documents-preview-safety.mjs:93:mustContain("template registry", templateRegistry, "Attorney Fee Breakdown");
./scripts/verify-settlement-documents-preview-safety.mjs:94:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/settlement-summary"');
./scripts/verify-settlement-documents-preview-safety.mjs:95:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/provider-remittance-breakdown"');
./scripts/verify-settlement-documents-preview-safety.mjs:96:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/attorney-fee-breakdown"');
./scripts/verify-settlement-documents-preview-safety.mjs:97:mustContain("template registry", templateRegistry, "routeOnly: true");
./scripts/verify-document-template-merge-field-visibility-safety.mjs:3:const helper = fs.readFileSync("lib/documents/templateImport.ts", "utf8");
./scripts/verify-document-template-merge-field-visibility-safety.mjs:4:const confirm = fs.readFileSync("app/api/documents/templates/import-confirm/route.ts", "utf8");
./scripts/verify-document-template-merge-field-visibility-safety.mjs:5:const page = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
./scripts/verify-document-template-merge-field-visibility-safety.mjs:32:check("package script registered", pkg.includes("verify:document-template-merge-field-visibility-safety"));
./scripts/verify-document-template-merge-field-visibility-safety.mjs:40:  console.error(`FAIL: document template merge field visibility safety verifier (${failures.length} failure(s))`);
./scripts/verify-document-template-merge-field-visibility-safety.mjs:44:console.log("PASS: document template merge field visibility safety verifier");
./scripts/verify-direct-claim-status-section-layout-safety.mjs:21:requireIncludes("Direct detail grid keeps payment area as right column", 'gridTemplateColumns: "minmax(0, 1fr) 520px"');
./scripts/verify-direct-claim-status-section-layout-safety.mjs:24:requireIncludes("Direct left info uses two columns", 'gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)"');
./scripts/verify-direct-claim-status-section-layout-safety.mjs:25:requireIncludes("Direct claim/status layout has status width", 'gridTemplateColumns: "minmax(0, 1fr) 340px"');
./scripts/verify-admin-template-merge-field-visibility-display.mjs:3:const page = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
./scripts/verify-admin-template-merge-field-visibility-display.mjs:27:check("package script registered", pkg.includes("verify:admin-template-merge-field-visibility-display"));
./scripts/verify-admin-template-merge-field-visibility-display.mjs:35:  console.error(`FAIL: admin template merge field visibility display verifier (${failures.length} failure(s))`);
./scripts/verify-admin-template-merge-field-visibility-display.mjs:39:console.log("PASS: admin template merge field visibility display verifier");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:16:const page = read("app/admin/document-templates/page.tsx");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:17:const detailPage = read("app/admin/document-templates/[key]/page.tsx");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:21:assert(page.includes('data-barsh-advanced-custom-template-import="true"'), "admin page marks advanced custom import section");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:22:assert(page.includes('data-barsh-advanced-custom-template-import-panel="true"'), "admin page wraps legacy import controls in advanced panel");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:25:assert(page.includes("Advanced / Debug Template Row Import"), "admin page labels custom import as advanced/debug");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:27:assert(page.includes("Open Template Detail"), "admin page directs users to template detail");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:28:assert(page.includes("Replace Current DOCX Template"), "admin page directs users to replacement workflow");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:31:assert(page.includes("customTemplateConfirmBlocked"), "advanced custom import blocks unsafe confirms");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:41:assert(detailPage.includes('data-barsh-template-replacement-workflow="true"'), "template detail replacement workflow still exists");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:42:assert(detailPage.includes("Preview Replacement"), "template detail still has Preview Replacement");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:43:assert(detailPage.includes("Confirm Replacement Version"), "template detail still has Confirm Replacement Version");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:45:assert(pkg.scripts?.["verify:admin-template-custom-import-demoted-safety"], "package has custom import demotion verifier script");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:48:  console.error("Admin template custom import demotion safety verification failed.");
./scripts/verify-admin-template-custom-import-demoted-safety.mjs:52:console.log("Admin template custom import demotion safety verification passed.");
./scripts/verify-adversary-attorney-reference-safety.mjs:41:mustContain("Graph preview grid remains six columns", matters, 'gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8, marginBottom: 14, fontSize: 12');
./app/api/documents/finalize-preview/route.ts:131:function storedTemplateFilename(baseName: string, template: any): string {
./app/api/documents/finalize-preview/route.ts:133:    safeFilenamePart(template?.defaultFilenameSuffix) ||
./app/api/documents/finalize-preview/route.ts:134:    safeFilenamePart(template?.label) ||
./app/api/documents/finalize-preview/route.ts:135:    safeFilenamePart(template?.key) ||
./app/api/documents/finalize-preview/route.ts:136:    "Stored Template";
./app/api/documents/finalize-preview/route.ts:140:async function buildStoredDbDocxTemplateDocuments(baseName: string, canGenerate: boolean) {
./app/api/documents/finalize-preview/route.ts:141:  const templates = await prisma.documentTemplate.findMany({
./app/api/documents/finalize-preview/route.ts:168:  return templates
./app/api/documents/finalize-preview/route.ts:169:    .map((template) => {
./app/api/documents/finalize-preview/route.ts:170:      const currentVersion = Array.isArray(template.versions) ? template.versions[0] : null;
./app/api/documents/finalize-preview/route.ts:176:      const metadata = template.metadata && typeof template.metadata === "object" && !Array.isArray(template.metadata)
./app/api/documents/finalize-preview/route.ts:177:        ? (template.metadata as any)
./app/api/documents/finalize-preview/route.ts:181:        key: template.key,
./app/api/documents/finalize-preview/route.ts:182:        label: template.label,
./app/api/documents/finalize-preview/route.ts:183:        filename: storedTemplateFilename(baseName, template),
./app/api/documents/finalize-preview/route.ts:184:        sourceEndpoint: `/api/documents/templates/stored-docx?versionId=${encodeURIComponent(currentVersion.id)}`,
./app/api/documents/finalize-preview/route.ts:190:        templateSource: "barsh-matters-db-template-repository",
./app/api/documents/finalize-preview/route.ts:192:        repositoryStatus: "stored-db-docx-template",
./app/api/documents/finalize-preview/route.ts:193:        storedTemplateVersionId: currentVersion.id,
./app/api/documents/finalize-preview/route.ts:194:        storedTemplateVersionNumber: currentVersion.versionNumber,
./app/api/documents/finalize-preview/route.ts:200:        productionTemplateReady:
./app/api/documents/finalize-preview/route.ts:201:          Boolean(metadata.productionTemplateReady) || currentVersion.status === "production-ready",
./app/api/documents/finalize-preview/route.ts:204:        mergeFields: template.mergeFields.map((field) => ({
./app/api/documents/finalize-preview/route.ts:251:  const storedDbTemplateDocuments = await buildStoredDbDocxTemplateDocuments(baseName, canGenerate);
./app/api/documents/finalize-preview/route.ts:254:    ...storedDbTemplateDocuments,
./app/api/documents/working-docx-latest/route.ts:10:function searchPhraseForTemplate(templateKey: string, templateLabel: string): string {
./app/api/documents/working-docx-latest/route.ts:11:  const key = clean(templateKey).toLowerCase();
./app/api/documents/working-docx-latest/route.ts:12:  const label = clean(templateLabel);
./app/api/documents/working-docx-latest/route.ts:22:    const templateKey = clean(req.nextUrl.searchParams.get("templateKey"));
./app/api/documents/working-docx-latest/route.ts:23:    const templateLabel = clean(req.nextUrl.searchParams.get("templateLabel"));
./app/api/documents/working-docx-latest/route.ts:24:    const filenameIncludes = searchPhraseForTemplate(templateKey, templateLabel);
./app/api/documents/working-docx-latest/route.ts:34:      templateKey,
./app/api/documents/working-docx-latest/route.ts:35:      templateLabel,
./app/api/settlements/documents-preview/route.ts:3:import { buildSettlementPlannedDocuments } from "@/lib/documents/templateRegistry";
./app/api/documents/packet/route.ts:369:  const templateFields = compactObject({
./app/api/documents/packet/route.ts:393:    readyForTemplates: true,
./app/api/documents/packet/route.ts:436:    templateFields,
./scripts/verify-placeholder-document-template-labels-safety.mjs:11:check("finalize preview supports template source contract", finalizePreview.includes("sourceTemplateContract") || finalizePreview.includes("templateSource"));
./scripts/verify-placeholder-document-template-labels-safety.mjs:12:check("finalize preview supports stored DB templates or placeholder fallback", finalizePreview.includes("stored") || finalizePreview.includes("placeholder"));
./scripts/verify-placeholder-document-template-labels-safety.mjs:14:check("UI avoids pretending templates are Clio templates", !mattersPage.includes("Clio template source of truth"));
./scripts/verify-placeholder-document-template-labels-safety.mjs:15:check("package script registered", pkg.includes("verify:placeholder-document-template-labels-safety"));
./scripts/verify-placeholder-document-template-labels-safety.mjs:17:console.log("PASS: placeholder/stored document template label safety passed.");
./scripts/verify-template-docx-db-storage-safety.mjs:3:const admin = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
./scripts/verify-template-docx-db-storage-safety.mjs:4:const confirm = fs.readFileSync("app/api/documents/templates/import-confirm/route.ts", "utf8");
./scripts/verify-template-docx-db-storage-safety.mjs:5:const route = fs.readFileSync("app/api/documents/templates/route.ts", "utf8");
./scripts/verify-template-docx-db-storage-safety.mjs:8:  "Template DOCX Storage",
./scripts/verify-template-docx-db-storage-safety.mjs:19:  "function uploadedTemplateFileFor",
./scripts/verify-template-docx-db-storage-safety.mjs:24:  "contentText: uploadedTemplateFile?.contentBase64 || null",
./scripts/verify-template-docx-db-storage-safety.mjs:25:  "storageKind: uploadedTemplateFile ? \"db-docx-base64\" : \"metadata-only\"",
./scripts/verify-template-docx-db-storage-safety.mjs:31:  "uploadedTemplateFile",
./scripts/verify-template-docx-db-storage-safety.mjs:47:  admin.indexOf("Template DOCX Storage"),
./scripts/verify-template-docx-db-storage-safety.mjs:73:  console.error("FAIL: template DOCX DB storage safety verifier failed");
./scripts/verify-template-docx-db-storage-safety.mjs:78:console.log("PASS: template DOCX DB storage captures DOCX base64 locally without Clio, Graph, email, print, or queue side effects.");
./app/api/documents/direct-finalize-preview/route.ts:108:function storedTemplateFilename(baseName: string, template: any): string {
./app/api/documents/direct-finalize-preview/route.ts:110:    safeFilenamePart(template?.defaultFilenameSuffix) ||
./app/api/documents/direct-finalize-preview/route.ts:111:    safeFilenamePart(template?.label) ||
./app/api/documents/direct-finalize-preview/route.ts:112:    safeFilenamePart(template?.key) ||
./app/api/documents/direct-finalize-preview/route.ts:113:    "Stored Template";
./app/api/documents/direct-finalize-preview/route.ts:117:async function buildStoredDbDocxTemplateDocuments(baseName: string, canGenerate: boolean) {
./app/api/documents/direct-finalize-preview/route.ts:118:  const templates = await prisma.documentTemplate.findMany({
./app/api/documents/direct-finalize-preview/route.ts:148:  return templates
./app/api/documents/direct-finalize-preview/route.ts:149:    .map((template) => {
./app/api/documents/direct-finalize-preview/route.ts:150:      const currentVersion = Array.isArray(template.versions) ? template.versions[0] : null;
./app/api/documents/direct-finalize-preview/route.ts:157:        template.metadata && typeof template.metadata === "object" && !Array.isArray(template.metadata)
./app/api/documents/direct-finalize-preview/route.ts:158:          ? (template.metadata as any)
./app/api/documents/direct-finalize-preview/route.ts:162:        key: template.key,
./app/api/documents/direct-finalize-preview/route.ts:163:        label: template.label,
./app/api/documents/direct-finalize-preview/route.ts:164:        filename: storedTemplateFilename(baseName, template),
./app/api/documents/direct-finalize-preview/route.ts:165:        sourceEndpoint: `/api/documents/templates/stored-docx?versionId=${encodeURIComponent(currentVersion.id)}`,
./app/api/documents/direct-finalize-preview/route.ts:171:        templateSource: "barsh-matters-db-template-repository",
./app/api/documents/direct-finalize-preview/route.ts:173:        repositoryStatus: "stored-db-docx-template",
./app/api/documents/direct-finalize-preview/route.ts:174:        storedTemplateVersionId: currentVersion.id,
./app/api/documents/direct-finalize-preview/route.ts:175:        storedTemplateVersionNumber: currentVersion.versionNumber,
./app/api/documents/direct-finalize-preview/route.ts:181:        productionTemplateReady:
./app/api/documents/direct-finalize-preview/route.ts:182:          Boolean(metadata.productionTemplateReady) || currentVersion.status === "production-ready",
./app/api/documents/direct-finalize-preview/route.ts:185:        mergeFields: template.mergeFields.map((field) => ({
./app/api/documents/direct-finalize-preview/route.ts:217:  const templateFields = documentData?.templateFields || packet?.templateFields || {};
./app/api/documents/direct-finalize-preview/route.ts:218:  const provider = safeFilePart(templateFields.providerName || packet?.provider?.displayName || "Provider");
./app/api/documents/direct-finalize-preview/route.ts:219:  const patient = safeFilePart(templateFields.patientName || packet?.patient?.displayName || "Patient");
./app/api/documents/direct-finalize-preview/route.ts:220:  const insurer = safeFilePart(templateFields.insurerName || packet?.insurer?.displayName || "Insurer");
./app/api/documents/direct-finalize-preview/route.ts:221:  const claimNumber = safeFilePart(templateFields.claimNumber || "No Claim");
./app/api/documents/direct-finalize-preview/route.ts:222:  const matterDisplay = safeFilePart(templateFields.displayNumber || displayNumber || "Direct Matter");
./app/api/documents/direct-finalize-preview/route.ts:245:    const templateFields = packetDocumentData?.templateFields || packet?.templateFields || {};
./app/api/documents/direct-finalize-preview/route.ts:246:    const resolvedDisplay = normalizeBrl(templateFields.displayNumber || directMatterDisplayNumber || (directMatterId ? `BRL${directMatterId}` : ""));
./app/api/documents/direct-finalize-preview/route.ts:262:    const plannedDocuments = await buildStoredDbDocxTemplateDocuments(baseName, canGenerate);
./app/api/documents/direct-finalize-preview/route.ts:265:      validation.blockingErrors.push("No enabled direct matter DOCX templates are available.");
./app/api/documents/direct-finalize-preview/route.ts:311:        provider: clean(templateFields.providerName),
./app/api/documents/direct-finalize-preview/route.ts:312:        patient: clean(templateFields.patientName),
./app/api/documents/direct-finalize-preview/route.ts:313:        insurer: clean(templateFields.insurerName),
./app/api/documents/direct-finalize-preview/route.ts:314:        claimNumber: clean(templateFields.claimNumber),
./app/api/documents/direct-finalize-preview/route.ts:315:        claimAmount: templateFields.claimAmount ?? null,
./app/api/documents/direct-finalize-preview/route.ts:316:        balancePresuit: templateFields.balancePresuit ?? null,
./app/api/settlements/documents-print-queue-local/route.ts:133:    const documentLabel = clean(selectedDocument.templateLabel || selectedDocument.label || deliveryCandidate.label || fallbackSkipped.label || documentKey);
./app/api/settlements/documents-print-queue-local/route.ts:190:          templateSource: clean(selectedDocument.templateRepositorySource || selectedDocument.templateSource) || "barsh-matters-settlement-template",
./app/api/settlements/documents-print-queue-local/route.ts:191:          productionTemplateReady: true,
./scripts/verify-master-field-edit-popup-standard-modal-safety.mjs:26:  "gridTemplateColumns: \"32px minmax(0, 1fr) 32px\"",
./scripts/verify-dedicated-mac-handoff-package.mjs:47:fileIncludes("docs/dedicated-mac-secrets-inventory-template.md", [
./app/api/documents/templates/import-confirm/route.ts:4:  buildTemplateImportPreview,
./app/api/documents/templates/import-confirm/route.ts:5:  normalizeTemplateImportRows,
./app/api/documents/templates/import-confirm/route.ts:6:  safetyTemplateImportConfirm,
./app/api/documents/templates/import-confirm/route.ts:7:  seededTemplateImportRows,
./app/api/documents/templates/import-confirm/route.ts:8:} from "@/lib/documents/templateImport";
./app/api/documents/templates/import-confirm/route.ts:13:function uploadedTemplateFileFor(row: any) {
./app/api/documents/templates/import-confirm/route.ts:14:  const file = row?.metadata?.uploadedTemplateFile;
./app/api/documents/templates/import-confirm/route.ts:38:  const uploadedTemplateFile = uploadedTemplateFileFor(row);
./app/api/documents/templates/import-confirm/route.ts:43:    templateSource: originalMetadata?.templateSource || row.repositorySource || "barsh-matters-template-import",
./app/api/documents/templates/import-confirm/route.ts:45:    productionTemplateReady: Boolean(row.productionTemplateReady),
./app/api/documents/templates/import-confirm/route.ts:47:    ...(uploadedTemplateFile
./app/api/documents/templates/import-confirm/route.ts:51:          uploadedTemplateFile: {
./app/api/documents/templates/import-confirm/route.ts:52:            name: uploadedTemplateFile.name,
./app/api/documents/templates/import-confirm/route.ts:53:            type: uploadedTemplateFile.type,
./app/api/documents/templates/import-confirm/route.ts:54:            size: uploadedTemplateFile.size,
./app/api/documents/templates/import-confirm/route.ts:55:            lastModified: uploadedTemplateFile.lastModified,
./app/api/documents/templates/import-confirm/route.ts:56:            lastModifiedIso: uploadedTemplateFile.lastModifiedIso,
./app/api/documents/templates/import-confirm/route.ts:57:            storageKind: uploadedTemplateFile.storageKind,
./app/api/documents/templates/import-confirm/route.ts:75:          action: "document-template-import-confirm",
./app/api/documents/templates/import-confirm/route.ts:76:          error: "Confirmed document template import requires confirm: true.",
./app/api/documents/templates/import-confirm/route.ts:77:          safety: safetyTemplateImportConfirm(false),
./app/api/documents/templates/import-confirm/route.ts:85:      ? seededTemplateImportRows(body?.category || "all")
./app/api/documents/templates/import-confirm/route.ts:86:      : normalizeTemplateImportRows(Array.isArray(body?.rows) ? body.rows : []);
./app/api/documents/templates/import-confirm/route.ts:88:    const existing = await prisma.documentTemplate.findMany({
./app/api/documents/templates/import-confirm/route.ts:99:    const preview = buildTemplateImportPreview({
./app/api/documents/templates/import-confirm/route.ts:108:          action: "document-template-import-confirm",
./app/api/documents/templates/import-confirm/route.ts:109:          error: "Template import blocked. Resolve invalid rows before confirming import.",
./app/api/documents/templates/import-confirm/route.ts:111:          safety: safetyTemplateImportConfirm(false),
./app/api/documents/templates/import-confirm/route.ts:123:        const template = await tx.documentTemplate.upsert({
./app/api/documents/templates/import-confirm/route.ts:152:        const latestVersion = await tx.documentTemplateVersion.findFirst({
./app/api/documents/templates/import-confirm/route.ts:153:          where: { templateId: template.id },
./app/api/documents/templates/import-confirm/route.ts:160:        const uploadedTemplateFile = uploadedTemplateFileFor(row);
./app/api/documents/templates/import-confirm/route.ts:162:        const version = await tx.documentTemplateVersion.create({
./app/api/documents/templates/import-confirm/route.ts:164:            templateId: template.id,
./app/api/documents/templates/import-confirm/route.ts:166:            status: row.productionTemplateReady ? "production-ready" : "draft",
./app/api/documents/templates/import-confirm/route.ts:167:            bodyFormat: "docx-template",
./app/api/documents/templates/import-confirm/route.ts:168:            storageKind: uploadedTemplateFile ? "db-docx-base64" : "metadata-only",
./app/api/documents/templates/import-confirm/route.ts:169:            contentText: uploadedTemplateFile?.contentBase64 || null,
./app/api/documents/templates/import-confirm/route.ts:173:              productionTemplateReady: Boolean(row.productionTemplateReady),
./app/api/documents/templates/import-confirm/route.ts:175:              ...(uploadedTemplateFile
./app/api/documents/templates/import-confirm/route.ts:177:                    uploadedTemplateFile: {
./app/api/documents/templates/import-confirm/route.ts:178:                      name: uploadedTemplateFile.name,
./app/api/documents/templates/import-confirm/route.ts:179:                      type: uploadedTemplateFile.type,
./app/api/documents/templates/import-confirm/route.ts:180:                      size: uploadedTemplateFile.size,
./app/api/documents/templates/import-confirm/route.ts:181:                      lastModified: uploadedTemplateFile.lastModified,
./app/api/documents/templates/import-confirm/route.ts:182:                      lastModifiedIso: uploadedTemplateFile.lastModifiedIso,
./app/api/documents/templates/import-confirm/route.ts:183:                      storageKind: uploadedTemplateFile.storageKind,
./app/api/documents/templates/import-confirm/route.ts:195:        await tx.documentTemplate.update({
./app/api/documents/templates/import-confirm/route.ts:196:          where: { id: template.id },
./app/api/documents/templates/import-confirm/route.ts:201:          await tx.documentTemplateMergeField.upsert({
./app/api/documents/templates/import-confirm/route.ts:203:              templateId_key: {
./app/api/documents/templates/import-confirm/route.ts:204:                templateId: template.id,
./app/api/documents/templates/import-confirm/route.ts:224:              templateId: template.id,
./app/api/documents/templates/import-confirm/route.ts:245:          templateId: template.id,
./app/api/documents/templates/import-confirm/route.ts:250:          productionTemplateReady: Boolean(row.productionTemplateReady),
./app/api/documents/templates/import-confirm/route.ts:252:          storageKind: uploadedTemplateFile ? "db-docx-base64" : "metadata-only",
./app/api/documents/templates/import-confirm/route.ts:253:          actualFileStored: Boolean(uploadedTemplateFile),
./app/api/documents/templates/import-confirm/route.ts:263:      action: "document-template-import-confirm",
./app/api/documents/templates/import-confirm/route.ts:265:      sourceOfTruth: "barsh-matters-local-template-repository",
./app/api/documents/templates/import-confirm/route.ts:269:      safety: safetyTemplateImportConfirm(true),
./app/api/documents/templates/import-confirm/route.ts:271:        "Confirmed document template import wrote only local Barsh Matters DocumentTemplate, DocumentTemplateVersion, and DocumentTemplateMergeField rows. It did not upload files, generate documents, write Clio, create drafts, send email, print, or queue documents.",
./app/api/documents/templates/import-confirm/route.ts:277:        action: "document-template-import-confirm",
./app/api/documents/templates/import-confirm/route.ts:278:        error: error?.message || "Document template import confirm failed.",
./app/api/documents/templates/import-confirm/route.ts:279:        safety: safetyTemplateImportConfirm(false),
./scripts/verify-invoice-step1-preview-card-polish-safety.mjs:42:mustContain("invoice page", page, 'gridTemplateColumns: "minmax(190px, 1fr) minmax(220px, 1fr) minmax(180px, 0.9fr) minmax(180px, 0.9fr)"');
./scripts/verify-document-template-repository-api-foundation.mjs:4:const registryPath = "lib/documents/templateRegistry.ts";
./scripts/verify-document-template-repository-api-foundation.mjs:5:const routePath = "app/api/documents/templates/route.ts";
./scripts/verify-document-template-repository-api-foundation.mjs:24:  ["repository records helper exists", registry.includes("templateRepositoryRecords")],
./scripts/verify-document-template-repository-api-foundation.mjs:28:  ["route imports registry fallback", route.includes("templateRepositoryRecords")],
./scripts/verify-document-template-repository-api-foundation.mjs:30:  ["route reads DocumentTemplate table", route.includes("prisma.documentTemplate.findMany")],
./scripts/verify-document-template-repository-api-foundation.mjs:33:  ["route falls back to registry when DB empty", route.includes("fallbackRegistryTemplates") && route.includes("templates.length === 0")],
./scripts/verify-document-template-repository-api-foundation.mjs:35:  ["route blocks template writes", route.includes("templateRepositoryWrites: false")],
./scripts/verify-document-template-repository-api-foundation.mjs:37:  ["route has future repository marker", route.includes("editable document-template repository")],
./scripts/verify-document-template-repository-api-foundation.mjs:58:console.log("PASS: document template repository API foundation verifier");
./scripts/verify-browser-history-ui-state-contract.mjs:12:const documentTemplatesPagePath = "app/admin/document-templates/page.tsx";
./scripts/verify-browser-history-ui-state-contract.mjs:23:const documentTemplatesPage = fs.readFileSync(documentTemplatesPagePath, "utf8");
./scripts/verify-browser-history-ui-state-contract.mjs:92:mustContain("/admin/document-templates has URL parser", documentTemplatesPage, "function documentTemplateStateFromUrl(): DocumentTemplateUrlState");
./scripts/verify-browser-history-ui-state-contract.mjs:93:mustContain("/admin/document-templates reads category from URL", documentTemplatesPage, "category: normalizeTemplateCategory(params.get(\"category\"))");
./scripts/verify-browser-history-ui-state-contract.mjs:94:mustContain("/admin/document-templates pushes history", documentTemplatesPage, "window.history.pushState({ barshMattersDocumentTemplates: true }, \"\", nextUrl);");
./scripts/verify-browser-history-ui-state-contract.mjs:95:mustContain("/admin/document-templates listens to popstate", documentTemplatesPage, 'window.addEventListener("popstate", applyDocumentTemplateStateFromUrl);');
./scripts/verify-browser-history-ui-state-contract.mjs:96:mustContain("/admin/document-templates restores templates from URL", documentTemplatesPage, "void loadTemplates(urlState.category);");
./app/api/documents/templates/replace-version/route.ts:21:  return raw || "Replacement Template";
./app/api/documents/templates/replace-version/route.ts:26:    action: "document-template-replace-version",
./app/api/documents/templates/replace-version/route.ts:28:    templateRepositoryWrites: databaseRecordsChanged,
./app/api/documents/templates/replace-version/route.ts:46:    const templateKey = clean(form.get("templateKey"));
./app/api/documents/templates/replace-version/route.ts:64:      templateKey,
./app/api/documents/templates/replace-version/route.ts:84:    templateKey: clean(body?.templateKey),
./app/api/documents/templates/replace-version/route.ts:105:  if (!input?.templateKey) errors.push("Missing template key.");
./app/api/documents/templates/replace-version/route.ts:108:    errors.push("Replacement file must be a .docx Word template.");
./app/api/documents/templates/replace-version/route.ts:128:          action: "document-template-replace-version",
./app/api/documents/templates/replace-version/route.ts:138:    const template = input.templateKey
./app/api/documents/templates/replace-version/route.ts:139:      ? await prisma.documentTemplate.findUnique({
./app/api/documents/templates/replace-version/route.ts:140:          where: { key: input.templateKey },
./app/api/documents/templates/replace-version/route.ts:153:    if (!template) {
./app/api/documents/templates/replace-version/route.ts:157:          action: "document-template-replace-version",
./app/api/documents/templates/replace-version/route.ts:158:          error: "Template was not found in the local Barsh Matters template repository.",
./app/api/documents/templates/replace-version/route.ts:159:          templateKey: input.templateKey,
./app/api/documents/templates/replace-version/route.ts:167:    const latestVersion = template.versions?.[0] || null;
./app/api/documents/templates/replace-version/route.ts:173:      templateId: template.id,
./app/api/documents/templates/replace-version/route.ts:174:      templateKey: template.key,
./app/api/documents/templates/replace-version/route.ts:175:      templateLabel: template.label,
./app/api/documents/templates/replace-version/route.ts:176:      currentVersionId: template.currentVersionId || null,
./app/api/documents/templates/replace-version/route.ts:184:      mergeFieldCount: template.mergeFields?.length || 0,
./app/api/documents/templates/replace-version/route.ts:193:          action: "document-template-replace-version",
./app/api/documents/templates/replace-version/route.ts:195:          error: "Replacement template validation failed.",
./app/api/documents/templates/replace-version/route.ts:206:        action: "document-template-replace-version",
./app/api/documents/templates/replace-version/route.ts:211:          "Preview only.  No database records changed.  Confirm replacement to create a new DocumentTemplateVersion and make it current.",
./app/api/documents/templates/replace-version/route.ts:219:        const version = await tx.documentTemplateVersion.create({
./app/api/documents/templates/replace-version/route.ts:221:            templateId: template.id,
./app/api/documents/templates/replace-version/route.ts:224:            bodyFormat: "docx-template",
./app/api/documents/templates/replace-version/route.ts:228:              replacementSource: "template-detail-replacement-upload",
./app/api/documents/templates/replace-version/route.ts:231:              uploadedTemplateFile: {
./app/api/documents/templates/replace-version/route.ts:243:              priorCurrentVersionId: template.currentVersionId || null,
./app/api/documents/templates/replace-version/route.ts:249:              clean((safeJsonObject(template.metadata) as any).mergeFieldSet) ||
./app/api/documents/templates/replace-version/route.ts:254:        await tx.documentTemplate.update({
./app/api/documents/templates/replace-version/route.ts:255:          where: { id: template.id },
./app/api/documents/templates/replace-version/route.ts:259:              ...safeJsonObject(template.metadata),
./app/api/documents/templates/replace-version/route.ts:281:      action: "document-template-replace-version",
./app/api/documents/templates/replace-version/route.ts:283:      template: {
./app/api/documents/templates/replace-version/route.ts:284:        id: template.id,
./app/api/documents/templates/replace-version/route.ts:285:        key: template.key,
./app/api/documents/templates/replace-version/route.ts:286:        label: template.label,
./app/api/documents/templates/replace-version/route.ts:287:        priorCurrentVersionId: template.currentVersionId || null,
./app/api/documents/templates/replace-version/route.ts:303:        "Confirmed replacement created a new DocumentTemplateVersion, preserved prior versions, and updated currentVersionId.  It did not generate documents, upload to Clio, send email, create drafts, print, or queue documents.",
./app/api/documents/templates/replace-version/route.ts:309:        action: "document-template-replace-version",
./app/api/documents/templates/replace-version/route.ts:310:        error: error?.message || "Template replacement failed.",
./app/api/settlements/documents-print-local/route.ts:88:      clean(selected.templateLabel || selected.label || selected.key || finalizedCandidate.label) ||
./app/api/settlements/documents-print-local/route.ts:162:      grid-template-columns: 1fr 1fr;
./scripts/verify-administrator-header-menu-gate.mjs:31:  check(`${file} has Templates in admin menu`, text.includes(">📄 Templates<") || text.includes("📄 Templates"));
./app/api/documents/finalize/route.ts:437:        sourceTemplateContract: {
./app/api/documents/finalize/route.ts:445:          storedTemplateVersionId: clean((document as any).storedTemplateVersionId),
./app/api/documents/finalize/route.ts:446:          storedTemplateVersionNumber: (document as any).storedTemplateVersionNumber || null,
./app/api/documents/working-docx/route.ts:223:            storedTemplateVersionId: clean(selectedDocument.storedTemplateVersionId),
./app/api/documents/working-docx/route.ts:224:            storedTemplateVersionNumber: selectedDocument.storedTemplateVersionNumber || null,
./app/api/documents/working-docx/route.ts:263:        storedTemplateVersionId: clean(selectedDocument.storedTemplateVersionId),
./app/api/documents/working-docx/route.ts:264:        storedTemplateVersionNumber: selectedDocument.storedTemplateVersionNumber || null,
./app/api/documents/working-docx/route.ts:281:      sourceTemplateContract: {
./app/api/documents/working-docx/route.ts:289:        storedTemplateVersionId: clean(selectedDocument.storedTemplateVersionId),
./app/api/documents/working-docx/route.ts:290:        storedTemplateVersionNumber: selectedDocument.storedTemplateVersionNumber || null,
./scripts/verify-document-template-registry-foundation.mjs:4:const registryPath = "lib/documents/templateRegistry.ts";
./scripts/verify-document-template-registry-foundation.mjs:17:  ["future repository marker", registry.includes("database-backed editable template repository")],
./scripts/verify-document-template-registry-foundation.mjs:35:console.log("PASS: document template registry foundation verifier");
./app/api/documents/templates/import-preview/route.ts:4:  buildTemplateImportPreview,
./app/api/documents/templates/import-preview/route.ts:5:  normalizeTemplateImportRows,
./app/api/documents/templates/import-preview/route.ts:6:  safetyTemplateImportPreview,
./app/api/documents/templates/import-preview/route.ts:7:  seededTemplateImportRows,
./app/api/documents/templates/import-preview/route.ts:8:} from "@/lib/documents/templateImport";
./app/api/documents/templates/import-preview/route.ts:18:      ? seededTemplateImportRows(body?.category || "all")
./app/api/documents/templates/import-preview/route.ts:19:      : normalizeTemplateImportRows(Array.isArray(body?.rows) ? body.rows : []);
./app/api/documents/templates/import-preview/route.ts:21:    const existing = await prisma.documentTemplate.findMany({
./app/api/documents/templates/import-preview/route.ts:32:    const preview = buildTemplateImportPreview({
./app/api/documents/templates/import-preview/route.ts:38:      action: "document-template-import-preview",
./app/api/documents/templates/import-preview/route.ts:41:      sourceOfTruth: "barsh-matters-local-template-repository",
./app/api/documents/templates/import-preview/route.ts:44:      safety: safetyTemplateImportPreview(),
./app/api/documents/templates/import-preview/route.ts:46:        "Preview-only document template import. It validates template rows and existing keys but does not write DocumentTemplate, DocumentTemplateVersion, DocumentTemplateMergeField, Clio, documents, print queue, drafts, or email.",
./app/api/documents/templates/import-preview/route.ts:52:        action: "document-template-import-preview",
./app/api/documents/templates/import-preview/route.ts:53:        error: error?.message || "Document template import preview failed.",
./app/api/documents/templates/import-preview/route.ts:54:        safety: safetyTemplateImportPreview(),
./scripts/verify-court-calendar-page-safety.mjs:61:if (!page.includes('gridTemplateColumns: "130px 130px minmax(210px, 1fr) 180px minmax(250px, 1.1fr) minmax(220px, 0.95fr) 190px"')) failures.push('page missing gridTemplateColumns: "130px 130px minmax(210px, 1fr) 180px minmax(250px, 1.1fr) minmax(220px, 0.95fr) 190px"');
./app/api/documents/templates/stored-docx/route.ts:12:  const raw = clean(value) || "barsh-matters-template.docx";
./app/api/documents/templates/stored-docx/route.ts:24:          action: "document-template-stored-docx-download",
./app/api/documents/templates/stored-docx/route.ts:31:    const version = await prisma.documentTemplateVersion.findUnique({
./app/api/documents/templates/stored-docx/route.ts:34:        template: {
./app/api/documents/templates/stored-docx/route.ts:48:          action: "document-template-stored-docx-download",
./app/api/documents/templates/stored-docx/route.ts:49:          error: "Stored DOCX template version was not found.",
./app/api/documents/templates/stored-docx/route.ts:59:          action: "document-template-stored-docx-download",
./app/api/documents/templates/stored-docx/route.ts:60:          error: "This template version does not contain a stored DB DOCX payload.",
./app/api/documents/templates/stored-docx/route.ts:69:      version.template?.defaultFilenameSuffix ||
./app/api/documents/templates/stored-docx/route.ts:70:        version.template?.label ||
./app/api/documents/templates/stored-docx/route.ts:71:        version.template?.key ||
./app/api/documents/templates/stored-docx/route.ts:83:        "X-Barsh-Matters-Action": "document-template-stored-docx-download",
./app/api/documents/templates/stored-docx/route.ts:91:        action: "document-template-stored-docx-download",
./app/api/documents/templates/stored-docx/route.ts:92:        error: error?.message || "Stored DOCX template download failed.",
./scripts/verify-administrator-header-opens-admin-home-only.mjs:26:  check(`${file} no header Templates dropdown item`, !text.includes("📄 Templates"));
./scripts/verify-administrator-header-opens-admin-home-only.mjs:34:check("Admin Home still links Document Templates", adminHome.includes("/admin/document-templates"));
./app/api/documents/templates/detail/route.ts:4:  BarshDocumentTemplateCategory,
./app/api/documents/templates/detail/route.ts:5:  mergeFieldsForTemplate,
./app/api/documents/templates/detail/route.ts:6:  templateRepositoryRecords,
./app/api/documents/templates/detail/route.ts:7:} from "@/lib/documents/templateRegistry";
./app/api/documents/templates/detail/route.ts:13:function normalizeCategory(value: string): BarshDocumentTemplateCategory | "all" {
./app/api/documents/templates/detail/route.ts:23:    return cleaned as BarshDocumentTemplateCategory | "all";
./app/api/documents/templates/detail/route.ts:51:        ? `/api/documents/templates/stored-docx?versionId=${encodeURIComponent(version.id)}`
./app/api/documents/templates/detail/route.ts:56:function dbTemplateDetail(row: any) {
./app/api/documents/templates/detail/route.ts:79:    repositoryStatus: "database-template",
./app/api/documents/templates/detail/route.ts:103:function fallbackTemplateDetail(key: string, category: BarshDocumentTemplateCategory | "all") {
./app/api/documents/templates/detail/route.ts:104:  const row = templateRepositoryRecords(category).find((template: any) => template.key === key);
./app/api/documents/templates/detail/route.ts:107:  const mergeFields = Array.isArray(row.mergeFields) ? row.mergeFields : mergeFieldsForTemplate(row);
./app/api/documents/templates/detail/route.ts:112:    repositoryStatus: "seed-template-fallback",
./app/api/documents/templates/detail/route.ts:120:function safetyTemplateDetail() {
./app/api/documents/templates/detail/route.ts:122:    action: "document-template-detail-preview",
./app/api/documents/templates/detail/route.ts:125:    templateRepositoryWrites: false,
./app/api/documents/templates/detail/route.ts:144:          action: "document-template-detail-preview",
./app/api/documents/templates/detail/route.ts:145:          error: "Missing template key.",
./app/api/documents/templates/detail/route.ts:146:          safety: safetyTemplateDetail(),
./app/api/documents/templates/detail/route.ts:152:    const row = await prisma.documentTemplate.findUnique({
./app/api/documents/templates/detail/route.ts:164:    const template = row ? dbTemplateDetail(row) : fallbackTemplateDetail(key, category);
./app/api/documents/templates/detail/route.ts:166:    if (!template) {
./app/api/documents/templates/detail/route.ts:170:          action: "document-template-detail-preview",
./app/api/documents/templates/detail/route.ts:171:          error: "Template was not found in the database repository or fallback registry.",
./app/api/documents/templates/detail/route.ts:174:          safety: safetyTemplateDetail(),
./app/api/documents/templates/detail/route.ts:182:      action: "document-template-detail-preview",
./app/api/documents/templates/detail/route.ts:183:      sourceOfTruth: "barsh-matters-local-template-repository",
./app/api/documents/templates/detail/route.ts:187:      template,
./app/api/documents/templates/detail/route.ts:190:          "Future replacement workflow should create a new DocumentTemplateVersion row, preserve prior versions, update currentVersionId, and leave document generation/finalization behavior unchanged until explicitly selected.",
./app/api/documents/templates/detail/route.ts:192:          "Future merge-field management should preserve visible_ui, hidden_internal, computed, and system visibility metadata while allowing additions and revisions without deleting historical template versions.",
./app/api/documents/templates/detail/route.ts:196:      safety: safetyTemplateDetail(),
./app/api/documents/templates/detail/route.ts:198:        "Read-only template detail endpoint.  It reads one template, its versions, and merge fields.  It does not edit templates, upload files, generate documents, write Clio, create drafts, send email, print, or queue documents.",
./app/api/documents/templates/detail/route.ts:204:        action: "document-template-detail-preview",
./app/api/documents/templates/detail/route.ts:205:        error: error?.message || "Document template detail lookup failed.",
./app/api/documents/templates/detail/route.ts:206:        safety: safetyTemplateDetail(),
./app/api/documents/matter-packet/route.ts:318:    const templateFields = compactObject({
./app/api/documents/matter-packet/route.ts:358:      readyForTemplates: true,
./app/api/documents/matter-packet/route.ts:372:      templateFields,
./scripts/verify-settlement-document-workflow-ui-safety.mjs:26:check("selected template fallback exists", page.includes("displayedSelectedTemplate") || page.includes("selectedTemplate"));
./scripts/verify-document-template-dialog-api-wiring.mjs:7:  ["repository templates state exists", page.includes("masterDocumentRepositoryTemplates")],
./scripts/verify-document-template-dialog-api-wiring.mjs:8:  ["repository loader exists", page.includes("loadMasterDocumentRepositoryTemplates")],
./scripts/verify-document-template-dialog-api-wiring.mjs:9:  ["templates API called", page.includes("/api/documents/templates?category=")],
./scripts/verify-document-template-dialog-api-wiring.mjs:10:  ["launch loads preview and templates together", page.includes("Promise.all") && page.includes("loadMasterDocumentRepositoryTemplates({ mode })")],
./scripts/verify-document-template-dialog-api-wiring.mjs:13:  ["settlement source copy references repository", page.includes("Template source: /api/documents/templates?category=settlement")],
./scripts/verify-document-template-dialog-api-wiring.mjs:27:console.log("PASS: document template dialog API wiring verifier");
./scripts/verify-settlement-document-artifact-contract-usage-safety.mjs:22:check("settlement route still marks placeholder seeded", route.includes("templateSource") && route.includes("placeholder-seeded"));
./scripts/verify-settlement-document-artifact-contract-usage-safety.mjs:23:check("settlement route still marks production template false", route.includes("productionTemplateReady") && route.includes("false"));
./scripts/verify-court-calendar-webcivil-local-import-safety.mjs:11:  "data-barsh-court-calendar-webcivil-local-copy-template",
./scripts/verify-court-calendar-webcivil-local-import-safety.mjs:14:  "webCivilImportTemplateText",
./scripts/verify-master-document-dropdown-stored-db-template-safety.mjs:8:  "Stored local DOCX templates appear first",
./scripts/verify-master-document-dropdown-stored-db-template-safety.mjs:12:  "masterDocumentRepositoryTemplates",
./scripts/verify-master-document-dropdown-stored-db-template-safety.mjs:45:  console.error("FAIL: master document dropdown stored DB template verifier failed");
./scripts/verify-master-document-dropdown-stored-db-template-safety.mjs:50:console.log("PASS: master document generation dropdown surfaces stored DB DOCX templates without delivery/finalization side effects.");
./scripts/verify-document-template-replacement-versioning-safety.mjs:16:const route = read("app/api/documents/templates/replace-version/route.ts");
./scripts/verify-document-template-replacement-versioning-safety.mjs:17:const detailPage = read("app/admin/document-templates/[key]/page.tsx");
./scripts/verify-document-template-replacement-versioning-safety.mjs:20:assert(route.includes("document-template-replace-version"), "replacement route identifies document-template-replace-version action");
./scripts/verify-document-template-replacement-versioning-safety.mjs:23:assert(route.includes("DocumentTemplateVersion"), "replacement route creates DocumentTemplateVersion records");
./scripts/verify-document-template-replacement-versioning-safety.mjs:24:assert(route.includes("documentTemplateVersion.create"), "replacement route creates a new version");
./scripts/verify-document-template-replacement-versioning-safety.mjs:34:assert(detailPage.includes('data-barsh-template-replacement-workflow="true"'), "template detail page exposes replacement workflow marker");
./scripts/verify-document-template-replacement-versioning-safety.mjs:35:assert(detailPage.includes("Preview Replacement"), "template detail page has Preview Replacement button");
./scripts/verify-document-template-replacement-versioning-safety.mjs:36:assert(detailPage.includes("Confirm Replacement Version"), "template detail page has Confirm Replacement Version button");
./scripts/verify-document-template-replacement-versioning-safety.mjs:37:assert(detailPage.includes("/api/documents/templates/replace-version"), "template detail page calls replacement route");
./scripts/verify-document-template-replacement-versioning-safety.mjs:38:assert(detailPage.includes("Prior versions will be preserved"), "template detail page warns that prior versions are preserved");
./scripts/verify-document-template-replacement-versioning-safety.mjs:39:assert(detailPage.includes("DocumentTemplateVersion"), "template detail page explains new DocumentTemplateVersion behavior");
./scripts/verify-document-template-replacement-versioning-safety.mjs:41:assert(pkg.scripts?.["verify:document-template-replacement-versioning-safety"], "package has replacement versioning verifier script");
./scripts/verify-document-template-replacement-versioning-safety.mjs:44:  console.error("Document template replacement versioning safety verification failed.");
./scripts/verify-document-template-replacement-versioning-safety.mjs:48:console.log("Document template replacement versioning safety verification passed.");
./scripts/verify-master-template-repository-load-category-safety.mjs:7:  "loadMasterDocumentRepositoryTemplates",
./scripts/verify-master-template-repository-load-category-safety.mjs:8:  "/api/documents/templates?category=",
./scripts/verify-master-template-repository-load-category-safety.mjs:9:  "lawsuit mode loads all stored local DOCX templates first",
./scripts/verify-master-template-repository-load-category-safety.mjs:28:const loadStart = page.indexOf("async function loadMasterDocumentRepositoryTemplates");
./scripts/verify-master-template-repository-load-category-safety.mjs:39:  console.error("FAIL: master template repository load category verifier failed");
./scripts/verify-master-template-repository-load-category-safety.mjs:44:console.log("PASS: master document generation loads all stored local DOCX templates in lawsuit mode while preserving settlement category mode.");
./scripts/verify-payment-popup-ux-polish-safety.mjs:73:mustContain("lawsuit payment popup header centered", matters, 'gridTemplateColumns: "38px minmax(0, 1fr) 38px"');
./scripts/verify-direct-matter-document-packet-safety.mjs:31:mustContain("readyForTemplates true", "readyForTemplates: true");
./scripts/verify-direct-matter-document-packet-safety.mjs:35:mustContain("templateFields", "templateFields");
./scripts/verify-local-document-packet-safety.mjs:30:mustContain("readyForTemplates true", "readyForTemplates: true");
./scripts/verify-local-document-packet-safety.mjs:34:mustContain("templateFields", "templateFields");
./scripts/verify-document-artifact-contract-safety.mjs:18:check("template repository helper exists", text.includes("buildTemplateRepositoryDocxRouteArtifact"));
./scripts/verify-document-artifact-contract-safety.mjs:22:check("template source includes placeholder seeded", text.includes('"placeholder-seeded"'));
./scripts/verify-document-artifact-contract-safety.mjs:23:check("template source includes template repository db", text.includes('"template-repository-db"'));
./scripts/verify-document-artifact-contract-safety.mjs:24:check("template source includes uploaded production template", text.includes('"uploaded-production-template"'));
./scripts/verify-document-artifact-contract-safety.mjs:25:check("production readiness fields exist", text.includes("productionTemplateReady") && text.includes("finalProductionDocument"));
./scripts/verify-document-artifact-contract-safety.mjs:28:check("safety flags exist", text.includes("noProductionTemplatePretended") && text.includes("noPdfPretended") && text.includes("noClioUploadPretended"));
./scripts/verify-document-artifact-contract-safety.mjs:29:check("placeholder helper cannot mark final production", text.includes("productionTemplateReady: false") && text.includes("finalProductionDocument: false"));
./scripts/verify-provider-client-identity-nowrap-safety.mjs:39:mustContain("client page", page, 'gridTemplateColumns: "minmax(450px, 1.05fr) minmax(440px, 1fr) minmax(320px, 0.85fr)"');
./scripts/verify-provider-client-identity-nowrap-safety.mjs:40:mustContain("client page", page, 'gridTemplateColumns: "100px max-content"');
./scripts/verify-direct-matter-document-preview-ui-safety.mjs:35:mustContain("templateFields JSON details", "Raw Template Fields");
./scripts/verify-invoice-step2-review-card-polish-safety.mjs:39:mustContain("invoice page", page, 'gridTemplateColumns: "repeat(4, minmax(190px, 1fr))"');
./app/api/documents/templates/route.ts:4:  BarshDocumentTemplateCategory,
./app/api/documents/templates/route.ts:5:  mergeFieldsForTemplate,
./app/api/documents/templates/route.ts:6:  templateRepositoryRecords,
./app/api/documents/templates/route.ts:7:} from "@/lib/documents/templateRegistry";
./app/api/documents/templates/route.ts:16:function normalizeCategory(value: string): BarshDocumentTemplateCategory | "all" {
./app/api/documents/templates/route.ts:30:function safetyDocumentTemplateRepository() {
./app/api/documents/templates/route.ts:32:    action: "document-template-repository-preview",
./app/api/documents/templates/route.ts:34:    sourceOfTruth: "barsh-matters-local-template-repository",
./app/api/documents/templates/route.ts:44:    templatesEdited: false,
./app/api/documents/templates/route.ts:45:    templateRepositoryWrites: false,
./app/api/documents/templates/route.ts:49:function readOnlyDbTemplateToRepositoryRecord(row: any) {
./app/api/documents/templates/route.ts:82:          uploadedTemplateFile:
./app/api/documents/templates/route.ts:86:              ? (currentVersion.contentJson as any).uploadedTemplateFile || null
./app/api/documents/templates/route.ts:92:    repositoryStatus: "database-template",
./app/api/documents/templates/route.ts:111:async function readDatabaseTemplates(category: BarshDocumentTemplateCategory | "all") {
./app/api/documents/templates/route.ts:117:  const rows = await prisma.documentTemplate.findMany({
./app/api/documents/templates/route.ts:139:  return rows.map(readOnlyDbTemplateToRepositoryRecord);
./app/api/documents/templates/route.ts:142:function fallbackRegistryTemplates(category: BarshDocumentTemplateCategory | "all") {
./app/api/documents/templates/route.ts:143:  return templateRepositoryRecords(category).map((template: any) => ({
./app/api/documents/templates/route.ts:144:    ...template,
./app/api/documents/templates/route.ts:146:    repositoryStatus: "seed-template-fallback",
./app/api/documents/templates/route.ts:148:    editableLater: Boolean(template.editableLater),
./app/api/documents/templates/route.ts:149:    mergeFields: Array.isArray(template.mergeFields)
./app/api/documents/templates/route.ts:150:      ? template.mergeFields
./app/api/documents/templates/route.ts:151:      : mergeFieldsForTemplate(template),
./app/api/documents/templates/route.ts:160:    let templates = await readDatabaseTemplates(category);
./app/api/documents/templates/route.ts:162:    if (templates.length === 0) {
./app/api/documents/templates/route.ts:164:      templates = fallbackRegistryTemplates(category);
./app/api/documents/templates/route.ts:169:      action: "document-template-repository-preview",
./app/api/documents/templates/route.ts:171:      sourceOfTruth: "barsh-matters-local-template-repository",
./app/api/documents/templates/route.ts:174:      repositoryFuture: "editable document-template repository with versioning, merge fields, uploaded Word templates, and finalized document vault integration",
./app/api/documents/templates/route.ts:176:      count: templates.length,
./app/api/documents/templates/route.ts:177:      templates,
./app/api/documents/templates/route.ts:178:      safety: safetyDocumentTemplateRepository(),
./app/api/documents/templates/route.ts:180:        "Read-only document-template repository endpoint.  It reads local Barsh Matters DocumentTemplate tables when records exist and falls back to seeded code-registry templates when the database repository is empty.  It does not edit templates, seed templates, generate documents, upload to Clio, create drafts, send email, print, or queue documents.",
./app/api/documents/templates/route.ts:186:        action: "document-template-repository-preview",
./app/api/documents/templates/route.ts:188:        sourceOfTruth: "barsh-matters-local-template-repository",
./app/api/documents/templates/route.ts:189:        error: error?.message || "Document template repository preview failed.",
./app/api/documents/templates/route.ts:190:        safety: safetyDocumentTemplateRepository(),
./scripts/verify-stored-db-docx-workflow-safety.mjs:17:const importConfirm = read("app/api/documents/templates/import-confirm/route.ts");
./scripts/verify-stored-db-docx-workflow-safety.mjs:18:const templatesRoute = read("app/api/documents/templates/route.ts");
./scripts/verify-stored-db-docx-workflow-safety.mjs:21:const storedDocxRoute = read("app/api/documents/templates/stored-docx/route.ts");
./scripts/verify-stored-db-docx-workflow-safety.mjs:22:const adminPage = read("app/admin/document-templates/page.tsx");
./scripts/verify-stored-db-docx-workflow-safety.mjs:39:assert(importConfirm.includes("maxWait: 10000"), "template import confirm uses Prisma transaction maxWait 10000");
./scripts/verify-stored-db-docx-workflow-safety.mjs:40:assert(importConfirm.includes("timeout: 30000"), "template import confirm uses Prisma transaction timeout 30000");
./scripts/verify-stored-db-docx-workflow-safety.mjs:41:assert(importConfirm.includes('storageKind: "db-docx-base64"'), "template import confirm supports stored DB DOCX storage kind");
./scripts/verify-stored-db-docx-workflow-safety.mjs:42:assert(importConfirm.includes("contentText"), "template import confirm writes DOCX base64 contentText");
./scripts/verify-stored-db-docx-workflow-safety.mjs:43:assert(templatesRoute.includes("hasStoredDocx"), "template repository API reports hasStoredDocx");
./scripts/verify-stored-db-docx-workflow-safety.mjs:44:assert(templatesRoute.includes("storedDocxBytes"), "template repository API reports storedDocxBytes");
./scripts/verify-stored-db-docx-workflow-safety.mjs:45:assert(templatesRoute.includes("barsh-matters-db"), "template repository API reads database repository first");
./scripts/verify-stored-db-docx-workflow-safety.mjs:49:assert(!adminPage.includes('"example-production-template"'), "admin page no longer uses old example-production-template key");
./scripts/verify-admin-custom-template-import-ui-safety.mjs:3:const page = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
./scripts/verify-admin-custom-template-import-ui-safety.mjs:16:check("custom template rows state exists", page.includes("customTemplateRowsText"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:17:check("custom preview function exists", page.includes("previewCustomTemplateRowsImport"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:18:check("custom confirm function exists", page.includes("confirmCustomTemplateRowsImport"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:19:check("custom parser requires JSON array", page.includes("Template import JSON must be an array"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:22:  page.includes("Advanced / Debug Template Row Import") &&
./scripts/verify-admin-custom-template-import-ui-safety.mjs:23:    page.includes('data-barsh-advanced-custom-template-import="true"') &&
./scripts/verify-admin-custom-template-import-ui-safety.mjs:24:    page.includes('data-barsh-advanced-custom-template-import-panel="true"')
./scripts/verify-admin-custom-template-import-ui-safety.mjs:28:check("custom import calls preview route", page.includes("/api/documents/templates/import-preview"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:29:check("custom import calls confirm route", page.includes("/api/documents/templates/import-confirm"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:33:check("custom preview displays hidden/internal count", page.includes("customTemplatePreview.summary?.hiddenInternalMergeFields"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:34:check("custom preview displays visible UI count", page.includes("customTemplatePreview.summary?.visibleMergeFields"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:35:check("custom import displays no Clio/email/print safety", page.includes("customTemplateConfirmResult.safety?.clioRecordsChanged"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:36:check("custom confirm blocks base64 DOCX payloads", page.includes("customTemplateConfirmBlocked") && page.includes("Confirming base64-stored DOCX payloads through this legacy JSON importer is blocked"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:39:check("package script registered", pkg.includes("verify:admin-custom-template-import-ui-safety"));
./scripts/verify-admin-custom-template-import-ui-safety.mjs:47:  console.error(`FAIL: admin custom template import UI safety verifier (${failures.length} failure(s))`);
./scripts/verify-admin-custom-template-import-ui-safety.mjs:51:console.log("PASS: admin custom template import UI safety verifier");
./scripts/verify-provider-client-hub-nowrap-safety.mjs:34:mustContain("client page", page, 'gridTemplateColumns: "minmax(450px, 1.05fr) minmax(440px, 1fr) minmax(320px, 0.85fr)"');
./scripts/verify-provider-client-hub-nowrap-safety.mjs:35:mustContain("client page", page, 'gridTemplateColumns: "205px max-content"');
./scripts/verify-admin-template-merge-field-visibility-filter.mjs:3:const page = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
./scripts/verify-admin-template-merge-field-visibility-filter.mjs:26:check("package script registered", pkg.includes("verify:admin-template-merge-field-visibility-filter"));
./scripts/verify-admin-template-merge-field-visibility-filter.mjs:34:  console.error(`FAIL: admin template merge field visibility filter verifier (${failures.length} failure(s))`);
./scripts/verify-admin-template-merge-field-visibility-filter.mjs:38:console.log("PASS: admin template merge field visibility filter verifier");
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:7:  "async function buildStoredDbDocxTemplateDocuments",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:8:  "prisma.documentTemplate.findMany",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:11:  "/api/documents/templates/stored-docx?versionId=",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:12:  'templateSource: "barsh-matters-db-template-repository"',
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:13:  'repositoryStatus: "stored-db-docx-template"',
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:14:  "storedTemplateVersionId",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:17:  "...storedDbTemplateDocuments",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:23:  "documentTemplate.create",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:24:  "documentTemplate.update",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:25:  "documentTemplate.upsert",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:26:  "documentTemplateVersion.create",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:27:  "documentTemplateVersion.update",
./scripts/verify-stored-db-docx-finalize-preview-safety.mjs:49:console.log("PASS: finalize-preview appends stored DB DOCX templates as read-only planned documents while preserving placeholder fallback.");
./scripts/verify-invoice-step4-finalize-output-safety.mjs:134:mustContain("printable invoice", page, "grid-template-columns: 390px minmax(720px, 1fr) 340px");
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:3:const page = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:16:check("file placeholder state exists", page.includes("templateFilePlaceholder"));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:17:check("file placeholder error state exists", page.includes("templateFilePlaceholderError"));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:18:check("file placeholder UI exists", page.includes("templateFilePlaceholder") && page.includes('type="file"'));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:21:check("file handler exists", page.includes("handleTemplateFilePlaceholderChange"));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:22:check("file placeholder applies to custom JSON", page.includes("applyTemplateFilePlaceholderToCustomJson"));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:23:check("metadata marks uploaded production template", page.includes('templateSource: "uploaded-production-template"'));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:24:check("metadata marks upload placeholder", page.includes('storageKind: "upload-placeholder"') || page.includes("templateFilePlaceholder"));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:26:check("metadata marks production false by default", page.includes("productionTemplateReady: false") && page.includes("finalProductionDocument: false"));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:28:check("package script registered", pkg.includes("verify:admin-template-file-placeholder-ui-safety"));
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:38:  console.error(`FAIL: admin template file placeholder UI safety verifier (${failures.length} failure(s))`);
./scripts/verify-admin-template-file-placeholder-ui-safety.mjs:42:console.log("PASS: admin template file placeholder UI safety verifier");
./scripts/verify-document-templates-browser-history-safety.mjs:5:const pagePath = "app/admin/document-templates/page.tsx";
./scripts/verify-document-templates-browser-history-safety.mjs:18:mustContain("has visibility filter type", "type TemplateVisibilityFilter =");
./scripts/verify-document-templates-browser-history-safety.mjs:19:mustContain("has URL state type", "type DocumentTemplateUrlState = {");
./scripts/verify-document-templates-browser-history-safety.mjs:20:mustContain("normalizes category", "function normalizeTemplateCategory(value: unknown): TemplateCategory");
./scripts/verify-document-templates-browser-history-safety.mjs:21:mustContain("normalizes visibility", "function normalizeTemplateVisibility(value: unknown): TemplateVisibilityFilter");
./scripts/verify-document-templates-browser-history-safety.mjs:22:mustContain("reads state from URL", "function documentTemplateStateFromUrl(): DocumentTemplateUrlState");
./scripts/verify-document-templates-browser-history-safety.mjs:23:mustContain("reads category param", "category: normalizeTemplateCategory(params.get(\"category\"))");
./scripts/verify-document-templates-browser-history-safety.mjs:24:mustContain("reads visibility param", "visibility: normalizeTemplateVisibility(params.get(\"visibility\"))");
./scripts/verify-document-templates-browser-history-safety.mjs:25:mustContain("builds URL state", "function documentTemplateUrlForState(state: DocumentTemplateUrlState)");
./scripts/verify-document-templates-browser-history-safety.mjs:26:mustContain("pushes history", "window.history.pushState({ barshMattersDocumentTemplates: true }, \"\", nextUrl);");
./scripts/verify-document-templates-browser-history-safety.mjs:27:mustContain("wrapped category setter", "function setCategory(categoryValue: TemplateCategory");
./scripts/verify-document-templates-browser-history-safety.mjs:28:mustContain("wrapped visibility setter", "function setMergeFieldVisibilityFilter(value: TemplateVisibilityFilter");
./scripts/verify-document-templates-browser-history-safety.mjs:29:mustContain("listens for popstate", 'window.addEventListener("popstate", applyDocumentTemplateStateFromUrl);');
./scripts/verify-document-templates-browser-history-safety.mjs:30:mustContain("removes popstate listener", 'window.removeEventListener("popstate", applyDocumentTemplateStateFromUrl);');
./scripts/verify-document-templates-browser-history-safety.mjs:31:mustContain("Back reloads templates by URL category", "void loadTemplates(urlState.category);");
./scripts/verify-document-templates-browser-history-safety.mjs:32:mustContain("state initializes category from URL", "useState<TemplateCategory>(initialTemplateUrlState.category)");
./scripts/verify-document-templates-browser-history-safety.mjs:33:mustContain("state initializes visibility from URL", "useState<TemplateVisibilityFilter>(initialTemplateUrlState.visibility)");
./scripts/verify-document-templates-browser-history-safety.mjs:35:mustNotContain("old category state setter should not remain", 'const [category, setCategory] = useState<TemplateCategory>("settlement");');
./scripts/verify-document-templates-browser-history-safety.mjs:38:console.log("RESULT: verify Document Templates browser history safety");
./scripts/verify-template-stored-docx-download-safety.mjs:3:const route = fs.readFileSync("app/api/documents/templates/stored-docx/route.ts", "utf8");
./scripts/verify-template-stored-docx-download-safety.mjs:4:const admin = fs.readFileSync("app/admin/document-templates/page.tsx", "utf8");
./scripts/verify-template-stored-docx-download-safety.mjs:7:  "document-template-stored-docx-download",
./scripts/verify-template-stored-docx-download-safety.mjs:8:  "prisma.documentTemplateVersion.findUnique",
./scripts/verify-template-stored-docx-download-safety.mjs:9:  "prisma.documentTemplateVersion.findFirst",
./scripts/verify-template-stored-docx-download-safety.mjs:23:  "function openStoredTemplateDocx",
./scripts/verify-template-stored-docx-download-safety.mjs:24:  "/api/documents/templates/stored-docx?versionId=",
./scripts/verify-template-stored-docx-download-safety.mjs:27:  "Choose DOCX Template",
./scripts/verify-template-stored-docx-download-safety.mjs:28:  "template-docx-storage-file-input",
./scripts/verify-template-stored-docx-download-safety.mjs:58:  console.error("FAIL: template stored DOCX download safety verifier failed");
./scripts/verify-template-stored-docx-download-safety.mjs:63:console.log("PASS: stored template DOCX download is read-only and exposes local DB DOCX payloads without Clio, Graph, email, print, or queue side effects.");
./scripts/verify-admin-document-readiness-audit-safety.mjs:39:  "prisma.documentTemplate.count",
./scripts/verify-admin-document-readiness-audit-safety.mjs:40:  "prisma.documentTemplateVersion.count",
./scripts/verify-admin-document-readiness-audit-safety.mjs:41:  "prisma.documentTemplateMergeField.count",
./scripts/verify-admin-document-readiness-audit-safety.mjs:64:  "no-local-document-templates",
./scripts/verify-admin-document-readiness-audit-safety.mjs:65:  "no-local-template-versions",
./scripts/verify-adversary-attorney-document-merge-data-safety.mjs:40:mustContain("packet route exposes adversary attorney template field", packet, "adversaryAttorneyName");
./scripts/verify-adversary-attorney-document-merge-data-safety.mjs:41:mustContain("packet route exposes adversary attorney firm template field", packet, "adversaryAttorneyFirmName");
./scripts/verify-master-document-preview-ui-safety.mjs:36:mustContain("templateFields JSON details", "Raw Template Fields");
./scripts/verify-admin-home-page-and-menu.mjs:22:check("admin home links document templates", adminHome.includes("/admin/document-templates"));
./app/api/settlements/documents-finalize-local/route.ts:13:import { buildSettlementPlannedDocuments } from "@/lib/documents/templateRegistry";
./app/api/settlements/documents-finalize-local/route.ts:71:function settlementDocxRouteForTemplate(templateKey: string): string {
./app/api/settlements/documents-finalize-local/route.ts:72:  const key = clean(templateKey);
./app/api/settlements/documents-finalize-local/route.ts:80:  templateKey: string;
./app/api/settlements/documents-finalize-local/route.ts:85:  const endpoint = settlementDocxRouteForTemplate(params.templateKey);
./app/api/settlements/documents-finalize-local/route.ts:95:    templateKey: params.templateKey,
./app/api/settlements/documents-finalize-local/route.ts:96:    templateLabel: params.templateKey,
./app/api/settlements/documents-finalize-local/route.ts:239:    const templateKey = clean(body?.templateKey);
./app/api/settlements/documents-finalize-local/route.ts:240:    const templateLabelInput = clean(body?.templateLabel);
./app/api/settlements/documents-finalize-local/route.ts:283:    if (!templateKey) {
./app/api/settlements/documents-finalize-local/route.ts:288:          error: "Missing templateKey.",
./app/api/settlements/documents-finalize-local/route.ts:363:    const selectedDocument = plannedDocuments.find((doc: any) => clean(doc?.key) === templateKey);
./app/api/settlements/documents-finalize-local/route.ts:370:          error: `Selected settlement document template was not found: ${templateKey}`,
./app/api/settlements/documents-finalize-local/route.ts:371:          templateKey,
./app/api/settlements/documents-finalize-local/route.ts:372:          availableTemplates: plannedDocuments.map((doc: any) => ({
./app/api/settlements/documents-finalize-local/route.ts:391:        templateKey,
./app/api/settlements/documents-finalize-local/route.ts:396:      templateLabel: templateLabelInput || selectedDocument.label || templateKey,
./app/api/settlements/documents-finalize-local/route.ts:410:    const finalFilename = clean(generatedDocx.filename || selectedDocument.filename || `${templateKey}.docx`);
./app/api/settlements/documents-finalize-local/route.ts:463:        workingDocumentKey: workingDocumentKey || templateKey,
./app/api/settlements/documents-finalize-local/route.ts:549:        key: templateKey,
./app/api/settlements/documents-finalize-local/route.ts:550:        label: templateLabelInput || selectedDocument.label || templateKey,
./app/api/settlements/documents-finalize-local/route.ts:568:        workingDocumentKey: workingDocumentKey || templateKey,
./app/api/settlements/documents-finalize-local/route.ts:582:        key: templateKey,
./app/api/settlements/documents-finalize-local/route.ts:583:        label: templateLabelInput || selectedDocument.label || templateKey,
./app/api/settlements/documents-finalize-local/route.ts:600:        workingDocumentKey: workingDocumentKey || templateKey,
./app/api/settlements/documents-finalize-local/route.ts:620:      templateLabel: templateLabelInput || selectedDocument.label || templateKey,
./app/api/settlements/documents-finalize-local/route.ts:624:      templateSource: "placeholder-seeded",
./app/api/settlements/documents-finalize-local/route.ts:625:      productionTemplateReady: false,
./app/api/settlements/documents-finalize-local/route.ts:647:        requestedKeys: jsonSafe([templateKey]),
./app/api/settlements/documents-finalize-local/route.ts:663:          selectedTemplateKey: templateKey,
./app/api/settlements/documents-finalize-local/route.ts:664:          selectedTemplateLabel: selectedSnapshot.templateLabel,
./app/api/settlements/documents-finalize-local/route.ts:678:          templateSource: "placeholder-seeded",
./app/api/settlements/documents-finalize-local/route.ts:679:          productionTemplateReady: false,
./app/api/settlements/documents-finalize-local/route.ts:702:            workingDocumentKey: workingDocumentKey || templateKey,
./app/api/settlements/documents-finalize-local/route.ts:734:        workingDocumentKey: workingDocumentKey || templateKey,
./scripts/verify-document-template-db-schema-foundation.mjs:5:const migrationPath = "prisma/migrations/20260520203000_add_document_template_repository/migration.sql";
./scripts/verify-document-template-db-schema-foundation.mjs:11:  ["DocumentTemplate model exists", schema.includes("model DocumentTemplate ")],
./scripts/verify-document-template-db-schema-foundation.mjs:12:  ["DocumentTemplateVersion model exists", schema.includes("model DocumentTemplateVersion ")],
./scripts/verify-document-template-db-schema-foundation.mjs:13:  ["DocumentTemplateMergeField model exists", schema.includes("model DocumentTemplateMergeField ")],
./scripts/verify-document-template-db-schema-foundation.mjs:14:  ["template key unique", /key\s+String\s+@unique/.test(schema)],
./scripts/verify-document-template-db-schema-foundation.mjs:15:  ["template versions relation", schema.includes("versions                   DocumentTemplateVersion[]") || schema.includes("DocumentTemplateVersion[]")],
./scripts/verify-document-template-db-schema-foundation.mjs:16:  ["merge fields relation", schema.includes("mergeFields                DocumentTemplateMergeField[]") || schema.includes("DocumentTemplateMergeField[]")],
./scripts/verify-document-template-db-schema-foundation.mjs:18:  ["migration creates DocumentTemplate", migration.includes('CREATE TABLE "DocumentTemplate"')],
./scripts/verify-document-template-db-schema-foundation.mjs:19:  ["migration creates DocumentTemplateVersion", migration.includes('CREATE TABLE "DocumentTemplateVersion"')],
./scripts/verify-document-template-db-schema-foundation.mjs:20:  ["migration creates DocumentTemplateMergeField", migration.includes('CREATE TABLE "DocumentTemplateMergeField"')],
./scripts/verify-document-template-db-schema-foundation.mjs:21:  ["migration has foreign keys", migration.includes("DocumentTemplateVersion_templateId_fkey") && migration.includes("DocumentTemplateMergeField_templateId_fkey")],
./scripts/verify-document-template-db-schema-foundation.mjs:34:console.log("PASS: document template DB schema foundation verifier");
./scripts/verify-clio-rule1-boundary-safety.mjs:68:const templateRoutes = [
./scripts/verify-clio-rule1-boundary-safety.mjs:69:  "app/api/documents/templates/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:70:  "app/api/documents/templates/detail/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:71:  "app/api/documents/templates/import-preview/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:72:  "app/api/documents/templates/import-confirm/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:73:  "app/api/documents/templates/replace-version/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:74:  "app/api/documents/templates/stored-docx/route.ts",
./scripts/verify-clio-rule1-boundary-safety.mjs:77:for (const file of templateRoutes) {
./scripts/verify-clio-rule1-boundary-safety.mjs:119:console.log("GOLDEN_RULE_CLIO_BOUNDARY=Clio owns IDs/numbers/document vault/MailDrop/operational close status; Barsh Matters owns workflows/local records/templates.");
./scripts/verify-clio-rule1-boundary-safety.mjs:122:console.log("DOCUMENT_TEMPLATE_SOURCE_OF_TRUTH=Barsh Matters local DocumentTemplate tables and DB-stored DOCX versions.");
./scripts/verify-direct-visible-popup-standardization-safety.mjs:36:assertOk(docGenerationVisible.includes("placeholder=\"Select document template\""), "Document Generation template placeholder is clean");
./scripts/verify-settlement-save-finalized-pdf-safety.mjs:23:mustInclude("Save Finalized PDF button calls save handler", "() => saveMasterSettlementDocumentLocally(displayedSelectedTemplate)");
./scripts/verify-administrator-button-gates-menu.mjs:28:  check(`${file} menu still has Templates`, text.includes("📄 Templates"));
./scripts/verify-direct-document-generation-popup-standard-safety.mjs:44:requireIncludes(popup, 'setMatterSelectedDocumentTemplateKey("");', "Back clears selected document");
./scripts/verify-direct-document-generation-popup-standard-safety.mjs:45:requireIncludes(popup, 'setMatterDocumentTemplateQuery("");', "Back clears template query");
./scripts/verify-admin-document-template-import-ui-safety.mjs:3:const pagePath = "app/admin/document-templates/page.tsx";
./scripts/verify-admin-document-template-import-ui-safety.mjs:18:check("admin template import preview function exists", page.includes("previewSeededTemplateImport"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:19:check("admin template import confirm function exists", page.includes("confirmSeededTemplateImport"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:20:check("admin calls import-preview route", page.includes("/api/documents/templates/import-preview"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:21:check("admin calls import-confirm route", page.includes("/api/documents/templates/import-confirm"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:26:check("admin warns placeholders are not final production", page.includes("Seeded definitions are placeholder/test templates only") && page.includes("not final production templates"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:30:check("package script registered", pkg.includes("verify:admin-document-template-import-ui-safety"));
./scripts/verify-admin-document-template-import-ui-safety.mjs:38:  console.error(`FAIL: admin document template import UI safety verifier (${failures.length} failure(s))`);
./scripts/verify-admin-document-template-import-ui-safety.mjs:42:console.log("PASS: admin document template import UI safety verifier");
./scripts/verify-court-calendar-report-output-safety.mjs:27:  ["court_appearance_result_choice_spacing_enlarged", has(".court-appearance-report .scan-choice { grid-template-columns: 54px 14px 22px 14px 20px; column-gap: 5px; row-gap: 7px; margin-top: 8px; margin-bottom: 6px; }")],
./scripts/verify-provider-remittance-docx-safety.mjs:38:const templateRegistry = read("lib/documents/templateRegistry.ts");
./scripts/verify-provider-remittance-docx-safety.mjs:80:mustContain("template registry", templateRegistry, "buildSettlementPlannedDocuments");
./scripts/verify-provider-remittance-docx-safety.mjs:81:mustContain("template registry", templateRegistry, "Settlement Summary");
./scripts/verify-provider-remittance-docx-safety.mjs:82:mustContain("template registry", templateRegistry, "Provider Remittance Breakdown");
./scripts/verify-provider-remittance-docx-safety.mjs:83:mustContain("template registry", templateRegistry, "Attorney Fee Breakdown");
./scripts/verify-provider-remittance-docx-safety.mjs:84:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/settlement-summary"');
./scripts/verify-provider-remittance-docx-safety.mjs:85:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/provider-remittance-breakdown"');
./scripts/verify-provider-remittance-docx-safety.mjs:86:mustContain("template registry", templateRegistry, 'generationEndpoint: "/api/settlements/attorney-fee-breakdown"');
./scripts/verify-provider-remittance-docx-safety.mjs:87:mustContain("template registry", templateRegistry, "routeOnly: true");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:19:const storedDocx = read("app/api/documents/templates/stored-docx/route.ts");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:22:assert(finalizePreview.includes("buildStoredDbDocxTemplateDocuments"), "finalize-preview builds stored DB DOCX planned documents");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:23:assert(finalizePreview.includes('sourceEndpoint: `/api/documents/templates/stored-docx?versionId=${encodeURIComponent(currentVersion.id)}`'), "finalize-preview uses stored-docx route as sourceEndpoint");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:25:assert(finalizePreview.includes('repositoryStatus: "stored-db-docx-template"'), "finalize-preview marks stored DB repository status");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:26:assert(finalizePreview.includes("storedTemplateVersionId: currentVersion.id"), "finalize-preview exposes stored template version id");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:27:assert(finalizePreview.includes("storedTemplateVersionNumber: currentVersion.versionNumber"), "finalize-preview exposes stored template version number");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:28:assert(finalizePreview.includes("...storedDbTemplateDocuments,") && finalizePreview.includes("...placeholderDocuments"), "finalize-preview places stored DB templates before placeholder documents");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:30:assert(storedDocx.includes("documentTemplateVersion.findUnique"), "stored-docx route reads DocumentTemplateVersion by versionId");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:35:assert(workingDocx.includes("sourceTemplateContract"), "working-docx response exposes sourceTemplateContract");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:39:assert(finalize.includes("sourceTemplateContract"), "finalize uploaded records expose sourceTemplateContract");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:41:assert(finalize.includes("storedTemplateVersionId"), "finalize uploaded records preserve stored template version id");
./scripts/verify-stored-db-docx-generation-path-safety.mjs:42:assert(finalize.includes("storedTemplateVersionNumber"), "finalize uploaded records preserve stored template version number");
```

## Migration and schema files

```text
./backups/indexes/2026-06-02T23-32-21-252Z/schema.sql
./backups/indexes/2026-06-03T23-40-38-806Z/schema.sql
./backups/indexes/2026-06-04T23-43-23-453Z/schema.sql
./backups/indexes/2026-06-05T23-39-33-355Z/schema.sql
./backups/indexes/2026-06-07T23-18-23-714Z/schema.sql
./backups/indexes/2026-06-08T23-45-44-208Z/schema.sql
./backups/indexes/2026-06-09T23-52-16-408Z/schema.sql
./backups/indexes/2026-06-10T23-56-58-557Z/schema.sql
./backups/indexes/2026-06-11T21-56-06-681Z/schema.sql
./backups/indexes/2026-06-15T23-23-45-378Z/schema.sql
./backups/indexes/2026-06-16T23-17-43-260Z/schema.sql
./backups/indexes/2026-06-17T14-54-57-490Z/schema.sql
./backups/indexes/2026-06-17T15-10-05-973Z/schema.sql
./backups/indexes/2026-06-17T15-25-12-600Z/schema.sql
./backups/indexes/2026-06-17T15-40-18-908Z/schema.sql
./backups/indexes/2026-06-17T15-55-25-111Z/schema.sql
./backups/indexes/2026-06-17T16-10-31-631Z/schema.sql
./backups/indexes/2026-06-17T16-29-11-369Z/schema.sql
./backups/indexes/2026-06-17T16-44-16-895Z/schema.sql
./backups/indexes/2026-06-17T16-59-23-438Z/schema.sql
./backups/indexes/2026-06-17T17-14-29-739Z/schema.sql
./backups/indexes/2026-06-17T17-15-39-810Z/schema.sql
./backups/indexes/2026-06-17T17-17-31-011Z/schema.sql
./backups/indexes/2026-06-17T17-18-34-079Z/schema.sql
./backups/indexes/2026-06-17T17-29-36-794Z/schema.sql
./backups/indexes/2026-06-17T17-44-43-960Z/schema.sql
./backups/indexes/2026-06-17T17-44-48-264Z/schema.sql
./backups/indexes/2026-06-17T17-57-47-341Z/schema.sql
./backups/indexes/2026-06-17T17-59-49-947Z/schema.sql
./backups/indexes/2026-06-17T18-14-55-764Z/schema.sql
./backups/indexes/2026-06-17T18-30-02-815Z/schema.sql
./backups/indexes/2026-06-17T18-45-09-467Z/schema.sql
./backups/indexes/2026-06-17T19-00-15-654Z/schema.sql
./backups/indexes/2026-06-17T19-15-21-255Z/schema.sql
./backups/indexes/2026-06-17T19-30-27-700Z/schema.sql
./backups/indexes/2026-06-17T19-45-33-761Z/schema.sql
./backups/indexes/2026-06-17T20-06-42-841Z/schema.sql
./backups/indexes/2026-06-17T20-21-49-822Z/schema.sql
./backups/indexes/2026-06-17T20-36-56-320Z/schema.sql
./backups/indexes/2026-06-17T20-52-02-582Z/schema.sql
./backups/indexes/2026-06-17T21-07-09-341Z/schema.sql
./backups/indexes/2026-06-17T21-22-15-582Z/schema.sql
./backups/indexes/2026-06-17T21-37-25-474Z/schema.sql
./backups/indexes/2026-06-17T21-52-31-806Z/schema.sql
./backups/indexes/2026-06-17T22-07-38-131Z/schema.sql
./backups/indexes/2026-06-17T22-22-44-258Z/schema.sql
./backups/indexes/2026-06-17T22-37-51-467Z/schema.sql
./backups/indexes/2026-06-17T22-52-58-610Z/schema.sql
./backups/indexes/2026-06-17T23-57-37-947Z/schema.sql
./backups/indexes/2026-06-18T00-55-18-874Z/schema.sql
./backups/indexes/2026-06-18T01-28-05-099Z/schema.sql
./backups/indexes/2026-06-18T02-01-57-559Z/schema.sql
./backups/indexes/2026-06-18T02-41-04-570Z/schema.sql
./backups/indexes/2026-06-18T04-00-09-974Z/schema.sql
./backups/indexes/2026-06-18T05-17-22-978Z/schema.sql
./backups/indexes/2026-06-18T06-35-31-954Z/schema.sql
./backups/indexes/2026-06-18T09-17-03-946Z/schema.sql
./backups/indexes/2026-06-18T12-02-54-848Z/schema.sql
./backups/indexes/2026-06-18T12-49-31-890Z/schema.sql
./backups/indexes/2026-06-18T13-04-38-972Z/schema.sql
./backups/indexes/2026-06-18T13-19-45-315Z/schema.sql
./backups/indexes/2026-06-18T13-34-51-960Z/schema.sql
./backups/indexes/2026-06-18T13-49-58-315Z/schema.sql
./backups/indexes/2026-06-18T14-05-04-316Z/schema.sql
./backups/indexes/2026-06-18T14-20-10-497Z/schema.sql
./backups/indexes/2026-06-18T14-35-16-641Z/schema.sql
./backups/indexes/2026-06-18T14-50-23-006Z/schema.sql
./backups/indexes/2026-06-18T15-05-29-348Z/schema.sql
./backups/indexes/schema-inventory-2026-06-02T13-43-47-050Z.txt
./backups/indexes/schema-inventory-2026-06-02T13-45-04-658Z.txt
./backups/indexes/schema-inventory-2026-06-02T13-46-48-894Z.txt
./backups/indexes/schema-inventory-2026-06-02T14-01-56-206Z.txt
./backups/indexes/schema-inventory-2026-06-02T14-03-56-525Z.txt
./backups/indexes/schema-inventory-2026-06-02T14-05-37-876Z.txt
./backups/indexes/schema-inventory-2026-06-02T14-07-39-884Z.txt
./prisma/migrations/20260424191943_init_postgres/migration.sql
./prisma/migrations/20260424193040_add_claim_index/migration.sql
./prisma/migrations/20260427212500_add_clio_token_token_type/migration.sql
./prisma/migrations/20260427213500_add_clio_token_expires_at/migration.sql
./prisma/migrations/20260427220000_add_worker_lock/migration.sql
./prisma/migrations/20260428120000_create_webhook_event/migration.sql
./prisma/migrations/20260428123000_add_webhook_event_key/migration.sql
./prisma/migrations/20260430120000_add_claim_cluster_cache/migration.sql
./prisma/migrations/20260504120000_add_lawsuit_amount_sought/migration.sql
./prisma/migrations/20260504123000_add_lawsuit_generation_metadata/migration.sql
./prisma/migrations/20260504131500_add_document_finalization/migration.sql
./prisma/migrations/20260504143000_add_document_print_queue/migration.sql
./prisma/migrations/20260504170000_add_settlement_writeback/migration.sql
./prisma/migrations/20260504203500_add_settlement_readback_fields/migration.sql
./prisma/migrations/20260515105500_add_claimindex_treating_provider/migration.sql
./prisma/migrations/20260515123500_remove_webhook_infrastructure/migration.sql
./prisma/migrations/202605190001_add_lawsuit_clio_master_mapping/migration.sql
./prisma/migrations/20260519093000_add_graph_email_thread_foundation/migration.sql
./prisma/migrations/20260519150000_add_maildrop_address_registry/migration.sql
./prisma/migrations/20260520120500_add_local_settlement_records/migration.sql
./prisma/migrations/20260520203000_add_document_template_repository/migration.sql
./prisma/migrations/20260520213000_add_local_workflow_ticklers/migration.sql
./prisma/migrations/20260526154500_add_settlement_contact/migration.sql
./prisma/migrations/20260604144000_add_claimindex_final_status/migration.sql
./prisma/migrations/20260610104500_add_provider_invoice_cost_balance_totals/migration.sql
./prisma/migrations/20260611164000_add_court_calendar_events/migration.sql
./prisma/migrations/20260611173500_add_court_calendar_number/migration.sql
./prisma/migrations/20260617130000_add_admin_user_role_tables/migration.sql
./prisma/migrations/20260618095000_add_admin_user_credential_fields/migration.sql
./prisma/migrations/migration_lock.toml
./prisma/schema.prisma
./scripts/inventory-claim-index-schema.mjs
./scripts/verify-admin-user-role-migration-sql-safety.mjs
./scripts/verify-admin-user-role-schema-foundation-safety.mjs
./scripts/verify-admin-users-phase12e-credential-schema-fields-safety.cjs
./scripts/verify-clio-master-mapping-schema-safety.mjs
./scripts/verify-court-calendar-schema-foundation-safety.mjs
./scripts/verify-document-template-db-schema-foundation.mjs
./scripts/verify-local-settlement-persistence-schema-safety.mjs
./scripts/verify-provider-client-invoice-schema-foundation.mjs
```
