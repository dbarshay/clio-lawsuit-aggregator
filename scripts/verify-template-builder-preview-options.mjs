import fs from "node:fs";

const page = fs.readFileSync("app/admin/document-templates/build/page.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

let failed = false;
const pass = (message) => console.log("\x1b[32mPASS\x1b[0m:", message);
const fail = (message) => {
  failed = true;
  console.error("\x1b[31mFAIL\x1b[0m:", message);
};

const has = (token, message) => page.includes(token) ? pass(message) : fail(message);
const lacks = (token, message) => !page.includes(token) ? pass(message) : fail(message);

const approved = ["2026.06.00011", "2026.06.00012", "BRL_202600001"];
const retired = ["BRL_202600003", "BRL30236", "2026.06.00002"];

has("Example matter", "Example preview select exists");
has("2026.06.00011", "Default/lawsuit preview matter 2026.06.00011 is available");
has("2026.06.00012", "Lawsuit preview matter 2026.06.00012 is available");
has("BRL_202600001", "Direct/non-lawsuit preview matter BRL_202600001 is available");

for (const value of retired) {
  lacks(value, `Preview dropdown excludes retired example matter ${value}`);
}

for (const value of approved) {
  const count = (page.match(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (count >= 1) pass(`Preview option appears for ${value}`);
  else fail(`Preview option appears for ${value}`);
}

if (pkg.scripts?.["verify:template-builder-preview-options"] === "node scripts/verify-template-builder-preview-options.mjs") {
  pass("Package has preview option verifier script");
} else {
  fail("Package has preview option verifier script");
}

if (failed) process.exit(1);
console.log("\nPASS: Template Builder preview options include two lawsuit examples and one direct example.");
