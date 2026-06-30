import fs from "node:fs";

const route = fs.readFileSync("app/api/documents/templates/generate-preview/route.ts", "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

// Current fill engine: token text is inserted via renderTokenText, which XML-escapes the value
// and converts newlines into Word hard breaks (<w:br/>) so multi-line values (e.g. address
// blocks) stack onto separate lines. The DOCX XML is read raw and the route never rewrites
// template layout XML before replacement (no signer-specific break normalization).
must(route.includes("function renderTokenText"), "fill engine must insert text via the renderTokenText renderer");
must(route.includes("xmlEscape("), "token replacement must XML-escape inserted text");
must(route.includes('out += "<w:br/>"'), "multi-line values must render as Word hard breaks (<w:br/>)");
must(route.includes('let xml = await file.async("string");'), "route must read DOCX XML raw, without layout normalization");
must(!route.includes("normalizeSignatureBreaksBeforeGeneration"), "route must not rewrite template layout XML before replacement");
must(!route.includes("signerReplacementValueForContext"), "replacement must not force signer-specific layout context");
must(route.includes("clioWrites: false"), "generation safety must still block Clio writes");
must(route.includes("graphWrites: false"), "generation safety must still block Graph writes");
must(route.includes("emailsSent: false"), "generation safety must still block emails");
must(route.includes("printQueued: false"), "generation safety must still block print queue");
must(route.includes("draftsCreated: false"), "generation safety must still block drafts");

if (failures.length) {
  console.error("FAILURES=" + failures.length);
  for (const failure of failures) console.error("FAIL=" + failure);
  process.exit(1);
}
console.log("PASS: template generation preserves DOCX layout and avoids raw XML injection");
