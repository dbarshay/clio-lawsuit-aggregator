import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initialBillingLetterMergeCodeReadinessContract as readiness, initialBillingLetterDocxImportGateContract as gate } from "../src/lib/templates/template-layout-composition-registry-source.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(root, "test/fixtures/templates/templates-phase18b-initial-billing-letter-docx-import-gate-fixtures.json");
const docPath = path.join(root, "docs/templates/templates-phase18b-initial-billing-letter-docx-import-gate.md");
const docxPath = path.join(root, "templates/docx/letters/initial-billing-letter.docx");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const doc = fs.readFileSync(docPath, "utf8");
function fail(message) { throw new Error(message); }
function eq(actual, expected, label) { if (actual === expected) return; fail(`${label} mismatch: expected ${expected}, received ${actual}`); }
function same(actual, expected, label) { if (JSON.stringify(actual) === JSON.stringify(expected)) return; fail(`${label} mismatch: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`); }
function has(text, value, label) { if (text.includes(value)) return; fail(`${label} missing ${value}`); }
function unzipStoredEntries(buffer) {
  const entries = [];
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const name = buffer.slice(nameStart, nameStart + fileNameLength).toString("utf8");
    const data = buffer.slice(dataStart, dataStart + compressedSize);
    entries.push({ name, method, data });
    offset = dataStart + compressedSize;
  }
  return entries;
}
async function extractVisibleTextAndTokens(docxFilePath) {
  const zlib = await import("node:zlib");
  const buffer = fs.readFileSync(docxFilePath);
  const entries = unzipStoredEntries(buffer);
  const xmlNames = entries.map((entry) => entry.name).filter((name) => name.startsWith("word/") && name.endsWith(".xml") && (name.endsWith("/document.xml") || name.includes("/header") || name.includes("/footer"))).sort();
  const parts = [];
  for (const name of xmlNames) {
    const entry = entries.find((item) => item.name === name);
    if (entry === undefined) fail(`missing ZIP entry ${name}`);
    let xmlBuffer;
    if (entry.method === 0) {
      xmlBuffer = entry.data;
    } else if (entry.method === 8) {
      xmlBuffer = zlib.inflateRawSync(entry.data);
    } else {
      fail(`unsupported DOCX ZIP compression method ${entry.method} for ${name}`);
    }
    const xml = xmlBuffer.toString("utf8");
    const matches = xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    for (const match of matches) {
      parts.push(match[1].replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&").replaceAll("&quot;", "\"").replaceAll("&apos;", "'"));
    }
    parts.push(" ");
  }
  const visibleText = parts.join("").replace(/\\s+/g, " ").trim();
  const scannedTokens = [];
  let searchOffset = 0;
  while (true) {
    const start = visibleText.indexOf("<<", searchOffset);
    if (start < 0) break;
    const end = visibleText.indexOf(">>", start + 2);
    if (end < 0) break;
    scannedTokens.push(visibleText.slice(start, end + 2));
    searchOffset = end + 2;
  }
  const tokens = Array.from(new Set(scannedTokens)).sort();
  return { xmlPartCount: xmlNames.length, visibleText, tokens };
}
const extracted = await extractVisibleTextAndTokens(docxPath);
if (fs.existsSync(docxPath) === false) fail("committed DOCX missing");
eq(fixture.templateId, "initial-billing-letter", "template id");
eq(fixture.documentKind, "letter", "document kind");
eq(fixture.matterScope, "individual", "matter scope");
eq(fixture.committedDocxPath, "templates/docx/letters/initial-billing-letter.docx", "committed path");
eq(fixture.layoutDependency, "letterhead-simple", "layout dependency");
eq(fixture.testMatterFileNumber, "BRL_202600003", "test matter");
eq(fixture.generationWired, false, "generation flag");
eq(fixture.clioCallsAllowed, false, "Clio flag");
eq(fixture.storageCallsAllowed, false, "storage flag");
eq(fixture.normalizedVisibleTextRequired, true, "normalized visible text flag");
eq(fixture.legacyTokensAllowedUntilTransformPhase, true, "legacy token phase flag");
same(fixture.legacyTokenInventory, readiness.legacyTokenInventory, "Phase 18A legacy token continuity");
same(fixture.requiredStandardTokens, readiness.requiredStandardTokens, "Phase 18A standard token continuity");
same(gate.legacyTokenInventory, fixture.legacyTokenInventory, "registry gate legacy tokens");
same(gate.requiredStandardTokens, fixture.requiredStandardTokens, "registry gate standard tokens");
eq(extracted.xmlPartCount, fixture.docxXmlPartCount, "XML part count");
eq(extracted.visibleText.length, fixture.visibleTextCharacterCount, "visible text character count");
same(extracted.tokens, fixture.legacyTokenInventory, "normalized visible legacy token inventory");
for (const token of fixture.legacyTokenInventory) has(doc, token, "doc legacy token coverage");
for (const token of fixture.requiredStandardTokens) has(doc, token, "doc standard token coverage");
for (const phrase of fixture.requiredVisiblePhrases) {
  has(extracted.visibleText, phrase, "DOCX visible phrase");
  has(doc, phrase, "readiness doc visible phrase");
}
has(doc, "normalized visible Word text", "normalized text documentation");
has(doc, "Generation remains unwired", "generation non-goal");
has(doc, "Clio and storage calls remain prohibited", "storage non-goal");
console.log("PASS: Templates Phase 18B Initial Billing Letter DOCX import gate verified");
