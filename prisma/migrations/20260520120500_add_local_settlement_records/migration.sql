-- Add Barsh Matters local settlement persistence tables.
-- These tables are app-native/local and do not write to Clio.

CREATE TABLE IF NOT EXISTS "LocalSettlementRecord" (
  "id" TEXT NOT NULL,
  "masterLawsuitId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'recorded',
  "source" TEXT NOT NULL DEFAULT 'barsh-matters-local',
  "payloadKind" TEXT,
  "recordIntent" TEXT,
  "settledWith" TEXT,
  "settlementDate" TEXT,
  "paymentExpectedDate" TEXT,
  "notes" TEXT,
  "allocationMode" TEXT,
  "grossSettlementAmount" DOUBLE PRECISION,
  "interestAmountTotal" DOUBLE PRECISION,
  "principalFeePercent" DOUBLE PRECISION,
  "interestFeePercent" DOUBLE PRECISION,
  "allocatedSettlementTotal" DOUBLE PRECISION,
  "principalFeeTotal" DOUBLE PRECISION,
  "interestFeeTotal" DOUBLE PRECISION,
  "totalFee" DOUBLE PRECISION,
  "providerPrincipalNetTotal" DOUBLE PRECISION,
  "providerInterestNetTotal" DOUBLE PRECISION,
  "providerNetTotal" DOUBLE PRECISION,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "previewSnapshot" JSONB,
  "roundingAdjustmentsSnapshot" JSONB,
  "safetySnapshot" JSONB,
  "recordedBy" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "voided" BOOLEAN NOT NULL DEFAULT false,
  "voidedAt" TIMESTAMP(3),
  "voidedBy" TEXT,
  "voidReason" TEXT,
  "voidSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LocalSettlementRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LocalSettlementRow" (
  "id" TEXT NOT NULL,
  "settlementRecordId" TEXT NOT NULL,
  "masterLawsuitId" TEXT NOT NULL,
  "matterId" INTEGER NOT NULL,
  "displayNumber" TEXT,
  "provider" TEXT,
  "patient" TEXT,
  "insurer" TEXT,
  "claimNumber" TEXT,
  "billNumber" TEXT,
  "dosStart" TEXT,
  "dosEnd" TEXT,
  "denialReason" TEXT,
  "claimAmount" DOUBLE PRECISION,
  "principalBasis" DOUBLE PRECISION,
  "allocatedSettlement" DOUBLE PRECISION,
  "interestAmount" DOUBLE PRECISION,
  "principalFee" DOUBLE PRECISION,
  "interestFee" DOUBLE PRECISION,
  "totalFee" DOUBLE PRECISION,
  "providerPrincipalNet" DOUBLE PRECISION,
  "providerInterestNet" DOUBLE PRECISION,
  "providerNet" DOUBLE PRECISION,
  "settlementStatus" TEXT,
  "rowSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LocalSettlementRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LocalSettlementRecord_masterLawsuitId_idx" ON "LocalSettlementRecord"("masterLawsuitId");
CREATE INDEX IF NOT EXISTS "LocalSettlementRecord_status_idx" ON "LocalSettlementRecord"("status");
CREATE INDEX IF NOT EXISTS "LocalSettlementRecord_settlementDate_idx" ON "LocalSettlementRecord"("settlementDate");
CREATE INDEX IF NOT EXISTS "LocalSettlementRecord_recordedAt_idx" ON "LocalSettlementRecord"("recordedAt");
CREATE INDEX IF NOT EXISTS "LocalSettlementRecord_voided_idx" ON "LocalSettlementRecord"("voided");

CREATE INDEX IF NOT EXISTS "LocalSettlementRow_settlementRecordId_idx" ON "LocalSettlementRow"("settlementRecordId");
CREATE INDEX IF NOT EXISTS "LocalSettlementRow_masterLawsuitId_idx" ON "LocalSettlementRow"("masterLawsuitId");
CREATE INDEX IF NOT EXISTS "LocalSettlementRow_matterId_idx" ON "LocalSettlementRow"("matterId");
CREATE INDEX IF NOT EXISTS "LocalSettlementRow_displayNumber_idx" ON "LocalSettlementRow"("displayNumber");
CREATE INDEX IF NOT EXISTS "LocalSettlementRow_settlementStatus_idx" ON "LocalSettlementRow"("settlementStatus");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LocalSettlementRow_settlementRecordId_fkey'
  ) THEN
    ALTER TABLE "LocalSettlementRow"
      ADD CONSTRAINT "LocalSettlementRow_settlementRecordId_fkey"
      FOREIGN KEY ("settlementRecordId")
      REFERENCES "LocalSettlementRecord"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
