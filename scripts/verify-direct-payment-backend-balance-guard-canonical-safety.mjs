import fs from "fs";

const route = fs.readFileSync("app/api/matters/apply-payment/route.ts", "utf8");
const failures = [];

for (const token of [
  "const claimIndexRow = await prisma.claimIndex.findFirst",
  "{ matter_id: matterId }",
  "const canonicalClaimAmount = num(",
  "claimIndexRow?.claim_amount ??",
  "const canonicalPaymentVoluntary = num(",
  "claimIndexRow?.payment_voluntary ??",
  "const canonicalBalancePresuit = num(",
  "claimIndexRow?.balance_presuit ??",
  "const canonicalBefore = canonicalBalancePresuit > 0",
  'paymentSource: "ClaimIndex canonical financial fields"',
  'balanceSource: "ClaimIndex balance_presuit"',
  "after: canonicalBefore",
  "if (!isCostRecoveryPayment && claimAmount > 0 && paymentAmount > before.balancePresuit + 0.005)",
  'error: "Payment amount exceeds the current Balance."',
]) {
  if (!route.includes(token)) failures.push("missing backend canonical payment balance token: " + token);
}

if (route.includes("after.balancePresuit < -0.005")) {
  failures.push("backend must not restore old clamped after-balance overpayment check");
}

if (failures.length) {
  console.error("FAIL: direct payment backend balance guard canonical safety");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: direct payment backend balance guard uses ClaimIndex canonical before-balance");
