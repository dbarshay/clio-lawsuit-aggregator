#!/usr/bin/env node
import fs from "fs";

const previewPath = "app/api/admin/clients/[id]/invoice/create-preview/route.ts";
const createPath = "app/api/admin/clients/[id]/invoice/create/route.ts";
const packagePath = "package.json";
const preview = fs.readFileSync(previewPath, "utf8");
const create = fs.readFileSync(createPath, "utf8");
let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}

function mustContain(label, text, needle) {
  if (text.includes(needle)) pass(`${label}: found ${needle}`);
  else fail(`${label}: missing ${needle}`);
}

function mustNotContain(label, text, needle) {
  if (!text.includes(needle)) pass(`${label}: does not contain ${needle}`);
  else fail(`${label}: still contains ${needle}`);
}

console.log("=== VERIFY PROVIDER CLIENT INVOICE NUMBER FORMAT SAFETY ===");

for (const [label, text] of [["create-preview route", preview], ["create route", create]]) {
  mustContain(label, text, "function providerInitials");
  mustContain(label, text, "replace(/&/g, \" and \")");
  mustContain(label, text, "replace(/\\bP\\.?\\s*C\\.?\\b/gi, \" P C \")");
  mustContain(label, text, "new Set([\"and\", \"the\", \"of\"])");
  mustContain(label, text, "return `${y}${m}${d}-${providerInitials");
  mustNotContain(label, text, "DRAFT-${y}${m}${d}");
  mustNotContain(label, text, "slice(-6).toUpperCase()");
}

mustContain("create-preview route", preview, "invoiceNumberCandidate(client.displayName)");
mustContain("create route", create, "safeInvoiceNumberBase(preview?.invoiceNumberCandidate, preview?.providerDisplayName || preview?.clientSnapshot?.displayName)");

function providerInitials(value) {
  const text = String(value ?? "")
    .trim()
    .replace(/&/g, " and ")
    .replace(/\bP\.?\s*C\.?\b/gi, " P C ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stopWords = new Set(["and", "the", "of"]);
  const initials = text
    .split(" ")
    .filter(Boolean)
    .filter((word) => !stopWords.has(word.toLowerCase()))
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return initials || "CLIENT";
}

const initials = providerInitials("Atlantic Medical & Diagnostic, P.C.");
if (initials === "AMDPC") {
  pass("Atlantic Medical & Diagnostic, P.C. initials resolve to AMDPC");
} else {
  fail(`Atlantic Medical & Diagnostic, P.C. initials resolved to ${initials}, expected AMDPC`);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const expectedScript = "node scripts/verify-provider-client-invoice-number-format-safety.mjs";
if (pkg.scripts?.["verify:provider-client-invoice-number-format-safety"] === expectedScript) {
  pass("package.json: verifier script registered");
} else {
  fail("package.json: verifier script is not registered");
}

if (failures) {
  console.error(`\nRESULT: provider client invoice number format safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nRESULT: provider client invoice number format safety PASSED");
