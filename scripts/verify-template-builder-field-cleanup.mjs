import fs from "node:fs";

const checks = [];
const add = (name, ok) => checks.push({ name, ok });

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const build = read("app/admin/document-templates/build/page.tsx");
const library = read("src/lib/templates/template-builder-merge-field-library.ts");

const mergeFieldMatches = [];
for (const line of library.split(String.fromCharCode(10))) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("mergeField:")) continue;
  const first = trimmed.indexOf(String.fromCharCode(34));
  const last = trimmed.lastIndexOf(String.fromCharCode(34));
  if (first >= 0 && last > first) mergeFieldMatches.push(trimmed.slice(first + 1, last));
}

const uniqueMergeFields = Array.from(new Set(mergeFieldMatches));

add("Build Template no longer shows kind/type description after field label", !build.includes("{field.kind} · {field.fieldType}") && !build.includes("signatureHeader · Text"));
add("Build Template field label remains visible", build.includes("<span style={{ fontWeight: 800 }}>{field.fieldLabel}</span>"));
add("Build Template keeps full-width one-line table", build.includes("maxWidth: \"none\"") && build.includes("whiteSpace: \"nowrap\"") && build.includes("minWidth: \"1480px\""));
add("Build Template still uses shared canonical merge-field list", build.includes("TEMPLATE_BUILDER_CANONICAL_MERGE_FIELDS"));
add("Merge-field library has expanded beyond initial sample set", uniqueMergeFields.length > 25);
add("Merge-field library merge fields are unique", uniqueMergeFields.length === mergeFieldMatches.length);
add("Merge-field library includes signature fields", uniqueMergeFields.includes("{{signature.phoneLine}}") && uniqueMergeFields.includes("{{signature.block}}"));

const pkg = JSON.parse(read("package.json"));
add("Package has field cleanup verifier script", pkg.scripts && pkg.scripts["verify:template-builder-field-cleanup"] === "node scripts/verify-template-builder-field-cleanup.mjs");

const failed = checks.filter((check) => check.ok === false);
for (const check of checks) {
  const color = check.ok ? "\\x1b[32mPASS\\x1b[0m" : "\\x1b[31mFAIL\\x1b[0m";
  console.log(`${color}: ${check.name}`);
}
console.log(`MERGE_FIELD_COUNT=${uniqueMergeFields.length}`);
if (failed.length > 0) {
  console.error(`\\n${failed.length} Template Builder field-cleanup checks failed.`);
  process.exit(1);
}
console.log("\\nPASS: Template Builder field labels cleaned and merge-field library expanded.");
