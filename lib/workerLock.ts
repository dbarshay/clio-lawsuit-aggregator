import { prisma } from "@/lib/prisma";

const LOCK_TIMEOUT_MS = 60 * 1000;

export async function acquireLock(): Promise<boolean> {
  const now = new Date();

  await prisma.workerLock.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      locked: false,
      lockedAt: null,
    },
  });

  const acquired = await prisma.workerLock.updateMany({
    where: {
      id: 1,
      OR: [
        { locked: false },
        { lockedAt: { lt: new Date(now.getTime() - LOCK_TIMEOUT_MS) } },
      ],
    },
    data: {
      locked: true,
      lockedAt: now,
    },
  });

  return acquired.count === 1;
}

export async function releaseLock(): Promise<void> {
  await prisma.workerLock.update({
    where: { id: 1 },
    data: {
      locked: false,
      lockedAt: null,
    },
  });
}
