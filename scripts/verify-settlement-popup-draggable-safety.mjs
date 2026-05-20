import fs from "node:fs";

let failures = 0;

function read(path) {
  try {
    return fs.readFileSync(path, "utf8");
  } catch {
    failures += 1;
    console.error(`FAIL: missing ${path}`);
    return "";
  }
}

function mustContain(label, text, needle) {
  if (text.includes(needle)) console.log(`PASS: ${label}: found ${needle}`);
  else {
    failures += 1;
    console.error(`FAIL: ${label}: missing ${needle}`);
  }
}

function mustNotContain(label, text, needle) {
  if (!text.includes(needle)) console.log(`PASS: ${label}: does not contain ${needle}`);
  else {
    failures += 1;
    console.error(`FAIL: ${label}: must not contain ${needle}`);
  }
}

const page = read("app/matters/page.tsx");
const packageJson = read("package.json");

console.log("=== SETTLEMENT POPUP DRAGGABLE SAFETY VERIFICATION ===");

[
  "masterSettlementPopupPosition",
  "popup.style.top = \"72px\"",
  "useState({ x: 0, y: 72 })",
  "`calc(50% + ${masterSettlementPopupPosition.x}px)`",
  "transform: \"translateX(-50%)\"",
  "masterSettlementPopupDragging",
  "resetMasterSettlementPopupPosition",
  "beginMasterSettlementPopupDrag",
  "popup.style.top",
  "popup.style.left",
  "getBoundingClientRect",
  "data-barsh-draggable-settlement-popup-shell",
  "masterSettlementFormOpen && activeMasterWorkspaceTab === \"payments\"",
  "onPointerDown={beginMasterSettlementPopupDrag}",
  "setPointerCapture",
  "pointercancel",
  "touchAction",
  "maxWidth: \"98vw\"",
  "minHeight: 420",
  "minWidth: 720",
  "resize: \"both\"",
  "data-barsh-draggable-settlement-popup-header",
  "Drag to move this settlement popup",
  "Drag this blue header to move the popup",
  "pointermove",
  "pointerup",
  "Math.max(8",
].forEach((needle) => mustContain("app/matters/page.tsx", page, needle));

mustContain("package.json", packageJson, '"verify:settlement-popup-draggable-safety"');

mustNotContain("app/matters/page.tsx", page, "aria-label=\"Close settlement preview popup\"");

if (failures) {
  console.error(`=== SETTLEMENT POPUP DRAGGABLE SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== SETTLEMENT POPUP DRAGGABLE SAFETY PASSED ===");
