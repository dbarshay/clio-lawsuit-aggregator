import fs from "fs";

const page = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const start = page.indexOf("async function finalizeMatterDocumentFromStep2");
const endCandidates = [
  page.indexOf("\n  async function ", start + 10),
  page.indexOf("\n  function ", start + 10),
].filter((index) => index > start);
const end = endCandidates.length ? Math.min(...endCandidates) : page.length;
const block = page.slice(start, end);

let failed = false;
function pass(message) { console.log("PASS:", message); }
function fail(message) { failed = true; console.error("FAIL:", message); }
function has(label, token) { block.includes(token) ? pass(label) : fail(`${label} missing ${token}`); }
function lacks(label, token) { !block.includes(token) ? pass(label) : fail(`${label} should not contain ${token}`); }

has("finalize normalizes raw matter display number", "const rawDirectMatterDisplayNumber =");
has("finalize accepts BRL underscore format", "/^BRL_\\d{9}$/i.test(rawDirectMatterDisplayNumber)");
has("finalize converts BRL without underscore", "`BRL_${rawDirectMatterDisplayNumber.slice(3)}`");
has("finalize converts 9 digit numeric display", "`BRL_${rawDirectMatterDisplayNumber}`");
has("finalize defaults numeric ID into BRL underscore display", "`BRL_${directMatterNumericIdForDocuments()}`");
has("finalize forces numeric directMatterId null", "const directMatterIdForRequest = null;");
has("finalize request sends null directMatterId", "directMatterId: directMatterIdForRequest,");
has("finalize request sends normalized display number", "directMatterDisplayNumber");
lacks("finalize request must not send directMatterNumericIdForDocuments directly", "directMatterId: directMatterNumericIdForDocuments(),");
lacks("finalize request must not generate BRL without underscore", "`BRL${directMatterNumericIdForDocuments()}`");
lacks("finalize request must not use inline BRL directMatterId expression", "directMatterId: /^BRL_");
lacks("finalize request must not send raw numeric directMatterId", "directMatterId: directMatterId,");
lacks("finalize request must not contain duplicate shorthand directMatterId before request value", "directMatterId,\n          directMatterId: directMatterIdForRequest,");

console.log("RESULT: direct matter finalize display number normalization verifier");
if (failed) process.exit(1);
