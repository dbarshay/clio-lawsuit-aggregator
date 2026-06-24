import fs from "node:fs";

const checks = [];
const add = (name, ok) => checks.push({ name, ok });

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const library = read("src/lib/templates/template-builder-merge-field-library.ts");

for (const bad of [
  "exampleOutput: \"-zsh.00\"",
  "exampleOutput: \".25\"",
  "exampleOutput: \",261.75\"",
]) {
  add("Curated examples do not contain shell-expanded bad value " + bad, !library.includes(bad));
}

for (const good of [
  "mergeField: \"{{claim.amount}}\"",
  "exampleOutput: \"$562.25\"",
  "mergeField: \"{{claim.balance}}\"",
  "mergeField: \"{{claim.payments}}\"",
  "mergeField: \"{{lawsuit.amount}}\"",
  "exampleOutput: \"$1,261.75\"",
  "mergeField: \"{{lawsuit.costs}}\"",
  "mergeField: \"{{lawsuit.paymentsPosted}}\"",
  "mergeField: \"{{cost.indexFee}}\"",
  "mergeField: \"{{cost.serviceFee}}\"",
  "mergeField: \"{{cost.otherCourtCosts}}\"",
  "mergeField: \"{{cost.total}}\"",
  "exampleOutput: \"$0.00\"",
]) {
  add("Curated examples include " + good, library.includes(good));
}

const pkg = JSON.parse(read("package.json"));
add("Package has example-output verifier script", pkg.scripts && pkg.scripts["verify:template-builder-example-outputs"] === "node scripts/verify-template-builder-example-outputs.mjs");

const failed = checks.filter((check) => check.ok === false);
for (const check of checks) {
  const color = check.ok ? "\\x1b[32mPASS\\x1b[0m" : "\\x1b[31mFAIL\\x1b[0m";
  console.log(color + ": " + check.name);
}
if (failed.length > 0) {
  console.error(String.fromCharCode(10) + failed.length + " Template Builder example-output checks failed.");
  process.exit(1);
}
console.log(String.fromCharCode(10) + "PASS: Template Builder curated amount example outputs verified.");
