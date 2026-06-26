import fs from "node:fs";

const pagePath = "app/admin/document-templates/build/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

if (page.includes("key={format}")) failures.push("format button still uses raw format object as React key");
if (page.includes("selectedFormats.includes(format)")) failures.push("selectedFormats still checks raw format object");
if (page.includes("toggleFormat(format)")) failures.push("toggleFormat still receives raw format object");
if (!page.includes("formatValue") || !page.includes("formatLabelText")) failures.push("format value/label normalization is missing");
if (page.includes("key={formatValue || formatLabelText}") && !page.includes("formatReactKey")) console.log("NOTICE: Phase 1M key expression present without Phase 1N hardening");
if (!page.includes("key={formatValue || formatLabelText}") && !page.includes("key={formatReactKey}")) failures.push("format button does not use normalized unique key");
if (!page.includes("onClick={() => toggleFormat(formatValue)}")) failures.push("format button click does not use normalized value");
if (!page.includes("selectedFormats.includes(formatValue)")) failures.push("format checked state does not use normalized value");
if (!page.includes("{checked ? \"✓ \" : \"\"}{formatLabelText}")) failures.push("format button label does not use normalized display label");
if (page.includes("<option key={category} value={category}>{category}</option>")) failures.push("raw category option key regression detected");
if (page.includes("key={category}")) failures.push("raw category key regression detected");

if (failures.length) {
  console.error("FAIL: Phase 1M format button React key verifier failed");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("PASS: Phase 1M Build Template format buttons use normalized value/label keys and do not key React children by object identity.");
