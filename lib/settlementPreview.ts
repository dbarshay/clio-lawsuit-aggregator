export type SettlementAllocationMode =
  | "proportional_balance_presuit"
  | "proportional_claim_amount"
  | "equal";

export type SettlementPreviewInput = {
  grossSettlementAmount: number;
  settledWith?: string;
  settlementDate?: string;
  paymentExpectedDate?: string;
  allocationMode?: SettlementAllocationMode;
  principalFeePercent?: number;
  interestAmount?: number;
  interestFeePercent?: number;
  notes?: string;
};

export type SettlementPreviewChildMatter = {
  matterId: number;
  displayNumber?: string;
  description?: string;
  providerName?: string;
  patientName?: string;
  insurerName?: string;
  claimNumber?: string;
  billNumber?: string;
  claimAmount?: number;
  balancePresuit?: number;
  balanceAmount?: number;
};

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(value: unknown): number {
  return Math.round(num(value) * 100) / 100;
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function pct(value: unknown): number {
  const n = num(value);
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function allocateByWeights(total: number, weights: number[]) {
  const safeTotal = money(total);
  if (safeTotal === 0 || weights.length === 0) return weights.map(() => 0);

  const positiveWeightTotal = weights.reduce((sum, weight) => sum + Math.max(0, num(weight)), 0);

  const effectiveWeights =
    positiveWeightTotal > 0 ? weights.map((weight) => Math.max(0, num(weight))) : weights.map(() => 1);

  const effectiveWeightTotal = effectiveWeights.reduce((sum, weight) => sum + weight, 0);

  const rawAllocations = effectiveWeights.map((weight) =>
    effectiveWeightTotal > 0 ? (safeTotal * weight) / effectiveWeightTotal : 0
  );

  const rounded = rawAllocations.map(money);
  const diff = money(safeTotal - rounded.reduce((sum, value) => sum + value, 0));

  if (rounded.length > 0 && diff !== 0) {
    rounded[rounded.length - 1] = money(rounded[rounded.length - 1] + diff);
  }

  return rounded;
}

function allocationWeight(row: SettlementPreviewChildMatter, mode: SettlementAllocationMode) {
  if (mode === "proportional_claim_amount") return num(row.claimAmount);
  if (mode === "equal") return 1;
  return num(row.balancePresuit);
}

export function buildSettlementPreview(params: {
  masterLawsuitId: string;
  packet: any;
  input: SettlementPreviewInput;
}) {
  const masterLawsuitId = clean(params.masterLawsuitId);
  const packet = params.packet || {};
  const input = params.input || ({} as SettlementPreviewInput);

  const grossSettlementAmount = money(input.grossSettlementAmount);
  const interestAmount = money(input.interestAmount || 0);
  const principalSettlementAmount = money(grossSettlementAmount - interestAmount);

  const allocationMode: SettlementAllocationMode =
    input.allocationMode === "proportional_claim_amount" || input.allocationMode === "equal"
      ? input.allocationMode
      : "proportional_balance_presuit";

  const principalFeePercent = pct(input.principalFeePercent ?? 0);
  const interestFeePercent = pct(input.interestFeePercent ?? 0);

  const warnings: string[] = [];
  const blockingErrors: string[] = [];

  if (!masterLawsuitId) blockingErrors.push("Missing masterLawsuitId.");
  if (grossSettlementAmount <= 0) blockingErrors.push("Gross settlement amount must be greater than zero.");
  if (interestAmount < 0) blockingErrors.push("Interest amount cannot be negative.");
  if (interestAmount > grossSettlementAmount) {
    blockingErrors.push("Interest amount cannot exceed gross settlement amount.");
  }

  const childMatters: SettlementPreviewChildMatter[] = Array.isArray(packet.childMatters)
    ? packet.childMatters.map((row: any) => ({
        matterId: Number(row.matterId),
        displayNumber: clean(row.displayNumber),
        description: clean(row.description),
        providerName: clean(row.providerName),
        patientName: clean(row.patientName),
        insurerName: clean(row.insurerName),
        claimNumber: clean(row.claimNumber),
        billNumber: clean(row.billNumber),
        claimAmount: money(row.claimAmount),
        balancePresuit: money(row.balancePresuit),
        balanceAmount: money(row.balanceAmount),
      }))
    : [];

  const billMatters = childMatters.filter((row) => Number.isFinite(row.matterId) && row.matterId > 0);

  if (billMatters.length === 0) {
    blockingErrors.push("No child/bill matters are available for settlement allocation.");
  }

  const weights = billMatters.map((row) => allocationWeight(row, allocationMode));

  if (allocationMode === "proportional_balance_presuit" && weights.every((weight) => num(weight) <= 0)) {
    warnings.push("All Balance (Presuit) weights are zero; allocation falls back to equal distribution.");
  }

  if (allocationMode === "proportional_claim_amount" && weights.every((weight) => num(weight) <= 0)) {
    warnings.push("All Claim Amount weights are zero; allocation falls back to equal distribution.");
  }

  if (principalFeePercent === 0) {
    warnings.push("Principal fee percentage is 0%. Provider-specific Clio contact fee percentages are not loaded in this preview yet.");
  }

  if (interestAmount > 0 && interestFeePercent === 0) {
    warnings.push("Interest fee percentage is 0%. Provider-specific Clio contact interest fee percentages are not loaded in this preview yet.");
  }

  const principalAllocations = allocateByWeights(Math.max(0, principalSettlementAmount), weights);
  const interestAllocations = allocateByWeights(Math.max(0, interestAmount), weights);

  const rows = billMatters.map((row, index) => {
    const allocatedPrincipalSettlement = money(principalAllocations[index] || 0);
    const allocatedInterest = money(interestAllocations[index] || 0);

    const principalFee = money((allocatedPrincipalSettlement * principalFeePercent) / 100);
    const interestFee = money((allocatedInterest * interestFeePercent) / 100);
    const totalFee = money(principalFee + interestFee);

    const providerPrincipalNet = money(allocatedPrincipalSettlement - principalFee);
    const providerInterestNet = money(allocatedInterest - interestFee);
    const providerNet = money(providerPrincipalNet + providerInterestNet);

    return {
      matterId: row.matterId,
      displayNumber: row.displayNumber || "",
      billNumber: row.billNumber || "",
      providerName: row.providerName || "",
      patientName: row.patientName || "",
      insurerName: row.insurerName || "",
      claimNumber: row.claimNumber || "",
      claimAmount: money(row.claimAmount),
      balancePresuit: money(row.balancePresuit),
      balanceAmount: money(row.balanceAmount),
      allocationWeight: money(weights[index] || 0),

      allocatedSettlement: allocatedPrincipalSettlement,
      interestAmount: allocatedInterest,
      grossAllocatedSettlement: money(allocatedPrincipalSettlement + allocatedInterest),

      principalFeePercent,
      interestFeePercent,
      principalFee,
      interestFee,
      totalFee,

      providerPrincipalNet,
      providerInterestNet,
      providerNet,

      clioWritebackPreview: {
        matterId: row.matterId,
        displayNumber: row.displayNumber || "",
        fields: {
          SETTLED_AMOUNT: grossSettlementAmount,
          SETTLED_WITH: clean(input.settledWith),
          ALLOCATED_SETTLEMENT: allocatedPrincipalSettlement,
          INTEREST_AMOUNT: allocatedInterest,
          PRINCIPAL_FEE: principalFee,
          INTEREST_FEE: interestFee,
          TOTAL_FEE: totalFee,
          PROVIDER_NET: providerNet,
          PROVIDER_PRINCIPAL_NET: providerPrincipalNet,
          PROVIDER_INTEREST_NET: providerInterestNet,
        },
      },
    };
  });

  const totals = {
    childMatterCount: rows.length,
    grossSettlementAmount,
    principalSettlementAmount: money(Math.max(0, principalSettlementAmount)),
    interestAmount,
    allocatedSettlementTotal: money(rows.reduce((sum, row) => sum + row.allocatedSettlement, 0)),
    allocatedInterestTotal: money(rows.reduce((sum, row) => sum + row.interestAmount, 0)),
    grossAllocatedSettlementTotal: money(rows.reduce((sum, row) => sum + row.grossAllocatedSettlement, 0)),
    principalFeeTotal: money(rows.reduce((sum, row) => sum + row.principalFee, 0)),
    interestFeeTotal: money(rows.reduce((sum, row) => sum + row.interestFee, 0)),
    totalFeeTotal: money(rows.reduce((sum, row) => sum + row.totalFee, 0)),
    providerPrincipalNetTotal: money(rows.reduce((sum, row) => sum + row.providerPrincipalNet, 0)),
    providerInterestNetTotal: money(rows.reduce((sum, row) => sum + row.providerInterestNet, 0)),
    providerNetTotal: money(rows.reduce((sum, row) => sum + row.providerNet, 0)),
  };

  const canPreview = blockingErrors.length === 0;

  return {
    ok: canPreview,
    action: "settlement-preview",
    dryRun: true,
    masterLawsuitId,
    generatedAt: new Date().toISOString(),

    input: {
      grossSettlementAmount,
      settledWith: clean(input.settledWith),
      settlementDate: clean(input.settlementDate),
      paymentExpectedDate: clean(input.paymentExpectedDate),
      allocationMode,
      principalFeePercent,
      interestAmount,
      interestFeePercent,
      notes: clean(input.notes),
    },

    metadata: {
      masterMatter: packet.masterMatter || null,
      lawsuit: packet.lawsuit || null,
      provider: packet.metadata?.provider?.value || "",
      patient: packet.metadata?.patient?.value || "",
      insurer: packet.metadata?.insurer?.value || "",
      claimNumber: packet.metadata?.claimNumber?.value || "",
    },

    validation: {
      canPreview,
      warnings,
      blockingErrors,
    },

    totals,
    rows,

    futureWriteback: {
      explicitFinalSaveRequired: true,
      previewDoesNotWriteToClio: true,
      previewDoesNotWriteToDatabase: true,
      intendedClioWriteTarget: "child-bill-matters-only",
      masterMatterFinancialWriteback: "not-planned-for-this-preview",
    },

    safety: {
      noClioRecordsChanged: true,
      noDatabaseRecordsChanged: true,
      noDocumentsGenerated: true,
      noPrintQueueRecordsChanged: true,
      noPersistentFilesCreated: true,
    },

    note:
      "Preview only. This endpoint calculates proposed settlement allocation and future Clio writeback values but does not write to Clio, does not write to the database, does not generate documents, and does not change the print queue.",
  };
}
