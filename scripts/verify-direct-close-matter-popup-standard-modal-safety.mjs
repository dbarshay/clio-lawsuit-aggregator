import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const failures = [];

const start = page.indexOf('data-barsh-direct-close-matter-standard-modal="true"');
const end = page.indexOf("    </>", start);
const region = start >= 0 && end > start ? page.slice(start, end) : "";

const visibleButtonIndex = page.indexOf(`data-barsh-direct-visible-close-matter-button="true"`);
const actionsBoxIndex = page.indexOf(`data-barsh-direct-actions-box="true"`);
if (visibleButtonIndex < 0) failures.push("missing visible direct Close Matter workflow button");
if (actionsBoxIndex >= 0 && visibleButtonIndex > actionsBoxIndex && visibleButtonIndex < page.indexOf(`{showCloseModal && (`, actionsBoxIndex)) failures.push("visible Close Matter button must not be inside the direct Actions box");
if (!page.includes(`data-barsh-direct-close-matter-visible-workflow-card="true"`)) failures.push("missing visible Close Matter workflow card marker");
if (!page.includes(`setCloseMatterTarget({\n                        id: matter.id,`)) failures.push("visible Close Matter button must set current matter target");

if (region === "") failures.push("could not isolate direct Close Matter popup region");

for (const token of [
  'data-barsh-direct-close-matter-standard-modal="true"',
  'data-barsh-direct-close-matter-current-card="true"',
  "Current",
  'background: "#1e3a8a"',
  'color: "#ffffff"',
  'textAlign: "center"',
  'Close Reason',
  'type="submit"',
  'onSubmit={(event) =>',
  'onKeyDown={(event) => { if (event.key === "Escape")',
  'borderTop: "1px solid #e2e8f0"',
  'border: "1px solid #dc2626"',
]) {
  if (region.includes(token) === false) failures.push("missing direct Close Matter popup token: " + token);
}

for (const forbidden of [
  "This will close matter",
  'background: "rgba(0,0,0,0.45)"',
  "borderRadius: 8",
  "boxShadow: \"0 10px 30px rgba(0,0,0,0.25)\"",
  'border: "1px solid #aaa"',
]) {
  if (region.includes(forbidden)) failures.push("direct Close Matter popup still has old token: " + forbidden);
}

if (failures.length) {
  console.error("FAIL: direct Close Matter popup standard modal safety");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("PASS: direct Close Matter popup standard modal safety");
