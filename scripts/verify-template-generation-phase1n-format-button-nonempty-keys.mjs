import fs from "node:fs";

const pagePath = "app/admin/document-templates/build/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

for (const forbidden of [
  "key={format}",
  "key={formatValue || formatLabelText}",
  "selectedFormats.includes(format)",
  "toggleFormat(format)",
  "TEMPLATE_BUILDER_SUPPORTED_FORMAT_MODIFIERS.map((format) =>",
]) {
  if (page.includes(forbidden)) failures.push(`forbidden fragile format render snippet remains: ${forbidden}`);
}

for (const required of [
  "TEMPLATE_BUILDER_SUPPORTED_FORMAT_MODIFIERS.map((format, formatIndex) =>",
  "rawFormatValue",
  "rawFormatLabel",
  "?.modifier",
  "?.id",
  "?.key",
  "const formatValue = rawFormatValue.trim() || \"format-\" + formatIndex;",
  "const formatLabelText = rawFormatLabel.trim() || formatValue;",
  "const formatReactKey = formatValue + \"-\" + formatIndex;",
  "key={formatReactKey}",
  "selectedFormats.includes(formatValue)",
  "onClick={() => toggleFormat(formatValue)}",
]) {
  if (!page.includes(required)) failures.push(`missing hardened format render snippet: ${required}`);
}

if (page.includes("<option key={category} value={category}>{category}</option>")) failures.push("raw category option key regression detected");
if (page.includes("key={category}")) failures.push("raw category key regression detected");

if (failures.length) {
  console.error("FAIL: Phase 1N nonempty format key verifier failed");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("PASS: Phase 1N format modifier buttons use index-backed non-empty keys and normalized values.");
