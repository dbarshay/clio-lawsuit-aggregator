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

const claimInputIndex = page.indexOf("value={claimAmountInput}");
const claimInputBlock =
  claimInputIndex >= 0 ? page.slice(Math.max(0, claimInputIndex - 500), claimInputIndex + 900) : "";

requireText("Claim Amount input exists", page, "value={claimAmountInput}");
requireText("Claim Amount input has autoFocus", claimInputBlock, "autoFocus");
requireText("Claim Amount input selects all text on focus", claimInputBlock, "onFocus={(event) => event.currentTarget.select()}");
requireText("Claim Amount input still keeps dollar sign while typing", claimInputBlock, "onChange={(event) => setClaimAmountInput(formatMoneyEditingInput(event.target.value))}");
requireText("Claim Amount input still Enter-saves", claimInputBlock, 'if (event.key === "Enter") {');

if (failed) process.exit(1);

console.log("PASS: Claim Amount edit input auto-focuses and selects the full amount.");
