#!/usr/bin/env node
import fs from "fs";

const files = [
  "app/page.tsx",
  "app/matter/[id]/page.tsx",
  "app/matters/page.tsx",
];

let failed = false;

function check(label, ok) {
  if (ok) console.log(`PASS: ${label}`);
  else {
    console.log(`FAIL: ${label}`);
    failed = true;
  }
}

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  check(`${file} has openAdministratorMenu`, text.includes("function openAdministratorMenu()"));
  check(`${file} Administrator button uses gate opener`, text.includes("onClick={openAdministratorMenu}"));
  check(`${file} Administrator menu opener uses admin gate`, text.includes("Open Administrator Menu") && text.includes("runAdministratorGate"));
  check(`${file} no raw Administrator toggle remains`, !text.includes("onClick={() => setAdministratorMenuOpen((open) => !open)}"));
  check(`${file} menu still has Admin Home`, text.includes("🛠️ Admin Home"));
  check(`${file} menu still has Import`, text.includes("🔐 Import"));
  check(`${file} menu still has Templates`, text.includes("📄 Templates"));
  check(`${file} Print Queue remains separate`, text.includes("<span>Print Queue</span>"));
}

const landing = fs.readFileSync("app/page.tsx", "utf8");
const matter = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const master = fs.readFileSync("app/matters/page.tsx", "utf8");

check("landing has Audit / History menu item", landing.includes("📜 Audit / History"));
check("matter has Audit / History menu item", matter.includes("📜 Audit / History"));
check("master has Audit / History menu item", master.includes("📜 Audit / History"));

if (failed) process.exit(1);
console.log("PASS: Administrator button gates menu verifier");
