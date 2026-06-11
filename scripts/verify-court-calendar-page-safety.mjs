import fs from "fs";

const page = fs.readFileSync("app/court-calendar/page.tsx", "utf8");
const header = fs.readFileSync("app/components/BarshHeaderActions.tsx", "utf8");
const matter = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");

const requiredPage = [
  'data-barsh-court-calendar-page="true"',
  "/api/court-calendar/events",
  "includeCaseData",
  "Export Report XLS",
  "Create Court Calendar Event",
  "BarshHeaderActions",
  "BarshHeaderQuickNav",
  "XLSX.writeFile",
  "/matters?master=",
];

const forbiddenPage = [
  "/matter/[id]",
  "google.calendar",
  "Microsoft Graph calendar",
  "externalCalendarEventsCreated: true",
];

const failures = [];

for (const token of requiredPage) if (!page.includes(token)) failures.push(`page missing ${token}`);
for (const token of forbiddenPage) if (page.includes(token)) failures.push(`page contains forbidden token ${token}`);

if (!header.includes('href="/court-calendar"') || !header.includes("Court Calendar")) {
  failures.push("global header is missing Court Calendar link");
}

if (matter.includes("/api/court-calendar/events") || matter.includes('data-barsh-court-calendar-page="true"')) {
  failures.push("direct matter page contains Court Calendar workflow wiring");
}

if (failures.length) {
  console.error("FAIL: court calendar page safety");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: court calendar page safety");
