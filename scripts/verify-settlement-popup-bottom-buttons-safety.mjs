#!/usr/bin/env node
import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const pkgPath = "package.json";
const text = fs.existsSync(pagePath) ? fs.readFileSync(pagePath, "utf8") : "";
const pkg = fs.existsSync(pkgPath) ? fs.readFileSync(pkgPath, "utf8") : "";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

for (const marker of [
  "data-barsh-settlement-popup-bottom-buttons-marker",
  "Cancel",
  "Clear",
  "Commit Settlement",
  "commitMasterSettlementAndLaunchDocuments",
  "Record Settlement",
]) {
  if (!text.includes(marker)) fail(`${pagePath} missing marker: ${marker}`);
}

if (text.includes("Record Local Settlement")) {
  fail("popup final button should not say Record Local Settlement");
}

if (text.includes("Save Local Settlement")) {
  fail("popup final button should not say Save Local Settlement");
}

if (!text.includes("onClick={commitMasterSettlementAndLaunchDocuments}") && !text.includes("onClick={() => void commitMasterSettlementAndLaunchDocuments()}")) {
  fail("popup final button should call commitMasterSettlementAndLaunchDocuments");
}

if (!pkg.includes("verify:settlement-popup-bottom-buttons-safety")) {
  fail(`${pkgPath} missing verify:settlement-popup-bottom-buttons-safety script`);
}

if (!process.exitCode) {
  pass("settlement popup bottom buttons are Cancel, Clear, and Commit Settlement");
}
