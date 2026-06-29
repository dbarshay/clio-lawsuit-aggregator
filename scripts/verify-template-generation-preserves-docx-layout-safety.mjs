import fs from "node:fs";

const route = fs.readFileSync("app/api/documents/templates/generate-preview/route.ts", "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

must(route.includes("xmlEscape(changed[index])"), "token replacement must escape text only");
must(!route.includes("xmlTextWithBreaks"), "token replacement must not inject raw DOCX XML breaks");
must(!route.includes("signerReplacementValueForContext"), "token replacement must not force signer layout context");
must(!route.includes("normalizeSignatureBreaksBeforeGeneration"), "route must not rewrite template layout XML before replacement");
must(route.includes('let xml = await file.async("string");'), "route must read DOCX XML without layout normalization");
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
