import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const DEFAULT_LOCK_NAME = "webhook-event-processor";
const DEFAULT_LOCK_TTL_SECONDS = 55;

export async function acquireLock(
  ownerId: string = `${process.env.VERCEL_REGION || "local"}-${randomUUID()}`,
  lockName: string = DEFAULT_LOCK_NAME,
  ttlSeconds: number = DEFAULT_LOCK_TTL_SECONDS
) {
  const rows = await prisma.$queryRaw<{ name: string }[]>`
    INSERT INTO "WorkerLock" ("name", "lockedBy", "lockedUntil", "createdAt", "updatedAt")
    VALUES (
      ${lockName},
      ${ownerId},
      NOW() + (${ttlSeconds} || ' seconds')::interval,
      NOW(),
      NOW()
    )
    ON CONFLICT ("name") DO UPDATE
    SET
      "lockedBy" = EXCLUDED."lockedBy",
      "lockedUntil" = EXCLUDED."lockedUntil",
      "updatedAt" = NOW()
    WHERE
      "WorkerLock"."lockedUntil" < NOW()
      OR "WorkerLock"."lockedBy" = ${ownerId}
    RETURNING "name";
  `;

  return rows.length > 0;
}

export async function releaseLock(
  ownerId?: string,
  lockName: string = DEFAULT_LOCK_NAME
) {
  if (ownerId) {
    await prisma.workerLock.deleteMany({
      where: {
        name: lockName,
        lockedBy: ownerId,
      },
    });
    return;
  }

  await prisma.workerLock.deleteMany({
    where: {
      name: lockName,
    },
  });
}
