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

function forbidText(label, haystack, needle) {
  if (haystack.includes(needle)) {
    console.error(`FAIL: forbidden ${label}`);
    failed = true;
  } else {
    console.log(`PASS: forbidden ${label} absent`);
  }
}

requireText("money input formatter exists", page, "function formatMoneyInputValue(value: unknown): string {");
requireText("money input parser exists", page, "function parseMoneyInputValue(value: string): string {");
requireText("formatter uses USD currency", page, 'currency: "USD"');
requireText("claim amount modal opens with formatted money", page, "setClaimAmountInput(formatMoneyInputValue(matter?.claimAmount));");
requireText("claim amount save parses money input", page, "const claimAmountRaw = parseMoneyInputValue(claimAmountInput);");
requireText("claim amount input is text", page, 'type="text"');
requireText("claim amount input uses decimal keyboard", page, 'inputMode="decimal"');
requireText("claim amount input formats on blur", page, "onBlur={() => setClaimAmountInput(formatMoneyInputValue(parseMoneyInputValue(claimAmountInput)))}");
forbidText("claim amount number input", page, 'type="number"');
forbidText("raw claim amount modal numeric state open", page, "setClaimAmountInput(String(num(matter?.claimAmount)));");

if (failed) process.exit(1);

console.log("PASS: Claim Amount edit modal uses money-formatted text input and saves normalized numeric value.");
