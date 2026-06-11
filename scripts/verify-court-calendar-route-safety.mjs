import fs from "fs";

const route = fs.readFileSync("app/api/court-calendar/events/route.ts", "utf8");

const required = [
  'sourceOfTruth: "barsh-matters-local"',
  "externalCalendarEventsCreated: false",
  "clioRecordsChanged: false",
  "prisma.courtCalendarEvent.findMany",
  "tx.courtCalendarEvent.create",
  "kind: \"court_calendar_reminder\"",
  "tx.auditLog.create",
  "previewOnly",
  "validDateOnly",
  'sourcePage: clean(body?.sourcePage) || "court-calendar"',
  'scope: "master-lawsuit"',
  "includeCaseData",
  "prisma.claimIndex.findMany",
];

const forbidden = [
  "matterId =",
  "numberOrNull",
  "app/matter/[id]",
  "google.calendar",
  "gcal",
  "Microsoft Graph calendar",
  "fetch(\"https://graph.microsoft.com",
  "clioApi",
  "sendEmail",
];

const failures = [];

for (const token of required) if (!route.includes(token)) failures.push(`route missing ${token}`);
for (const token of forbidden) if (route.includes(token)) failures.push(`route contains forbidden individual/external workflow token ${token}`);

if (failures.length) {
  console.error("FAIL: court calendar route safety");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: court calendar route safety");
