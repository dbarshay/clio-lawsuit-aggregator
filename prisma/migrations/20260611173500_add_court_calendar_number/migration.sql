ALTER TABLE "CourtCalendarEvent" ADD COLUMN IF NOT EXISTS "calendarNumber" TEXT;
CREATE INDEX IF NOT EXISTS "CourtCalendarEvent_calendarNumber_idx" ON "CourtCalendarEvent"("calendarNumber");
