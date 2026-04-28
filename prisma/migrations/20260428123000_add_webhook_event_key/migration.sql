ALTER TABLE "WebhookEvent"
ADD COLUMN IF NOT EXISTS "eventKey" TEXT;

UPDATE "WebhookEvent"
SET "eventKey" = md5("id" || ':' || COALESCE("matterId"::text, '') || ':' || "createdAt"::text)
WHERE "eventKey" IS NULL;

ALTER TABLE "WebhookEvent"
ALTER COLUMN "eventKey" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_eventKey_key"
ON "WebhookEvent"("eventKey");
