#!/usr/bin/env node
import fs from "node:fs";

const pagePath = "app/matter/[id]/page.tsx";
const src = fs.readFileSync(pagePath, "utf8");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function requireIncludes(haystack, needle, label = needle) {
  if (!haystack.includes(needle)) fail(`missing ${label}`);
}

function requireNotIncludes(haystack, needle, label = needle) {
  if (haystack.includes(needle)) fail(`unexpected ${label}`);
}

const start = src.indexOf("function renderMatterDocumentGenerationPopup()");
if (start < 0) fail("Document Generation popup function not found");

const end = src.indexOf("function renderMatterViewEmailsPopup()", start);
if (end < 0) fail("Document Generation popup end not found");

const popup = src.slice(start, end);

requireIncludes(popup, 'data-barsh-direct-document-generation-header-standard="true"', "standard navy header marker");
requireIncludes(popup, 'background: "#1e3a8a"', "navy header/action color");
requireIncludes(popup, "Document Generation", "centered title");
requireNotIncludes(popup, "Select a document, preview the PDF, edit in Word if needed", "old subtitle");
requireNotIncludes(popup, ">\\n              Close\\n            </button>\\n          </div>\\n\\n          <div style={{ padding: 24", "old top-right Close");

requireIncludes(popup, 'border: complete ? "1px solid #16a34a" : "1px solid #bbf7d0"', "green progress border");
requireIncludes(popup, 'background: complete ? "#16a34a" : "#dcfce7"', "green progress background");
requireIncludes(popup, 'background: complete ? "#15803d" : "#bbf7d0"', "green progress bubble number");

requireIncludes(popup, 'border: disabled ? "1px solid #d1d5db" : "1px solid #1e3a8a"', "navy action border");
requireIncludes(popup, 'background: disabled ? "#f3f4f6" : "#1e3a8a"', "navy action background");

requireIncludes(popup, 'data-barsh-direct-document-generation-footer-actions="true"', "footer marker");
requireIncludes(popup, "Back", "Back footer button");
requireIncludes(popup, "Cancel", "Cancel footer button");
requireIncludes(popup, 'setMatterSelectedDocumentTemplateKey("");', "Back clears selected document");
requireIncludes(popup, 'setMatterDocumentTemplateQuery("");', "Back clears template query");
requireIncludes(popup, "setMatterDocumentFinalizationResult(null);", "Back clears direct finalization result");

const viewEmailsStart = src.indexOf("function renderMatterViewEmailsPopup()");
const viewEmailsEnd = src.indexOf("function renderMatterDocumentDataPreviewPanel()", viewEmailsStart);
const viewEmails = src.slice(viewEmailsStart, viewEmailsEnd);
requireNotIncludes(viewEmails, 'data-barsh-direct-document-generation-footer-actions="true"', "misplaced Document Generation footer in View Emails");

const previewFnStart = src.indexOf("async function launchMatterStep2PdfPreview(");
const previewFnEnd = src.indexOf("async function finalizeMatterDocumentFromStep2(", previewFnStart);
const previewFn = src.slice(previewFnStart, previewFnEnd);
requireNotIncludes(previewFn, "No valid Master Lawsuit ID is available for PDF preview", "master lawsuit PDF preview alert");
requireNotIncludes(previewFn, "const masterLawsuitId = usableMasterLawsuitIdForDocuments();", "master lawsuit PDF preview dependency");
requireIncludes(previewFn, "direct-matter-preview-data", "direct matter preview placeholder");

const finalizeFnStart = src.indexOf("async function finalizeMatterDocumentFromStep2(");
const finalizeFnEnd = src.indexOf("function downloadBillScheduleDocx()", finalizeFnStart);
const finalizeFn = src.slice(finalizeFnStart, finalizeFnEnd);
requireNotIncludes(finalizeFn, "No valid Master Lawsuit ID is available for finalization", "master lawsuit finalization alert");
requireNotIncludes(finalizeFn, "const masterLawsuitId = usableMasterLawsuitIdForDocuments();", "master lawsuit finalization dependency");
requireIncludes(finalizeFn, "direct-matter-finalization-pending", "direct matter finalization placeholder");

console.log("PASS: direct Document Generation popup standard verifier passed");
