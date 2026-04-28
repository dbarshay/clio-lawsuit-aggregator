CREATE TABLE "WorkerLock" (
  "name" TEXT NOT NULL,
  "lockedBy" TEXT NOT NULL,
  "lockedUntil" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkerLock_pkey" PRIMARY KEY ("name")
);

CREATE INDEX "WorkerLock_lockedUntil_idx" ON "WorkerLock"("lockedUntil");
