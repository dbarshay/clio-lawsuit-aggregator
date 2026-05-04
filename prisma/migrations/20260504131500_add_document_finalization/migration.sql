-- Add local audit/tracking records for explicit Clio document finalization.
-- Clio remains the source of truth for actual document existence.

CREATE TABLE IF NOT EXISTS "DocumentFinalization" (
    "id" SERIAL NOT NULL,
    "masterLawsuitId" TEXT NOT NULL,
    "masterMatterId" INTEGER NOT NULL,
    "masterDisplayNumber" TEXT,
    "status" TEXT NOT NULL,
    "requestedKeys" JSONB,
    "uploaded" JSONB,
    "skipped" JSONB,
    "clioUploadTarget" JSONB,
    "validationSnapshot" JSONB,
    "packetSummarySnapshot" JSONB,
    "allowDuplicateUploads" BOOLEAN NOT NULL DEFAULT false,
    "noUploadPerformed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentFinalization_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DocumentFinalization_masterLawsuitId_idx" ON "DocumentFinalization"("masterLawsuitId");
CREATE INDEX IF NOT EXISTS "DocumentFinalization_masterMatterId_idx" ON "DocumentFinalization"("masterMatterId");
CREATE INDEX IF NOT EXISTS "DocumentFinalization_status_idx" ON "DocumentFinalization"("status");
CREATE INDEX IF NOT EXISTS "DocumentFinalization_finalizedAt_idx" ON "DocumentFinalization"("finalizedAt");
