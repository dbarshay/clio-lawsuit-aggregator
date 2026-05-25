import fs from "fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");

const required = [
  "PDF preview generated:",
  "temporary working DOCX converted to PDF",
  "No final Clio upload, email draft, or print queue record is created by preview",
  "Edit the generated working DOCX in Word Web",
];

const forbidden = [
  "PDF preview pending:",
  "cannot open as a PDF until server-side PDF generation/conversion is wired",
  "final document route will be wired next",
  "Word editing will be wired later",
];

const failures = [];

for (const marker of required) {
  if (!page.includes(marker)) failures.push(`missing required marker: ${marker}`);
}

for (const marker of forbidden) {
  if (page.includes(marker)) failures.push(`stale marker present: ${marker}`);
}

if (failures.length) {
  console.error("FAIL: master stored DB DOCX Step 2 copy verifier failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: master Step 2 preview/edit copy reflects stored DB DOCX preview and Word Web workflow.");
