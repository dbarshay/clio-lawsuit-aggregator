import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");
const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, needle) {
  if (page.includes(needle)) failures.push(`still contains ${label}: ${needle}`);
}

mustInclude("Recorded Settlement heading", "Recorded Settlement");
mustInclude("Payment Due Follow-Up heading", "Payment Due Follow-Up");
mustInclude("payment due follow-up date-label helper", "masterSettlementPaymentDueFollowUpLabel");
mustInclude("payment due follow-up heading", "Payment Due Follow-Up");
mustInclude("recorded settlement principal display", "Principal Settlement");
mustInclude("recorded settlement gross total display", "Gross Total");

mustNotInclude(
  "Refresh Settlement button",
  "Refresh Settlement"
);

mustNotInclude(
  "local settlement readback explanatory copy",
  "Barsh Matters local settlement readback.  Clio is not the source of truth for this panel."
);

mustNotInclude(
  "generic tickler explanatory copy",
  "Generic Barsh Matters tickler system.  Settlement payment due is the first tickler kind."
);

if (failures.length) {
  console.error("FAIL: settlement recorded panel copy simplification verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: recorded settlement panel explanatory copy and refresh button removed while settlement/tickler display remains.");
