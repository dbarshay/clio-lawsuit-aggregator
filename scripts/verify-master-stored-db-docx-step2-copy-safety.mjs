import fs from "fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");

// Locks the current Step 2 (Preview PDF / Edit / Finalize) copy: a working DOCX is created in
// the Barsh Matters working-docs folder, edited in Word Web, then finalized. Preview itself
// persists nothing.
const required = [
  "Step 2: Preview PDF / Edit / Finalize",
  "was created in the Barsh Matters working-docs folder",
  "Use Word Web for editing",
  "Save your edits in Word Web, then return here and click Finalize Document",
  "No files are finalized, uploaded, emailed, or queued by preview",
];

const forbidden = [
  "PDF preview pending:",
  "cannot open as a PDF until server-side PDF generation/conversion is wired",
  "final document route will be wired next",
  "Word editing will be wired later",
  "PDF preview will be enabled after PDF generation/conversion is wired",
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
