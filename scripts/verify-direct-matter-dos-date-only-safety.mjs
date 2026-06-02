import fs from "fs";

const file = "app/matter/[id]/page.tsx";
const text = fs.readFileSync(file, "utf8");

let failed = false;

function requireText(label, needle) {
  if (!text.includes(needle)) {
    console.error(`FAIL: missing ${label}`);
    failed = true;
  } else {
    console.log(`PASS: ${label}`);
  }
}

function forbidText(label, needle) {
  if (text.includes(needle)) {
    console.error(`FAIL: forbidden ${label}`);
    failed = true;
  } else {
    console.log(`PASS: forbidden ${label} absent`);
  }
}

requireText("formatDate handles YYYY-MM-DD as date-only string", String.raw`const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);`);
requireText("formatDate outputs non-padded M/D/YYYY for date-only string", "if (ymd) return `${Number(ymd[2])}/${Number(ymd[3])}/${ymd[1]}`;");
requireText("directFieldDateInputValue preserves YYYY-MM-DD", String.raw`if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;`);
requireText("directFieldDateInputValue parses manual M/D/YYYY without Date", String.raw`const dotMatch = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);`);

forbidText("old formatDate Date parse for all values", "function formatDate(v?: string) {\n  if (!v) return \"\";\n  const d = new Date(v);");
forbidText("directFieldDateInputValue fallback Date parse", "const date = new Date(raw);\n    if (!Number.isNaN(date.getTime()))");

if (failed) process.exit(1);

console.log("PASS: direct matter DOS date-only handling avoids timezone shifts.");
