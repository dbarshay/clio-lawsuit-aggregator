import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

function mustContain(label, needle) {
  if (!page.includes(needle)) {
    failures.push(`${pagePath} missing ${label}`);
  }
}

function mustNotContain(label, needle) {
  if (page.includes(needle)) {
    failures.push(`${pagePath} still contains ${label}`);
  }
}

mustContain("Payment Due Follow-Up display heading", "Payment Due Follow-Up");
mustContain("tickler readback state", "masterSettlementTicklers");
mustContain("tickler readback loader", "loadMasterSettlementTicklers");
mustContain("payment due follow-up date-label helper", "masterSettlementPaymentDueFollowUpLabel");
mustContain("payment due follow-up date formatter", "formatSettlementTicklerDate");
mustContain("no open payment due follow-up display", "No open payment due follow-up tickler yet.");
mustContain("automatic tickler creation after settlement save", "await createMasterSettlementPaymentDueTickler(savedSettlementRecordId);");
mustContain("automatic tickler creation function", "async function createMasterSettlementPaymentDueTickler");

mustNotContain("manual Create Payment Due Tickler button", "Create Payment Due Tickler");
mustNotContain("manual tickler create click handler", "createMasterSettlementPaymentDueTickler(masterSettlementHistory?.activeRecordId)");
mustNotContain("manual duplicatePrevented UI", "masterSettlementTicklerCreate?.duplicatePrevented");
mustNotContain("manual tickler create error UI", "masterSettlementTicklerCreate?.error");

if (failures.length) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log(
  "PASS: settlement payment due tickler UI is display-only on individual pages while settlement recording auto-creates the tickler."
);
