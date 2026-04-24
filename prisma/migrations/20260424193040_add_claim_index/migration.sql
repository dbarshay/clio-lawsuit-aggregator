-- CreateTable
CREATE TABLE "ClaimIndex" (
    "matter_id" INTEGER NOT NULL,
    "display_number" TEXT,
    "description" TEXT,
    "claim_number_raw" TEXT,
    "claim_number_normalized" TEXT,
    "patient_name" TEXT,
    "client_name" TEXT,
    "insurer_name" TEXT,
    "claim_amount" DOUBLE PRECISION,
    "settled_amount" DOUBLE PRECISION,
    "payment_amount" DOUBLE PRECISION,
    "balance_amount" DOUBLE PRECISION,
    "bill_number" TEXT,
    "dos_start" TEXT,
    "dos_end" TEXT,
    "denial_reason" TEXT,
    "payment_voluntary" DOUBLE PRECISION,
    "balance_presuit" DOUBLE PRECISION,
    "master_lawsuit_id" TEXT,
    "status" TEXT,
    "raw_json" TEXT,
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimIndex_pkey" PRIMARY KEY ("matter_id")
);

-- CreateIndex
CREATE INDEX "ClaimIndex_claim_number_normalized_idx" ON "ClaimIndex"("claim_number_normalized");
