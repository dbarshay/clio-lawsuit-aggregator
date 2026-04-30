CREATE TABLE IF NOT EXISTS "ClaimClusterCache" (
  "claim_number_normalized" TEXT NOT NULL,
  "matter_ids" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClaimClusterCache_pkey" PRIMARY KEY ("claim_number_normalized")
);

CREATE INDEX IF NOT EXISTS "ClaimClusterCache_updated_at_idx"
ON "ClaimClusterCache"("updated_at");
