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

requireText("money editing input helper exists", page, "function formatMoneyEditingInput(value: string): string {");
requireText("money editing input strips non-money typing chars", page, 'replace(/[^0-9.]/g, "")');
requireText("money editing input prepends dollar sign", page, "return `$${cleaned}`;");
requireText("claim amount onChange keeps dollar sign while typing", page, "onChange={(event) => setClaimAmountInput(formatMoneyEditingInput(event.target.value))}");
requireText("claim amount input still formats fully on blur", page, "onBlur={() => setClaimAmountInput(formatMoneyInputValue(parseMoneyInputValue(claimAmountInput)))}");
requireText("claim amount input handles enter key", page, 'if (event.key === "Enter") {');
requireText("claim amount enter prevents default", page, "event.preventDefault();");
requireText("claim amount enter saves", page, "void saveClaimAmountEditDialog();");

if (failed) process.exit(1);

console.log("PASS: Claim Amount money entry keeps dollar sign while typing and Enter saves.");
