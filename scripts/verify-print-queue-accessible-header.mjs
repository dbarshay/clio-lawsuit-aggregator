#!/usr/bin/env node
import fs from "fs";

const files = [
  "app/page.tsx",
  "app/matter/[id]/page.tsx",
  "app/matters/page.tsx",
  "app/lawsuits/page.tsx",
  "app/print-queue/page.tsx",
];

let failed = false;

function check(label, ok) {
  if (ok) console.log(`PASS: ${label}`);
  else {
    console.log(`FAIL: ${label}`);
    failed = true;
  }
}

function nearestPrintQueueButtonBlocks(text) {
  const blocks = [];
  const label = "<span>Print Queue</span>";
  let searchFrom = 0;

  while (true) {
    const labelIndex = text.indexOf(label, searchFrom);
    if (labelIndex === -1) break;

    const buttonStart = text.lastIndexOf("<button", labelIndex);
    const buttonEnd = text.indexOf("</button>", labelIndex);

    if (buttonStart !== -1 && buttonEnd !== -1) {
      blocks.push(text.slice(buttonStart, buttonEnd + "</button>".length));
    }

    searchFrom = labelIndex + label.length;
  }

  return blocks;
}

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");

  if (!text.includes("Print Queue")) continue;

  check(`${file} has no locked Print Queue copy`, !text.includes("Print Queue access is locked unless the user has print-queue rights."));
  check(`${file} has no lock icon`, !text.includes("🔒"));

  const blocks = nearestPrintQueueButtonBlocks(text);
  for (const [index, block] of blocks.entries()) {
    check(`${file} Print Queue button ${index + 1} routes to /print-queue`, block.includes('window.location.href = "/print-queue"') || block.includes('href="/print-queue"'));
    check(`${file} Print Queue button ${index + 1} is not disabled`, !/^\s*disabled\b/m.test(block) && !/^\s*aria-disabled=/m.test(block));
    check(`${file} Print Queue button ${index + 1} uses print icon`, block.includes("🖨️"));
    check(`${file} Print Queue button ${index + 1} does not use locked style name`, !block.includes("LockedPrintQueueStyle"));
  }
}

const landing = fs.readFileSync("app/page.tsx", "utf8");
const matter = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const master = fs.readFileSync("app/matters/page.tsx", "utf8");

check("Administrator still present on landing", landing.includes("<span>Administrator</span>"));
check("Administrator still present on matter", matter.includes("<span>Administrator</span>"));
check("Administrator still present on master", master.includes("<span>Administrator</span>"));
check("Admin Home still present on landing", landing.includes("🛠️ Admin Home"));
check("Admin Home still present on matter", matter.includes("🛠️ Admin Home"));
check("Admin Home still present on master", master.includes("🛠️ Admin Home"));

if (failed) process.exit(1);
console.log("PASS: Print Queue accessible header verifier");
