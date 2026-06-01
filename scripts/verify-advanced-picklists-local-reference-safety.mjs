import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function mustContain(label, text, needle) {
  if (!text.includes(needle)) fail(`${label} missing ${needle}`);
}

function mustNotContain(label, text, needle) {
  if (text.includes(needle)) fail(`${label} must not contain ${needle}`);
}

const route = read("app/api/advanced-search/picklists/route.ts");
const directPage = read("app/matter/[id]/page.tsx");
const homePage = read("app/page.tsx");
const packageJson = read("package.json");

mustContain("picklists route", route, 'import { prisma } from "@/lib/prisma"');
mustContain("picklists route", route, 'source: "barsh-matters-local-reference-data"');
mustContain("picklists route", route, "clioRead: false");
mustContain("picklists route", route, "clioWrite: false");
mustContain("picklists route", route, 'fetchLocalReferenceOptions("denial_reason"');
mustContain("picklists route", route, 'fetchLocalReferenceOptions("closed_reason"');
mustContain("picklists route", route, 'fetchLocalReferenceOptions("service_type"');
mustContain("picklists route", route, "prisma.referenceEntity.findMany");
mustContain("picklists route", route, 'type,');
mustContain("picklists route", route, 'active: true');
mustContain("picklists route", route, "localReferenceDataOnly: true");
mustContain("picklists route", route, "noClioReadPerformed: true");
mustContain("picklists route", route, "FALLBACK_STATUS_STAGE_OPTIONS");

mustNotContain("picklists route no Clio import", route, 'import { clioFetch }');
mustNotContain("picklists route no clioFetch", route, "clioFetch(");
mustNotContain("picklists route no Clio field ids", route, "FIELD_IDS");
mustNotContain("picklists route no custom field fetch", route, "fetchCustomFieldOptions");
mustNotContain("picklists route no Clio custom fields", route, "/api/v4/custom_fields");
mustNotContain("picklists route no Clio matter stages", route, "/api/v4/matter_stages");

mustContain("direct matter denial reason uses local reference options", directPage, "/api/reference-data/options?type=denial_reason");
mustContain("direct matter closed reason uses local reference options", directPage, "/api/reference-data/options?type=closed_reason");
mustContain("home page still uses shared local-reference picklists route", homePage, "/api/advanced-search/picklists");

mustContain("package.json", packageJson, "verify:advanced-picklists-local-reference-safety");

if (process.exitCode) {
  process.exit();
}

console.log("Advanced picklists local reference safety verifier passed.");
