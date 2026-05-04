ALTER TABLE "Lawsuit"
ADD COLUMN "amountSoughtMode" TEXT NOT NULL DEFAULT 'balance_presuit',
ADD COLUMN "amountSought" DOUBLE PRECISION,
ADD COLUMN "customAmountSought" DOUBLE PRECISION,
ADD COLUMN "amountSoughtBreakdown" JSONB;
