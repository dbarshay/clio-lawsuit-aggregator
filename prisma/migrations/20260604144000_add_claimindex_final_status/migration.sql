ALTER TABLE "ClaimIndex" ADD COLUMN IF NOT EXISTS "final_status" TEXT;
UPDATE "ClaimIndex"
SET "final_status" = "close_reason"
WHERE "final_status" IS NULL
  AND "close_reason" IS NOT NULL
  AND TRIM("close_reason") <> '';
CREATE INDEX IF NOT EXISTS "ClaimIndex_final_status_idx" ON "ClaimIndex"("final_status");
