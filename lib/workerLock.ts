import { prisma } from "@/lib/prisma";

const WORKER_LOCK_ID = "global-lock";
const WORKER_LOCK_NAME = "webhook-worker";

export async function acquireLock(ownerId: string = "default-worker") {
  const now = new Date();

  const existing = await prisma.workerLock.findUnique({
    where: { id: WORKER_LOCK_ID },
  });

  if (existing?.locked) {
    return false;
  }

  await prisma.workerLock.upsert({
    where: { id: WORKER_LOCK_ID },
    update: {
      locked: true,
      lockedAt: now,
      lockedBy: ownerId,
      name: WORKER_LOCK_NAME,
    },
    create: {
      id: WORKER_LOCK_ID,
      locked: true,
      lockedAt: now,
      lockedBy: ownerId,
      name: WORKER_LOCK_NAME,
    },
  });

  return true;
}

export async function releaseLock() {
  await prisma.workerLock.update({
    where: { id: WORKER_LOCK_ID },
    data: {
      locked: false,
      lockedAt: null,
      lockedBy: null,
    },
  });
}
