# Phase 48F — Signer / Addressee / Court Source Resolution Inspection

## Status

Read-only inspection only. This phase does not map fields into templates.

## Goal

Before mapping letterhead, pleading-paper, or Stipulation fields, Barsh Matters needs source-resolution rules for signer fields, addressee source fields, court/caption fields, and Re fields.

## Signer Rule to Implement Later

- Signer defaults to the logged-in Barsh Matters user generating the document.
- Other users must be selectable from the Generate Documents dialog.
- Fax number, email address, and extension are preset per selected signer.

Proposed signer fields:

- `{{signerUserId}}`
- `{{signerName}}`
- `{{signerTitle}}`
- `{{signerPhoneExtension}}`
- `{{signerFax}}`
- `{{signerEmail}}`

Likely signer-related models:

- `AuditLog`: id, createdAt, updatedAt, action, summary, entityType, fieldName, priorValue, newValue, details, affectedMatterIds, matterId, matterDisplayNumber, masterMatterId, masterMatterDisplayNumber, masterLawsuitId
- `MaildropAddress`: id, source, matterId, matterDisplayNumber, masterLawsuitId, clioMatterId, clioDisplayNumber, clioMaildropEmail, clioMaildropLabel, active, lastResolvedAt, metadata, createdAt, updatedAt
- `EmailThread`: id, provider, mailboxUserId, mailboxUserPrincipalName, conversationId, internetMessageId, subject, normalizedSubject, latestMessageAt, lastSyncedAt, direction, source, matterId, matterDisplayNumber, masterLawsuitId, clioMatterId
- `EmailMessage`: id, threadId, thread, provider, mailboxUserId, mailboxUserPrincipalName, graphMessageId, internetMessageId, conversationId, subject, from, fromEmail, toRecipients, ccRecipients, bccRecipients, replyTo
- `EmailAttachment`: id, messageId, message, provider, graphAttachmentId, name, contentType, sizeBytes, isInline, contentId, clioDocumentId, clioDocumentName, clioDocumentVersionUuid, storageStatus, metadata, createdAt
- `EmailSyncState`: id, provider, mailboxUserId, mailboxUserPrincipalName, folderId, folderName, deltaLink, nextLink, lastSyncedAt, lastSuccessfulSyncAt, lastErrorAt, lastError, status, metadata, createdAt, updatedAt
- `EmailMatterLink`: id, threadId, messageId, matterId, matterDisplayNumber, masterLawsuitId, clioMatterId, clioDisplayNumber, linkReason, confidence, createdBy, createdAt, metadata
- `EmailFilingLog`: id, threadId, messageId, provider, targetSystem, targetType, targetId, action, status, previewOnly, clioRecordsChanged, databaseChanged, requestedBy, error, metadata, createdAt
- `SettlementContact`: id, name, email, phone, company, role, notes, isActive, metadata, createdAt, updatedAt
- `AdminUser`: id, email, username, normalizedUsername, passwordHash, passwordSetAt, passwordChangeRequired, lastLoginAt, lastFailedLoginAt, failedLoginCount, twoFactorRequired, twoFactorMethod, twoFactorConfiguredAt, displayName, status, bootstrapSafe
- `AdminRole`: id, key, label, description, status, systemRole, createdAt, updatedAt, users, permissions
- `AdminUserRole`: id, userId, roleId, createdAt, user, role
- `AdminUserPermissionOverride`: id, userId, permissionKey, action, reason, createdAt, updatedAt, user

Likely signer-related source files:

- `app/admin/audit-history/page.tsx` — matches: user, email
- `app/admin/backup-restore/page.tsx` — matches: user, email
- `app/admin/claim-index/audit/page.tsx` — matches: email
- `app/admin/claim-index/page.tsx` — matches: email
- `app/admin/clients/[id]/invoice/page.tsx` — matches: user, email
- `app/admin/clients/[id]/page.tsx` — matches: attorney
- `app/admin/clients/page.tsx` — matches: email, phone
- `app/admin/document-readiness/audit/page.tsx` — matches: attorney, email
- `app/admin/document-templates/page.tsx` — matches: user, email
- `app/admin/lawsuit-cleanup/page.tsx` — matches: email
- `app/admin/lawsuits/audit/page.tsx` — matches: email
- `app/admin/page.tsx` — matches: user, email
- `app/admin/permissions/page.tsx` — matches: adminuser, user, email, owner_admin
- `app/admin/readiness-dashboard/page.tsx` — matches: email
- `app/admin/reference-data/page.tsx` — matches: user, attorney, email, phone
- `app/admin/ticklers/page.tsx` — matches: email
- `app/admin/ticklers/runner/page.tsx` — matches: email
- `app/admin/users/page.tsx` — matches: adminuser, user, email, owner_admin
- `app/api/admin/backups/archive-error-log/route.ts` — matches: email
- `app/api/admin/backups/restore-preview/route.ts` — matches: email
- `app/api/admin/backups/run/route.ts` — matches: email
- `app/api/admin/backups/status/route.ts` — matches: user, email
- `app/api/admin/claim-index/audit/route.ts` — matches: user, email
- `app/api/admin/claim-index/search/route.ts` — matches: email
- `app/api/admin/clients/[id]/invoice/[invoiceId]/finalize/route.ts` — matches: email

Uncertain signer items requiring Dave review:

- Whether AdminUser currently has all signer profile fields or needs an extended signer profile table.
- Whether signer title/extension/fax/email should live directly on AdminUser or a separate FirmSignerProfile model.

## Addressee Source Rule to Implement Later

Allowed addressee source types:

- `adversary_attorney`
- `insurer`
- `court`
- `settled_with_contact`
- `manual`

Required behavior:

- Addressee source defaults from the selected template/workflow.
- User can override the addressee source in the Generate Documents dialog.
- Manual addressee entry remains available.

Proposed addressee fields:

- `{{addresseeSourceType}}`
- `{{addresseeRole}}`
- `{{addresseeName}}`
- `{{addresseeCompany}}`
- `{{addresseeAttentionLine}}`
- `{{addresseeAddressLine1}}`
- `{{addresseeAddressLine2}}`
- `{{addresseeAddressLine3}}`
- `{{addresseeEmail}}`
- `{{addresseeFax}}`

Likely addressee-related models:

- `Lawsuit`: id, masterLawsuitId, claimNumber, lawsuitMatters, sharedFolderPath, venue, venueSelection, venueOther, indexAaaNumber, lawsuitNotes, lawsuitOptions, amountSoughtMode, amountSought, customAmountSought, amountSoughtBreakdown, clioMasterMatterId
- `ClaimIndex`: matter_id, display_number, description, claim_number_raw, claim_number_normalized, patient_name, client_name, insurer_name, claim_amount, settled_amount, settled_with, allocated_settlement, interest_amount, principal_fee, interest_fee, total_fee
- `SettlementWriteback`: id, masterLawsuitId, status, grossSettlement, settledWith, settlementDate, allocationMode, childMatterIds, previewSnapshot, readinessSnapshot, writeResults, safetySnapshot, error, noWritePerformed, finalizedAt, createdAt
- `LocalSettlementRecord`: id, masterLawsuitId, status, source, payloadKind, recordIntent, settledWith, settlementDate, paymentExpectedDate, notes, allocationMode, grossSettlementAmount, interestAmountTotal, principalFeePercent, interestFeePercent, allocatedSettlementTotal
- `LocalSettlementRow`: id, settlementRecordId, settlementRecord, masterLawsuitId, matterId, displayNumber, provider, patient, insurer, claimNumber, billNumber, dosStart, dosEnd, denialReason, claimAmount, principalBasis
- `ProviderClientInvoice`: id, invoiceNumber, providerClientInfoId, referenceEntityId, providerDisplayName, status, dateFrom, dateTo, statusFilter, transactionTypeFilter, receiptRowCount, principalInterestTotal, filingFeePaymentTotal, costsExpendedTotal, retainerFeeTotal, invoicePackageTotal
- `ProviderClientInvoiceLine`: id, invoiceId, lineType, sourceId, sourceTable, sortDate, matter, patient, provider, insurer, lawsuit, description, amount, retainerFee, rowSnapshot, dateOfLoss
- `AuditLog`: id, createdAt, updatedAt, action, summary, entityType, fieldName, priorValue, newValue, details, affectedMatterIds, matterId, matterDisplayNumber, masterMatterId, masterMatterDisplayNumber, masterLawsuitId
- `ReferenceEntity`: id, type, displayName, normalizedName, active, notes, details, source, createdAt, updatedAt, aliases, providerClientInfo
- `ProviderClientInfo`: id, referenceEntityId, displayNameSnapshot, address, owner, providerGroup, retainerNFPrincipal, retainerNFInterest, retainerWCPrincipal, retainerWCInterest, retainerLiensPrincipal, retainerLiensInterest, pullCosts, remit, notes, source
- `MaildropAddress`: id, source, matterId, matterDisplayNumber, masterLawsuitId, clioMatterId, clioDisplayNumber, clioMaildropEmail, clioMaildropLabel, active, lastResolvedAt, metadata, createdAt, updatedAt
- `EmailThread`: id, provider, mailboxUserId, mailboxUserPrincipalName, conversationId, internetMessageId, subject, normalizedSubject, latestMessageAt, lastSyncedAt, direction, source, matterId, matterDisplayNumber, masterLawsuitId, clioMatterId
- `EmailMessage`: id, threadId, thread, provider, mailboxUserId, mailboxUserPrincipalName, graphMessageId, internetMessageId, conversationId, subject, from, fromEmail, toRecipients, ccRecipients, bccRecipients, replyTo
- `EmailAttachment`: id, messageId, message, provider, graphAttachmentId, name, contentType, sizeBytes, isInline, contentId, clioDocumentId, clioDocumentName, clioDocumentVersionUuid, storageStatus, metadata, createdAt
- `EmailSyncState`: id, provider, mailboxUserId, mailboxUserPrincipalName, folderId, folderName, deltaLink, nextLink, lastSyncedAt, lastSuccessfulSyncAt, lastErrorAt, lastError, status, metadata, createdAt, updatedAt
- `EmailMatterLink`: id, threadId, messageId, matterId, matterDisplayNumber, masterLawsuitId, clioMatterId, clioDisplayNumber, linkReason, confidence, createdBy, createdAt, metadata
- `EmailFilingLog`: id, threadId, messageId, provider, targetSystem, targetType, targetId, action, status, previewOnly, clioRecordsChanged, databaseChanged, requestedBy, error, metadata, createdAt
- `LocalWorkflowTickler`: id, kind, source, status, priority, title, description, masterLawsuitId, matterId, displayNumber, settlementRecordId, dueDate, completedAt, completedBy, completedNote, metadata
- `CourtCalendarEvent`: id, masterLawsuitId, displayNumber, eventType, title, court, venue, indexAaaNumber, calendarNumber, eventDate, eventTime, part, judgeOrArbitrator, appearanceType, notes, status
- `SettlementContact`: id, name, email, phone, company, role, notes, isActive, metadata, createdAt, updatedAt

Likely addressee-related source files:

- `app/admin/audit-history/page.tsx` — matches: email
- `app/admin/backup-restore/page.tsx` — matches: email
- `app/admin/claim-index/audit/page.tsx` — matches: insurer, email
- `app/admin/claim-index/page.tsx` — matches: insurer, email
- `app/admin/clients/[id]/invoice/page.tsx` — matches: insurer, court, address, email
- `app/admin/clients/[id]/page.tsx` — matches: insurer, address
- `app/admin/clients/page.tsx` — matches: address, email
- `app/admin/document-readiness/audit/page.tsx` — matches: adversary, insurer, court, venue, email
- `app/admin/document-templates/page.tsx` — matches: insurer, settlement, address, email
- `app/admin/invoices/page.tsx` — matches: insurer, referenceentity
- `app/admin/lawsuit-cleanup/page.tsx` — matches: insurer, venue, email
- `app/admin/lawsuits/audit/page.tsx` — matches: insurer, venue, email
- `app/admin/page.tsx` — matches: email
- `app/admin/permissions/page.tsx` — matches: email
- `app/admin/readiness-dashboard/page.tsx` — matches: email
- `app/admin/reference-data/page.tsx` — matches: adversary, insurer, court, venue, contact, referenceentity, address, email
- `app/admin/ticklers/page.tsx` — matches: insurer, court, venue, settlement, settled, email
- `app/admin/ticklers/runner/page.tsx` — matches: insurer, settlement, email
- `app/admin/users/page.tsx` — matches: email
- `app/api/admin/backups/archive-error-log/route.ts` — matches: email
- `app/api/admin/backups/restore-preview/route.ts` — matches: email
- `app/api/admin/backups/run/route.ts` — matches: email
- `app/api/admin/backups/status/route.ts` — matches: email
- `app/api/admin/claim-index/audit/route.ts` — matches: insurer, settlement, email
- `app/api/admin/claim-index/search/route.ts` — matches: insurer, email

Uncertain addressee items requiring Dave review:

- Exact adversary attorney source field/table for each lawsuit.
- Exact insurer contact source where multiple insurer/contact fields exist.
- Whether settled_with_contact should come from settlement contacts, adjuster, insurer contact, or a dedicated settled-with entity.

## Court / Caption Source Rule to Implement Later

Proposed court/caption fields:

- `{{courtName}}`
- `{{courtVenue}}`
- `{{courtAddressLine1}}`
- `{{courtAddressLine2}}`
- `{{courtCity}}`
- `{{courtState}}`
- `{{courtZip}}`
- `{{courtAddressCityStateZip}}`
- `{{indexNumber}}`
- `{{docketNumber}}`

Likely court-related models:

- `Lawsuit`: id, masterLawsuitId, claimNumber, lawsuitMatters, sharedFolderPath, venue, venueSelection, venueOther, indexAaaNumber, lawsuitNotes, lawsuitOptions, amountSoughtMode, amountSought, customAmountSought, amountSoughtBreakdown, clioMasterMatterId
- `ClaimIndex`: matter_id, display_number, description, claim_number_raw, claim_number_normalized, patient_name, client_name, insurer_name, claim_amount, settled_amount, settled_with, allocated_settlement, interest_amount, principal_fee, interest_fee, total_fee
- `ClaimIndexRebuildState`: name, currentBrlNumber, lastProcessedAt, status, lastError, createdAt, updatedAt
- `CourtCalendarEvent`: id, masterLawsuitId, displayNumber, eventType, title, court, venue, indexAaaNumber, calendarNumber, eventDate, eventTime, part, judgeOrArbitrator, appearanceType, notes, status

Likely court-related source files:

- `app/admin/audit-history/page.tsx` — matches: index
- `app/admin/backup-restore/page.tsx` — matches: index
- `app/admin/claim-index/audit/page.tsx` — matches: index
- `app/admin/claim-index/page.tsx` — matches: index
- `app/admin/clients/[id]/invoice/client-costs-ledger/page.tsx` — matches: index
- `app/admin/clients/[id]/invoice/page.tsx` — matches: court, index
- `app/admin/clients/[id]/page.tsx` — matches: index
- `app/admin/document-readiness/audit/page.tsx` — matches: court, venue, index
- `app/admin/document-templates/[key]/page.tsx` — matches: index
- `app/admin/document-templates/page.tsx` — matches: index
- `app/admin/lawsuit-cleanup/page.tsx` — matches: venue, index
- `app/admin/lawsuits/audit/page.tsx` — matches: venue, index
- `app/admin/page.tsx` — matches: index
- `app/admin/permissions/page.tsx` — matches: index
- `app/admin/readiness-dashboard/page.tsx` — matches: index
- `app/admin/reference-data/page.tsx` — matches: court, venue, index
- `app/admin/ticklers/page.tsx` — matches: court, venue, index
- `app/admin/users/page.tsx` — matches: index
- `app/api/admin/backups/archive-error-log/route.ts` — matches: index
- `app/api/admin/backups/restore-preview/route.ts` — matches: index
- `app/api/admin/backups/run/route.ts` — matches: index
- `app/api/admin/backups/status/route.ts` — matches: index
- `app/api/admin/claim-index/audit/route.ts` — matches: index
- `app/api/admin/claim-index/search/route.ts` — matches: index
- `app/api/admin/clients/[id]/invoice/[invoiceId]/finalize/route.ts` — matches: index

Uncertain court items requiring Dave review:

- Whether courtName and courtVenue should be separate in every workflow.
- Whether indexNumber and docketNumber should be aliases or distinct fields.
- Whether court address should come from reference data or stored lawsuit snapshot.

## Settled-With Contact Source

Settled-with contact may be used as a letter addressee source.

Proposed settled-with fields:

- `{{settledWithContactName}}`
- `{{settledWithCompany}}`
- `{{settledWithEmail}}`
- `{{settledWithFax}}`
- `{{settledWithAddressLine1}}`
- `{{settledWithAddressLine2}}`

Likely settlement-contact source files:

- `app/admin/document-templates/page.tsx` — matches: settlement
- `app/admin/reference-data/page.tsx` — matches: contact
- `app/admin/ticklers/page.tsx` — matches: settlement, settled
- `app/admin/ticklers/runner/page.tsx` — matches: settlement
- `app/api/admin/claim-index/audit/route.ts` — matches: settlement
- `app/api/admin/clients/[id]/invoice/create/route.ts` — matches: settlement
- `app/api/admin/document-readiness/audit/route.ts` — matches: contact
- `app/api/admin/ticklers/duplicates/cleanup-preview/route.ts` — matches: settlement
- `app/api/admin/ticklers/duplicates/route.ts` — matches: settlement
- `app/api/admin/ticklers/run/route.ts` — matches: settlement
- `app/api/admin/ticklers/search/route.ts` — matches: settlement, settled
- `app/api/advanced-search/candidates/route.ts` — matches: settlement
- `app/api/documents/delivery-draft-preview/route.ts` — matches: settlement, settled
- `app/api/documents/matter-packet/route.ts` — matches: settlement, settled
- `app/api/documents/packet/route.ts` — matches: settlement, settled
- `app/api/documents/templates/detail/route.ts` — matches: settlement
- `app/api/documents/templates/route.ts` — matches: settlement
- `app/api/documents/working-docx/route.ts` — matches: settlement
- `app/api/graph/create-draft/route.ts` — matches: settlement
- `app/api/reference-data/contact-search/route.ts` — matches: contact
- `app/api/settlements/attorney-fee-breakdown/route.ts` — matches: settlement, settled
- `app/api/settlements/close/route.ts` — matches: settlement
- `app/api/settlements/close-preview/route.ts` — matches: settlement
- `app/api/settlements/contacts/route.ts` — matches: settlement, contact
- `app/api/settlements/current-values/route.ts` — matches: settlement

## Generate Documents Dialog Controls Needed Later

- selectedSignerUserId defaults to current user
- selectedAddresseeSourceType defaults from template/workflow
- selectedAddresseeId or manual addressee values
- editable Re line preview/override

Likely generation-dialog source files:

- `app/admin/backup-restore/page.tsx` — matches: generate documents
- `app/admin/claim-index/audit/page.tsx` — matches: generate documents
- `app/admin/claim-index/page.tsx` — matches: generate documents, document generation
- `app/admin/document-readiness/audit/page.tsx` — matches: generate documents, document generation
- `app/admin/document-templates/page.tsx` — matches: generate documents
- `app/admin/lawsuits/audit/page.tsx` — matches: generate documents
- `app/admin/page.tsx` — matches: document generation
- `app/admin/permissions/page.tsx` — matches: generate documents
- `app/admin/readiness-dashboard/page.tsx` — matches: generate documents
- `app/admin/reference-data/page.tsx` — matches: generate documents, document generation
- `app/admin/ticklers/runner/page.tsx` — matches: generate documents
- `app/admin/users/page.tsx` — matches: generate documents
- `app/api/admin/claim-index/audit/route.ts` — matches: generate documents
- `app/api/admin/claim-index/search/route.ts` — matches: generate documents
- `app/api/admin/clients/[id]/invoice/create/route.ts` — matches: generate documents
- `app/api/admin/clients/[id]/invoice/create-preview/route.ts` — matches: generate documents
- `app/api/admin/clients/[id]/route.ts` — matches: generate documents
- `app/api/admin/clients/route.ts` — matches: generate documents
- `app/api/admin/document-readiness/audit/route.ts` — matches: generate documents, document generation
- `app/api/admin/lawsuits/audit/route.ts` — matches: generate documents, document generation
- `app/api/admin/permissions/activation-status/route.ts` — matches: generate documents
- `app/api/admin/permissions/deployment-package/route.ts` — matches: generate documents
- `app/api/documents/direct-finalize-preview/route.ts` — matches: document generation
- `app/api/documents/finalize/route.ts` — matches: document generation, working-docx
- `app/api/documents/finalize-preview/route.ts` — matches: document generation

## Mapping Policy

Ask Dave before implementing or mapping any uncertain signer, addressee, court/caption, settled-with, or Re source.

## Non-Goals

This phase does not write database rows, does not update templates, does not convert DOCX files, does not create Graph/OneDrive working documents, does not upload to Clio, does not finalize documents, and does not change the print queue.

## Next Recommended Phase

Phase 48G should propose the signer profile data model and addressee source-resolution design for Dave review before any implementation.
