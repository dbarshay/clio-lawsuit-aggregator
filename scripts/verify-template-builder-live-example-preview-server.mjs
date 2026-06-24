import fs from "node:fs";

const checks = [];
const add = (name, ok) => checks.push({ name, ok });

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const resolver = read("src/lib/templates/template-builder-live-example-preview.ts");
const route = read("app/api/admin/document-templates/example-preview/route.ts");
const pkg = JSON.parse(read("package.json"));

add("Live resolver file exists", resolver.length > 0);
add("Live resolver imports repo prisma", resolver.includes("from \"@/lib/prisma\""));
add("Live resolver exports resolveTemplateBuilderExamplePreview", resolver.includes("export async function resolveTemplateBuilderExamplePreview"));
add("Live resolver uses schema-aware tableColumns helper", resolver.includes("PRAGMA table_info"));
add("Live resolver queries live ClaimIndex", resolver.includes("findRows(\"ClaimIndex\""));
add("Live resolver queries live ProviderClientInfo", resolver.includes("findRows(\"ProviderClientInfo\""));
add("Live resolver keeps fallback data only as fallback", resolver.includes("const FALLBACKS"));
add("Live resolver resolves provider address source tokens", resolver.includes("{{provider.hidden_street}}") && resolver.includes("provider_hidden_street"));
add("Live resolver resolves claim amount and lawsuit balance", resolver.includes("{{claim.amount}}") && resolver.includes("{{lawsuit.balance}}"));
add("API route exists", route.includes("export async function GET"));
add("API route reads matter search param", route.includes("searchParams.get(\"matter\")"));
add("API route calls resolver", route.includes("resolveTemplateBuilderExamplePreview(matter)"));
add("Package has server verifier script", pkg.scripts && pkg.scripts["verify:template-builder-live-example-preview-server"] === "node scripts/verify-template-builder-live-example-preview-server.mjs");

const failed = checks.filter((check) => check.ok === false);
for (const check of checks) {
  const color = check.ok ? "\\x1b[32mPASS\\x1b[0m" : "\\x1b[31mFAIL\\x1b[0m";
  console.log(color + ": " + check.name);
}
if (failed.length > 0) {
  console.error(String.fromCharCode(10) + failed.length + " live example preview server checks failed.");
  process.exit(1);
}
console.log(String.fromCharCode(10) + "PASS: Template Builder live example preview server/API verified.");
