-- Create local MailDrop address registry for background Graph/MailDrop discovery.
-- This is local Barsh Matters metadata only. It does not write to Clio.

CREATE TABLE "MaildropAddress" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'local_registry',
  "matterId" INTEGER,
  "matterDisplayNumber" TEXT,
  "masterLawsuitId" TEXT,
  "clioMatterId" INTEGER,
  "clioDisplayNumber" TEXT,
  "clioMaildropEmail" TEXT NOT NULL,
  "clioMaildropLabel" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastResolvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MaildropAddress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaildropAddress_clioMaildropEmail_key" ON "MaildropAddress"("clioMaildropEmail");
CREATE INDEX "MaildropAddress_active_idx" ON "MaildropAddress"("active");
CREATE INDEX "MaildropAddress_matterId_idx" ON "MaildropAddress"("matterId");
CREATE INDEX "MaildropAddress_matterDisplayNumber_idx" ON "MaildropAddress"("matterDisplayNumber");
CREATE INDEX "MaildropAddress_masterLawsuitId_idx" ON "MaildropAddress"("masterLawsuitId");
CREATE INDEX "MaildropAddress_clioMatterId_idx" ON "MaildropAddress"("clioMatterId");
CREATE INDEX "MaildropAddress_clioDisplayNumber_idx" ON "MaildropAddress"("clioDisplayNumber");
CREATE INDEX "MaildropAddress_lastResolvedAt_idx" ON "MaildropAddress"("lastResolvedAt");

INSERT INTO "MaildropAddress" (
  "id",
  "source",
  "matterId",
  "matterDisplayNumber",
  "masterLawsuitId",
  "clioMatterId",
  "clioDisplayNumber",
  "clioMaildropEmail",
  "clioMaildropLabel",
  "active",
  "lastResolvedAt",
  "metadata",
  "createdAt",
  "updatedAt"
)
SELECT DISTINCT ON (LOWER(TRIM("clioMaildropEmail")))
  'emailthread_' || md5(LOWER(TRIM("clioMaildropEmail"))) AS "id",
  'email_thread_backfill' AS "source",
  "matterId",
  "matterDisplayNumber",
  "masterLawsuitId",
  "clioMatterId",
  "clioDisplayNumber",
  LOWER(TRIM("clioMaildropEmail")) AS "clioMaildropEmail",
  "clioMaildropLabel",
  true AS "active",
  COALESCE("updatedAt", CURRENT_TIMESTAMP) AS "lastResolvedAt",
  jsonb_build_object(
    'backfilledFrom', 'EmailThread',
    'emailThreadId', "id",
    'conversationId', "conversationId"
  ) AS "metadata",
  CURRENT_TIMESTAMP AS "createdAt",
  CURRENT_TIMESTAMP AS "updatedAt"
FROM "EmailThread"
WHERE "clioMaildropEmail" IS NOT NULL
  AND TRIM("clioMaildropEmail") <> ''
ORDER BY LOWER(TRIM("clioMaildropEmail")), "updatedAt" DESC
ON CONFLICT ("clioMaildropEmail") DO UPDATE SET
  "source" = EXCLUDED."source",
  "matterId" = COALESCE(EXCLUDED."matterId", "MaildropAddress"."matterId"),
  "matterDisplayNumber" = COALESCE(EXCLUDED."matterDisplayNumber", "MaildropAddress"."matterDisplayNumber"),
  "masterLawsuitId" = COALESCE(EXCLUDED."masterLawsuitId", "MaildropAddress"."masterLawsuitId"),
  "clioMatterId" = COALESCE(EXCLUDED."clioMatterId", "MaildropAddress"."clioMatterId"),
  "clioDisplayNumber" = COALESCE(EXCLUDED."clioDisplayNumber", "MaildropAddress"."clioDisplayNumber"),
  "clioMaildropLabel" = COALESCE(EXCLUDED."clioMaildropLabel", "MaildropAddress"."clioMaildropLabel"),
  "active" = true,
  "lastResolvedAt" = EXCLUDED."lastResolvedAt",
  "metadata" = EXCLUDED."metadata",
  "updatedAt" = CURRENT_TIMESTAMP;
