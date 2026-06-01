import fs from "node:fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");
const failures = [];

function mustInclude(label, needle) {
  if (!page.includes(needle)) failures.push(`missing ${label}: ${needle}`);
}

function mustNotInclude(label, needle) {
  if (page.includes(needle)) failures.push(`still contains ${label}: ${needle}`);
}

mustInclude("Email Finalized Document button", "Email Finalized Document");
mustInclude("email button purple background", 'background: masterDocumentFinalizationResult?.finalizationRecord?.id ? "#4f46e5" : "#c7d2fe"');
mustInclude("email button white text", 'color: "#fff"');
mustInclude("email button purple shadow", 'boxShadow: "0 10px 25px rgba(79,70,229,0.18)"');
mustInclude("email button title retained", 'title="Create an Outlook draft with the finalized settlement PDF attached from the mapped master Clio matter."');

mustNotInclude("delivery panel void notice display", "{masterSettlementVoidNotice && (");

const deliverySectionIndex = page.indexOf("Document Delivery");
const deliverySectionEnd = page.indexOf("{masterDocumentPrintResult &&", deliverySectionIndex);
const deliverySection = deliverySectionIndex >= 0
  ? page.slice(deliverySectionIndex, deliverySectionEnd > deliverySectionIndex ? deliverySectionEnd : page.length)
  : "";

if (deliverySection.includes("masterSettlementVoidNotice")) {
  failures.push("delivery section still renders masterSettlementVoidNotice");
}

if (failures.length) {
  console.error("FAIL: settlement delivery void notice/email color verifier failed");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: settlement delivery hides void notice and styles Email Finalized Document like the other purple action buttons.");
