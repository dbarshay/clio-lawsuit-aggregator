#!/usr/bin/env node

let failures = 0;

function moneyNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

function assertMoney(label, actual, expected) {
  const roundedActual = moneyNumber(actual);
  const roundedExpected = moneyNumber(expected);
  if (roundedActual === roundedExpected) {
    console.log(`PASS: ${label}: ${roundedActual.toFixed(2)}`);
  } else {
    console.error(`FAIL: ${label}: expected ${roundedExpected.toFixed(2)}, got ${roundedActual.toFixed(2)}`);
    failures += 1;
  }
}

console.log("=== VERIFY SCENARIO 7 NUMERIC ARITHMETIC: UNUSED 25% CAP APPLIES TO PRIOR NEGATIVE BALANCE ===");

// Screenshot facts from Scenario 7 review.
const principalInterestTotal = 2600.00;
const retainerFeeTotal = 1300.00;
const costsExpendedTotal = 2301.25;
const filingFeePaymentTotal = 2000.00;
const priorNegativeCostBalance = 101.25;

const baseNetRemitToProvider = moneyNumber(principalInterestTotal - retainerFeeTotal);
const costBalanceThisRemittancePeriod = moneyNumber(filingFeePaymentTotal - costsExpendedTotal);
const costBalanceLedgerBefore = moneyNumber(Math.max(0, priorNegativeCostBalance));
const currentPeriodPositiveCostBalance = moneyNumber(Math.max(0, costBalanceThisRemittancePeriod));
const currentPeriodNegativeCostBalance = moneyNumber(Math.max(0, -costBalanceThisRemittancePeriod));
const costBalanceDeductionCap = moneyNumber(currentPeriodNegativeCostBalance > 0 ? Math.max(0, baseNetRemitToProvider * 0.25) : 0);
const costBalanceAppliedToLedger = moneyNumber(Math.min(currentPeriodPositiveCostBalance, costBalanceLedgerBefore));
const costBalanceReimbursementToProvider = moneyNumber(Math.max(0, currentPeriodPositiveCostBalance - costBalanceAppliedToLedger));
const totalRecoverableNegativeCostBalance = moneyNumber(currentPeriodNegativeCostBalance + Math.max(0, costBalanceLedgerBefore - costBalanceAppliedToLedger));
const costBalanceDeductionApplied = moneyNumber(Math.min(totalRecoverableNegativeCostBalance, costBalanceDeductionCap));
const currentShortfallDeductionApplied = moneyNumber(Math.min(currentPeriodNegativeCostBalance, costBalanceDeductionApplied));
const priorBalanceDeductionApplied = moneyNumber(Math.max(0, costBalanceDeductionApplied - currentShortfallDeductionApplied));
const costBalanceAddedToLedger = moneyNumber(Math.max(0, currentPeriodNegativeCostBalance - currentShortfallDeductionApplied));
const costBalanceLedgerAfter = moneyNumber(Math.max(0, costBalanceLedgerBefore - costBalanceAppliedToLedger - priorBalanceDeductionApplied + costBalanceAddedToLedger));
const costBalanceLedgerChange = moneyNumber(costBalanceLedgerAfter - costBalanceLedgerBefore);
const costBalanceAdjustmentToNetRemit = moneyNumber(costBalanceReimbursementToProvider - costBalanceDeductionApplied);
const netRemitToProviderTotal = moneyNumber(baseNetRemitToProvider + costBalanceAdjustmentToNetRemit);

assertMoney("principal / interest received", principalInterestTotal, 2600.00);
assertMoney("retainer fee", retainerFeeTotal, 1300.00);
assertMoney("net remit before costs", baseNetRemitToProvider, 1300.00);
assertMoney("costs expended during this remittance period", costsExpendedTotal, 2301.25);
assertMoney("costs received during this remittance period", filingFeePaymentTotal, 2000.00);
assertMoney("cost excess / shortfall this remittance", costBalanceThisRemittancePeriod, -301.25);
assertMoney("negative cost balance before this remittance", costBalanceLedgerBefore, 101.25);
assertMoney("25 percent deduction cap", costBalanceDeductionCap, 325.00);
assertMoney("total recoverable negative cost balance", totalRecoverableNegativeCostBalance, 402.50);
assertMoney("current shortfall deduction applied first", currentShortfallDeductionApplied, 301.25);
assertMoney("unused cap applied to prior negative balance", priorBalanceDeductionApplied, 23.75);
assertMoney("negative cost balance after this remittance", costBalanceLedgerAfter, 77.50);
assertMoney("cost balance ledger change", costBalanceLedgerChange, -23.75);
assertMoney("cost deduction applied", costBalanceDeductionApplied, 325.00);
assertMoney("final net remit to provider", netRemitToProviderTotal, 975.00);

if (failures) {
  console.error(`\nRESULT: Scenario 7 numeric arithmetic safety FAILED (${failures})`);
  process.exit(1);
}

console.log("\nPASS: Scenario 7 numeric arithmetic safety passed");
