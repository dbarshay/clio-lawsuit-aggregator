import fs from "fs";

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const migration = fs.readFileSync("prisma/migrations/20260611164000_add_court_calendar_events/migration.sql", "utf8");

function modelBlock(name) {
  const start = schema.indexOf(`model ${name} {`);
  if (start < 0) return "";
  const next = schema.indexOf("\nmodel ", start + 1);
  return next < 0 ? schema.slice(start) : schema.slice(start, next);
}

const block = modelBlock("CourtCalendarEvent");
const failures = [];

if (!block) failures.push("schema missing model CourtCalendarEvent");

const requiredSchema = [
  "masterLawsuitId        String",
  "eventType              String",
  "eventDate              String",
  "reminderTicklerId      String?",
  "@@index([masterLawsuitId])",
  "@@index([eventDate])",
  "@@index([reminderTicklerId])",
];

const forbiddenSchema = [
  "matterId               Int?",
  "@@index([matterId])",
];

const requiredMigration = [
  'CREATE TABLE "CourtCalendarEvent"',
  '"masterLawsuitId" TEXT NOT NULL',
  '"eventType" TEXT NOT NULL',
  '"eventDate" TEXT NOT NULL',
  'CREATE INDEX "CourtCalendarEvent_masterLawsuitId_idx"',
  'CREATE INDEX "CourtCalendarEvent_eventDate_idx"',
];

const forbiddenMigration = [
  '"matterId" INTEGER',
  'CourtCalendarEvent_matterId_idx',
];

for (const token of requiredSchema) if (!block.includes(token)) failures.push(`CourtCalendarEvent schema block missing ${token}`);
for (const token of forbiddenSchema) if (block.includes(token)) failures.push(`CourtCalendarEvent schema block should not include individual matter workflow field ${token}`);
for (const token of requiredMigration) if (!migration.includes(token)) failures.push(`migration missing ${token}`);
for (const token of forbiddenMigration) if (migration.includes(token)) failures.push(`migration should not include individual matter workflow token ${token}`);

if (failures.length) {
  console.error("FAIL: court calendar schema foundation safety");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: court calendar schema foundation safety");
