import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const failures = [];

const start = page.indexOf("{paymentClosePromptOpen && (");
const end = page.indexOf("{directPaymentsPanelOpen && (", start);
const region = start >= 0 && end > start ? page.slice(start, end) : "";

if (!region) failures.push("could not isolate post-payment Close Matter prompt region");

for (const token of [
  'data-barsh-direct-payment-close-prompt-standard-modal="true"',
  'data-barsh-direct-payment-close-prompt-header-standard="true"',
  'data-barsh-direct-payment-close-prompt-current-card="true"',
  'data-barsh-direct-payment-close-prompt-footer-actions="true"',
  'aria-label="Close Matter?"',
  'background: "#1e3a8a"',
  'borderBottom: "1px solid #1e3a8a"',
  'color: "#ffffff"',
  'textAlign: "center"',
  'Close Matter?',
  'Payment activity was saved. Do you want to close this matter now?',
  'onKeyDown={(event) => { if (event.key === "Escape") setPaymentClosePromptOpen(false); }}',
  'borderTop: "1px solid #e5e7eb"',
  'justifyContent: "flex-end"',
  'No',
  'Yes, Close Matter',
  'onClick={openCloseMatterFromPayment}',
]) {
  if (!region.includes(token)) failures.push("missing post-payment Close Matter prompt token: " + token);
}

for (const forbidden of [
  'border: "1px solid #fecaca"',
  'padding: 20,',
  'Payment activity was saved.  Do you want to close this matter now?',
  '>\n                          Yes\n',
]) {
  if (region.includes(forbidden)) failures.push("post-payment Close Matter prompt still has old token: " + forbidden);
}

const headerIndex = region.indexOf('data-barsh-direct-payment-close-prompt-header-standard="true"');
const footerIndex = region.indexOf('data-barsh-direct-payment-close-prompt-footer-actions="true"');
const closeActionIndex = region.indexOf("onClick={openCloseMatterFromPayment}");
if (!(headerIndex >= 0 && footerIndex > headerIndex && closeActionIndex > footerIndex)) {
  failures.push("Close Matter action must remain in footer actions after the standard header/body");
}

if (failures.length) {
  console.error("FAIL: post-payment Close Matter prompt standard safety");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: post-payment Close Matter prompt standard safety");
