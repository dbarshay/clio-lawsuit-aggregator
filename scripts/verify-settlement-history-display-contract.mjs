import { readFileSync } from "node:fs";

const mattersPage = readFileSync("app/matters/page.tsx", "utf8");
const localHistoryRoute = readFileSync("app/api/settlements/local-history/route.ts", "utf8");
const localPreviewRoute = readFileSync("app/api/settlements/local-preview/route.ts", "utf8");

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message, detail = "") {
  console.error(`FAIL: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

function assertIncludes(source, needle, message) {
  if (!source.includes(needle)) fail(message, `Missing expected text: ${needle}`);
  pass(message);
}

function assertNotIncludes(source, needle, message) {
  if (source.includes(needle)) fail(message, `Unexpected text found: ${needle}`);
  pass(message);
}

function between(source, start, end, label) {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) fail(`${label}: start anchor not found`, start);

  const endIndex = source.indexOf(end, startIndex);
  if (endIndex < 0) fail(`${label}: end anchor not found`, end);

  return source.slice(startIndex, endIndex);
}

const settlementHistorySection = between(
  mattersPage,
  'masterSettlementHistory.records.map((record: any) => (',
  ') : masterSettlementHistory?.ok ? (',
  "settlement history section"
);

const settlementHistoryCard = between(
  settlementHistorySection,
  'masterSettlementHistory.records.map((record: any) => (',
  '{Array.isArray(record.rows) && record.rows.length > 0 && (',
  "settlement history card"
);

const settlementHistoryTable = between(
  settlementHistorySection,
  '<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>',
  '</table>',
  "settlement history table"
);

const sidebarFinancialSummary = between(
  mattersPage,
  '<span>Lawsuit Amount</span>',
  '<span>Balance</span>',
  "master sidebar financial summary"
);

console.log("== Settlement history display contract ==");

// Top summary layout.
assertIncludes(settlementHistoryCard, "Principal Settlement", "top summary includes Principal Settlement");
assertIncludes(settlementHistoryCard, "Interest Settlement", "top summary includes Interest Settlement");
assertIncludes(settlementHistoryCard, "Costs", "top summary includes Costs");
assertIncludes(settlementHistoryCard, "Attorney Fee", "top summary includes Attorney Fee");
assertIncludes(settlementHistoryCard, ">Total<", "top summary includes Total");
assertIncludes(settlementHistoryCard, "Status", "second summary row includes Status");
assertIncludes(settlementHistoryCard, "Settled With", "second summary row includes Settled With");
assertIncludes(settlementHistoryCard, "Settlement Date", "second summary row includes Settlement Date");
assertIncludes(settlementHistoryCard, "Payment Due", "second summary row includes Payment Due");

// Top summary exclusions.
assertNotIncludes(settlementHistoryCard, "Principal Allocated", "top summary omits Principal Allocated");
assertNotIncludes(settlementHistoryCard, "Interest Allocated", "top summary omits Interest Allocated");
assertNotIncludes(settlementHistoryCard, "Provider Net", "top summary omits Provider Net");
assertNotIncludes(settlementHistoryCard, ">Rows<", "top summary omits Rows");

// Combined amount + percentage display.
assertIncludes(localHistoryRoute, "function displayMoney", "history route has explicit currency display helper");
assertIncludes(localHistoryRoute, "combinedSettlementDisplay", "history route combines amount and percentage");
assertIncludes(localHistoryRoute, "percentDisplayFromRawInput", "history route reads percentage from raw input");
assertIncludes(localHistoryRoute, "derivedPrincipalPercent", "history route can derive legacy principal percent");
assertIncludes(localHistoryRoute, "principalSettlementDisplay: combinedSettlementDisplay", "principal display uses combined amount-percent helper");
assertIncludes(localHistoryRoute, "interestSettlementDisplay: combinedSettlementDisplay", "interest display uses combined amount-percent helper");

// Raw input preservation.
assertIncludes(mattersPage, "principalSettlementInput: masterSettlementGrossInput", "frontend sends raw principal settlement input");
assertIncludes(mattersPage, "interestSettlementInput: masterSettlementInterestAmountInput", "frontend sends raw interest settlement input");
assertIncludes(localPreviewRoute, "principalSettlementInput: clean(body.principalSettlementInput)", "preview snapshot preserves raw principal input");
assertIncludes(localPreviewRoute, "interestSettlementInput: clean(body.interestSettlementInput)", "preview snapshot preserves raw interest input");

// Date normalization.
assertIncludes(mattersPage, "function formatSettlementHistoryDate", "history display has date normalizer");
assertIncludes(settlementHistoryCard, "formatSettlementHistoryDate(record.settlementDate)", "settlement date uses normalizer");
assertIncludes(settlementHistoryCard, "formatSettlementHistoryDate(record.paymentExpectedDate)", "payment due date uses normalizer");

// Row table layout.
assertIncludes(settlementHistoryTable, "Principal", "row table includes Principal column");
assertIncludes(settlementHistoryTable, "Interest", "row table includes Interest column");
assertIncludes(settlementHistoryTable, "Costs", "row table includes Costs column");
assertIncludes(settlementHistoryTable, "Fee", "row table includes Fee column");
assertIncludes(settlementHistoryTable, "Total", "row table includes Total column");
assertNotIncludes(settlementHistoryTable, "Provider Net", "row table omits Provider Net column");

// Row costs and totals.
assertIncludes(localHistoryRoute, "rowIndex === 0 ? costsAmount : 0", "history route allocates costs to first row when row snapshot lacks costs");
assertIncludes(localHistoryRoute, "settlementTotal", "history route exposes row settlement total");
assertIncludes(settlementHistoryTable, "row.costAmount", "row table displays row cost amount");
assertIncludes(settlementHistoryTable, "row.settlementTotal", "row table displays row total");

// Footer totals.
assertIncludes(settlementHistoryTable, "Column Totals", "row table has Column Totals footer");
assertIncludes(settlementHistoryTable, "Gross Total", "row table has Gross Total footer");
assertIncludes(settlementHistoryTable, "formatSettlementHistoryMoney(record.allocatedSettlementTotal || 0)", "footer totals principal column");
assertIncludes(settlementHistoryTable, "formatSettlementHistoryMoney(record.interestAmountTotal || 0)", "footer totals interest column");
assertIncludes(settlementHistoryTable, "formatSettlementHistoryMoney(record.costsAmount || 0)", "footer totals costs column");
assertIncludes(settlementHistoryTable, "formatSettlementHistoryMoney(record.totalFee || 0)", "footer totals fee column");
assertIncludes(settlementHistoryTable, "formatSettlementHistoryMoney(record.totalSettlementAmount || 0)", "footer totals total column and gross total");

// Sidebar cost source.
assertIncludes(sidebarFinancialSummary, "{masterCourtCostsDisplayValue()}", "sidebar Costs uses shared court-costs display helper");
assertIncludes(mattersPage, "masterSettlementCostDefaultValue() -", "sidebar Balance uses shared court-costs numeric helper");

console.log("\nSettlement history display contract verifier passed.");
