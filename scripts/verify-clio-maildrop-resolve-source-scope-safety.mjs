import fs from "fs";

const routePath = "app/api/documents/clio-maildrop-resolve/route.ts";
const route = fs.readFileSync(routePath, "utf8");

function requireContains(label, needle) {
  if (!route.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

function requireRegex(label, regex) {
  if (!regex.test(route)) {
    throw new Error(`Missing ${label}: ${regex}`);
  }
}

requireContains("source/scope resolver function", "function resolveMaildropSource(url: URL): \"direct_matter\" | \"master_lawsuit\"");
requireContains("source param read", "url.searchParams.get(\"source\")");
requireContains("scope param read", "url.searchParams.get(\"scope\")");
requireRegex("master alias support", /value === "master"/);
requireRegex("master_lawsuit alias support", /value === "master_lawsuit"/);
requireRegex("master-lawsuit alias support", /value === "master-lawsuit"/);
requireContains("direct fallback", "return \"direct_matter\";");
requireContains("GET uses resolver", "const source = resolveMaildropSource(url);");
requireContains("master branch uses resolved source", "source === \"master_lawsuit\"");
requireContains("direct branch still available", "await resolveDirectMatter(url)");
requireContains("master branch still available", "await resolveMasterMatter(url)");
requireContains("read-only response flag", "readOnly: true");
requireContains("no Clio records changed flag", "clioRecordsChanged: false");
requireContains("no database records changed response flag", "databaseRecordsChanged: false");
requireContains("MailDrop registry upsert remains explicit", "await upsertMaildropAddress({");

console.log("PASS: Clio MailDrop resolve source/scope safety verifier passed.");
