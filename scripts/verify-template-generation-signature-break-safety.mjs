import fs from "node:fs";

const route = fs.readFileSync("app/api/documents/templates/generate-preview/route.ts", "utf8");
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

must(route.includes("function xmlTextWithBreaks"), "missing XML hard-break text renderer");
must(route.includes('join("</w:t><w:br/><w:t>")'), "replacement values with newlines must render as Word hard breaks");
must(route.includes("function normalizeSignatureBreaksBeforeGeneration"), "missing signature break normalizer");
must(route.includes("function signerReplacementValueForContext"), "missing context-aware signer break helper");
must(route.includes('token !== "{{signer.signatureName}}"'), "context helper must only target signer signature token");
must(route.includes('beforeToken.endsWith("Very truly yours,")'), "context helper must target closing phrase");
must(route.includes('return "\\n" + value'), "context helper must prepend newline before signature value");
must(route.includes("const replacementValue = signerReplacementValueForContext(token, value, fullText, tokenStart);"), "token replacement must use context-aware value");
must(route.includes("xmlTextWithBreaks(changed[index])"), "replacement must render hard breaks into DOCX XML");
must(route.includes("normalizeSignatureBreaksBeforeGeneration(await file.async"), "DOCX XML must be normalized before token replacement");
must(route.includes("clioWrites: false"), "generation route safety must still block Clio writes");
must(route.includes("graphWrites: false"), "generation route safety must still block Graph writes");
must(route.includes("emailsSent: false"), "generation route safety must still block emails");
must(route.includes("printQueued: false"), "generation route safety must still block print queue");
must(route.includes("draftsCreated: false"), "generation route safety must still block drafts");

if (failures.length) {
  console.error("FAILURES=" + failures.length);
  for (const failure of failures) console.error("FAIL=" + failure);
  process.exit(1);
}
console.log("PASS: template generation enforces signature hard break safely");
