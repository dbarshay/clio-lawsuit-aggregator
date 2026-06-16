import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");
const failures = [];

function mustContain(token, message) {
  if (!page.includes(token)) failures.push(message);
}

mustContain("function splitMasterCourtDatesByTiming()", "missing upcoming/past Court Dates split helper");
mustContain("function compareMasterCourtDatesSoonest", "missing soonest sort helper for upcoming appearances");
mustContain("function compareMasterCourtDatesLatest", "missing latest sort helper for past appearances");
mustContain('renderMasterCourtDateSection("Upcoming Appearances"', "missing Upcoming Appearances section render");
mustContain('renderMasterCourtDateSection("Past Appearances"', "missing Past Appearances section render");
mustContain('data-barsh-master-court-dates-upcoming-past="true"', "missing upcoming/past wrapper marker");
mustContain('data-barsh-master-court-dates-section={marker}', "missing section marker for Court Dates split");
mustContain('eventDate && eventDate < today', "missing past-date classification against today");
mustContain("upcoming.sort(compareMasterCourtDatesSoonest)", "missing upcoming soonest sort");
mustContain("past.sort(compareMasterCourtDatesLatest)", "missing past latest sort");
mustContain("No upcoming appearances.", "missing upcoming empty state");
mustContain("No past appearances.", "missing past empty state");

if (failures.length) {
  console.error("FAIL: master court dates status box safety");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: master court dates status box safety");
