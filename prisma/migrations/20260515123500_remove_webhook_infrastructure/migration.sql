-- Remove obsolete Clio webhook processing infrastructure.
-- Clio is no longer an operational source-of-truth dependency for Barsh Matters workflows.
DROP TABLE IF EXISTS "WebhookEvent";
DROP TABLE IF EXISTS "WorkerLock";
