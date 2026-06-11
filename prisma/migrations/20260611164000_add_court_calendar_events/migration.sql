-- CreateTable
CREATE TABLE "CourtCalendarEvent" (
    "id" TEXT NOT NULL,
    "masterLawsuitId" TEXT NOT NULL,
    "displayNumber" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "court" TEXT,
    "venue" TEXT,
    "indexAaaNumber" TEXT,
    "eventDate" TEXT NOT NULL,
    "eventTime" TEXT,
    "part" TEXT,
    "judgeOrArbitrator" TEXT,
    "appearanceType" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "adjournedFromEventId" TEXT,
    "adjournedToEventId" TEXT,
    "reminderDate" TEXT,
    "reminderTicklerId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'barsh-matters-local',
    "sourceType" TEXT,
    "sourcePage" TEXT,
    "sourceAction" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourtCalendarEvent_masterLawsuitId_idx" ON "CourtCalendarEvent"("masterLawsuitId");
CREATE INDEX "CourtCalendarEvent_displayNumber_idx" ON "CourtCalendarEvent"("displayNumber");
CREATE INDEX "CourtCalendarEvent_eventType_idx" ON "CourtCalendarEvent"("eventType");
CREATE INDEX "CourtCalendarEvent_status_idx" ON "CourtCalendarEvent"("status");
CREATE INDEX "CourtCalendarEvent_eventDate_idx" ON "CourtCalendarEvent"("eventDate");
CREATE INDEX "CourtCalendarEvent_reminderDate_idx" ON "CourtCalendarEvent"("reminderDate");
CREATE INDEX "CourtCalendarEvent_reminderTicklerId_idx" ON "CourtCalendarEvent"("reminderTicklerId");
CREATE INDEX "CourtCalendarEvent_createdAt_idx" ON "CourtCalendarEvent"("createdAt");
