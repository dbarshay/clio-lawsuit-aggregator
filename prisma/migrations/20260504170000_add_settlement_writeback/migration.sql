CREATE TABLE IF NOT EXISTS "SettlementWriteback" (
  "id" SERIAL PRIMARY KEY,
  "masterLawsuitId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "grossSettlement" DOUBLE PRECISION,
  "settledWith" TEXT,
  "settlementDate" TEXT,
  "allocationMode" TEXT,
  "childMatterIds" JSONB,
  "previewSnapshot" JSONB,
  "readinessSnapshot" JSONB,
  "writeResults" JSONB,
  "safetySnapshot" JSONB,
  "error" TEXT,
  "noWritePerformed" BOOLEAN NOT NULL DEFAULT false,
  "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SettlementWriteback_masterLawsuitId_idx"
  ON "SettlementWriteback"("masterLawsuitId");

CREATE INDEX IF NOT EXISTS "SettlementWriteback_status_idx"
  ON "SettlementWriteback"("status");

CREATE INDEX IF NOT EXISTS "SettlementWriteback_finalizedAt_idx"
  ON "SettlementWriteback"("finalizedAt");
