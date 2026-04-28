# Webhook System – Rollback Notes

Tag: webhook-system-production-ready-2026-04-28

If rollback is needed:

1. Re-deploy previous tag:
   git checkout webhook-idempotency-live-2026-04-28
   npx vercel --prod

2. WorkerLock table must exist with columns:
   - name (PK)
   - lockedBy
   - lockedUntil
   - createdAt
   - updatedAt

3. WebhookEvent requires:
   - eventKey (unique, non-null)

4. If worker errors:
   - check WorkerLock columns
   - check Prisma schema alignment

5. Safe operations:
   - Re-running webhook ingestion is idempotent
   - Skipped events are expected behavior
