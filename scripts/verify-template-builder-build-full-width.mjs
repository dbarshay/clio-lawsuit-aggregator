import fs from "node:fs";

const checks = [];
const add = (name, ok) => checks.push({ name, ok });

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const build = read("app/admin/document-templates/build/page.tsx");

for (const token of [
  "maxWidth: \"none\"",
  "width: \"100%\"",
  "boxSizing: \"border-box\"",
  "minWidth: \"1480px\"",
  "tableLayout: \"auto\"",
  "maxHeight: \"calc(100vh - 230px)\"",
  "whiteSpace: \"nowrap\"",
  "verticalAlign: \"middle\"",
  "minWidth: \"520px\"",
]) {
  add(`Build Template full-width table contains ${token}`, build.includes(token));
}

add("Build Template no longer uses 1280px page max width", !build.includes("maxWidth: \"1280px\""));
add("Field label remains one-line without kind/type description", build.includes("<span style={{ fontWeight: 800 }}>{field.fieldLabel}</span>") && !build.includes("{field.kind} · {field.fieldType}"));
add("Functional controls remain", build.includes("Formats for copy") && build.includes("CopyIcon") && build.includes("TrashIcon") && build.includes("toggleSort"));

const pkg = JSON.parse(read("package.json"));
add("Package has full-width verifier script", pkg.scripts && pkg.scripts["verify:template-builder-build-full-width"] === "node scripts/verify-template-builder-build-full-width.mjs");

const failed = checks.filter((check) => check.ok === false);
for (const check of checks) {
  const color = check.ok ? "\\x1b[32mPASS\\x1b[0m" : "\\x1b[31mFAIL\\x1b[0m";
  console.log(`${color}: ${check.name}`);
}
if (failed.length > 0) {
  console.error(`\\n${failed.length} Build Template full-width checks failed.`);
  process.exit(1);
}
console.log("\\nPASS: Build Template full-width one-line table UI verified.");
