import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");
const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, needle) {
  if (page.includes(needle)) failures.push(`still contains ${label}: ${needle}`);
}

mustInclude("tickler date formatter", "function formatSettlementTicklerDate");
mustInclude("payment due follow-up label helper", "function masterSettlementPaymentDueFollowUpLabel()");
mustInclude("MM/DD/YYYY formatter", 'return `${match[2]}/${match[3]}/${match[1]}`;');
mustInclude("label includes formatted due date", "Payment Due Follow-Up- ${firstDueDate}");
mustInclude("heading renders helper", "{masterSettlementPaymentDueFollowUpLabel()}</div>");
mustInclude("no-open tickler fallback remains", "No open payment due follow-up tickler yet.");
mustInclude("tickler readback remains", "masterSettlementTicklers.ticklers");

mustNotInclude("old open follow-up count wording", "open payment due follow-up(s):");
mustNotInclude("old due date join display", ".map((tickler: any) => tickler.dueDate || \"no due date\").join");
mustNotInclude("generic tickler explanatory copy", "Generic Barsh Matters tickler system.");

if (failures.length) {
  console.error("FAIL: settlement payment due follow-up date label verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: payment due follow-up label displays first open tickler date as MM/DD/YYYY without count/list wording.");
