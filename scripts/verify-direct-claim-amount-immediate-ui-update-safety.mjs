import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");

let failed = false;

function requireText(label, haystack, needle) {
  if (!haystack.includes(needle)) {
    console.error(`FAIL: missing ${label}`);
    failed = true;
  } else {
    console.log(`PASS: ${label}`);
  }
}

requireText("Claim Amount save computes local payment", page, "const nextPayment =");
requireText("Claim Amount save computes local balance", page, "const nextBalance = Math.max(claimAmount - nextPayment, 0);");
requireText("Claim Amount save always updates matter state", page, "setMatter((current: any) => ({");
requireText("Claim Amount save merges response matter when present", page, "...(json?.matter || {}),");
requireText("Claim Amount immediate state sets claimAmount camelCase", page, "claimAmount,");
requireText("Claim Amount immediate state sets claim_amount snake_case", page, "claim_amount: claimAmount,");
requireText("Claim Amount immediate state sets balancePresuit", page, "balancePresuit: nextBalance,");
requireText("Claim Amount immediate state sets balance_presuit", page, "balance_presuit: nextBalance,");
requireText("Claim Amount immediate state sets balanceAmount", page, "balanceAmount: nextBalance,");
requireText("Claim Amount immediate state sets balance_amount", page, "balance_amount: nextBalance,");
requireText("Claim Amount input re-formats after save", page, "setClaimAmountInput(formatMoneyInputValue(claimAmount));");

if (failed) process.exit(1);

console.log("PASS: Claim Amount save immediately updates local UI state after persistence.");
