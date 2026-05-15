-- Add local Barsh Matters Treating Provider identity field to ClaimIndex.
ALTER TABLE "ClaimIndex"
ADD COLUMN IF NOT EXISTS "treating_provider" TEXT;

CREATE INDEX IF NOT EXISTS "ClaimIndex_treating_provider_idx"
ON "ClaimIndex"("treating_provider");

-- Backfill existing proof-of-concept MatterLocalField Treating Provider values.
UPDATE "ClaimIndex" ci
SET "treating_provider" = mlf."fieldValue"
FROM "MatterLocalField" mlf
WHERE mlf."matterId" = ci."matter_id"
  AND mlf."fieldName" = 'treating_provider'
  AND COALESCE(TRIM(mlf."fieldValue"), '') <> ''
  AND (
    ci."treating_provider" IS NULL
    OR COALESCE(TRIM(ci."treating_provider"), '') = ''
  );
