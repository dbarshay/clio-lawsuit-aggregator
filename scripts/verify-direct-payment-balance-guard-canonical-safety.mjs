import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const failures = [];

const helperStart = page.indexOf("function currentDirectMatterBalancePresuit(matter: any): number");
const helperEnd = page.indexOf("function stageColor", helperStart);
const helper = helperStart >= 0 && helperEnd > helperStart ? page.slice(helperStart, helperEnd) : "";

if (!helper) failures.push("could not isolate currentDirectMatterBalancePresuit helper");

for (const token of [
  "const storedBalance = num(",
  "matter?.balancePresuit ??",
  "matter?.balance_presuit ??",
  "matter?.balanceAmount ??",
  "matter?.balance_amount",
  "if (storedBalance > 0) return storedBalance;",
  "return Math.max(claimAmount - paymentVoluntary, 0);",
]) {
  if (!helper.includes(token)) failures.push("missing canonical balance helper token: " + token);
}

const applyMarker = "async function applyVoluntaryPaymentFromSummary()";
const applyStart = page.indexOf(applyMarker);
const afterApplyHeader = applyStart >= 0 ? applyStart + applyMarker.length : -1;
const applyEndCandidates = [
  page.indexOf("async function", afterApplyHeader),
  page.indexOf("function ", afterApplyHeader),
].filter((index) => index > afterApplyHeader);
const applyEnd = applyEndCandidates.length ? Math.min(...applyEndCandidates) : -1;
const apply = applyStart >= 0 && applyEnd > applyStart ? page.slice(applyStart, applyEnd) : "";

if (!apply) failures.push("could not isolate applyVoluntaryPaymentFromSummary");

for (const token of [
  "const currentBalancePresuit = currentDirectMatterBalancePresuit(matter);",
  "if (!isCostRecoveryPayment && paymentDelta > currentBalancePresuit)",
  "Payment exceeds the current Balance Presuit.",
]) {
  if (!apply.includes(token)) failures.push("missing payment guard token: " + token);
}

if (failures.length) {
  console.error("FAIL: direct payment balance guard canonical safety");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: direct payment balance guard uses canonical stored balance before claim-minus-payment fallback");
