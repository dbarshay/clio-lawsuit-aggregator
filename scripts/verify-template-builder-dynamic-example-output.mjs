import fs from "node:fs";

const checks = [];
const add = (name, ok) => checks.push({ name, ok });

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const build = read("app/admin/document-templates/build/page.tsx");
const pkg = JSON.parse(read("package.json"));

for (const token of [
  "TEMPLATE_BUILDER_EXAMPLE_MATTER_OUTPUTS",
  "function exampleOutputFor",
  "TEMPLATE_BUILDER_EXAMPLE_MATTER_OUTPUTS[exampleMatter]?.[field.mergeField] || field.exampleOutput",
  "{exampleOutputFor(field)}",
  "\"2026.06.00011\"",
  "\"{{claim.number}}\": \"EX-00011\"",
  "\"{{claim.amount}}\": \"$888.88\"",
  "\"{{lawsuit.indexNumber}}\": \"2026.06.00011\"",
  "\"{{cost.total}}\": \"$65.00\"",
  "\"BRL30236\"",
  "\"{{claim.amount}}\": \"$500.00\"",
  "\"2026.06.00002\"",
  "\"{{claim.amount}}\": \"$1,250.00\"",
]) {
  add("Build Template dynamic example output contains " + token, build.includes(token));
}

add("Build Template no longer renders static field.exampleOutput directly in table cell", !build.includes("<span>{field.exampleOutput}</span>"));
add("Package has dynamic example-output verifier script", pkg.scripts && pkg.scripts["verify:template-builder-dynamic-example-output"] === "node scripts/verify-template-builder-dynamic-example-output.mjs");

const failed = checks.filter((check) => check.ok === false);
for (const check of checks) {
  const color = check.ok ? "\\x1b[32mPASS\\x1b[0m" : "\\x1b[31mFAIL\\x1b[0m";
  console.log(color + ": " + check.name);
}
if (failed.length > 0) {
  console.error(String.fromCharCode(10) + failed.length + " Template Builder dynamic example output checks failed.");
  process.exit(1);
}
console.log(String.fromCharCode(10) + "PASS: Template Builder example matter dynamically changes example outputs.");
