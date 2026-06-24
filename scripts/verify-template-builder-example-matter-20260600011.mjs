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

has("2026.06.00011", "Build Template includes 2026.06.00011 as lawsuit example matter option");
has("2026.06.00012", "Build Template includes 2026.06.00012 as lawsuit example matter option");
has("BRL_202600001", "Build Template includes BRL_202600001 as direct/non-lawsuit example matter option");

lacks("BRL_202600003", "Build Template excludes retired example matter BRL_202600003");
lacks("BRL30236", "Build Template excludes retired example matter BRL30236");
lacks("2026.06.00002", "Build Template excludes retired example matter 2026.06.00002");

if (pkg.scripts?.["verify:template-builder-example-matter-20260600011"] === "node scripts/verify-template-builder-example-matter-20260600011.mjs") {
  pass("Package has example matter verifier script");
} else {
  fail("Package has example matter verifier script");
}

if (failed) process.exit(1);
console.log("\nPASS: Template Builder example matter options include lawsuit and direct examples.");
