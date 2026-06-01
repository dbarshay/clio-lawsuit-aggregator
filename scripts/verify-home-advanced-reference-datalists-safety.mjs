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

const homePage = read("app/page.tsx");
const packageJson = read("package.json");

mustContain("home page provider reference state", homePage, "providerReferenceOptions");
mustContain("home page insurer reference state", homePage, "insurerReferenceOptions");
mustContain("home page court reference state", homePage, "courtReferenceOptions");

mustContain("home page loads provider_client options", homePage, "/api/reference-data/options?type=provider_client");
mustContain("home page loads insurer_company options", homePage, "/api/reference-data/options?type=insurer_company");
mustContain("home page loads court_venue options", homePage, "/api/reference-data/options?type=court_venue");

mustContain("home page main provider datalist", homePage, 'datalist id="barsh-search-provider-suggestions"');
mustContain("home page main provider reference options", homePage, "providerReferenceOptions.map");
mustContain("home page main provider keeps search suggestions", homePage, "providerSearchSuggestions.map");

mustContain("advanced provider input uses datalist", homePage, 'list="barsh-advanced-provider-reference-options"');
mustContain("advanced insurer input uses datalist", homePage, 'list="barsh-advanced-insurer-reference-options"');
mustContain("advanced court input uses datalist", homePage, 'list="barsh-advanced-court-reference-options"');

mustContain("advanced provider datalist", homePage, 'datalist id="barsh-advanced-provider-reference-options"');
mustContain("advanced insurer datalist", homePage, 'datalist id="barsh-advanced-insurer-reference-options"');
mustContain("advanced court datalist", homePage, 'datalist id="barsh-advanced-court-reference-options"');

mustContain("package.json", packageJson, "verify:home-advanced-reference-datalists-safety");

mustNotContain("advanced patient should not use patient reference datalist yet", homePage, 'barsh-advanced-patient-reference-options');
mustNotContain("home page should not load empty patient reference table yet", homePage, "/api/reference-data/options?type=patient");

if (process.exitCode) {
  process.exit();
}

console.log("Home/advanced reference datalist safety verifier passed.");
