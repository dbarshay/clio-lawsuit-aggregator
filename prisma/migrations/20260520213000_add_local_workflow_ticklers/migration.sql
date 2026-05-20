-- CreateTable
CREATE TABLE "LocalWorkflowTickler" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'barsh-matters-local',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "masterLawsuitId" TEXT,
    "matterId" INTEGER,
    "displayNumber" TEXT,
    "settlementRecordId" TEXT,
    "dueDate" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completedNote" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalWorkflowTickler_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_kind_idx" ON "LocalWorkflowTickler"("kind");

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_status_idx" ON "LocalWorkflowTickler"("status");

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_priority_idx" ON "LocalWorkflowTickler"("priority");

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_masterLawsuitId_idx" ON "LocalWorkflowTickler"("masterLawsuitId");

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_matterId_idx" ON "LocalWorkflowTickler"("matterId");

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_displayNumber_idx" ON "LocalWorkflowTickler"("displayNumber");

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_settlementRecordId_idx" ON "LocalWorkflowTickler"("settlementRecordId");

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_dueDate_idx" ON "LocalWorkflowTickler"("dueDate");

-- CreateIndex
CREATE INDEX "LocalWorkflowTickler_createdAt_idx" ON "LocalWorkflowTickler"("createdAt");
