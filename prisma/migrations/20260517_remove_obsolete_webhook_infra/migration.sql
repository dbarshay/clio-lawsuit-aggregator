-- Remove obsolete Clio webhook/worker infrastructure.
-- Clio webhooks are no longer part of Barsh Matters correctness.
-- Clio remains available only for document storage/access and explicit legacy routes retained elsewhere.

DROP TABLE IF EXISTS "WebhookEvent";
DROP TABLE IF EXISTS "WorkerLock";
