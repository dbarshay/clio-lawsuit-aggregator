import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");
const route = fs.readFileSync("app/api/ticklers/settlement-payment-due/route.ts", "utf8");

const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle) && !route.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustIncludePage(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustIncludeRoute(label, needle) {
  if (!route.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotIncludePage(label, needle) {
  if (page.includes(needle)) failures.push(`still contains ${label}: ${needle}`);
}

mustIncludePage("automatic tickler creation function remains", "async function createMasterSettlementPaymentDueTickler");
mustIncludePage("Record Settlement still creates tickler after save", "await createMasterSettlementPaymentDueTickler(savedSettlementRecordId);");
mustIncludePage("tickler readback function remains", "async function loadMasterSettlementTicklers");
mustIncludePage("Payment Due Follow-Up display remains", "Payment Due Follow-Up");
mustIncludePage("payment due follow-up date-label helper remains", "masterSettlementPaymentDueFollowUpLabel");
mustIncludePage("payment due follow-up date formatter remains", "formatSettlementTicklerDate");
mustIncludePage("no open follow-up display remains", "No open payment due follow-up tickler yet.");

mustIncludeRoute("tickler route supports settlementRecordId", "settlementRecordId");
mustIncludeRoute("tickler route creates open status", 'status: "open"');
mustIncludeRoute("tickler route has duplicate prevention", "duplicatePrevented");
mustIncludeRoute("tickler route stores due date", "dueDate");

mustNotIncludePage("manual create tickler button label", "Create Payment Due Tickler");
mustNotIncludePage("manual create tickler click handler", "createMasterSettlementPaymentDueTickler(masterSettlementHistory?.activeRecordId)");
mustNotIncludePage("manual create tickler duplicate UI", "masterSettlementTicklerCreate?.duplicatePrevented");
mustNotIncludePage("manual create tickler error UI", "masterSettlementTicklerCreate?.error");

if (failures.length) {
  console.error("FAIL: settlement tickler auto-create/display-only page verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: settlement recording auto-creates payment-due ticklers while individual pages display ticklers without a manual create button.");
