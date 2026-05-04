-- Add local print queue records for Clio-verified finalized documents.
-- Clio remains the source of truth for actual document existence.
-- This table tracks explicit local print workflow only.

CREATE TABLE IF NOT EXISTS "DocumentPrintQueueItem" (
    "id" SERIAL NOT NULL,
    "uniqueQueueKey" TEXT NOT NULL,
    "masterLawsuitId" TEXT NOT NULL,
    "masterMatterId" INTEGER NOT NULL,
    "masterDisplayNumber" TEXT,
    "finalizationId" INTEGER,
    "documentKey" TEXT NOT NULL,
    "documentLabel" TEXT,
    "filename" TEXT NOT NULL,
    "clioDocumentId" TEXT,
    "clioDocumentName" TEXT,
    "clioDocumentVersionUuid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "documentSnapshot" JSONB,
    "sourceFinalizationSnapshot" JSONB,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),
    "printDecision" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentPrintQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentPrintQueueItem_uniqueQueueKey_key" ON "DocumentPrintQueueItem"("uniqueQueueKey");
CREATE INDEX IF NOT EXISTS "DocumentPrintQueueItem_masterLawsuitId_idx" ON "DocumentPrintQueueItem"("masterLawsuitId");
CREATE INDEX IF NOT EXISTS "DocumentPrintQueueItem_masterMatterId_idx" ON "DocumentPrintQueueItem"("masterMatterId");
CREATE INDEX IF NOT EXISTS "DocumentPrintQueueItem_status_idx" ON "DocumentPrintQueueItem"("status");
CREATE INDEX IF NOT EXISTS "DocumentPrintQueueItem_queuedAt_idx" ON "DocumentPrintQueueItem"("queuedAt");
CREATE INDEX IF NOT EXISTS "DocumentPrintQueueItem_clioDocumentId_idx" ON "DocumentPrintQueueItem"("clioDocumentId");
