#!/usr/bin/env node
import fs from "node:fs";

const src = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");

function fail(message) {
  console.error(`FAIL: direct Document Generation progress bubbles safety\n- ${message}`);
  process.exit(1);
}

function requireIncludes(haystack, needle, label = needle) {
  if (!haystack.includes(needle)) fail(`missing ${label}`);
}

const start = src.indexOf("function renderMatterDocumentGenerationPopup()");
if (start < 0) fail("renderMatterDocumentGenerationPopup function");

const end = src.indexOf("function renderMatterViewEmailsPopup()", start);
if (end < 0) fail("renderMatterDocumentGenerationPopup boundary before View Emails");

const popup = src.slice(start, end);

requireIncludes(popup, "const stepBadge =", "stepBadge helper");
requireIncludes(popup, "Select Document", "Select Document step label");
requireIncludes(popup, "Preview PDF / Edit / Finalize", "Step 2 label");
requireIncludes(popup, "Document Delivery", "Document Delivery step label");

requireIncludes(popup, 'border: complete ? "1px solid #16a34a" : "1px solid #bbf7d0"', "green completion/light-green pending border");
requireIncludes(popup, 'background: complete ? "#16a34a" : "#dcfce7"', "solid green complete/light green pending background");
requireIncludes(popup, 'color: complete ? "#ffffff" : "#166534"', "white complete/dark green pending text");
requireIncludes(popup, 'background: complete ? "#15803d" : "#bbf7d0"', "inner number bubble green backgrounds");
requireIncludes(popup, 'color: completed ? "#16a34a" : "#94a3b8"', "completed arrow green");

console.log("PASS: direct Document Generation progress bubbles safety verifier passed");
