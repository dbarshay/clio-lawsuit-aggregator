import fs from "node:fs";

const checks = [];
const add = (name, ok) => checks.push({ name, ok });

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const library = read("src/lib/templates/template-builder-merge-field-library.ts");

for (const label of [
  "fieldLabel: \"Provider Street\"",
  "fieldLabel: \"Provider City\"",
  "fieldLabel: \"Provider State\"",
  "fieldLabel: \"Provider Zipcode\"",
  "fieldLabel: \"Insurer Street\"",
  "fieldLabel: \"Insurer City\"",
  "fieldLabel: \"Insurer State\"",
  "fieldLabel: \"Insurer Zipcode\"",
]) {
  add("Clean field label exists " + label, library.includes(label));
}

for (const badLabel of [
  "fieldLabel: \"Provider Hidden",
  "fieldLabel: \"Insurer Hidden",
  "fieldLabel: \"Patient Hidden",
  "fieldLabel: \"Treating Provider Hidden",
]) {
  add("No Hidden text remains in field labels " + badLabel, !library.includes(badLabel));
}

for (const token of [
  "{{provider.hidden_street}}",
  "{{provider.hidden_city}}",
  "{{provider.hidden_state}}",
  "{{provider.hidden_zipcode}}",
  "{{insurer.hidden_street}}",
  "{{insurer.hidden_city}}",
  "{{insurer.hidden_state}}",
  "{{insurer.hidden_zipcode}}",
]) {
  add("Underlying hidden source token preserved " + token, library.includes(token));
}

const pkg = JSON.parse(read("package.json"));
add("Package has hidden-label verifier script", pkg.scripts && pkg.scripts["verify:template-builder-remove-hidden-labels"] === "node scripts/verify-template-builder-remove-hidden-labels.mjs");

const failed = checks.filter((check) => check.ok === false);
for (const check of checks) {
  const color = check.ok ? "\\x1b[32mPASS\\x1b[0m" : "\\x1b[31mFAIL\\x1b[0m";
  console.log(color + ": " + check.name);
}
if (failed.length > 0) {
  console.error(String.fromCharCode(10) + failed.length + " Template Builder hidden-label checks failed.");
  process.exit(1);
}
console.log(String.fromCharCode(10) + "PASS: Template Builder Hidden label text removed while source tokens remain.");
