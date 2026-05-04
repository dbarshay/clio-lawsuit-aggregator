-- Historical repair migration.
-- The database already has WebhookEvent, but the migration folder was missing
-- the table-creation migration required for clean shadow-database replay.

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT,
    "matterId" INTEGER,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WebhookEvent_status_idx" ON "WebhookEvent"("status");
CREATE INDEX IF NOT EXISTS "WebhookEvent_nextAttemptAt_idx" ON "WebhookEvent"("nextAttemptAt");
CREATE INDEX IF NOT EXISTS "WebhookEvent_matterId_idx" ON "WebhookEvent"("matterId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_webhookId_idx" ON "WebhookEvent"("webhookId");
